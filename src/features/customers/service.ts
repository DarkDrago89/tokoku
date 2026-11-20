import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/domain/phone";
import { NEW_CUSTOMER_DAYS, type CustomerStatus } from "@/lib/domain/customer";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null));

export const customerInputSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi"),
  phone: z
    .string()
    .trim()
    .min(1, "Nomor WhatsApp wajib diisi")
    .transform((v, ctx) => {
      const n = normalizePhone(v);
      if (!n) {
        ctx.addIssue({ code: "custom", message: "Nomor tidak valid. Contoh: 0812 3456 7890" });
        return z.NEVER;
      }
      return n;
    }),
  email: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v.toLowerCase() : null))
    .refine((v) => !v || z.string().email().safeParse(v).success, "Format email tidak valid"),
  address: optionalText,
  city: optionalText,
  birthday: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(`${v}T00:00:00Z`) : null))
    .refine((d) => !d || !Number.isNaN(+d), "Tanggal tidak valid"),
  source: optionalText,
  notes: optionalText,
});

export type CustomerInput = z.input<typeof customerInputSchema>;
type CustomerData = z.output<typeof customerInputSchema>;

export class DuplicatePhoneError extends Error {
  constructor(public existing: { id: string; name: string }) {
    super(`Nomor ini sudah dipakai oleh ${existing.name}.`);
  }
}

export class NotFoundError extends Error {
  constructor() {
    super("Data tidak ditemukan.");
  }
}

/** Cari pelanggan aktif (tidak terhapus) yang memakai nomor ini. */
export async function findDuplicate(storeId: string, rawPhone: string, excludeId?: string) {
  const phone = normalizePhone(rawPhone);
  if (!phone) return null;
  return prisma.customer.findFirst({
    where: { storeId, phone, deletedAt: null, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true, name: true },
  });
}

export async function createCustomerForStore(storeId: string, input: CustomerInput) {
  const data: CustomerData = customerInputSchema.parse(input);
  const existing = await prisma.customer.findUnique({
    where: { storeId_phone: { storeId, phone: data.phone } },
    select: { id: true, name: true, deletedAt: true },
  });
  if (existing && !existing.deletedAt) throw new DuplicatePhoneError(existing);
  if (existing) {
    // Nomor milik pelanggan yang sudah dihapus (masih dalam masa simpan): pulihkan dengan data baru.
    return prisma.customer.update({ where: { id: existing.id }, data: { ...data, deletedAt: null } });
  }
  return prisma.customer.create({ data: { ...data, storeId } });
}

export async function updateCustomerForStore(storeId: string, id: string, input: CustomerInput) {
  const data = customerInputSchema.parse(input);
  const current = await getCustomerForStore(storeId, id);
  if (!current) throw new NotFoundError();
  const dup = await prisma.customer.findFirst({
    where: { storeId, phone: data.phone, id: { not: id } },
    select: { id: true, name: true },
  });
  if (dup) throw new DuplicatePhoneError(dup);
  return prisma.customer.update({ where: { id }, data });
}

