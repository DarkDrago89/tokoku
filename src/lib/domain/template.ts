export const TEMPLATE_VARIABLES = ["nama", "produk", "total", "resi"] as const;

/** Mengisi {variabel}. Variabel yang kosong dibiarkan apa adanya dan dilaporkan di `missing`. */
export function renderTemplate(
  body: string,
  vars: Record<string, string | undefined>,
): { text: string; missing: string[] } {
  const missing = new Set<string>();
  const text = body.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = vars[key];
    if (value === undefined || value === "") {
      missing.add(key);
      return match;
    }
    return value;
  });
  return { text, missing: [...missing] };
}
