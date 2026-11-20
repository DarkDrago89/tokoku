"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "../actions";
import { Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export default function RegisterPage() {
  const [state, action] = useActionState(registerAction, {});
  const fe = state.fieldErrors ?? {};
  return (
    <>
      <h1 className="mb-1 text-lg font-semibold">Buat akun toko</h1>
      <p className="mb-5 text-sm text-zinc-500">Gratis, siap dipakai dalam 1 menit.</p>
      <form action={action} className="space-y-4">
        <Input name="name" label="Nama Anda" autoComplete="name" required error={fe.name} />
        <Input name="storeName" label="Nama toko" required placeholder="Contoh: Kopi Nusantara" error={fe.storeName} />
        <Input name="email" type="email" label="Email" autoComplete="email" inputMode="email" required error={fe.email} />
        <Input
          name="password"
          type="password"
          label="Kata sandi"
          autoComplete="new-password"
          required
          minLength={8}
          hint="Minimal 8 karakter"
          error={fe.password}
        />
        <SubmitButton size="lg" pendingText="Membuat akun…">
          Daftar
        </SubmitButton>
      </form>
      <p className="mt-5 text-center text-sm text-zinc-500">
        Sudah punya akun?{" "}
        <Link href="/masuk" className="font-medium text-zinc-900 underline underline-offset-4">
          Masuk
        </Link>
      </p>
    </>
  );
}
