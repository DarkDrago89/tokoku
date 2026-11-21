/**
 * Normalisasi nomor WhatsApp ke format internasional Indonesia (62xxx).
 * Menerima "0812-3456 7890", "+62 812...", "62812...", atau "812...".
 * Mengembalikan null jika bukan nomor yang masuk akal (10–15 digit).
 */
export function normalizePhone(raw: string): string | null {
  let digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  else if (!digits.startsWith("62")) digits = "62" + digits;
  // "+62 0812…" → buang 0 setelah kode negara
  if (digits.startsWith("620")) digits = "62" + digits.slice(3);
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

/** 6281234567890 → "0812-3456-7890" agar mudah dibaca. */
export function formatPhone(phone: string): string {
  const local = phone.startsWith("62") ? "0" + phone.slice(2) : phone;
  return local.replace(/^(\d{4})(\d{4})(\d+)$/, "$1-$2-$3");
}

/** Tautan wa.me yang membuka chat (opsional dengan teks terisi). */
export function waLink(phone: string, text?: string): string {
  const base = `https://wa.me/${phone}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
