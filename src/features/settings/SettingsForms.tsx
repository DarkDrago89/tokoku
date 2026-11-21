"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { ROLE_LABEL, type Role } from "@/lib/permissions";
import type { FormState } from "@/lib/utils";
import { addMemberAction, changeRoleAction, removeMemberAction, updateStoreAction } from "./actions";

export function StoreForm({ store }: { store: { name: string; phone: string; address: string; inactiveDays: number } }) {
  const [state, action] = useActionState<FormState, FormData>(updateStoreAction, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4">
      {state.ok && <Alert tone="success">{state.message}</Alert>}
      <Input name="name" label="Nama toko" required defaultValue={store.name} error={fe.name} />
      <Input name="phone" label="Nomor WhatsApp toko" type="tel" defaultValue={store.phone} error={fe.phone} />
      <Textarea name="address" label="Alamat" rows={2} defaultValue={store.address} />
      <Input
        name="inactiveDays"
        label="Pelanggan dianggap tidak aktif setelah (hari)"
        type="number"
        min={7}
        max={365}
        defaultValue={store.inactiveDays}
        error={fe.inactiveDays}
        hint="Bawaan 60 hari. Dipakai untuk status pelanggan dan daftar 'Lama tidak belanja'."
      />
      <SubmitButton>Simpan pengaturan</SubmitButton>
    </form>
  );
}

export type Member = { id: string; name: string; email: string; role: Role };

export function TeamManager({ members, meId }: { members: Member[]; meId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<FormState, FormData>(addMemberAction, {});
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const fe = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      setMsg(state.message ?? "");
      formRef.current?.reset();
    }
  }, [state]);

  const run = (fn: () => Promise<{ error?: string }>) =>
    start(async () => {
      const r = await fn();
      setMsg(r.error ?? "");
    });

  return (
    <div className="space-y-3">
      {msg && <Alert tone="neutral">{msg}</Alert>}
      <ul className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200">
        {members.map((m) => (
          <li key={m.id} className="flex items-center gap-3 px-4 py-3">
            <Avatar name={m.name} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {m.name} {m.id === meId && <span className="text-zinc-400">(Anda)</span>}
              </p>
              <p className="truncate text-xs text-zinc-500">{m.email}</p>
            </div>
            {m.role === "owner" || m.id === meId ? (
              <Badge tone="dark">{ROLE_LABEL[m.role]}</Badge>
            ) : (
              <>
                <select
                  aria-label={`Peran ${m.name}`}
                  defaultValue={m.role}
                  disabled={pending}
                  onChange={(e) => run(() => changeRoleAction(m.id, e.target.value as "admin" | "staff"))}
                  className="h-9 rounded-lg border border-zinc-300 bg-white px-2 text-sm"
                >
                  <option value="admin">Admin</option>
                  <option value="staff">Staf</option>
                </select>
                <button
                  aria-label={`Hapus ${m.name}`}
                  disabled={pending}
                  onClick={() => confirm(`Hapus akses ${m.name}?`) && run(() => removeMemberAction(m.id))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" /> Tambah anggota
      </Button>
      <div className="rounded-2xl bg-zinc-50 p-4 text-xs text-zinc-600">
        <p className="mb-1 font-medium text-zinc-800">Hak akses</p>
        <p>
          <b>Admin</b>: semua kecuali pengaturan & tim. <b>Staf</b>: lihat/tambah pelanggan dan kelola pesanan, tanpa hapus pelanggan,
          laporan, atau ekspor.
        </p>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title="Anggota baru">
        <form ref={formRef} action={action} className="space-y-4">
          <Input name="name" label="Nama" required error={fe.name} />
          <Input name="email" type="email" label="Email" required error={fe.email} />
          <Input name="password" type="text" label="Kata sandi awal" required minLength={8} error={fe.password} hint="Minimal 8 karakter. Bagikan ke anggota secara pribadi." />
          <Select name="role" label="Peran" defaultValue="staff">
            <option value="staff">Staf</option>
            <option value="admin">Admin</option>
          </Select>
          <SubmitButton size="lg">Tambah anggota</SubmitButton>
        </form>
      </Sheet>
    </div>
  );
}
