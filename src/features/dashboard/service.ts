import { prisma } from "@/lib/db";
import { num } from "@/lib/utils";

/** Kartu ringkasan (F-DSH-01) + persentase repeat order (F-DSH-03). */
export async function getSummary(storeId: string, from: Date, to: Date) {
  const span = +to - +from;
  const prevFrom = new Date(+from - span);
  const range = { gte: from, lt: to };

  const [done, prevDone, orderCount, newCustomers, buyers, repeaters] = await Promise.all([
    prisma.order.aggregate({ where: { storeId, status: "done", orderDate: range }, _sum: { total: true }, _count: true }),
    prisma.order.aggregate({ where: { storeId, status: "done", orderDate: { gte: prevFrom, lt: from } }, _sum: { total: true } }),
    prisma.order.count({ where: { storeId, status: { not: "cancelled" }, orderDate: range } }),
    prisma.customer.count({ where: { storeId, deletedAt: null, createdAt: range } }),
    prisma.customer.count({ where: { storeId, deletedAt: null, orderCount: { gte: 1 } } }),
    prisma.customer.count({ where: { storeId, deletedAt: null, orderCount: { gte: 2 } } }),
  ]);

  const revenue = num(done._sum.total);
  return {
    revenue,
    prevRevenue: num(prevDone._sum.total),
    orderCount,
    newCustomers,
    avgOrderValue: done._count ? Math.round(revenue / done._count) : 0,
    repeatRate: buyers ? Math.round((repeaters / buyers) * 100) : 0,
  };
}

/** Omzet harian (zona Jakarta) untuk grafik (F-DSH-02). */
export async function dailyRevenue(storeId: string, from: Date, to: Date) {
  const rows = await prisma.$queryRaw<{ day: string; total: number }[]>`
    SELECT to_char((order_date AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') AS day,
           SUM(total)::float AS total
    FROM orders
    WHERE store_id = ${storeId}::uuid AND status = 'done' AND order_date >= ${from} AND order_date < ${to}
    GROUP BY 1 ORDER BY 1`;
  const map = new Map(rows.map((r) => [r.day, Number(r.total)]));
  const days: { day: string; total: number }[] = [];
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" });
  for (let t = +from; t < +to; t += 86_400_000) {
    const day = fmt.format(new Date(t));
    if (!days.length || days[days.length - 1].day !== day) days.push({ day, total: map.get(day) ?? 0 });
  }
  return days;
}

export async function topCustomers(storeId: string, limit = 5) {
  const rows = await prisma.customer.findMany({
    where: { storeId, deletedAt: null, orderCount: { gt: 0 } },
    orderBy: { totalSpent: "desc" },
    take: limit,
    select: { id: true, name: true, totalSpent: true, orderCount: true },
  });
  return rows.map((r) => ({ ...r, totalSpent: num(r.totalSpent) }));
}

/** Produk terlaris dari pesanan Selesai (F-PRD-02 / F-DSH-04). */
export async function topProducts(storeId: string, limit = 5) {
  const rows = await prisma.$queryRaw<{ name: string; qty: number; revenue: number }[]>`
    SELECT oi.item_name AS name, SUM(oi.qty)::int AS qty, SUM(oi.qty * oi.unit_price)::float AS revenue
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE o.store_id = ${storeId}::uuid AND o.status = 'done'
    GROUP BY oi.item_name ORDER BY qty DESC, revenue DESC LIMIT ${limit}`;
  return rows.map((r) => ({ name: r.name, qty: Number(r.qty), revenue: Number(r.revenue) }));
}

/** Distribusi sumber pelanggan (F-DSH-05). */
export async function sourceDistribution(storeId: string) {
  const rows = await prisma.customer.groupBy({
    by: ["source"],
    where: { storeId, deletedAt: null },
    _count: true,
  });
  return rows
    .map((r) => ({ source: r.source ?? "Tidak diketahui", count: r._count }))
    .sort((a, b) => b.count - a.count);
}
