import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { readSettings } from "@/lib/utils";
import { normalizePhone } from "@/lib/domain/phone";

export const storeSchema = z.object({
  name: z.string().trim().min(2, "Nama toko minimal 2 huruf"),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v, ctx) => {
      if (!v) return null;
      const n = normalizePhone(v);
      if (!n) {
        ctx.addIssue({ code: "custom", message: "Nomor tidak valid" });
        return z.NEVER;
      }
      return n;
    }),
  address: z.string().trim().optional().transform((v) => v || null),
  inactiveDays: z.coerce.number().int().min(7, "Minimal 7 hari").max(365, "Maksimal 365 hari"),
});

export async function updateStore(storeId: string, input: z.input<typeof storeSchema>) {
  const { inactiveDays, ...data } = storeSchema.parse(input);
  const store = await prisma.store.findUniqueOrThrow({ where: { id: storeId } });
  await prisma.store.update({
    where: { id: storeId },
    data: { ...data, settings: { ...readSettings(store.settings), inactiveDays } },
  });
}

export const memberSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 huruf"),
  email: z.string().trim().toLowerCase().email("Format email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  role: z.enum(["admin", "staff"]),
});

export class MemberError extends Error {}

export async function addMember(storeId: string, input: z.input<typeof memberSchema>) {
  const data = memberSchema.parse(input);
  if (await prisma.user.findUnique({ where: { email: data.email } })) throw new MemberError("Email ini sudah dipakai akun lain.");
  return prisma.user.create({
    data: { storeId, name: data.name, email: data.email, role: data.role, passwordHash: await bcrypt.hash(data.password, 10) },
  });
}

export async function changeRole(storeId: string, actorId: string, userId: string, role: "admin" | "staff") {
  if (userId === actorId) throw new MemberError("Anda tidak bisa mengubah peran sendiri.");
  const res = await prisma.user.updateMany({ where: { id: userId, storeId, role: { not: "owner" } }, data: { role } });
  if (!res.count) throw new MemberError("Anggota tidak ditemukan.");
}

export async function removeMember(storeId: string, actorId: string, userId: string) {
  if (userId === actorId) throw new MemberError("Anda tidak bisa menghapus akun sendiri.");
  const res = await prisma.user.deleteMany({ where: { id: userId, storeId, role: { not: "owner" } } });
  if (!res.count) throw new MemberError("Anggota tidak ditemukan.");
}
