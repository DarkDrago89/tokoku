"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Pilih tag yang ada atau ketik tag baru. Nilai dikirim sebagai input tersembunyi "tags" (dipisah koma). */
export function TagPicker({ allTags, initial = [] }: { allTags: string[]; initial?: string[] }) {
  const [selected, setSelected] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");
  const suggestions = [...new Set([...allTags, "VIP", "Reseller", "Grosir"])].filter((t) => !selected.includes(t));

  const add = (t: string) => {
    const v = t.trim();
    if (v && !selected.includes(v)) setSelected([...selected, v]);
    setDraft("");
  };

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-zinc-800">Tag</span>
      <input type="hidden" name="tags" value={selected.join(",")} />
      <div className="flex flex-wrap gap-2">
        {selected.map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => setSelected(selected.filter((x) => x !== t))}
            className="inline-flex h-8 items-center gap-1 rounded-full bg-zinc-900 px-3 text-sm text-white"
            aria-label={`Hapus tag ${t}`}
          >
            {t} <X className="h-3.5 w-3.5" />
          </button>
        ))}
        {suggestions.slice(0, 8).map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => add(t)}
            className={cn("inline-flex h-8 items-center gap-1 rounded-full border border-dashed border-zinc-300 px-3 text-sm text-zinc-600 hover:border-zinc-900")}
          >
            <Plus className="h-3.5 w-3.5" /> {t}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            }
          }}
          placeholder="Tag baru, lalu Enter"
          className="h-10 flex-1 rounded-xl border border-zinc-300 px-3 text-sm focus:border-zinc-900 focus:outline-none"
        />
        <button type="button" onClick={() => add(draft)} className="h-10 rounded-xl border border-zinc-300 px-3 text-sm hover:bg-zinc-50">
          Tambah
        </button>
      </div>
    </div>
  );
}
