import Link from "next/link";
import { ChevronRight, LogOut } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SECONDARY_NAV, visibleFor } from "@/components/shell/nav";
import { requireSession } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/permissions";
import { logoutAction } from "@/app/(auth)/actions";
import { Avatar } from "@/components/ui/Avatar";

export const metadata = { title: "Lainnya" };

export default async function MorePage() {
  const s = await requireSession();
  return (
    <>
      <PageHeader title="Lainnya" />
      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-zinc-200 p-4">
        <Avatar name={s.name} size={44} />
        <div>
          <p className="font-medium">{s.name}</p>
          <p className="text-sm text-zinc-500">{ROLE_LABEL[s.role]}</p>
        </div>
      </div>
      <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200">
        {visibleFor(s.role, SECONDARY_NAV).map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="flex h-14 items-center gap-3 px-4 hover:bg-zinc-50 active:bg-zinc-100">
              <Icon className="h-5 w-5 text-zinc-600" />
              <span className="flex-1">{label}</span>
              <ChevronRight className="h-4 w-4 text-zinc-400" />
            </Link>
          </li>
        ))}
      </ul>
      <form action={logoutAction} className="mt-5">
        <button className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
          <LogOut className="h-4 w-4" /> Keluar
        </button>
      </form>
    </>
  );
}
