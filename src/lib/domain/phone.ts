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
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

/** Tautan wa.me yang membuka chat (opsional dengan teks terisi). */
export function waLink(phone: string, text?: string): string {
  const base = `https://wa.me/${phone}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
