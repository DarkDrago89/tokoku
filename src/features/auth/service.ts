import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { DEFAULT_TEMPLATES } from "@/features/templates/defaults";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 huruf"),
  storeName: z.string().trim().min(2, "Nama toko minimal 2 huruf"),
  email: z.string().trim().toLowerCase().email("Format email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export class EmailTakenError extends Error {
  constructor() {
    super("Email ini sudah terdaftar. Silakan masuk.");
  }
}

/** Membuat toko baru beserta pemiliknya dan template pesan bawaan. */
export async function registerStore(input: RegisterInput) {
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) throw new EmailTakenError();
  const passwordHash = await bcrypt.hash(input.password, 10);
  return prisma.$transaction(async (tx) => {
    const store = await tx.store.create({ data: { name: input.storeName, settings: { inactiveDays: 60 } } });
    const user = await tx.user.create({
      data: { storeId: store.id, name: input.name, email: input.email, passwordHash, role: "owner" },
    });
    await tx.messageTemplate.createMany({
      data: DEFAULT_TEMPLATES.map((t) => ({ ...t, storeId: store.id })),
    });
    return { store, user };
  });
}
