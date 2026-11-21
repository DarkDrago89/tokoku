import { PageHeader } from "@/components/ui/PageHeader";
import { requireSession } from "@/lib/session";
import { getTemplates } from "@/lib/store";
import { TemplateManager } from "@/features/templates/TemplateManager";

export const metadata = { title: "Template Pesan" };

export default async function TemplatesPage() {
  const s = await requireSession();
  const templates = await getTemplates(s.storeId);
  return (
    <>
      <PageHeader title="Template Pesan" subtitle="Ketuk variabel untuk menyisipkan data pelanggan otomatis" back="/lainnya" />
      <TemplateManager templates={templates} />
    </>
  );
}
