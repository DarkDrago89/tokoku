"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireSession } from "@/lib/session";
import { zodFieldErrors, type FormState } from "@/lib/utils";
import { completeTask, createTaskForStore, reopenTask } from "./service";
import { logInteraction } from "@/features/interactions/service";
import type { InteractionType } from "@prisma/client";

export async function createTaskAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const s = await requireSession();
  const customerId = String(formData.get("customerId") ?? "") || null;
  try {
    await createTaskForStore(s.storeId, {
      title: String(formData.get("title") ?? ""),
      dueDate: String(formData.get("dueDate") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      customerId,
      assignedTo: s.userId,
    });
  } catch (e) {
    if (e instanceof ZodError) return { fieldErrors: zodFieldErrors(e.issues) };
    throw e;
  }
  revalidatePath("/hari-ini");
  if (customerId) revalidatePath(`/pelanggan/${customerId}`);
  if (formData.get("stay")) return { ok: true, message: "Tugas tersimpan" };
  redirect(customerId ? `/pelanggan/${customerId}` : "/hari-ini");
}

export async function completeTaskAction(taskId: string, note?: string) {
  const s = await requireSession();
  await completeTask(s.storeId, taskId, { note, userId: s.userId });
  revalidatePath("/hari-ini");
  revalidatePath("/pelanggan", "layout");
}

export async function reopenTaskAction(taskId: string) {
  const s = await requireSession();
  await reopenTask(s.storeId, taskId);
  revalidatePath("/hari-ini");
}

export async function logInteractionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const s = await requireSession();
  const customerId = String(formData.get("customerId") ?? "");
  if (!customerId) return { fieldErrors: { customerId: "Pilih pelanggan dulu" } };
  try {
    await logInteraction(s.storeId, customerId, {
      type: String(formData.get("type") ?? "note") as InteractionType,
      content: String(formData.get("content") ?? ""),
      userId: s.userId,
    });
  } catch (e) {
    if (e instanceof ZodError) return { fieldErrors: zodFieldErrors(e.issues) };
    throw e;
  }
  revalidatePath(`/pelanggan/${customerId}`);
  if (formData.get("stay")) return { ok: true, message: "Catatan tersimpan" };
  redirect(`/pelanggan/${customerId}`);
}

/** Dipanggil setelah tombol WhatsApp dipakai (F-WA-05). */
export async function logWhatsAppAction(customerId: string, text: string) {
  const s = await requireSession();
  await logInteraction(s.storeId, customerId, {
    type: "whatsapp",
    content: text.trim() ? text.slice(0, 2000) : "Membuka chat WhatsApp",
    userId: s.userId,
  });
  revalidatePath(`/pelanggan/${customerId}`);
}
