"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { EmailTakenError, registerSchema, registerStore } from "@/features/auth/service";
import { zodFieldErrors, type FormState } from "@/lib/utils";

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? "").toLowerCase(),
      password: formData.get("password"),
      redirectTo: "/hari-ini",
    });
    return {};
  } catch (e) {
    if (e instanceof AuthError) return { error: "Email atau kata sandi salah." };
    throw e; // redirect dari signIn harus diteruskan
  }
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error.issues) };
  try {
    await registerStore(parsed.data);
  } catch (e) {
    if (e instanceof EmailTakenError) return { fieldErrors: { email: e.message } };
    throw e;
  }
  await signIn("credentials", { email: parsed.data.email, password: parsed.data.password, redirectTo: "/hari-ini" });
  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/masuk" });
}