export async function softDeleteCustomer(storeId: string, id: string) {
  const res = await prisma.customer.updateMany({
    where: { id, storeId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (res.count === 0) throw new NotFoundError();
}

export async function getCustomerForStore(storeId: string, id: string) {
  if (!z.string().uuid().safeParse(id).success) return null;
  return prisma.customer.findFirst({
    where: { id, storeId, deletedAt: null },
    include: { tags: { include: { tag: true } } },
  });
}

/** Kondisi Prisma yang setara dengan `customerStatus()` agar filter dan label selalu cocok. */
export function statusWhere(status: CustomerStatus, now: Date, inactiveDays: number): Prisma.CustomerWhereInput {
  const day = 86_400_000;
  const newSince = new Date(+now - NEW_CUSTOMER_DAYS * day);
  const inactiveSince = new Date(+now - inactiveDays * day);
  const neverBought: Prisma.CustomerWhereInput = { OR: [{ orderCount: 0 }, { lastOrderAt: null }] };
  const bought: Prisma.CustomerWhereInput = { orderCount: { gt: 0 }, lastOrderAt: { not: null } };
  const isNew: Prisma.CustomerWhereInput = { AND: [neverBought, { createdAt: { gte: newSince } }] };
  const isInactive: Prisma.CustomerWhereInput = {
    OR: [
      { AND: [bought, { lastOrderAt: { lt: inactiveSince } }] },
      { AND: [neverBought, { createdAt: { lt: newSince } }, { createdAt: { lt: inactiveSince } }] },
    ],
  };
  if (status === "baru") return isNew;
  if (status === "tidak_aktif") return isInactive;
  return { NOT: { OR: [isNew, isInactive] } };
}

export type CustomerFilters = {
  q?: string;
  tagId?: string;
  city?: string;
  source?: string;
  status?: CustomerStatus;
  sort?: "terbaru" | "belanja" | "nama" | "terakhir";
  page?: number;
};

export const PAGE_SIZE = 20;

export async function listCustomers(storeId: string, f: CustomerFilters, inactiveDays: number, now = new Date()) {
  const and: Prisma.CustomerWhereInput[] = [{ storeId, deletedAt: null }];
  const q = f.q?.trim();
  if (q) {
    const digits = q.replace(/\D/g, "");
    const phoneQ = digits.length >= 4 ? (normalizePhone(digits) ?? digits).replace(/^62/, "") : null;
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        ...(phoneQ ? [{ phone: { contains: phoneQ } }] : []),
      ],
    });
  }
  if (f.tagId) and.push({ tags: { some: { tagId: f.tagId } } });
  if (f.city) and.push({ city: { equals: f.city, mode: "insensitive" } });
  if (f.source) and.push({ source: f.source });
  if (f.status) and.push(statusWhere(f.status, now, inactiveDays));

  const orderBy: Prisma.CustomerOrderByWithRelationInput =
    f.sort === "belanja"
      ? { totalSpent: "desc" }
      : f.sort === "nama"
        ? { name: "asc" }
        : f.sort === "terakhir"
          ? { lastOrderAt: { sort: "desc", nulls: "last" } }
          : { createdAt: "desc" };

  const page = Math.max(1, f.page ?? 1);
  const where = { AND: and };
  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { tags: { include: { tag: true } } },
    }),
    prisma.customer.count({ where }),
  ]);
  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/** Pencarian cepat untuk pemilih pelanggan (form pesanan, catatan, tugas). */
export async function searchCustomers(storeId: string, q: string, limit = 8) {
  const res = await listCustomers(storeId, { q, sort: q ? "nama" : "terakhir" }, 60);
  return res.items.slice(0, limit).map((c) => ({ id: c.id, name: c.name, phone: c.phone, city: c.city }));
}

export async function listTags(storeId: string) {
  return prisma.tag.findMany({ where: { storeId }, orderBy: { name: "asc" } });
}

export async function listCities(storeId: string) {
  const rows = await prisma.customer.findMany({
    where: { storeId, deletedAt: null, city: { not: null } },
    distinct: ["city"],
    select: { city: true },
    orderBy: { city: "asc" },
  });
  return rows.map((r) => r.city!).filter(Boolean);
}

/** Mengganti seluruh tag pelanggan; tag baru dibuat otomatis. */
export async function setCustomerTags(storeId: string, customerId: string, names: string[]) {
  const customer = await getCustomerForStore(storeId, customerId);
  if (!customer) throw new NotFoundError();
  const clean = [...new Set(names.map((n) => n.trim()).filter(Boolean))].slice(0, 10);
  await prisma.$transaction(async (tx) => {
    const tags = await Promise.all(
      clean.map((name) =>
        tx.tag.upsert({ where: { storeId_name: { storeId, name } }, update: {}, create: { storeId, name } }),
      ),
    );
    await tx.customerTag.deleteMany({ where: { customerId } });
    if (tags.length) await tx.customerTag.createMany({ data: tags.map((t) => ({ customerId, tagId: t.id })) });
  });
}
