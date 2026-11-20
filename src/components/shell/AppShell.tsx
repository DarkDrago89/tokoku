"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, Plus, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/permissions";
import { ROLE_LABEL } from "@/lib/permissions";
import { PRIMARY_NAV, SECONDARY_NAV, visibleFor } from "./nav";
import { QuickAddSheet } from "./QuickAddSheet";
import { logoutAction } from "@/app/(auth)/actions";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppShell({
  role,
  userName,
  storeName,
  children,
}: {
  role: Role;
  userName: string;
  storeName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [quickOpen, setQuickOpen] = useState(false);
  const secondary = visibleFor(role, SECONDARY_NAV);
  const moreActive = secondary.some((i) => isActive(pathname, i.href)) || isActive(pathname, "/lainnya");

  return (
    <div className="min-h-dvh bg-white lg:flex">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50/60 p-4 lg:flex">
        <div className="mb-6 flex items-center gap-2.5 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white">
            <Store className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{storeName}</p>
            <p className="text-xs text-zinc-500">TokoKu CRM</p>
          </div>
        </div>
        <button
          onClick={() => setQuickOpen(true)}
          className="mb-5 flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-700"
        >
          <Plus className="h-4 w-4" /> Tambah
        </button>
        <nav className="flex-1 space-y-1">
          {[...PRIMARY_NAV, ...secondary].map(({ href, label, icon: Icon }, idx) => (
            <div key={href}>
              {idx === PRIMARY_NAV.length && <div className="my-3 border-t border-zinc-200" />}
              <Link
                href={href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-xl px-3 text-sm",
                  isActive(pathname, href) ? "bg-white font-medium text-zinc-900 shadow-sm ring-1 ring-zinc-200" : "text-zinc-600 hover:bg-zinc-100",
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {label}
              </Link>
            </div>
          ))}
        </nav>
        <div className="mt-4 flex items-center justify-between rounded-xl px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{userName}</p>
            <p className="text-xs text-zinc-500">{ROLE_LABEL[role]}</p>
          </div>
          <form action={logoutAction}>
            <button aria-label="Keluar" title="Keluar" className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-200">
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </aside>

      {/* Konten */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-5 lg:px-8 lg:pb-10 lg:pt-8">{children}</main>

      {/* Bilah bawah ponsel */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur lg:hidden" aria-label="Navigasi utama">
        <ul className="mx-auto grid max-w-md grid-cols-5 items-end">
          {PRIMARY_NAV.slice(0, 2).map((item) => (
            <TabLink key={item.href} {...item} active={isActive(pathname, item.href)} />
          ))}
          <li className="flex justify-center">
            <button
              onClick={() => setQuickOpen(true)}
              aria-label="Tambah cepat"
              className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg shadow-zinc-900/20 active:scale-95"
            >
              <Plus className="h-6 w-6" />
            </button>
          </li>
          <TabLink {...PRIMARY_NAV[2]} active={isActive(pathname, PRIMARY_NAV[2].href)} />
          <TabLink href="/lainnya" label="Lainnya" icon={Menu} active={moreActive} />
        </ul>
      </nav>

      <QuickAddSheet open={quickOpen} onClose={() => setQuickOpen(false)} />
    </div>
  );
}

function TabLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: React.ElementType; active: boolean }) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn("flex h-16 flex-col items-center justify-center gap-1 text-[11px]", active ? "font-semibold text-zinc-900" : "text-zinc-500")}
      >
        <Icon className={cn("h-5 w-5", active && "stroke-[2.4]")} />
        {label}
      </Link>
    </li>
  );
}
