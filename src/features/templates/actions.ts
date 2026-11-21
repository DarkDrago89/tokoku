"use server";

import { revalidatePath } from "next/cache";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { zodFieldErrors, type FormState } from "@/lib/utils";

const schema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi").max(80),
  category: z.string().trim().min(1, "Pilih kategori"),
  body: z.string().trim().min(1, "Isi pesan wajib diisi").max(2000),
});

export async function saveTemplateAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const s = await requireSession();
  const id = String(formData.get("id") ?? "");
  try {
    const data = schema.parse(Object.fromEntries(formData));
    if (id) {
      const res = await prisma.messageTemplate.updateMany({ where: { id, storeId: s.storeId }, data });
      if (!res.count) return { error: "Template tidak ditemukan." };
    } else {
      await prisma.messageTemplate.create({ data: { ...data, storeId: s.storeId } });
    }
  } catch (e) {
    if (e instanceof ZodError) return { fieldErrors: zodFieldErrors(e.issues) };
    throw e;
  }
  revalidatePath("/template");
  return { ok: true };
}

export async function deleteTemplateAction(id: string) {
  const s = await requireSession();
  await prisma.messageTemplate.deleteMany({ where: { id, storeId: s.storeId } });
  revalidatePath("/template");
}
