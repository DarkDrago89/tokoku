"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import type { OrderStatus } from "@prisma/client";
import { requireSession } from "@/lib/session";
import { zodFieldErrors, type FormState } from "@/lib/utils";
import { createOrderForStore, duplicateOrderForStore, updateOrderStatusForStore } from "./service";

export async function createOrderAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const s = await requireSession();
  let payload: unknown;
  try {
    payload = JSON.parse(String(formData.get("payload") ?? "{}"));
  } catch {
    return { error: "Data pesanan tidak terbaca. Coba lagi." };
  }
  let id: string;
  try {
    const order = await createOrderForStore(s.storeId, payload as Parameters<typeof createOrderForStore>[1]);
    id = order.id;
  } catch (e) {
    if (e instanceof ZodError) {
      const fe = zodFieldErrors(e.issues);
      return { fieldErrors: fe, error: Object.values(fe)[0] };
    }
    throw e;
  }
  revalidatePath("/pesanan");
  revalidatePath("/pelanggan", "layout");
  redirect(`/pesanan/${id}?baru=1`);
}

export async function updateStatusAction(orderId: string, status: OrderStatus, trackingNumber?: string) {
  const s = await requireSession();
  await updateOrderStatusForStore(s.storeId, orderId, status, { trackingNumber, userId: s.userId });
  revalidatePath(`/pesanan/${orderId}`);
  revalidatePath("/pesanan");
  revalidatePath("/hari-ini");
  revalidatePath("/pelanggan", "layout");
}

export async function duplicateOrderAction(orderId: string) {
  const s = await requireSession();
  const copy = await duplicateOrderForStore(s.storeId, orderId);
  revalidatePath("/pesanan");
  redirect(`/pesanan/${copy.id}?baru=1`);
}
