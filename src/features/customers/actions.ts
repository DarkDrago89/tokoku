"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireSession } from "@/lib/session";
import { assertCan } from "@/lib/permissions";
import { zodFieldErrors, type FormState } from "@/lib/utils";
import {
  createCustomerForStore,
  DuplicatePhoneError,
  findDuplicate,
  searchCustomers,
  setCustomerTags,
  softDeleteCustomer,
  updateCustomerForStore,
} from "./service";

export type CustomerFormState = FormState & { duplicate?: { id: string; name: string } };

export async function saveCustomerAction(_prev: CustomerFormState, formData: FormData): Promise<CustomerFormState> {
  const s = await requireSession();
  const id = String(formData.get("id") ?? "") || null;
  const input = {
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    address: String(formData.get("address") ?? ""),
    city: String(formData.get("city") ?? ""),
    birthday: String(formData.get("birthday") ?? ""),
    source: String(formData.get("source") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  let customerId: string;
  try {
    const c = id ? await updateCustomerForStore(s.storeId, id, input) : await createCustomerForStore(s.storeId, input);
    customerId = c.id;
    await setCustomerTags(s.storeId, customerId, tags);
  } catch (e) {
    if (e instanceof ZodError) return { fieldErrors: zodFieldErrors(e.issues) };
    if (e instanceof DuplicatePhoneError) return { fieldErrors: { phone: e.message }, duplicate: e.existing };
    throw e;
  }
  revalidatePath("/pelanggan");
  const next = String(formData.get("next") ?? "");
  redirect(next === "pesanan" ? `/pesanan/baru?pelanggan=${customerId}` : `/pelanggan/${customerId}`);
}

export async function deleteCustomerAction(id: string) {
  const s = await requireSession();
  assertCan(s.role, "customer.delete");
  await softDeleteCustomer(s.storeId, id);
  revalidatePath("/pelanggan");
  redirect("/pelanggan");
}

export async function checkPhoneAction(phone: string, excludeId?: string) {
  const s = await requireSession();
  return findDuplicate(s.storeId, phone, excludeId);
}

export async function searchCustomersAction(q: string) {
  const s = await requireSession();
  return searchCustomers(s.storeId, q);
}

export async function saveTagsAction(customerId: string, names: string[]) {
  const s = await requireSession();
  await setCustomerTags(s.storeId, customerId, names);
  revalidatePath(`/pelanggan/${customerId}`);
}
