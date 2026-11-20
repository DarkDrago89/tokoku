"use client";

import { useActionState, useEffect, useState } from "react";
import { ClipboardList, NotebookPen } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { cn, type FormState } from "@/lib/utils";
import { createTaskAction, logInteractionAction } from "@/features/tasks/actions";
import { CustomerPicker, type PickedCustomer } from "@/features/customers/CustomerPicker";

const TYPES = [
  { value: "whatsapp", label: "Chat" },
  { value: "call", label: "Telepon" },
  { value: "meeting", label: "Tatap muka" },
  { value: "complaint", label: "Keluhan" },
  { value: "note", label: "Catatan" },
] as const;

export function InteractionFields({ fe, defaultType = "note" }: { fe: Record<string, string>; defaultType?: string }) {
  const [type, setType] = useState(defaultType);
  return (
    <>
      <div>
        <span className="mb-1.5 block text-sm font-medium text-zinc-800">Jenis</span>
        <input type="hidden" name="type" value={type} />
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              type="button"
              key={t.value}
              onClick={() => setType(t.value)}
              className={cn(
                "h-9 rounded-full border px-3.5 text-sm",
                type === t.value ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 text-zinc-700",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <Textarea name="content" label="Isi" required rows={4} error={fe.content} placeholder="Apa yang dibicarakan?" />
    </>
  );
}

function isoDate(offsetDays: number) {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(d);
}

export function TaskFields({ fe, defaultTitle = "" }: { fe: Record<string, string>; defaultTitle?: string }) {
  const [due, setDue] = useState(isoDate(1));
  const quick = [
    { label: "Hari ini", d: 0 },
    { label: "Besok", d: 1 },
    { label: "3 hari", d: 3 },
    { label: "1 minggu", d: 7 },
  ];
  return (
    <>
      <Input name="title" label="Tugas" required defaultValue={defaultTitle} placeholder="Contoh: Tawarkan stok baru" error={fe.title} />
      <div className="space-y-1.5">
        <Input name="dueDate" type="date" label="Kapan" required value={due} onChange={(e) => setDue(e.target.value)} error={fe.dueDate} />
        <div className="flex flex-wrap gap-2">
          {quick.map((q) => (
            <button
              type="button"
              key={q.label}
              onClick={() => setDue(isoDate(q.d))}
              className={cn(
                "h-8 rounded-full border px-3 text-xs",
                due === isoDate(q.d) ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 text-zinc-700",
              )}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>
      <Textarea name="notes" label="Catatan" rows={2} />
    </>
  );
}

/** Tombol + lembar untuk mencatat interaksi pelanggan tertentu. */
export function LogInteractionButton({ customerId }: { customerId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<FormState, FormData>(logInteractionAction, {});
  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <NotebookPen className="h-4 w-4" /> Catat
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Catat interaksi">
        <form action={action} className="space-y-4">
          <input type="hidden" name="customerId" value={customerId} />
          <input type="hidden" name="stay" value="1" />
          <InteractionFields fe={state.fieldErrors ?? {}} />
          <SubmitButton size="lg">Simpan catatan</SubmitButton>
        </form>
      </Sheet>
    </>
  );
}

export function AddTaskButton({ customerId }: { customerId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<FormState, FormData>(createTaskAction, {});
  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <ClipboardList className="h-4 w-4" /> Tugas
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Tugas follow-up">
        <form action={action} className="space-y-4">
          <input type="hidden" name="customerId" value={customerId} />
          <input type="hidden" name="stay" value="1" />
          <TaskFields fe={state.fieldErrors ?? {}} />
          <SubmitButton size="lg">Simpan tugas</SubmitButton>
        </form>
      </Sheet>
    </>
  );
}

/** Halaman mandiri (dari tombol +): pilih pelanggan lalu isi. */
export function StandaloneInteractionForm({ initial }: { initial?: PickedCustomer | null }) {
  const [state, action] = useActionState<FormState, FormData>(logInteractionAction, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5">
      <CustomerPicker initial={initial} error={fe.customerId} />
      <InteractionFields fe={fe} />
      <SubmitButton size="lg">Simpan catatan</SubmitButton>
    </form>
  );
}

export function StandaloneTaskForm({ initial }: { initial?: PickedCustomer | null }) {
  const [state, action] = useActionState<FormState, FormData>(createTaskAction, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5">
      <CustomerPicker initial={initial} error={fe.customerId} />
      <p className="-mt-3 text-xs text-zinc-500">Boleh dikosongkan untuk tugas umum.</p>
      <TaskFields fe={fe} />
      <SubmitButton size="lg">Simpan tugas</SubmitButton>
    </form>
  );
}
