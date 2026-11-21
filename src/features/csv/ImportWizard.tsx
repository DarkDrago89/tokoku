"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CheckCircle2, FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/lib/utils";
import { FIELD_LABEL, guessMapping, IMPORT_FIELDS, parseCsv, type ImportAnalysis, type Mapping } from "./analyze";
import { previewImportAction, runImportAction } from "./actions";

type Step = "upload" | "map" | "confirm" | "done";
const STEPS: { key: Step; label: string }[] = [
  { key: "upload", label: "Unggah" },
  { key: "map", label: "Cocokkan" },
  { key: "confirm", label: "Periksa" },
  { key: "done", label: "Selesai" },
];

export function ImportWizard() {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof runImportAction>> | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const onFile = async (file: File) => {
    setError("");
    if (!/\.(csv|txt)$/i.test(file.name)) return setError("Simpan file Excel sebagai CSV dulu (File → Save As → CSV).");
    const { headers, rows } = parseCsv(await file.text());
    if (!headers.length || !rows.length) return setError("File kosong atau tidak terbaca.");
    setFileName(file.name);
    setHeaders(headers);
    setRows(rows);
    setMapping(guessMapping(headers));
    setStep("map");
  };

  const toConfirm = () =>
    start(async () => {
      setAnalysis(await previewImportAction(rows, mapping));
      setStep("confirm");
    });

  const runImport = () =>
    start(async () => {
      setResult(await runImportAction(rows, mapping));
      setStep("done");
    });

  const reset = () => {
    setStep("upload");
    setRows([]);
    setAnalysis(null);
    setResult(null);
  };

  return (
    <div>
      <ol className="mb-5 flex gap-2">
        {STEPS.map((s, i) => {
          const current = STEPS.findIndex((x) => x.key === step);
          return (
            <li key={s.key} className="flex-1">
              <div className={cn("mb-1 h-1 rounded-full", i <= current ? "bg-zinc-900" : "bg-zinc-200")} />
              <span className={cn("text-xs", i === current ? "font-semibold" : "text-zinc-500")}>{s.label}</span>
            </li>
          );
        })}
      </ol>

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      {step === "upload" && (
        <>
          <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-zinc-300 px-6 py-10 text-center hover:border-zinc-900">
            <FileUp className="mb-3 h-8 w-8 text-zinc-500" />
            <span className="font-medium">Pilih file CSV</span>
            <span className="mt-1 text-sm text-zinc-500">Dari Excel / Google Sheets: simpan sebagai .csv</span>
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          </label>
          <p className="mt-3 text-center text-sm text-zinc-500">
            Belum punya format?{" "}
            { }
            <a download href="/api/ekspor/contoh" className="font-medium text-zinc-900 underline underline-offset-2">
              Unduh contoh CSV
            </a>
          </p>
        </>
      )}

      {step === "map" && (
        <>
          <p className="mb-3 text-sm text-zinc-600">
            <b>{fileName}</b> · {rows.length} baris. Cocokkan kolom file dengan data pelanggan:
          </p>
          <div className="mb-5 space-y-2">
            {IMPORT_FIELDS.map((f) => (
              <label key={f} className="flex items-center gap-3 rounded-xl border border-zinc-200 px-3 py-2">
                <span className="w-32 shrink-0 text-sm">
                  {FIELD_LABEL[f]}
                  {(f === "name" || f === "phone") && <span className="text-zinc-400">*</span>}
                </span>
                <select
                  value={mapping[f] ?? ""}
                  onChange={(e) => setMapping({ ...mapping, [f]: e.target.value || undefined })}
                  className="h-10 min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-2 text-sm"
                >
                  <option value="">— Lewati —</option>
                  {headers.map((h) => (
                    <option key={h}>{h}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Pratinjau 5 baris</p>
          <div className="mb-5 overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Nama</th>
                  <th className="px-3 py-2">Nomor</th>
                  <th className="px-3 py-2">Kota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.slice(0, 5).map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">{mapping.name ? r[mapping.name] : "–"}</td>
                    <td className="px-3 py-2">{mapping.phone ? r[mapping.phone] : "–"}</td>
                    <td className="px-3 py-2">{mapping.city ? r[mapping.city] : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={reset}>
              Ganti file
            </Button>
            <Button className="flex-1" disabled={!mapping.name || !mapping.phone || pending} onClick={toConfirm}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} Lanjut periksa
            </Button>
          </div>
        </>
      )}

      {step === "confirm" && analysis && (
        <>
          <div className="mb-4 grid grid-cols-3 gap-2 text-center">
            <Count n={analysis.valid.length} label="siap diimpor" tone="dark" />
            <Count n={analysis.duplicates.length} label="nomor ganda" tone="warning" />
            <Count n={analysis.invalid.length} label="tidak valid" tone="danger" />
          </div>
          <Issues analysis={analysis} />
          <div className="mt-5 flex gap-2">
            <Button variant="secondary" onClick={() => setStep("map")}>
              Kembali
            </Button>
            <Button className="flex-1" disabled={!analysis.valid.length || pending} onClick={runImport}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} Impor {analysis.valid.length} pelanggan
            </Button>
          </div>
        </>
      )}

      {step === "done" && result && (
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-zinc-900" />
          <p className="text-lg font-semibold">{result.imported} pelanggan berhasil diimpor</p>
          <p className="mt-1 text-sm text-zinc-500">
            {result.duplicates.length} dilewati karena nomor ganda, {result.invalid.length} tidak valid.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button variant="secondary" onClick={reset}>
              Impor lagi
            </Button>
            <Link href="/pelanggan" className="inline-flex h-11 items-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white">
              Lihat pelanggan
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Count({ n, label, tone }: { n: number; label: string; tone: "dark" | "warning" | "danger" }) {
  return (
    <div
      className={cn(
        "rounded-2xl p-3",
        tone === "dark" && "bg-zinc-900 text-white",
        tone === "warning" && "bg-amber-50 text-amber-900",
        tone === "danger" && "bg-red-50 text-red-800",
      )}
    >
      <p className="tabular text-2xl font-semibold">{n}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}

function Issues({ analysis }: { analysis: ImportAnalysis }) {
  const items = [
    ...analysis.duplicates.map((d) => ({ row: d.row, text: d.reason === "di_file" ? `Nomor ${d.phone} muncul lebih dari sekali di file` : `Nomor ${d.phone} sudah ada di daftar pelanggan` })),
    ...analysis.invalid.map((d) => ({ row: d.row, text: d.reason })),
  ].sort((a, b) => a.row - b.row);
  if (!items.length) return <Alert tone="success">Semua baris valid 👍</Alert>;
  return (
    <details className="rounded-2xl border border-zinc-200" open={items.length <= 10}>
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium">{items.length} baris akan dilewati</summary>
      <ul className="max-h-64 divide-y divide-zinc-100 overflow-y-auto border-t border-zinc-200 text-sm">
        {items.map((i, idx) => (
          <li key={idx} className="flex gap-3 px-4 py-2">
            <span className="w-16 shrink-0 text-zinc-500">Baris {i.row}</span>
            <span>{i.text}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
