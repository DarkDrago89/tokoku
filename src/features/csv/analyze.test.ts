import { describe, expect, it } from "vitest";
import { analyzeImport, guessMapping, parseCsv } from "./analyze";

describe("impor CSV", () => {
  it("membaca CSV dengan BOM dan pemisah titik koma (ekspor Excel Indonesia)", () => {
    const text = "﻿Nama;No HP;Kota\nAni;0812-1111-2222;Bandung\n";
    const { headers, rows } = parseCsv(text);
    expect(headers).toEqual(["Nama", "No HP", "Kota"]);
    expect(rows[0]).toEqual({ Nama: "Ani", "No HP": "0812-1111-2222", Kota: "Bandung" });
  });

  it("menebak pemetaan kolom dari judul", () => {
    expect(guessMapping(["Nama Pelanggan", "No. WhatsApp", "Kota", "Tgl Lahir", "E-mail"])).toEqual({
      name: "Nama Pelanggan",
      phone: "No. WhatsApp",
      city: "Kota",
      birthday: "Tgl Lahir",
      email: "E-mail",
    });
  });

  const mapping = { name: "nama", phone: "hp", birthday: "lahir" };

  it("menandai nomor ganda di dalam file dan yang sudah ada, tanpa menggagalkan baris lain", () => {
    const rows = [
      { nama: "Ani", hp: "081211112222", lahir: "" },
      { nama: "Ani lagi", hp: "+62 812 1111 2222", lahir: "" },
      { nama: "Budi", hp: "081233334444", lahir: "" },
      { nama: "Citra", hp: "081255556666", lahir: "17/08/1995" },
    ];
    const res = analyzeImport(rows, mapping, new Set(["6281233334444"]));
    expect(res.valid.map((v) => v.name)).toEqual(["Citra"]);
    expect(res.valid[0].birthday).toBe("1995-08-17");
    expect(res.duplicates).toEqual([
      { row: 2, phone: "6281211112222", reason: "di_file" },
      { row: 3, phone: "6281211112222", reason: "di_file" },
      { row: 4, phone: "6281233334444", reason: "sudah_ada" },
    ]);
  });

  it("menandai baris tidak valid dengan alasan yang jelas", () => {
    const rows = [
      { nama: "", hp: "081277778888", lahir: "" },
      { nama: "Dedi", hp: "abc", lahir: "" },
      { nama: "Eka", hp: "081299990000", lahir: "31/02/1990" },
    ];
    const res = analyzeImport(rows, mapping, new Set());
    expect(res.invalid).toEqual([
      { row: 2, reason: "Nama kosong" },
      { row: 3, reason: "Nomor tidak valid" },
      { row: 4, reason: "Tanggal lahir tidak valid (pakai dd/mm/yyyy)" },
    ]);
    expect(res.valid).toHaveLength(0);
  });
});

import { toCsv } from "./analyze";
describe("ekspor CSV aman", () => {
  it("menetralkan formula (CSV injection) dan menjaga nomor sebagai teks", () => {
    const csv = toCsv([{ Nama: "=HYPERLINK(1)", HP: "+6281234567890", Catatan: "@x" }], ["Nama", "HP", "Catatan"]);
    expect(csv).toContain("'=HYPERLINK(1)");
    expect(csv).toContain("'@x");
    expect(csv).toContain("'+6281234567890");
  });
});
