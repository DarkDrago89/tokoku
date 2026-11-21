"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Package, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { formatRupiah } from "@/lib/domain/format";
import type { FormState } from "@/lib/utils";
import { archiveProductAction, saveProductAction } from "./actions";

export type ProductRow = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  category: string | null;
  stock: number | null;
  repurchaseDays: number | null;
};

export function ProductManager({ products }: { products: ProductRow[] }) {
  const [editing, setEditing] = useState<ProductRow | "new" | null>(null);
  const [q, setQ] = useState("");
  const shown = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  const groups = shown.reduce<Record<string, ProductRow[]>>((acc, p) => {
    (acc[p.category || "Tanpa kategori"] ??= []).push(p);
    return acc;
  }, {});

  return (
    <>
      <div className="mb-4 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari produk"
          className="h-11 flex-1 rounded-xl border border-zinc-300 px-3.5 focus:border-zinc-900 focus:outline-none"
        />
        <Button onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" /> Produk
        </Button>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="Belum ada produk"
          action={<Button onClick={() => setEditing("new")}>Tambah produk</Button>}
        >
          Produk membantu mengisi pesanan lebih cepat. Boleh juga ketik barang manual saat membuat pesanan.
        </EmptyState>
      ) : (
        Object.entries(groups).map(([cat, items]) => (
          <section key={cat} className="mb-5">
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">{cat}</h2>
            <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200">
              {items.map((p) => (
                <li key={p.id}>
                  <button onClick={() => setEditing(p)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="text-xs text-zinc-500">
                        {p.sku ? `SKU ${p.sku}` : "Tanpa SKU"}
                        {p.repurchaseDays ? ` · beli ulang ±${p.repurchaseDays} hari` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="tabular text-sm font-medium">{formatRupiah(p.price)}</p>
                      {p.stock !== null && (
                        <Badge tone={p.stock <= 5 ? "warning" : "neutral"}>Stok {p.stock}</Badge>
                      )}
                    </div>
                    <Pencil className="h-4 w-4 text-zinc-300" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      {editing && <ProductSheet product={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function ProductSheet({ product, onClose }: { product: ProductRow | null; onClose: () => void }) {
  const [state, action] = useActionState<FormState, FormData>(saveProductAction, {});
  const [archiving, start] = useTransition();
  const fe = state.fieldErrors ?? {};
  useEffect(() => {
    if (state.ok) onClose();
  }, [state, onClose]);

  return (
    <Sheet open onClose={onClose} title={product ? "Ubah produk" : "Produk baru"}>
      <form action={action} className="space-y-4">
        {product && <input type="hidden" name="id" value={product.id} />}
        <Input name="name" label="Nama produk" required defaultValue={product?.name} error={fe.name} autoFocus />
        <div className="grid grid-cols-2 gap-3">
          <Input name="price" label="Harga (Rp)" required inputMode="numeric" defaultValue={product?.price} error={fe.price} />
          <Input name="category" label="Kategori" defaultValue={product?.category ?? ""} />
          <Input name="sku" label="SKU" defaultValue={product?.sku ?? ""} />
          <Input name="stock" label="Stok" inputMode="numeric" defaultValue={product?.stock ?? ""} error={fe.stock} hint="Kosongkan jika tidak dihitung" />
        </div>
        <Input
          name="repurchaseDays"
          label="Biasanya habis dalam (hari)"
          inputMode="numeric"
          defaultValue={product?.repurchaseDays ?? ""}
          error={fe.repurchaseDays}
          hint="Opsional. Contoh: kopi 250g ±30 hari"
        />
        <SubmitButton size="lg">Simpan</SubmitButton>
        {product && (
          <Button
            type="button"
            variant="danger"
            size="lg"
            disabled={archiving}
            onClick={() =>
              start(async () => {
                await archiveProductAction(product.id);
                onClose();
              })
            }
          >
            Hapus produk
          </Button>
        )}
      </form>
    </Sheet>
  );
}
