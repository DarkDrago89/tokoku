import { cn } from "@/lib/utils";

export function Alert({ tone = "danger", children }: { tone?: "danger" | "neutral" | "success"; children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl px-3.5 py-2.5 text-sm",
        tone === "danger" && "bg-red-50 text-red-800",
        tone === "neutral" && "bg-zinc-100 text-zinc-700",
        tone === "success" && "bg-emerald-50 text-emerald-800",
      )}
    >
      {children}
    </div>
  );
}
