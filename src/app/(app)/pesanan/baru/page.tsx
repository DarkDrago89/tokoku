import { PageHeader } from "@/components/ui/PageHeader";
import { OrderForm } from "@/features/orders/OrderForm";
import { listProducts } from "@/features/products/service";
import { getCustomerForStore } from "@/features/customers/service";
import { requireSession } from "@/lib/session";
import { num } from "@/lib/utils";

export const metadata = { title: "Pesanan baru" };

export default async function NewOrderPage({ searchParams }: { searchParams: Promise<{ pelanggan?: string }> }) {
  const { pelanggan } = await searchParams;
  const s = await requireSession();
  const [products, customer] = await Promise.all([
    listProducts(s.storeId),
    pelanggan ? getCustomerForStore(s.storeId, pelanggan) : null,
  ]);
  return (
    <>
      <PageHeader title="Pesanan baru" back={customer ? `/pelanggan/${customer.id}` : "/pesanan"} />
      <OrderForm
        products={products.map((p) => ({ id: p.id, name: p.name, price: num(p.price) }))}
        initialCustomer={customer ? { id: customer.id, name: customer.name, phone: customer.phone, city: customer.city } : null}
      />
    </>
  );
}
