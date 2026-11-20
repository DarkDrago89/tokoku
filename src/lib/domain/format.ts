const rupiah = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

export function formatRupiah(n: number): string {
  return `Rp ${rupiah.format(Math.round(n))}`;
}

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** dd/mm/yyyy dalam zona waktu Jakarta. */
export function formatDate(d: Date): string {
  const parts = Object.fromEntries(dateFmt.formatToParts(d).map((p) => [p.type, p.value]));
  return `${parts.day}/${parts.month}/${parts.year}`;
}

/** "3 hari lalu", "hari ini", dst. untuk tampilan ramah. */
export function relativeDays(d: Date, now = new Date()): string {
  const days = Math.floor((+now - +d) / 86_400_000);
  if (days <= 0) return "hari ini";
  if (days === 1) return "kemarin";
  if (days < 30) return `${days} hari lalu`;
  if (days < 365) return `${Math.floor(days / 30)} bulan lalu`;
  return `${Math.floor(days / 365)} tahun lalu`;
}
