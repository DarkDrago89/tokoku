"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { CUSTOMER_SOURCES } from "@/lib/domain/customer";
import { checkPhoneAction, saveCustomerAction } from "./actions";
import { TagPicker } from "./TagPicker";

export type CustomerFormValues = {
  id?: string;
  name?: string;
  phone?: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  birthday?: string | null; // yyyy-mm-dd
  source?: string | null;
  notes?: string | null;
  tags?: string[];
};

export function CustomerForm({ values = {}, allTags }: { values?: CustomerFormValues; allTags: string[] }) {
  const [state, action] = useActionState(saveCustomerAction, {});
  const fe = state.fieldErrors ?? {};
  const [dup, setDup] = useState<{ id: string; name: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hasExtra = !!(values.email || values.address || values.city || values.birthday || values.source || values.notes);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onPhoneChange = (v: string) => {
    clearTimeout(timer.current);
    if (v.replace(/\D/g, "").length < 9) return setDup(null);
    timer.current = setTimeout(async () => setDup(await checkPhoneAction(v, values.id)), 400);
  };

  const duplicate = dup ?? state.duplicate ?? null;

  return (
    <form action={action} className="space-y-5">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <Input name="name" label="Nama" required autoFocus={!values.id} defaultValue={values.name} error={fe.name} placeholder="Nama pelanggan" />
      <div className="space-y-2">
        <Input
          name="phone"
          label="Nomor WhatsApp"
          required
          type="tel"
          inputMode="tel"
          defaultValue={values.phone}
          error={duplicate ? undefined : fe.phone}
          placeholder="0812 3456 7890"
          hint="Boleh pakai 08…, +62…, atau 62…"
          onChange={(e) => onPhoneChange(e.target.value)}
        />
        {duplicate && (
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900" role="alert">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Nomor ini sudah dipakai oleh <b>{duplicate.name}</b>.{" "}
              <Link href={`/pelanggan/${duplicate.id}`} className="font-medium underline underline-offset-2">
                Lihat pelanggan
              </Link>
            </p>
          </div>
        )}
      </div>

      <details open={hasExtra} className="group rounded-2xl border border-zinc-200">
        <summary className="flex h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-medium">
          Detail tambahan <span className="text-xs font-normal text-zinc-500">(opsional)</span>
          <ChevronDown className="ml-auto h-4 w-4 text-zinc-500 transition group-open:rotate-180" />
        </summary>
        <div className="space-y-4 border-t border-zinc-200 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="city" label="Kota" defaultValue={values.city ?? ""} error={fe.city} />
            <Select name="source" label="Tahu toko dari" defaultValue={values.source ?? ""}>
              <option value="">Pilih sumber</option>
              {CUSTOMER_SOURCES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </div>
          <Textarea name="address" label="Alamat" rows={2} defaultValue={values.address ?? ""} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="email" type="email" label="Email" defaultValue={values.email ?? ""} error={fe.email} />
            <Input name="birthday" type="date" label="Tanggal lahir" defaultValue={values.birthday ?? ""} error={fe.birthday} hint="Untuk pengingat ulang tahun" />
          </div>
          <TagPicker allTags={allTags} initial={values.tags} />
          <Textarea name="notes" label="Catatan" rows={2} defaultValue={values.notes ?? ""} placeholder="Contoh: suka kopi yang tidak terlalu asam" />
        </div>
      </details>

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <SubmitButton size="lg" className="sm:w-auto sm:flex-1">
          Simpan
        </SubmitButton>
        {!values.id && (
          <SubmitButton size="lg" variant="secondary" name="next" value="pesanan" className="sm:w-auto sm:flex-1" pendingText="Menyimpan…">
            Simpan & buat pesanan
          </SubmitButton>
        )}
      </div>
    </form>
  );
}
