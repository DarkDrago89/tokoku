"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { MessageSquareText, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Input, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { renderTemplate, TEMPLATE_VARIABLES } from "@/lib/domain/template";
import type { FormState } from "@/lib/utils";
import { TEMPLATE_CATEGORIES } from "./defaults";
import { deleteTemplateAction, saveTemplateAction } from "./actions";
import type { TemplateOption } from "./SendWhatsAppSheet";

const SAMPLE = { nama: "Ani", produk: "- Kopi Gayo 250g x2", total: "Rp 105.000", resi: "JNE0123456789" };
const VAR_HINT: Record<string, string> = { nama: "nama depan", produk: "daftar barang", total: "total bayar", resi: "nomor resi" };

export function TemplateManager({ templates }: { templates: TemplateOption[] }) {
  const [editing, setEditing] = useState<TemplateOption | "new" | null>(null);
  return (
    <>
      <Button className="mb-4 w-full sm:w-auto" onClick={() => setEditing("new")}>
        <Plus className="h-4 w-4" /> Template baru
      </Button>
      {templates.length === 0 ? (
        <EmptyState icon={<MessageSquareText className="h-6 w-6" />} title="Belum ada template" />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {templates.map((t) => (
            <li key={t.id}>
              <button onClick={() => setEditing(t)} className="h-full w-full rounded-2xl border border-zinc-200 p-4 text-left hover:border-zinc-900">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-medium">{t.title}</p>
                  <Badge>{t.category}</Badge>
                </div>
                <p className="line-clamp-3 whitespace-pre-line text-sm text-zinc-600">{t.body}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
      {editing && <TemplateSheet template={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function TemplateSheet({ template, onClose }: { template: TemplateOption | null; onClose: () => void }) {
  const [state, action] = useActionState<FormState, FormData>(saveTemplateAction, {});
  const [body, setBody] = useState(template?.body ?? "Halo Kak {nama}, ");
  const [deleting, start] = useTransition();
  const ref = useRef<HTMLTextAreaElement>(null);
  const fe = state.fieldErrors ?? {};
  useEffect(() => {
    if (state.ok) onClose();
  }, [state, onClose]);

  const insert = (v: string) => {
    const el = ref.current;
    const token = `{${v}}`;
    if (!el) return setBody(body + token);
    const { selectionStart: a, selectionEnd: b } = el;
    const next = body.slice(0, a) + token + body.slice(b);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + token.length, a + token.length);
    });
  };

  return (
    <Sheet open onClose={onClose} title={template ? "Ubah template" : "Template baru"}>
      <form action={action} className="space-y-4">
        {template && <input type="hidden" name="id" value={template.id} />}
        <Input name="title" label="Judul" required defaultValue={template?.title} error={fe.title} />
        <Select name="category" label="Kategori" defaultValue={template?.category ?? TEMPLATE_CATEGORIES[0]}>
          {TEMPLATE_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <div className="space-y-1.5">
          <label htmlFor="tpl-body" className="block text-sm font-medium">
            Isi pesan
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATE_VARIABLES.map((v) => (
              <button
                type="button"
                key={v}
                onClick={() => insert(v)}
                className="h-8 rounded-full border border-zinc-300 px-3 font-mono text-xs hover:border-zinc-900"
                title={`Sisipkan ${VAR_HINT[v]}`}
              >
                + {`{${v}}`}
              </button>
            ))}
          </div>
          <textarea
            ref={ref}
            id="tpl-body"
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="w-full rounded-xl border border-zinc-300 p-3 text-[15px] focus:border-zinc-900 focus:outline-none"
          />
          {fe.body && <p className="text-sm text-red-700">{fe.body}</p>}
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500">Pratinjau</p>
          <div className="whitespace-pre-line rounded-2xl rounded-tl-sm bg-zinc-100 p-3 text-sm">{renderTemplate(body, SAMPLE).text}</div>
        </div>
        <SubmitButton size="lg">Simpan template</SubmitButton>
        {template && (
          <Button
            type="button"
            variant="danger"
            size="lg"
            disabled={deleting}
            onClick={() =>
              start(async () => {
                await deleteTemplateAction(template.id);
                onClose();
              })
            }
          >
            Hapus template
          </Button>
        )}
      </form>
    </Sheet>
  );
}
