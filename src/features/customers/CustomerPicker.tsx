"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Loader2, Search, X } from "lucide-react";
import { formatPhone } from "@/lib/domain/phone";
import { Avatar } from "@/components/ui/Avatar";
import { searchCustomersAction } from "./actions";

export type PickedCustomer = { id: string; name: string; phone: string; city?: string | null };

/** Cari & pilih pelanggan. Menyimpan id di input tersembunyi `name`. */
export function CustomerPicker({
  name = "customerId",
  initial,
  onChange,
  error,
}: {
  name?: string;
  initial?: PickedCustomer | null;
  onChange?: (c: PickedCustomer | null) => void;
  error?: string;
}) {
  const [picked, setPicked] = useState<PickedCustomer | null>(initial ?? null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PickedCustomer[]>([]);
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (picked) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => start(async () => setResults(await searchCustomersAction(q))), 250);
    return () => clearTimeout(timer.current);
  }, [q, picked]);

  const choose = (c: PickedCustomer | null) => {
    setPicked(c);
    onChange?.(c);
  };

  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-zinc-800">
        Pelanggan<span className="ml-0.5 text-zinc-400">*</span>
      </span>
      <input type="hidden" name={name} value={picked?.id ?? ""} />
      {picked ? (
        <div className="flex items-center gap-3 rounded-xl border border-zinc-900 p-3">
          <Avatar name={picked.name} size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{picked.name}</p>
            <p className="text-sm text-zinc-500">{formatPhone(picked.phone)}</p>
          </div>
          <button type="button" onClick={() => choose(null)} className="flex h-9 items-center gap-1 rounded-lg px-2 text-sm text-zinc-600 hover:bg-zinc-100">
            <X className="h-4 w-4" /> Ganti
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-300 focus-within:border-zinc-900">
          <div className="flex items-center gap-2 px-3">
            <Search className="h-4 w-4 text-zinc-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama atau nomor"
              className="h-11 flex-1 bg-transparent text-[15px] focus:outline-none"
              aria-label="Cari pelanggan"
            />
            {pending && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
          </div>
          <ul className="max-h-64 overflow-y-auto border-t border-zinc-100">
            {results.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => choose(c)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-zinc-50">
                  <Avatar name={c.name} size={32} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{c.name}</span>
                    <span className="block text-xs text-zinc-500">
                      {formatPhone(c.phone)}
                      {c.city ? ` · ${c.city}` : ""}
                    </span>
                  </span>
                  <Check className="h-4 w-4 text-transparent" />
                </button>
              </li>
            ))}
            {!pending && results.length === 0 && <li className="px-3 py-3 text-sm text-zinc-500">Tidak ditemukan.</li>}
          </ul>
        </div>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
