import { Prisma } from "@prisma/client";

/** Decimal Prisma → number (aman untuk Rupiah tanpa desimal). */
export function num(v: Prisma.Decimal | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : v.toNumber();
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Bentuk state umum untuk form yang memakai useActionState. */
export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
  message?: string;
};

/** Ubah ZodError menjadi { field: pesan pertama }. */
export function zodFieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const k = String(i.path[0] ?? "_");
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

/** Tanggal "hari ini" di Jakarta sebagai Date UTC tengah malam (cocok untuk kolom @db.Date). */
export function jakartaToday(now = new Date()): Date {
  const s = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(now); // yyyy-mm-dd
  return new Date(`${s}T00:00:00Z`);
}

export function addDays(d: Date, days: number): Date {
  return new Date(+d + days * 86_400_000);
}

/** Pengaturan toko dengan nilai bawaan. */
export type StoreSettings = { inactiveDays: number };
export function readSettings(json: unknown): StoreSettings {
  const s = (json ?? {}) as Partial<StoreSettings>;
  return { inactiveDays: typeof s.inactiveDays === "number" && s.inactiveDays > 0 ? s.inactiveDays : 60 };
}
