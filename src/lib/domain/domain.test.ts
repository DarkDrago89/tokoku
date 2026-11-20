import { describe, expect, it } from "vitest";
import { normalizePhone, waLink } from "./phone";
import { calcOrderTotals, computeCustomerStats } from "./order";
import { customerStatus, isLoyal } from "./customer";
import { renderTemplate } from "./template";
import { formatDate, formatRupiah } from "./format";

const DAY = 86_400_000;

describe("normalizePhone", () => {
  it("mengubah 08xx dengan spasi/strip ke 62xx", () => {
    expect(normalizePhone("0812-3456 7890")).toBe("6281234567890");
  });
  it("menerima +62 dan 62", () => {
    expect(normalizePhone("+62 812 3456 7890")).toBe("6281234567890");
    expect(normalizePhone("6281234567890")).toBe("6281234567890");
  });
  it("menambah 62 pada nomor tanpa awalan 0", () => {
    expect(normalizePhone("812345678901")).toBe("62812345678901");
  });
  it("menolak nomor tidak valid", () => {
    expect(normalizePhone("abc")).toBeNull();
    expect(normalizePhone("0812")).toBeNull();
    expect(normalizePhone("")).toBeNull();
  });
  it("membuat tautan wa.me dengan teks ter-encode", () => {
    expect(waLink("6281234567890", "Halo Ani & Budi")).toBe(
      "https://wa.me/6281234567890?text=Halo%20Ani%20%26%20Budi",
    );
    expect(waLink("6281234567890")).toBe("https://wa.me/6281234567890");
  });
});

describe("pesanan", () => {
  it("menghitung subtotal dan total", () => {
    expect(calcOrderTotals([{ qty: 2, unitPrice: 50000 }], 10000, 15000)).toEqual({
      subtotal: 100000,
      total: 105000,
    });
  });
  it("total tidak pernah negatif", () => {
    expect(calcOrderTotals([{ qty: 1, unitPrice: 1000 }], 5000, 0).total).toBe(0);
  });
  it("statistik pelanggan hanya menghitung pesanan Selesai", () => {
    const d1 = new Date("2026-10-01");
    const stats = computeCustomerStats([
      { status: "done", total: 100000, orderDate: d1 },
      { status: "cancelled", total: 50000, orderDate: new Date("2026-11-01") },
    ]);
    expect(stats).toEqual({ totalSpent: 100000, orderCount: 1, lastOrderAt: d1 });
  });
  it("pesanan yang dibatalkan menghilangkan total", () => {
    expect(
      computeCustomerStats([{ status: "cancelled", total: 100000, orderDate: new Date() }]),
    ).toEqual({ totalSpent: 0, orderCount: 0, lastOrderAt: null });
  });
});

describe("status pelanggan", () => {
  const now = new Date("2026-11-21T10:00:00Z");
  it("baru: dibuat 10 hari lalu tanpa pesanan", () => {
    expect(
      customerStatus({ createdAt: new Date(+now - 10 * DAY), lastOrderAt: null, orderCount: 0 }, now),
    ).toBe("baru");
  });
  it("tidak aktif: pesanan terakhir 61 hari lalu", () => {
    expect(
      customerStatus(
        { createdAt: new Date(+now - 200 * DAY), lastOrderAt: new Date(+now - 61 * DAY), orderCount: 2 },
        now,
      ),
    ).toBe("tidak_aktif");
  });
  it("aktif: pesanan terakhir 59 hari lalu", () => {
    expect(
      customerStatus(
        { createdAt: new Date(+now - 200 * DAY), lastOrderAt: new Date(+now - 59 * DAY), orderCount: 2 },
        now,
      ),
    ).toBe("aktif");
  });
  it("ambang hari dapat diatur", () => {
    expect(
      customerStatus(
        { createdAt: new Date(+now - 200 * DAY), lastOrderAt: new Date(+now - 40 * DAY), orderCount: 1 },
        now,
        30,
      ),
    ).toBe("tidak_aktif");
  });
  it("setia jika minimal 3 pesanan", () => {
    expect(isLoyal(3)).toBe(true);
    expect(isLoyal(2)).toBe(false);
  });
});

describe("template", () => {
  it("mengisi variabel dan mencatat yang kosong", () => {
    expect(renderTemplate("Halo {nama}, resi {resi}", { nama: "Ani" })).toEqual({
      text: "Halo Ani, resi {resi}",
      missing: ["resi"],
    });
  });
  it("variabel string kosong dianggap hilang, tidak duplikat", () => {
    expect(renderTemplate("{resi} {resi}", { resi: "" }).missing).toEqual(["resi"]);
  });
});

describe("format", () => {
  it("rupiah tanpa desimal", () => {
    expect(formatRupiah(1250000)).toBe("Rp 1.250.000");
  });
  it("tanggal dd/mm/yyyy zona Jakarta", () => {
    expect(formatDate(new Date("2026-11-21T20:00:00Z"))).toBe("22/11/2026");
  });
});
