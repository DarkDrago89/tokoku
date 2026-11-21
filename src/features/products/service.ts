import { z } from "zod";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/features/customers/service";

const optionalInt = z
  .union([z.literal(""), z.coerce.number().int().min(0, "Tidak boleh negatif")])
  .optional()
  .transform((v) => (v === "" || v === undefined ? null : v));

export const productInputSchema = z.object({
  name: z.string().trim().min(1, "Nama produk wajib diisi"),
  sku: z.string().trim().optional().transform((v) => v || null),
  price: z.coerce.number({ message: "Harga wajib diisi" }).min(0, "Harga tidak boleh negatif"),
  category: z.string().trim().optional().transform((v) => v || null),
  stock: optionalInt,
  repurchaseDays: optionalInt,
});

export type ProductInput = z.input<typeof productInputSchema>;

export async function listProducts(storeId: string, q?: string) {
  return prisma.product.findMany({
    where: { storeId, isActive: true, ...(q ? { name: { contains: q, mode: "insensitive" } } : {}) },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

export async function createProductForStore(storeId: string, input: ProductInput) {
  return prisma.product.create({ data: { ...productInputSchema.parse(input), storeId } });
}

export async function updateProductForStore(storeId: string, id: string, input: ProductInput) {
  const data = productInputSchema.parse(input);
  const res = await prisma.product.updateMany({ where: { id, storeId }, data });
  if (!res.count) throw new NotFoundError();
}

/** Produk tidak dihapus permanen agar riwayat pesanan tetap utuh. */
export async function archiveProductForStore(storeId: string, id: string) {
  const res = await prisma.product.updateMany({ where: { id, storeId }, data: { isActive: false } });
  if (!res.count) throw new NotFoundError();
}
