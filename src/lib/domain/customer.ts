export type CustomerStatus = "baru" | "aktif" | "tidak_aktif";

export const CUSTOMER_STATUS_LABEL: Record<CustomerStatus, string> = {
  baru: "Baru",
  aktif: "Aktif",
  tidak_aktif: "Tidak Aktif",
};

export const CUSTOMER_SOURCES = ["Instagram", "WhatsApp", "Tokopedia", "Shopee", "Offline", "Lainnya"] as const;

export const DEFAULT_INACTIVE_DAYS = 60;
export const NEW_CUSTOMER_DAYS = 30;

/** Pelanggan Setia: minimal 3 pesanan Selesai (aturan bisnis no. 5). */
export function isLoyal(orderCount: number): boolean {
  return orderCount >= 3;
}

/**
 * Status otomatis pelanggan (F-CUS-07, aturan bisnis no. 4).
 * - "baru"        : dibuat ≤ NEW_CUSTOMER_DAYS hari lalu dan belum punya pesanan Selesai
 * - "tidak_aktif" : tidak ada pesanan Selesai selama lebih dari `inactiveDays` hari
 * - "aktif"       : selain itu
 */
export function customerStatus(
  c: { createdAt: Date; lastOrderAt: Date | null; orderCount: number },
  now: Date,
  inactiveDays: number = DEFAULT_INACTIVE_DAYS,
): CustomerStatus {
  // TODO(human): tentukan status pelanggan sesuai aturan di atas.
  throw new Error("belum diimplementasikan");
}
