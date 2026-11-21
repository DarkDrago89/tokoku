import { Download, Lock } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, SectionTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { buttonClass } from "@/components/ui/Button";
import { requireSession } from "@/lib/session";
import { can } from "@/lib/permissions";
import { ImportWizard } from "@/features/csv/ImportWizard";

export const metadata = { title: "Impor & Ekspor" };

export default async function ImportExportPage() {
  const s = await requireSession();
  if (!can(s.role, "data.export"))
    return (
      <>
        <PageHeader title="Impor & Ekspor" back="/lainnya" />
        <EmptyState icon={<Lock className="h-6 w-6" />} title="Khusus Pemilik dan Admin" />
      </>
    );
  return (
    <>
      <PageHeader title="Impor & Ekspor" subtitle="Pindahkan data dari/ke Excel atau Google Sheets" back="/lainnya" />
      <section className="mb-8">
        <SectionTitle>Impor pelanggan</SectionTitle>
        <Card className="p-4">
          <ImportWizard />
        </Card>
      </section>
      <section>
        <SectionTitle>Ekspor</SectionTitle>
        <Card className="grid gap-2 p-4 sm:grid-cols-2">
          <a download href="/api/ekspor/pelanggan" className={buttonClass("secondary", "md")}>
            <Download className="h-4 w-4" /> Semua pelanggan (.csv)
          </a>
          <a download href="/api/ekspor/pesanan" className={buttonClass("secondary", "md")}>
            <Download className="h-4 w-4" /> Semua pesanan (.csv)
          </a>
        </Card>
        <p className="mt-2 px-1 text-xs text-zinc-500">File bisa dibuka langsung di Excel atau Google Sheets.</p>
      </section>
    </>
  );
}
