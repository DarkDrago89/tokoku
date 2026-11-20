import { Store } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white">
            <Store className="h-6 w-6" />
          </span>
          <p className="text-xl font-semibold tracking-tight">TokoKu CRM</p>
          <p className="text-sm text-zinc-500">Kenali pelanggan, jaga mereka kembali.</p>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">{children}</div>
      </div>
    </main>
  );
}
