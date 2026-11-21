import { Lock } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, SectionTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/session";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { readSettings } from "@/lib/utils";
import { formatPhone } from "@/lib/domain/phone";
import { StoreForm, TeamManager } from "@/features/settings/SettingsForms";

export const metadata = { title: "Pengaturan" };

export default async function SettingsPage() {
  const s = await requireSession();
  if (!can(s.role, "settings.manage"))
    return (
      <>
        <PageHeader title="Pengaturan" back="/lainnya" />
        <EmptyState icon={<Lock className="h-6 w-6" />} title="Khusus Pemilik toko" />
      </>
    );

  const [store, members] = await Promise.all([
    prisma.store.findUniqueOrThrow({ where: { id: s.storeId } }),
    prisma.user.findMany({ where: { storeId: s.storeId }, orderBy: [{ role: "asc" }, { name: "asc" }], select: { id: true, name: true, email: true, role: true } }),
  ]);

  return (
    <>
      <PageHeader title="Pengaturan" back="/lainnya" />
      <section className="mb-8">
        <SectionTitle>Profil toko</SectionTitle>
        <Card className="p-4">
          <StoreForm
            store={{
              name: store.name,
              phone: store.phone ? formatPhone(store.phone) : "",
              address: store.address ?? "",
              inactiveDays: readSettings(store.settings).inactiveDays,
            }}
          />
        </Card>
      </section>
      <section>
        <SectionTitle count={members.length}>Tim</SectionTitle>
        <TeamManager members={members} meId={s.userId} />
      </section>
    </>
  );
}
