"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { assertCan } from "@/lib/permissions";
import { analyzeImport, type ImportAnalysis, type Mapping } from "./analyze";

const MAX_ROWS = 5000;

async function existingPhones(storeId: string) {
  const rows = await prisma.customer.findMany({ where: { storeId }, select: { phone: true } });
  return new Set(rows.map((r) => r.phone));
}

/** Langkah pratinjau: hitung berapa baris siap, ganda, dan tidak valid. */
export async function previewImportAction(rows: Record<string, string>[], mapping: Mapping): Promise<ImportAnalysis> {
  const s = await requireSession();
  assertCan(s.role, "data.export");
  return analyzeImport(rows.slice(0, MAX_ROWS), mapping, await existingPhones(s.storeId));
}

/** Langkah konfirmasi: analisis ulang di server (jangan percaya data klien) lalu simpan. */
export async function runImportAction(rows: Record<string, string>[], mapping: Mapping) {
  const s = await requireSession();
  assertCan(s.role, "data.export");
  const res = analyzeImport(rows.slice(0, MAX_ROWS), mapping, await existingPhones(s.storeId));
  const created = await prisma.customer.createMany({
    data: res.valid.map((r) => ({
      storeId: s.storeId,
      name: r.name,
      phone: r.phone,
      email: r.email?.toLowerCase() ?? null,
      city: r.city ?? null,
      address: r.address ?? null,
      birthday: r.birthday ? new Date(`${r.birthday}T00:00:00Z`) : null,
      source: r.source ?? "Impor CSV",
      notes: r.notes ?? null,
    })),
    skipDuplicates: true,
  });
  revalidatePath("/pelanggan");
  return { imported: created.count, duplicates: res.duplicates, invalid: res.invalid, skipped: rows.length > MAX_ROWS ? rows.length - MAX_ROWS : 0 };
}
