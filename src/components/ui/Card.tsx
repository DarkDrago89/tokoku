import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-zinc-200 bg-white", className)} {...props} />;
}

export function SectionTitle({
  children,
  count,
  action,
}: {
  children: React.ReactNode;
  count?: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center justify-between px-1">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {children}
        {count !== undefined && <span className="ml-1.5 text-zinc-400">{count}</span>}
      </h2>
      {action}
    </div>
  );
}
