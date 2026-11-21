import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { requireSession } from "@/lib/session";
import { getTemplates } from "@/lib/store";
import { getOrderForStore } from "@/features/orders/service";
import { OrderStatusBadge } from "@/features/orders/OrderStatusBadge";
import { StatusStepper } from "@/features/orders/StatusStepper";
import { ReorderButton } from "@/features/orders/ReorderButton";
import { WhatsAppButton } from "@/features/templates/SendWhatsAppSheet";
import { formatDate, formatRupiah } from "@/lib/domain/format";
import { formatPhone } from "@/lib/domain/phone";
import { num } from "@/lib/utils";

export const metadata = { title: "Detail pesanan" };

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ baru?: string }>;
}) {
  const [{ id }, { baru }] = await Promise.all([params, searchParams]);
  const s = await requireSession();
  const order = await getOrderForStore(s.storeId, id);
  if (!order) notFound();
  const templates = await getTemplates(s.storeId);

  const produk = order.items.map((i) => `- ${i.itemName} x${i.qty}`).join("\n");
  const context = {
    produk,
    total: formatRupiah(num(order.total)),
    resi: order.trackingNumber ?? undefined,
  };
  const preferCategory =
    order.status === "shipped" ? "Info resi" : order.status === "done" ? "Terima kasih" : "Konfirmasi pesanan";

  return (
    <>
      <PageHeader
        title={order.orderNumber}
        subtitle={
          <span className="flex items-center gap-2">
            {formatDate(order.orderDate)} <OrderStatusBadge status={order.status} />
          </span>
        }
        back="/pesanan"
      />

      {baru && (
        <div className="mb-4">
          <Alert tone="success">Pesanan tersimpan. Kirim ringkasannya ke pelanggan lewat WhatsApp 👇</Alert>
        </div>
      )}

      <Card className="mb-4 p-4">
        <Link href={`/pelanggan/${order.customer.id}`} className="mb-3 flex items-center gap-3">
          <Avatar name={order.customer.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{order.customer.name}</p>
            <p className="text-sm text-zinc-500">{formatPhone(order.customer.phone)}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-300" />
        </Link>
        <WhatsAppButton
          customer={{ id: order.customer.id, name: order.customer.name, phone: order.customer.phone }}
          templates={templates}
          context={context}
          preferCategory={preferCategory}
          label={order.status === "shipped" ? "Kirim info resi" : order.status === "done" ? "Ucapkan terima kasih" : "Kirim ringkasan pesanan"}
          size="lg"
        />
      </Card>

      <section className="mb-6">
        <SectionTitle>Status</SectionTitle>
        <Card className="p-4">
          <StatusStepper orderId={order.id} status={order.status} trackingNumber={order.trackingNumber} />
          {order.trackingNumber && (
            <p className="mt-3 text-sm text-zinc-600">
              Resi: <span className="font-mono font-medium text-zinc-900">{order.trackingNumber}</span>
            </p>
          )}
        </Card>
      </section>

      <section className="mb-6">
        <SectionTitle count={order.items.length}>Barang</SectionTitle>
        <Card className="divide-y divide-zinc-100">
          {order.items.map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{i.itemName}</p>
                <p className="tabular text-zinc-500">
                  {i.qty} × {formatRupiah(num(i.unitPrice))}
                </p>
              </div>
              <p className="tabular font-medium">{formatRupiah(i.qty * num(i.unitPrice))}</p>
            </div>
          ))}
          <dl className="tabular space-y-1 px-4 py-3 text-sm">
            <Row label="Subtotal" value={formatRupiah(num(order.subtotal))} />
            {num(order.discount) > 0 && <Row label="Diskon" value={`− ${formatRupiah(num(order.discount))}`} />}
            {num(order.shippingCost) > 0 && <Row label="Ongkos kirim" value={formatRupiah(num(order.shippingCost))} />}
            <div className="flex justify-between pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatRupiah(num(order.total))}</dd>
            </div>
          </dl>
        </Card>
      </section>

      <section className="mb-6">
        <SectionTitle>Lainnya</SectionTitle>
        <Card className="divide-y divide-zinc-100 text-sm">
          <div className="flex justify-between px-4 py-3">
            <span className="text-zinc-500">Pembayaran</span>
            <span>{order.paymentMethod ?? "-"}</span>
          </div>
          {order.notes && (
            <div className="px-4 py-3">
              <p className="text-zinc-500">Catatan</p>
              <p className="whitespace-pre-line">{order.notes}</p>
            </div>
          )}
        </Card>
      </section>

      <div className="flex justify-center pb-4">
        <ReorderButton orderId={order.id} />
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-zinc-600">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
