import { PageHeader } from "@/components/ui/PageHeader";
import { requireSession } from "@/lib/session";
import { listProducts } from "@/features/products/service";
import { ProductManager } from "@/features/products/ProductManager";
import { num } from "@/lib/utils";

export const metadata = { title: "Produk" };

export default async function ProductsPage() {
  const s = await requireSession();
  const products = await listProducts(s.storeId);
  return (
    <>
      <PageHeader title="Produk" subtitle={`${products.length} produk aktif`} back="/lainnya" />
      <ProductManager
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          price: num(p.price),
          category: p.category,
          stock: p.stock,
          repurchaseDays: p.repurchaseDays,
        }))}
      />
    </>
  );
}
