"use client";

import { useActionState, useMemo, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { CustomerPicker, type PickedCustomer } from "@/features/customers/CustomerPicker";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { calcOrderTotals, PAYMENT_METHODS } from "@/lib/domain/order";
import { formatRupiah } from "@/lib/domain/format";
import { cn, type FormState } from "@/lib/utils";
import { createOrderAction } from "./actions";

export type ProductOption = { id: string; name: string; price: number };
type Line = { key: number; productId: string | null; itemName: string; qty: number; unitPrice: number };

const toNumber = (s: string) => Number(s.replace(/\D/g, "")) || 0;
const thousands = new Intl.NumberFormat("id-ID");

/** Input angka Rupiah yang otomatis diberi titik ribuan. */
function MoneyInput({ value, onChange, label, id }: { value: number; onChange: (n: number) => void; label: string; id: string }) {
  return (
    <label htmlFor={id} className="block space-y-1.5">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <div className="flex h-11 items-center rounded-xl border border-zinc-300 px-3 focus-within:border-zinc-900">
        <span className="mr-1 text-sm text-zinc-500">Rp</span>
        <input
          id={id}
          inputMode="numeric"
          value={value ? thousands.format(value) : ""}
          placeholder="0"
          onChange={(e) => onChange(toNumber(e.target.value))}
          className="tabular w-full bg-transparent text-[15px] focus:outline-none"
        />
      </div>
    </label>
  );
}

export function OrderForm({ products, initialCustomer }: { products: ProductOption[]; initialCustomer?: PickedCustomer | null }) {
  const [state, action] = useActionState<FormState, FormData>(createOrderAction, {});
  const [customer, setCustomer] = useState<PickedCustomer | null>(initialCustomer ?? null);
  const [seq, setSeq] = useState(1);
  const [lines, setLines] = useState<Line[]>([{ key: 0, productId: null, itemName: "", qty: 1, unitPrice: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [payment, setPayment] = useState<string>("Transfer");
  const [paid, setPaid] = useState(false);
  const [notes, setNotes] = useState("");

  const valid = lines.filter((l) => l.itemName.trim() && l.qty > 0);
  const totals = calcOrderTotals(valid, discount, shipping);

  const payload = useMemo(
    () =>
      JSON.stringify({
        customerId: customer?.id ?? "",
        items: valid.map(({ productId, itemName, qty, unitPrice }) => ({ productId, itemName, qty, unitPrice })),
        discount,
        shippingCost: shipping,
        paymentMethod: payment,
        notes,
        status: paid ? "paid" : "pending",
      }),
    [customer, valid, discount, shipping, payment, notes, paid],
  );

  const update = (key: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const addLine = () => {
    setLines((ls) => [...ls, { key: seq, productId: null, itemName: "", qty: 1, unitPrice: 0 }]);
    setSeq(seq + 1);
  };
  const pickProduct = (key: number, id: string) => {
    const p = products.find((x) => x.id === id);
    update(key, p ? { productId: p.id, itemName: p.name, unitPrice: p.price } : { productId: null });
  };

  return (
    <form action={action} className="space-y-6 pb-28 lg:pb-0">
      <input type="hidden" name="payload" value={payload} />
      {state.error && <Alert>{state.error}</Alert>}

      <CustomerPicker initial={initialCustomer} onChange={setCustomer} />
      {!customer && (
        <p className="-mt-4 text-sm text-zinc-500">
          Pelanggan belum ada?{" "}
          <a href="/pelanggan/baru" className="font-medium text-zinc-900 underline underline-offset-2">
            Tambah pelanggan baru
          </a>
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-800">Barang</h2>
        {lines.map((l, idx) => (
          <div key={l.key} className="space-y-3 rounded-2xl border border-zinc-200 p-3">
            {products.length > 0 && (
              <select
                aria-label={`Produk baris ${idx + 1}`}
                value={l.productId ?? ""}
                onChange={(e) => pickProduct(l.key, e.target.value)}
                className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-[15px]"
              >
                <option value="">Ketik manual…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {formatRupiah(p.price)}
                  </option>
                ))}
              </select>
            )}
            {!l.productId && (
              <input
                aria-label={`Nama barang baris ${idx + 1}`}
                value={l.itemName}
                onChange={(e) => update(l.key, { itemName: e.target.value })}
                placeholder="Nama barang"
                className="h-11 w-full rounded-xl border border-zinc-300 px-3 text-[15px] focus:border-zinc-900 focus:outline-none"
              />
            )}
            <div className="flex items-end gap-3">
              <div>
                <span className="mb-1.5 block text-xs text-zinc-500">Jumlah</span>
                <div className="flex h-11 items-center rounded-xl border border-zinc-300">
                  <button type="button" aria-label="Kurangi" onClick={() => update(l.key, { qty: Math.max(1, l.qty - 1) })} className="flex h-full w-10 items-center justify-center">
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    aria-label="Jumlah"
                    inputMode="numeric"
                    value={l.qty}
                    onChange={(e) => update(l.key, { qty: Math.max(1, toNumber(e.target.value)) })}
                    className="tabular w-10 text-center focus:outline-none"
                  />
                  <button type="button" aria-label="Tambah" onClick={() => update(l.key, { qty: l.qty + 1 })} className="flex h-full w-10 items-center justify-center">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <MoneyInput id={`price-${l.key}`} label="Harga satuan" value={l.unitPrice} onChange={(n) => update(l.key, { unitPrice: n })} />
              </div>
              {lines.length > 1 && (
                <button
                  type="button"
                  aria-label="Hapus barang"
                  onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="tabular text-right text-sm text-zinc-500">= {formatRupiah(l.qty * l.unitPrice)}</p>
          </div>
        ))}
        <button
          type="button"
          onClick={addLine}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 text-sm text-zinc-700 hover:border-zinc-900"
        >
          <Plus className="h-4 w-4" /> Tambah barang
        </button>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <MoneyInput id="discount" label="Diskon" value={discount} onChange={setDiscount} />
        <MoneyInput id="shipping" label="Ongkos kirim" value={shipping} onChange={setShipping} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-800">Pembayaran</h2>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHODS.map((m) => (
            <Chip key={m} active={payment === m} onClick={() => setPayment(m)}>
              {m}
            </Chip>
          ))}
        </div>
        <label className="mt-3 flex items-center gap-3 rounded-xl border border-zinc-200 p-3">
          <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="h-5 w-5 accent-zinc-900" />
          <span className="text-sm">Sudah dibayar</span>
        </label>
      </section>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-zinc-800">Catatan</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Contoh: kirim sebelum jam 3"
          className="w-full rounded-xl border border-zinc-300 p-3 text-[15px] focus:border-zinc-900 focus:outline-none"
        />
      </label>

      {/* Ringkasan total: menempel di bawah pada ponsel */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-zinc-200 bg-white px-4 py-3 lg:static lg:rounded-2xl lg:border">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-zinc-500">
              Subtotal {formatRupiah(totals.subtotal)}
              {discount ? ` − ${formatRupiah(discount)}` : ""}
              {shipping ? ` + ongkir ${formatRupiah(shipping)}` : ""}
            </p>
            <p className="tabular text-xl font-semibold">{formatRupiah(totals.total)}</p>
          </div>
          <SubmitButton disabled={!customer || valid.length === 0} className={cn("h-12 px-6")}>
            Simpan pesanan
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("h-9 rounded-full border px-4 text-sm", active ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 text-zinc-700")}
    >
      {children}
    </button>
  );
}
