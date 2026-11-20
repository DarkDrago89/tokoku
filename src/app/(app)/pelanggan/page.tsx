import Link from "next/link";
import { ChevronRight, Search, SlidersHorizontal, UserPlus, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/session";
import { getStoreSettings } from "@/lib/store";
import { listCities, listCustomers, listTags, type CustomerFilters } from "@/features/customers/service";
import { CustomerStatusBadges } from "@/features/customers/StatusBadge";
import { formatPhone } from "@/lib/domain/phone";
import { formatRupiah, relativeDays } from "@/lib/domain/format";
import { CUSTOMER_SOURCES, type CustomerStatus } from "@/lib/domain/customer";
import { cn, num } from "@/lib/utils";

export const metadata = { title: "Pelanggan" };

type SP = Record<string, string | undefined>;

const STATUS_CHIPS: { value?: CustomerStatus; label: string }[] = [
  { label: "Semua" },
  { value: "baru", label: "Baru" },
  { value: "aktif", label: "Aktif" },
  { value: "tidak_aktif", label: "Tidak Aktif" },
];

function href(sp: SP, patch: SP) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...sp, ...patch, ...(patch.page ? {} : { page: undefined }) })) if (v) p.set(k, v);
  const s = p.toString();
  return `/pelanggan${s ? `?${s}` : ""}`;
}

export default async function CustomersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const s = await requireSession();
  const { inactiveDays } = await getStoreSettings(s.storeId);
  const filters: CustomerFilters = {
    q: sp.q,
    tagId: sp.tag,
    city: sp.kota,
    source: sp.sumber,
    status: sp.status as CustomerStatus | undefined,
    sort: sp.urut as CustomerFilters["sort"],
    page: Number(sp.page) || 1,
  };
  const [res, tags, cities] = await Promise.all([
    listCustomers(s.storeId, filters, inactiveDays),
    listTags(s.storeId),
    listCities(s.storeId),
  ]);
  const advanced = !!(sp.tag || sp.kota || sp.sumber || sp.urut);
  const now = new Date();

  return (
    <>
      <PageHeader
        title="Pelanggan"
        subtitle={`${res.total} pelanggan`}
        action={
          <ButtonLink href="/pelanggan/baru" size="sm">
            <UserPlus className="h-4 w-4" /> <span className="hidden sm:inline">Tambah</span>
          </ButtonLink>
        }
      />

      <form className="mb-3" role="search">
        {Object.entries(sp)
          .filter(([k, v]) => v && !["q", "page"].includes(k))
          .map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
        <label className="flex h-12 items-center gap-2 rounded-2xl border border-zinc-300 px-4 focus-within:border-zinc-900">
          <Search className="h-4 w-4 text-zinc-400" />
          <input name="q" defaultValue={sp.q} placeholder="Cari nama atau nomor WhatsApp" className="flex-1 bg-transparent text-[15px] focus:outline-none" />
        </label>
      </form>

      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {STATUS_CHIPS.map((c) => (
          <Link
            key={c.label}
            href={href(sp, { status: c.value })}
            className={cn(
              "h-9 shrink-0 rounded-full border px-4 text-sm leading-9",
              sp.status === c.value ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 text-zinc-700",
            )}
          >
            {c.label}
          </Link>
        ))}
      </div>

      <details open={advanced} className="mb-4 rounded-2xl border border-zinc-200">
        <summary className="flex h-11 cursor-pointer list-none items-center gap-2 px-4 text-sm text-zinc-700">
          <SlidersHorizontal className="h-4 w-4" /> Filter & urutan
          {advanced && <Badge tone="dark">aktif</Badge>}
        </summary>
        <form className="grid grid-cols-2 gap-3 border-t border-zinc-200 p-4">
          {sp.q && <input type="hidden" name="q" value={sp.q} />}
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <FilterSelect name="tag" label="Tag" value={sp.tag} options={tags.map((t) => [t.id, t.name])} />
          <FilterSelect name="kota" label="Kota" value={sp.kota} options={cities.map((c) => [c, c])} />
          <FilterSelect name="sumber" label="Sumber" value={sp.sumber} options={CUSTOMER_SOURCES.map((c) => [c, c])} />
          <FilterSelect
            name="urut"
            label="Urutkan"
            value={sp.urut}
            placeholder="Terbaru ditambah"
            options={[
              ["belanja", "Belanja terbesar"],
              ["terakhir", "Terakhir beli"],
              ["nama", "Nama A–Z"],
            ]}
          />
          <div className="col-span-2 flex gap-2">
            <button className="h-10 flex-1 rounded-xl bg-zinc-900 text-sm font-medium text-white">Terapkan</button>
            <Link href="/pelanggan" className="flex h-10 flex-1 items-center justify-center rounded-xl border border-zinc-300 text-sm">
              Reset
            </Link>
          </div>
        </form>
      </details>

      {res.items.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title={sp.q || advanced || sp.status ? "Tidak ada yang cocok" : "Belum ada pelanggan"}
          action={
            <ButtonLink href="/pelanggan/baru">
              <UserPlus className="h-4 w-4" /> Tambah pelanggan
            </ButtonLink>
          }
        >
          {sp.q || advanced || sp.status ? "Coba kata kunci atau filter lain." : "Mulai catat pelanggan pertamamu. Cukup nama dan nomor WhatsApp."}
        </EmptyState>
      ) : (
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200">
          {res.items.map((c) => (
            <li key={c.id}>
              <Link href={`/pelanggan/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 active:bg-zinc-100">
                <Avatar name={c.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{c.name}</p>
                    <CustomerStatusBadges c={c} inactiveDays={inactiveDays} now={now} />
                  </div>
                  <p className="truncate text-sm text-zinc-500">
                    {formatPhone(c.phone)}
                    {c.city ? ` · ${c.city}` : ""}
                    {c.tags.length > 0 && ` · ${c.tags.map((t) => t.tag.name).join(", ")}`}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="tabular text-sm font-medium">{formatRupiah(num(c.totalSpent))}</p>
                  <p className="text-xs text-zinc-500">{c.lastOrderAt ? `beli ${relativeDays(c.lastOrderAt, now)}` : "belum beli"}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {res.pageCount > 1 && (
        <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Halaman">
          <PageLink disabled={res.page <= 1} href={href(sp, { page: String(res.page - 1) })}>
            ← Sebelumnya
          </PageLink>
          <span className="text-zinc-500">
            {res.page} / {res.pageCount}
          </span>
          <PageLink disabled={res.page >= res.pageCount} href={href(sp, { page: String(res.page + 1) })}>
            Berikutnya →
          </PageLink>
        </nav>
      )}
    </>
  );
}

function FilterSelect({
  name,
  label,
  value,
  options,
  placeholder = "Semua",
}: {
  name: string;
  label: string;
  value?: string;
  options: (readonly [string, string])[] | [string, string][];
  placeholder?: string;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-zinc-600">{label}</span>
      <select name={name} defaultValue={value ?? ""} className="h-10 w-full rounded-xl border border-zinc-300 bg-white px-2">
        <option value="">{placeholder}</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
  return disabled ? (
    <span className="px-3 py-2 text-zinc-300">{children}</span>
  ) : (
    <Link href={href} className="rounded-xl px-3 py-2 hover:bg-zinc-100">
      {children}
    </Link>
  );
}
