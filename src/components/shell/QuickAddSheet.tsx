"use client";

import Link from "next/link";
import { ClipboardList, NotebookPen, Receipt, UserPlus } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";

const ACTIONS = [
  { href: "/pelanggan/baru", label: "Pelanggan baru", desc: "Cukup nama & nomor WhatsApp", icon: UserPlus },
  { href: "/pesanan/baru", label: "Pesanan baru", desc: "Catat pesanan yang masuk", icon: Receipt },
  { href: "/catatan/baru", label: "Catatan", desc: "Chat, telepon, atau keluhan", icon: NotebookPen },
  { href: "/tugas/baru", label: "Tugas follow-up", desc: "Ingatkan untuk menghubungi", icon: ClipboardList },
];

export function QuickAddSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Tambah cepat">
      <ul className="grid grid-cols-2 gap-3">
        {ACTIONS.map(({ href, label, desc, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              onClick={onClose}
              className="flex h-full flex-col gap-2 rounded-2xl border border-zinc-200 p-4 hover:border-zinc-900 active:bg-zinc-50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
                <Icon className="h-5 w-5" />
              </span>
              <span className="font-medium">{label}</span>
              <span className="text-xs text-zinc-500">{desc}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
