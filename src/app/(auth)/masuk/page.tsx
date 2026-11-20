"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "../actions";
import { Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Alert } from "@/components/ui/Alert";

export default function LoginPage() {
  const [state, action] = useActionState(loginAction, {});
  return (
    <>
      <h1 className="mb-1 text-lg font-semibold">Masuk</h1>
      <p className="mb-5 text-sm text-zinc-500">Selamat datang kembali 👋</p>
      <form action={action} className="space-y-4">
        {state.error && <Alert>{state.error}</Alert>}
        <Input name="email" type="email" label="Email" autoComplete="email" inputMode="email" required placeholder="nama@email.com" />
        <Input name="password" type="password" label="Kata sandi" autoComplete="current-password" required />
        <SubmitButton size="lg" pendingText="Memeriksa…">
          Masuk
        </SubmitButton>
      </form>
      <div className="mt-5 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-600">
        <span className="font-medium text-zinc-800">Coba demo:</span> demo@tokoku.id / demo12345
      </div>
      <p className="mt-5 text-center text-sm text-zinc-500">
        Belum punya akun?{" "}
        <Link href="/daftar" className="font-medium text-zinc-900 underline underline-offset-4">
          Daftar gratis
        </Link>
      </p>
    </>
  );
}
