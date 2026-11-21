"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { ORDER_FLOW, ORDER_STATUS_LABEL } from "@/lib/domain/order";
import { cn } from "@/lib/utils";
import { updateStatusAction } from "./actions";

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  pending: "Sudah dibayar",
  paid: "Mulai dikemas",
  packed: "Kirim + resi",
  shipped: "Pesanan selesai",
};

/** Langkah status pesanan dengan satu tombol aksi utama (prinsip desain 8.1). */
export function StatusStepper({ orderId, status, trackingNumber }: { orderId: string; status: OrderStatus; trackingNumber: string | null }) {
  const [pending, start] = useTransition();
  const [resiOpen, setResiOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [resi, setResi] = useState(trackingNumber ?? "");
  const idx = ORDER_FLOW.indexOf(status);
  const next = status !== "cancelled" && idx < ORDER_FLOW.length - 1 ? ORDER_FLOW[idx + 1] : null;

  const go = (s: OrderStatus, tracking?: string) =>
    start(async () => {
      await updateStatusAction(orderId, s, tracking);
      setResiOpen(false);
      setCancelOpen(false);
    });

  return (
    <div>
      <ol className="mb-4 grid grid-cols-5 gap-1" aria-label="Status pesanan">
        {ORDER_FLOW.map((s, i) => {
          const reached = status !== "cancelled" && i <= idx;
          return (
            <li key={s} className="flex flex-col items-center gap-1.5 text-center">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs",
                  reached ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-400",
                  i === idx && status !== "cancelled" && "ring-4 ring-zinc-900/10",
                )}
              >
                {reached ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={cn("text-[11px] leading-tight", i === idx ? "font-semibold text-zinc-900" : "text-zinc-500")}>
                {ORDER_STATUS_LABEL[s]}
              </span>
            </li>
          );
        })}
      </ol>

      {status === "cancelled" ? (
        <div className="flex items-center justify-between rounded-xl bg-red-50 p-3 text-sm text-red-800">
          Pesanan dibatalkan.
          <Button variant="secondary" size="sm" disabled={pending} onClick={() => go("pending")}>
            Aktifkan lagi
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          {next && (
            <Button size="lg" className="flex-1" disabled={pending} onClick={() => (next === "shipped" ? setResiOpen(true) : go(next))}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {NEXT_LABEL[status]}
            </Button>
          )}
          {status !== "done" && (
            <Button variant="secondary" size="md" className="h-12" disabled={pending} onClick={() => setCancelOpen(true)}>
              <X className="h-4 w-4" /> Batal
            </Button>
          )}
          {status === "shipped" && (
            <Button variant="ghost" className="h-12" onClick={() => setResiOpen(true)}>
              Ubah resi
            </Button>
          )}
        </div>
      )}

      <Sheet open={resiOpen} onClose={() => setResiOpen(false)} title="Nomor resi">
        <label htmlFor="resi" className="mb-1.5 block text-sm font-medium">
          Nomor resi pengiriman
        </label>
        <input
          id="resi"
          value={resi}
          onChange={(e) => setResi(e.target.value.toUpperCase())}
          placeholder="Contoh: JNE0123456789"
          autoFocus
          className="h-11 w-full rounded-xl border border-zinc-300 px-3.5 font-mono focus:border-zinc-900 focus:outline-none"
        />
        <p className="mt-1.5 text-xs text-zinc-500">Boleh dikosongkan untuk kurir toko / ambil sendiri.</p>
        <Button size="lg" className="mt-4" disabled={pending} onClick={() => go("shipped", resi.trim())}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Simpan & tandai dikirim
        </Button>
      </Sheet>

      <Sheet open={cancelOpen} onClose={() => setCancelOpen(false)} title="Batalkan pesanan?">
        <p className="text-sm text-zinc-600">Pesanan yang dibatalkan tidak dihitung dalam total belanja pelanggan maupun omzet.</p>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setCancelOpen(false)}>
            Tidak
          </Button>
          <Button className="flex-1 bg-red-700 hover:bg-red-800" disabled={pending} onClick={() => go("cancelled")}>
            Ya, batalkan
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
