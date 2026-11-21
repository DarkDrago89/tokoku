import Papa from "papaparse";
import { normalizePhone } from "@/lib/domain/phone";

export const IMPORT_FIELDS = ["name", "phone", "email", "city", "address", "birthday", "source", "notes"] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];
export type Mapping = Partial<Record<ImportField, string>>;

export const FIELD_LABEL: Record<ImportField, string> = {
  name: "Nama",
  phone: "Nomor WhatsApp",
  email: "Email",
  city: "Kota",
  address: "Alamat",
  birthday: "Tanggal lahir",
  source: "Sumber",
  notes: "Catatan",
};

export type ImportRow = {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  address?: string;
  birthday?: string; // yyyy-mm-dd
  source?: string;
  notes?: string;
};

export type ImportAnalysis = {
  valid: ImportRow[];
  duplicates: { row: number; phone: string; reason: "di_file" | "sudah_ada" }[];
  invalid: { row: number; reason: string }[];
};

/** Baca teks CSV; pemisah (koma / titik koma) dideteksi otomatis, BOM dibuang. */
export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const res = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });
  return { headers: (res.meta.fields ?? []).filter(Boolean), rows: res.data };
}

const GUESS: [ImportField, RegExp][] = [
  ["phone", /(wa|whatsapp|hp|telp|telepon|phone|nomor|no\.?\s)/i],
  ["email", /e-?mail/i],
  ["birthday", /(lahir|ultah|ulang|birth)/i],
  ["city", /(kota|city|kab)/i],
  ["address", /(alamat|address)/i],
  ["source", /(sumber|source|asal)/i],
  ["notes", /(catatan|note|ket)/i],
  ["name", /(nama|name)/i],
];

/** Tebak kolom mana untuk tiap data dari judul kolom. */
export function guessMapping(headers: string[]): Mapping {
  const mapping: Mapping = {};
  const used = new Set<string>();
  for (const [field, re] of GUESS) {
    const h = headers.find((x) => !used.has(x) && re.test(x));
    if (h) {
      mapping[field] = h;
      used.add(h);
    }
  }
  return mapping;
}

/** dd/mm/yyyy, dd-mm-yyyy, atau yyyy-mm-dd → yyyy-mm-dd; null jika tanggal tidak ada. */
export function parseBirthday(raw: string): string | null {
  const s = raw.trim();
  let y: number, m: number, d: number;
  let match = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (match) [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else if ((match = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return dt.toISOString().slice(0, 10);
}

/**
 * Validasi baris impor (alur 5.3): nomor dinormalisasi, nomor ganda di file dan yang sudah ada ditandai,
 * baris rusak dilaporkan dengan alasan. Nomor baris dihitung seperti di spreadsheet (baris 1 = judul).
 */
export function analyzeImport(rows: Record<string, string>[], mapping: Mapping, existingPhones: Set<string>): ImportAnalysis {
  const get = (r: Record<string, string>, f: ImportField) => (mapping[f] ? (r[mapping[f]!] ?? "").trim() : "");
  const result: ImportAnalysis = { valid: [], duplicates: [], invalid: [] };
  const candidates: { row: number; data: ImportRow }[] = [];
  const seen = new Map<string, number>();

  rows.forEach((r, i) => {
    const row = i + 2;
    const name = get(r, "name");
    if (!name) return result.invalid.push({ row, reason: "Nama kosong" });
    const phone = normalizePhone(get(r, "phone"));
    if (!phone) return result.invalid.push({ row, reason: "Nomor tidak valid" });
    const rawBirthday = get(r, "birthday");
    const birthday = rawBirthday ? parseBirthday(rawBirthday) : null;
    if (rawBirthday && !birthday) return result.invalid.push({ row, reason: "Tanggal lahir tidak valid (pakai dd/mm/yyyy)" });
    const opt = (f: ImportField) => get(r, f) || undefined;
    candidates.push({
      row,
      data: { name, phone, email: opt("email"), city: opt("city"), address: opt("address"), birthday: birthday ?? undefined, source: opt("source"), notes: opt("notes") },
    });
    seen.set(phone, (seen.get(phone) ?? 0) + 1);
  });

  for (const c of candidates) {
    if ((seen.get(c.data.phone) ?? 0) > 1) result.duplicates.push({ row: c.row, phone: c.data.phone, reason: "di_file" });
    else if (existingPhones.has(c.data.phone)) result.duplicates.push({ row: c.row, phone: c.data.phone, reason: "sudah_ada" });
    else result.valid.push(c.data);
  }
  return result;
}

/** Ubah baris menjadi CSV (dengan BOM agar Excel membaca UTF-8 dengan benar). */
export function toCsv(rows: Record<string, string | number | null | undefined>[], headers: string[]): string {
  return "﻿" + Papa.unparse({ fields: headers, data: rows.map((r) => headers.map((h) => r[h] ?? "")) });
}
