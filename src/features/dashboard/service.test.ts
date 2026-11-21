import { describe, expect, it } from "vitest";
import { makeStore, randomPhone } from "@/test/factory";
import { createCustomerForStore } from "@/features/customers/service";
import { createOrderForStore, updateOrderStatusForStore } from "@/features/orders/service";
import { getSummary, topProducts } from "./service";

describe("ringkasan dashboard", () => {
  it("omzet hanya dari pesanan Selesai; pesanan batal tidak dihitung", async () => {
    const s = await makeStore();
    const c = await createCustomerForStore(s.storeId, { name: "Ani", phone: randomPhone() });
    const mk = async (price: number, status: "done" | "cancelled" | "pending") => {
      const o = await createOrderForStore(s.storeId, { customerId: c.id, items: [{ itemName: "Kopi", qty: 1, unitPrice: price }] });
      if (status !== "pending") await updateOrderStatusForStore(s.storeId, o.id, status, { userId: s.userId });
    };
    await mk(100000, "done");
    await mk(50000, "done");
    await mk(70000, "cancelled");
    await mk(30000, "pending");

    const from = new Date(Date.now() - 86_400_000);
    const to = new Date(Date.now() + 86_400_000);
    const sum = await getSummary(s.storeId, from, to);
    expect(sum.revenue).toBe(150000);
    expect(sum.orderCount).toBe(3); // semua kecuali batal
    expect(sum.avgOrderValue).toBe(75000);
    expect(sum.newCustomers).toBe(1);
    expect(sum.repeatRate).toBe(100); // 1 pelanggan dengan ≥2 pesanan selesai

    const top = await topProducts(s.storeId, 5);
    expect(top[0]).toMatchObject({ name: "Kopi", qty: 2 });
  });
});
