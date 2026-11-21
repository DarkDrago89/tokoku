"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireSession } from "@/lib/session";
import { assertCan } from "@/lib/permissions";
import { zodFieldErrors, type FormState } from "@/lib/utils";
import { addMember, changeRole, MemberError, removeMember, updateStore } from "./service";

async function owner() {
  const s = await requireSession();
  assertCan(s.role, "settings.manage");
  return s;
}

export async function updateStoreAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const s = await owner();
  try {
    await updateStore(s.storeId, {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      address: String(formData.get("address") ?? ""),
      inactiveDays: String(formData.get("inactiveDays") ?? "60"),
    });
  } catch (e) {
    if (e instanceof ZodError) return { fieldErrors: zodFieldErrors(e.issues) };
    throw e;
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Pengaturan tersimpan" };
}

export async function addMemberAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const s = await owner();
  try {
    await addMember(s.storeId, {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      role: String(formData.get("role") ?? "staff") as "admin" | "staff",
    });
  } catch (e) {
    if (e instanceof ZodError) return { fieldErrors: zodFieldErrors(e.issues) };
    if (e instanceof MemberError) return { fieldErrors: { email: e.message } };
    throw e;
  }
  revalidatePath("/pengaturan");
  return { ok: true, message: "Anggota ditambahkan. Bagikan email & kata sandinya agar bisa masuk." };
}

export async function changeRoleAction(userId: string, role: "admin" | "staff") {
  const s = await owner();
  try {
    await changeRole(s.storeId, s.userId, userId, role);
  } catch (e) {
    if (e instanceof MemberError) return { error: e.message };
    throw e;
  }
  revalidatePath("/pengaturan");
  return {};
}

export async function removeMemberAction(userId: string) {
  const s = await owner();
  try {
    await removeMember(s.storeId, s.userId, userId);
  } catch (e) {
    if (e instanceof MemberError) return { error: e.message };
    throw e;
  }
  revalidatePath("/pengaturan");
  return {};
}
