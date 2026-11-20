export type OrderStatus = "pending" | "paid" | "packed" | "shipped" | "done" | "cancelled";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Menunggu Bayar",
  paid: "Dibayar",
  packed: "Dikemas",
  shipped: "Dikirim",
  done: "Selesai",
  cancelled: "Batal",
};

/** Urutan alur normal pesanan (Batal bisa dari mana saja sebelum Selesai). */
export const ORDER_FLOW: OrderStatus[] = ["pending", "paid", "packed", "shipped", "done"];

export const PAYMENT_METHODS = ["Transfer", "COD", "E-wallet", "Tunai"] as const;

export function calcOrderTotals(
  items: { qty: number; unitPrice: number }[],
  discount: number,
  shippingCost: number,
): { subtotal: number; total: number } {
  const subtotal = items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  const total = Math.max(0, subtotal - (discount || 0) + (shippingCost || 0));
  return { subtotal, total };
}

/**
 * Statistik pelanggan dihitung ulang dari seluruh pesanannya.
 * Hanya pesanan Selesai yang dihitung, sehingga pembatalan otomatis mengurangi total.
 */
export function computeCustomerStats(
  orders: { status: OrderStatus; total: number; orderDate: Date }[],
): { totalSpent: number; orderCount: number; lastOrderAt: Date | null } {
  const done = orders.filter((o) => o.status === "done");
  const lastOrderAt = done.reduce<Date | null>(
    (latest, o) => (!latest || o.orderDate > latest ? o.orderDate : latest),
    null,
  );
  return {
    totalSpent: done.reduce((s, o) => s + o.total, 0),
    orderCount: done.length,
    lastOrderAt,
  };
}
