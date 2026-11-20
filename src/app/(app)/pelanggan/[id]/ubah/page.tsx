import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { CustomerForm } from "@/features/customers/CustomerForm";
import { getCustomerForStore, listTags } from "@/features/customers/service";
import { requireSession } from "@/lib/session";
import { formatPhone } from "@/lib/domain/phone";

export const metadata = { title: "Ubah pelanggan" };

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await requireSession();
  const [c, tags] = await Promise.all([getCustomerForStore(s.storeId, id), listTags(s.storeId)]);
  if (!c) notFound();
  return (
    <>
      <PageHeader title="Ubah pelanggan" subtitle={c.name} back={`/pelanggan/${c.id}`} />
      <CustomerForm
        allTags={tags.map((t) => t.name)}
        values={{
          id: c.id,
          name: c.name,
          phone: formatPhone(c.phone),
          email: c.email,
          address: c.address,
          city: c.city,
          birthday: c.birthday ? c.birthday.toISOString().slice(0, 10) : null,
          source: c.source,
          notes: c.notes,
          tags: c.tags.map((t) => t.tag.name),
        }}
      />
    </>
  );
}
