import {
  CalendarCheck,
  LayoutDashboard,
  MessageSquareText,
  Package,
  Receipt,
  Settings,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react";
import { can, type Action, type Role } from "@/lib/permissions";

export type NavItem = { href: string; label: string; icon: LucideIcon; needs?: Action };

export const PRIMARY_NAV: NavItem[] = [
  { href: "/hari-ini", label: "Hari Ini", icon: CalendarCheck },
  { href: "/pelanggan", label: "Pelanggan", icon: Users },
  { href: "/pesanan", label: "Pesanan", icon: Receipt },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, needs: "report.view" },
  { href: "/produk", label: "Produk", icon: Package },
  { href: "/template", label: "Template Pesan", icon: MessageSquareText },
  { href: "/impor-ekspor", label: "Impor & Ekspor", icon: Upload, needs: "data.export" },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings, needs: "settings.manage" },
];

export function visibleFor(role: Role, items: NavItem[]) {
  return items.filter((i) => !i.needs || can(role, i.needs));
}
