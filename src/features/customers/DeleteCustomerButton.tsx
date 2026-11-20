"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { deleteCustomerAction } from "./actions";

export function DeleteCustomerButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" /> Hapus pelanggan
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Hapus pelanggan?">
        <p className="text-sm text-zinc-600">
          <b>{name}</b> akan disembunyikan dari daftar. Data disimpan 30 hari sebelum dihapus permanen, dan bisa dipulihkan dengan
          menambahkan nomor yang sama lagi.
        </p>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button className="flex-1 bg-red-700 hover:bg-red-800" disabled={pending} onClick={() => start(() => deleteCustomerAction(id))}>
            Ya, hapus
          </Button>
        </div>
      </Sheet>
    </>
  );
}
