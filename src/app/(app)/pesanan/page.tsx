import Link from "next/link";
import { ChevronRight, Plus, Receipt, Search } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/session";
import { listOrders } from "@/features/orders/service";
import { OrderStatusBadge } from "@/features/orders/OrderStatusBadge";
import { ORDER_STATUS_LABEL } from "@/lib/domain/order";
import { formatDate, formatRupiah } from "@/lib/domain/format";
import { cn, num } from "@/lib/utils";

export const metadata = { title: "Pesanan" };

type SP = Record<string, string | undefined>;
const STATUSES: OrderStatus[] = ["pending", "paid", "packed", "shipped", "done", "cancelled"];

function href(sp: SP, patch: SP) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...sp, page: undefined, ...patch })) if (v) p.set(k, v);
  const s = p.toString();
  return `/pesanan${s ? `?${s}` : ""}`;
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const s = await requireSession();
  const status = STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : undefined;
  const from = sp.dari ? new Date(`${sp.dari}T00:00:00+07:00`) : undefined;
  const to = sp.sampai ? new Date(+new Date(`${sp.sampai}T00:00:00+07:00`) + 86_400_000) : undefined;
  const res = await listOrders(s.storeId, { status, from, to, q: sp.q, page: Number(sp.page) || 1 });
  const all = Object.values(res.statusCounts).reduce((a, b) => a + (b ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Pesanan"
        subtitle={`${res.total} pesanan`}
        action={
          <ButtonLink href="/pesanan/baru" size="sm">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Pesanan baru</span>
          </ButtonLink>
        }
      />

      <form className="mb-3 space-y-2" role="search">
        {status && <input type="hidden" name="status" value={status} />}
        <label className="flex h-12 items-center gap-2 rounded-2xl border border-zinc-300 px-4 focus-within:border-zinc-900">
          <Search className="h-4 w-4 text-zinc-400" />
          <input name="q" defaultValue={sp.q} placeholder="Cari nomor pesanan atau nama" className="flex-1 bg-transparent text-[15px] focus:outline-none" />
        </label>
        <div className="flex items-center gap-2 text-sm">
          <input type="date" name="dari" defaultValue={sp.dari} aria-label="Dari tanggal" className="h-10 min-w-0 flex-1 rounded-xl border border-zinc-300 px-2" />
          <span className="text-zinc-400">–</span>
          <input type="date" name="sampai" defaultValue={sp.sampai} aria-label="Sampai tanggal" className="h-10 min-w-0 flex-1 rounded-xl border border-zinc-300 px-2" />
          <button className="h-10 rounded-xl border border-zinc-300 px-3">Terapkan</button>
        </div>
      </form>

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <StatusChip href={href(sp, { status: undefined })} active={!status} label="Semua" count={all} />
        {STATUSES.map((st) => (
          <StatusChip key={st} href={href(sp, { status: st })} active={status === st} label={ORDER_STATUS_LABEL[st]} count={res.statusCounts[st] ?? 0} />
        ))}
      </div>

      {res.items.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-6 w-6" />}
          title={all === 0 ? "Belum ada pesanan" : "Tidak ada pesanan yang cocok"}
          action={
            <ButtonLink href="/pesanan/baru">
              <Plus className="h-4 w-4" /> Buat pesanan
            </ButtonLink>
          }
        />
      ) : (
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200">
          {res.items.map((o) => (
            <li key={o.id}>
              <Link href={`/pesanan/${o.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 active:bg-zinc-100">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-zinc-500">{o.orderNumber}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <p className="truncate font-medium">{o.customer.name}</p>
                  <p className="text-xs text-zinc-500">
                    {formatDate(o.orderDate)} · {o._count.items} barang
                  </p>
                </div>
                <p className={cn("tabular font-medium", o.status === "cancelled" && "text-zinc-400 line-through")}>{formatRupiah(num(o.total))}</p>
                <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {res.pageCount > 1 && (
        <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Halaman">
          {res.page > 1 ? (
            <Link href={href(sp, { page: String(res.page - 1) })} className="rounded-xl px-3 py-2 hover:bg-zinc-100">
              ← Sebelumnya
            </Link>
          ) : (
            <span />
          )}
          <span className="text-zinc-500">
            {res.page} / {res.pageCount}
          </span>
          {res.page < res.pageCount ? (
            <Link href={href(sp, { page: String(res.page + 1) })} className="rounded-xl px-3 py-2 hover:bg-zinc-100">
              Berikutnya →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}

function StatusChip({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm",
        active ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 text-zinc-700",
      )}
    >
      {label}
      <span className={cn("text-xs", active ? "text-zinc-300" : "text-zinc-400")}>{count}</span>
    </Link>
  );
}
