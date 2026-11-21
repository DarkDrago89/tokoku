import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Lock } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, SectionTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { requireSession } from "@/lib/session";
import { can } from "@/lib/permissions";
import { dailyRevenue, getSummary, sourceDistribution, topCustomers, topProducts } from "@/features/dashboard/service";
import { RevenueChart } from "@/features/dashboard/RevenueChart";
import { formatRupiah } from "@/lib/domain/format";
import { cn, jakartaToday } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

const PERIODS = {
  "7": { label: "7 hari", prev: "minggu lalu" },
  "30": { label: "30 hari", prev: "30 hari sebelumnya" },
  bulan: { label: "Bulan ini", prev: "periode sebelumnya" },
} as const;
type PeriodKey = keyof typeof PERIODS;

function range(key: PeriodKey) {
  // Batas hari mengikuti zona Jakarta (00:00 WIB = 17:00 UTC hari sebelumnya).
  const todayUtc = jakartaToday();
  const startOfToday = new Date(+todayUtc - 7 * 3_600_000);
  const to = new Date(+startOfToday + 86_400_000);
  if (key === "bulan") {
    const first = new Date(Date.UTC(todayUtc.getUTCFullYear(), todayUtc.getUTCMonth(), 1) - 7 * 3_600_000);
    return { from: first, to };
  }
  return { from: new Date(+to - Number(key) * 86_400_000), to };
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ periode?: string }> }) {
  const s = await requireSession();
  if (!can(s.role, "report.view"))
    return (
      <>
        <PageHeader title="Dashboard" back="/lainnya" />
        <EmptyState icon={<Lock className="h-6 w-6" />} title="Khusus Pemilik dan Admin">
          Minta pemilik toko untuk mengubah peran Anda jika perlu melihat laporan.
        </EmptyState>
      </>
    );

  const { periode } = await searchParams;
  const key: PeriodKey = periode && periode in PERIODS ? (periode as PeriodKey) : "7";
  const { from, to } = range(key);
  const [sum, daily, customers, products, sources] = await Promise.all([
    getSummary(s.storeId, from, to),
    dailyRevenue(s.storeId, from, to),
    topCustomers(s.storeId),
    topProducts(s.storeId),
    sourceDistribution(s.storeId),
  ]);
  const change = sum.prevRevenue ? Math.round(((sum.revenue - sum.prevRevenue) / sum.prevRevenue) * 100) : null;
  const sourceTotal = sources.reduce((a, b) => a + b.count, 0);

  return (
    <>
      <PageHeader title="Dashboard" back="/lainnya" />
      <div className="mb-5 inline-flex rounded-xl bg-zinc-100 p-1" role="tablist" aria-label="Periode">
        {(Object.keys(PERIODS) as PeriodKey[]).map((k) => (
          <Link
            key={k}
            href={`/dashboard?periode=${k}`}
            role="tab"
            aria-selected={k === key}
            className={cn("rounded-lg px-4 py-1.5 text-sm", k === key ? "bg-white font-medium shadow-sm" : "text-zinc-600")}
          >
            {PERIODS[k].label}
          </Link>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card className="col-span-2 p-4">
          <p className="text-sm text-zinc-500">Omzet (pesanan selesai)</p>
          <p className="tabular mt-1 text-3xl font-semibold tracking-tight">{formatRupiah(sum.revenue)}</p>
          {change !== null ? (
            <p className={cn("mt-1 flex items-center gap-1 text-sm", change >= 0 ? "text-emerald-700" : "text-red-700")}>
              {change >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {Math.abs(change)}% dari {PERIODS[key].prev}
            </p>
          ) : (
            <p className="mt-1 text-sm text-zinc-400">Belum ada pembanding</p>
          )}
        </Card>
        <Metric label="Pesanan" value={String(sum.orderCount)} />
        <Metric label="Rata-rata pesanan" value={formatRupiah(sum.avgOrderValue)} />
        <Metric label="Pelanggan baru" value={String(sum.newCustomers)} />
        <Metric label="Repeat order" value={`${sum.repeatRate}%`} hint="pelanggan beli ≥2 kali" />
      </div>

      <Card className="mb-6 p-4">
        <RevenueChart data={daily} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle>Pelanggan teratas</SectionTitle>
          <Card className="divide-y divide-zinc-100">
            {customers.length === 0 && <p className="p-4 text-sm text-zinc-500">Belum ada data.</p>}
            {customers.map((c, i) => (
              <Link key={c.id} href={`/pelanggan/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50">
                <span className="w-4 text-sm text-zinc-400">{i + 1}</span>
                <Avatar name={c.name} size={32} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.name}</span>
                <span className="tabular text-sm">{formatRupiah(c.totalSpent)}</span>
              </Link>
            ))}
          </Card>
        </section>

        <section>
          <SectionTitle>Produk terlaris</SectionTitle>
          <Card className="space-y-3 p-4">
            {products.length === 0 && <p className="text-sm text-zinc-500">Belum ada data.</p>}
            {products.map((p) => (
              <Bar key={p.name} label={p.name} value={`${p.qty} terjual`} ratio={p.qty / (products[0]?.qty || 1)} />
            ))}
          </Card>
        </section>

        <section className="lg:col-span-2">
          <SectionTitle>Sumber pelanggan</SectionTitle>
          <Card className="space-y-3 p-4">
            {sources.map((src) => (
              <Bar
                key={src.source}
                label={src.source}
                value={`${src.count} (${Math.round((src.count / (sourceTotal || 1)) * 100)}%)`}
                ratio={src.count / (sources[0]?.count || 1)}
              />
            ))}
          </Card>
        </section>
      </div>
    </>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="tabular mt-1 truncate text-xl font-semibold">{value}</p>
      {hint && <p className="text-xs text-zinc-400">{hint}</p>}
    </Card>
  );
}

function Bar({ label, value, ratio }: { label: string; value: string; ratio: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between gap-2 text-sm">
        <span className="truncate">{label}</span>
        <span className="tabular shrink-0 text-zinc-500">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-100">
        <div className="h-2 rounded-full bg-zinc-900" style={{ width: `${Math.max(4, ratio * 100)}%` }} />
      </div>
    </div>
  );
}
