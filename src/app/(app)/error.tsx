"use client";

import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";

/** Tampilan ramah saat terjadi kesalahan, menggantikan layar error bawaan. */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center rounded-2xl border border-zinc-200 px-6 py-12 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
        <TriangleAlert className="h-6 w-6" />
      </span>
      <h1 className="text-lg font-semibold">Ada yang tidak beres</h1>
      <p className="mt-1 max-w-xs text-sm text-zinc-500">
        Data mungkin sudah diubah atau dihapus orang lain, atau koneksi sedang terputus. Coba lagi sebentar.
      </p>
      <div className="mt-5 flex gap-2">
        <Button variant="secondary" onClick={reset}>
          <RotateCcw className="h-4 w-4" /> Coba lagi
        </Button>
        <ButtonLink href="/hari-ini">Ke Hari Ini</ButtonLink>
      </div>
    </div>
  );
}
