"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/domain/format";

/** Grafik batang omzet harian, monokrom; ketuk/arahkan batang untuk melihat angka. */
export function RevenueChart({ data }: { data: { day: string; total: number }[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.total));
  const shown = active ?? data.length - 1;
  const label = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
  const tick = Math.max(1, Math.ceil(data.length / 6));

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-sm text-zinc-500">{data[shown] ? label(data[shown].day) : ""}</p>
        <p className="tabular text-lg font-semibold">{data[shown] ? formatRupiah(data[shown].total) : "-"}</p>
      </div>
      <div className="flex h-36 items-end gap-[3px]" role="img" aria-label="Grafik omzet harian" onMouseLeave={() => setActive(null)}>
        {data.map((d, i) => (
          <button
            key={d.day}
            type="button"
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
            aria-label={`${label(d.day)}: ${formatRupiah(d.total)}`}
            className="group flex h-full flex-1 items-end"
          >
            <span
              className={
                "block w-full rounded-t-[3px] transition-colors " +
                (i === shown ? "bg-zinc-900" : d.total ? "bg-zinc-300 group-hover:bg-zinc-500" : "bg-zinc-100")
              }
              style={{ height: `${Math.max(2, (d.total / max) * 100)}%` }}
            />
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex gap-[3px] text-[10px] text-zinc-400">
        {data.map((d, i) => (
          <span key={d.day} className="flex-1 text-center">
            {i % tick === 0 ? label(d.day) : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
