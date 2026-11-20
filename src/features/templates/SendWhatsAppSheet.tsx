"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, MessageCircle } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { renderTemplate } from "@/lib/domain/template";
import { waLink } from "@/lib/domain/phone";
import { cn } from "@/lib/utils";
import { logWhatsAppAction } from "@/features/tasks/actions";

export type TemplateOption = { id: string; title: string; category: string; body: string };
export type WaContext = { produk?: string; total?: string; resi?: string };

/** Tombol "Chat WhatsApp" + lembar pilih template (F-WA-01..05). */
export function WhatsAppButton({
  customer,
  templates,
  context,
  label = "Chat WhatsApp",
  variant = "primary",
  size = "md",
  className,
  preferCategory,
}: {
  customer: { id: string; name: string; phone: string };
  templates: TemplateOption[];
  context?: WaContext;
  label?: string;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  className?: string;
  preferCategory?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        <MessageCircle className="h-4 w-4" /> {label}
      </Button>
      {open && (
        <SendSheet
          customer={customer}
          templates={templates}
          context={context}
          preferCategory={preferCategory}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function SendSheet({
  customer,
  templates,
  context,
  preferCategory,
  onClose,
}: {
  customer: { id: string; name: string; phone: string };
  templates: TemplateOption[];
  context?: WaContext;
  preferCategory?: string;
  onClose: () => void;
}) {
  const initial = templates.find((t) => t.category === preferCategory) ?? null;
  const [templateId, setTemplateId] = useState<string | null>(initial?.id ?? null);
  const vars = useMemo(() => ({ nama: customer.name.split(" ")[0], ...context }), [customer.name, context]);
  const rendered = useMemo(() => {
    const t = templates.find((x) => x.id === templateId);
    return t ? renderTemplate(t.body, vars) : { text: "", missing: [] };
  }, [templateId, templates, vars]);
  const [text, setText] = useState(rendered.text);
  const [, start] = useTransition();

  const pick = (id: string | null) => {
    setTemplateId(id);
    const t = templates.find((x) => x.id === id);
    setText(t ? renderTemplate(t.body, vars).text : "");
  };

  const missing = templateId ? renderTemplate(text, {}).missing.filter((m) => rendered.missing.includes(m)) : [];

  const send = () => {
    // Buka WhatsApp dulu (sinkron) agar tidak diblokir browser, lalu catat interaksi di latar belakang.
    window.open(waLink(customer.phone, text), "_blank", "noopener");
    start(() => logWhatsAppAction(customer.id, text));
    onClose();
  };

  return (
    <Sheet open onClose={onClose} title={`WhatsApp ke ${customer.name}`}>
      <p className="mb-2 text-sm font-medium text-zinc-800">Pilih template</p>
      <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
        <Chip active={templateId === null} onClick={() => pick(null)}>
          Tulis sendiri
        </Chip>
        {templates.map((t) => (
          <Chip key={t.id} active={templateId === t.id} onClick={() => pick(t.id)}>
            {t.title}
          </Chip>
        ))}
      </div>
      <label htmlFor="wa-text" className="mb-1.5 block text-sm font-medium text-zinc-800">
        Pesan
      </label>
      <textarea
        id="wa-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={7}
        placeholder="Tulis pesan…"
        className="w-full rounded-xl border border-zinc-300 p-3 text-[15px] focus:border-zinc-900 focus:outline-none"
      />
      {missing.length > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Data {missing.map((m) => `{${m}}`).join(", ")} belum tersedia. Ganti teksnya di atas atau tetap kirim.
          </span>
        </div>
      )}
      <Button size="lg" className="mt-4" onClick={send}>
        <MessageCircle className="h-5 w-5" /> {missing.length ? "Tetap kirim" : "Buka WhatsApp"}
      </Button>
      <p className="mt-2 text-center text-xs text-zinc-500">Pesan akan tercatat otomatis di riwayat pelanggan.</p>
    </Sheet>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 shrink-0 rounded-full border px-3.5 text-sm whitespace-nowrap",
        active ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 text-zinc-700 hover:border-zinc-900",
      )}
    >
      {children}
    </button>
  );
}
