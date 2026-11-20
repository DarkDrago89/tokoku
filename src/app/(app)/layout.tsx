import { AppShell } from "@/components/shell/AppShell";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await requireSession();
  const store = await prisma.store.findUnique({ where: { id: s.storeId }, select: { name: true } });
  return (
    <AppShell role={s.role} userName={s.name} storeName={store?.name ?? "Toko"}>
      {children}
    </AppShell>
  );
}
