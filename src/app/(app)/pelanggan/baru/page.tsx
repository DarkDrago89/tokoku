import { PageHeader } from "@/components/ui/PageHeader";
import { CustomerForm } from "@/features/customers/CustomerForm";
import { listTags } from "@/features/customers/service";
import { requireSession } from "@/lib/session";

export const metadata = { title: "Pelanggan baru" };

export default async function NewCustomerPage() {
  const s = await requireSession();
  const tags = await listTags(s.storeId);
  return (
    <>
      <PageHeader title="Pelanggan baru" subtitle="Cukup nama dan nomor WhatsApp" back="/pelanggan" />
      <CustomerForm allTags={tags.map((t) => t.name)} />
    </>
  );
}
