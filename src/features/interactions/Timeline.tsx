import Link from "next/link";
import { AlertCircle, MessageCircle, NotebookPen, Phone, Receipt, Users } from "lucide-react";
import type { InteractionType } from "@prisma/client";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatRupiah } from "@/lib/domain/format";
import { INTERACTION_LABEL, type TimelineEntry } from "./service";
import { OrderStatusBadge } from "@/features/orders/OrderStatusBadge";

const ICON: Record<InteractionType, React.ElementType> = {
  whatsapp: MessageCircle,
  call: Phone,
  meeting: Users,
  complaint: AlertCircle,
  note: NotebookPen,
};

const timeFmt = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" });

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  if (!entries.length)
    return <EmptyState title="Belum ada riwayat">Pesanan, chat, dan catatan akan muncul di sini.</EmptyState>;
  return (
    <ol className="relative space-y-1 before:absolute before:bottom-3 before:left-[19px] before:top-3 before:w-px before:bg-zinc-200">
      {entries.map((e) => {
        const Icon = e.kind === "order" ? Receipt : ICON[e.type];
        return (
          <li key={e.kind + e.id} className="relative flex gap-3 py-2">
            <span
              className={
                "z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border " +
                (e.kind === "order"
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : e.kind === "interaction" && e.type === "complaint"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-zinc-200 bg-white text-zinc-600")
              }
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              {e.kind === "order" ? (
                <Link href={`/pesanan/${e.id}`} className="block rounded-xl hover:bg-zinc-50">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">Pesanan {e.orderNumber}</span>
                    <OrderStatusBadge status={e.status} />
                  </div>
                  <p className="tabular text-sm text-zinc-600">
                    {formatRupiah(e.total)} · {e.itemCount} barang
                  </p>
                </Link>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{INTERACTION_LABEL[e.type]}</span>
                    {e.type === "complaint" && <Badge tone="danger">Keluhan</Badge>}
                  </div>
                  <p className="whitespace-pre-line text-sm text-zinc-700">{e.content}</p>
                </>
              )}
              <p className="mt-0.5 text-xs text-zinc-400">
                {formatDate(e.at)} {timeFmt.format(e.at)}
                {e.kind === "interaction" && e.by ? ` · ${e.by}` : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

