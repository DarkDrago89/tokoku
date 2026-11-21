/**
 * Data demo untuk portofolio: satu toko kopi dengan pelanggan, produk, pesanan 90 hari, interaksi, dan tugas.
 * Jalankan: npm run db:seed   (aman diulang, toko demo lama dihapus dulu)
 * Akun: demo@tokoku.id / demo12345 (Pemilik) · staf@tokoku.id / demo12345 (Staf)
 */
import { PrismaClient, type OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_TEMPLATES } from "../src/features/templates/defaults";
import { calcOrderTotals, computeCustomerStats } from "../src/lib/domain/order";

const prisma = new PrismaClient();
const DAY = 86_400_000;

// Pembangkit acak deterministik agar data demo selalu sama.
let seed = 42;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
const between = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1));

const FIRST = ["Ani", "Budi", "Citra", "Dewi", "Eko", "Fajar", "Gita", "Hendra", "Indah", "Joko", "Kartika", "Lukman", "Maya", "Nanda", "Oki", "Putri", "Rizky", "Sari", "Taufik", "Utami", "Vina", "Wahyu", "Yusuf", "Zahra"];
const LAST = ["Wijaya", "Santoso", "Lestari", "Pratama", "Hidayat", "Siregar", "Nugroho", "Rahmawati", "Saputra", "Kusuma", "Harahap", "Purnomo"];
const CITIES = ["Jakarta", "Bandung", "Surabaya", "Yogyakarta", "Semarang", "Medan", "Malang", "Bekasi", "Depok", "Makassar"];
const SOURCES = ["Instagram", "Instagram", "WhatsApp", "WhatsApp", "Tokopedia", "Shopee", "Offline", "Lainnya"];
const PRODUCTS = [
  { name: "Kopi Gayo 250g", category: "Biji Kopi", price: 85000, repurchaseDays: 30 },
  { name: "Kopi Toraja 250g", category: "Biji Kopi", price: 90000, repurchaseDays: 30 },
  { name: "Kopi Kintamani 250g", category: "Biji Kopi", price: 82000, repurchaseDays: 30 },
  { name: "Kopi Flores Bajawa 250g", category: "Biji Kopi", price: 88000, repurchaseDays: 30 },
  { name: "House Blend 1kg", category: "Biji Kopi", price: 260000, repurchaseDays: 45 },
  { name: "Kopi Susu Literan", category: "Minuman Siap Saji", price: 95000, repurchaseDays: 7 },
  { name: "Cold Brew 500ml", category: "Minuman Siap Saji", price: 55000, repurchaseDays: 7 },
  { name: "Drip Bag isi 10", category: "Praktis", price: 65000, repurchaseDays: 14 },
  { name: "V60 Paper Filter", category: "Alat Seduh", price: 45000 },
  { name: "French Press 350ml", category: "Alat Seduh", price: 165000 },
  { name: "Gelas Tumbler TokoKu", category: "Merchandise", price: 120000 },
  { name: "Paket Hampers Kopi", category: "Hampers", price: 350000 },
];
const NOTES = [
  "Suka kopi yang tidak terlalu asam",
  "Minta dikirim sore hari",
  "Reseller area kampus",
  "Langganan untuk kantor",
  "Pernah komplain kemasan, sekarang sudah oke",
];

async function main() {
  const old = await prisma.user.findUnique({ where: { email: "demo@tokoku.id" } });
  if (old) await prisma.store.delete({ where: { id: old.storeId } });

  const store = await prisma.store.create({
    data: { name: "Kopi Nusantara", phone: "6281234567000", address: "Jl. Braga No. 10, Bandung", settings: { inactiveDays: 60 } },
  });
  const passwordHash = await bcrypt.hash("demo12345", 10);
  const owner = await prisma.user.create({ data: { storeId: store.id, name: "Rina Kusuma", email: "demo@tokoku.id", passwordHash, role: "owner" } });
  const staff = await prisma.user.create({ data: { storeId: store.id, name: "Dimas", email: "staf@tokoku.id", passwordHash, role: "staff" } });
  await prisma.messageTemplate.createMany({ data: DEFAULT_TEMPLATES.map((t) => ({ ...t, storeId: store.id })) });

  const products = await Promise.all(PRODUCTS.map((p) => prisma.product.create({ data: { ...p, storeId: store.id, stock: between(3, 60) } })));
  const tags = await Promise.all(["VIP", "Reseller", "Grosir", "Kantor"].map((name) => prisma.tag.create({ data: { storeId: store.id, name } })));

  const now = Date.now();
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  const usedPhones = new Set<string>();
  const customers = [];
  for (let i = 0; i < 40; i++) {
    let phone: string;
    do phone = `628${between(11, 59)}${between(10000000, 99999999)}`;
    while (usedPhones.has(phone));
    usedPhones.add(phone);
    const createdAt = new Date(now - between(5, 200) * DAY);
    const isBirthdayToday = i === 3;
    const birthday = isBirthdayToday
      ? new Date(Date.UTC(1993, today.getUTCMonth(), today.getUTCDate()))
      : rand() < 0.5
        ? new Date(Date.UTC(between(1975, 2003), between(0, 11), between(1, 28)))
        : null;
    customers.push(
      await prisma.customer.create({
        data: {
          storeId: store.id,
          name: `${FIRST[i % FIRST.length]} ${pick(LAST)}`,
          phone,
          city: pick(CITIES),
          source: pick(SOURCES),
          birthday,
          notes: rand() < 0.2 ? pick(NOTES) : null,
          createdAt,
        },
      }),
    );
  }

  // Tag: beberapa VIP, reseller, dst.
  for (const c of customers.slice(0, 14)) {
    await prisma.customerTag.create({ data: { customerId: c.id, tagId: pick(tags).id } });
  }

  // 120 pesanan dalam 90 hari; pelanggan awal lebih sering belanja (pola nyata: sebagian kecil pelanggan = sebagian besar omzet).
  const statusFor = (daysAgo: number): OrderStatus => {
    if (daysAgo > 7) return rand() < 0.92 ? "done" : "cancelled";
    return pick(["pending", "paid", "packed", "shipped", "done", "done"] as const);
  };
  let counter = 0;
  const orderDates: number[] = Array.from({ length: 120 }, () => between(0, 90)).sort((a, b) => b - a);
  for (const daysAgo of orderDates) {
    // Sisakan 6 pelanggan "lama tidak belanja": hanya pesan > 65 hari lalu.
    const pool = daysAgo < 65 ? customers.slice(0, 34) : customers;
    const weighted = rand() < 0.5 ? pool.slice(0, 10) : pool;
    const customer = pick(weighted);
    const lineCount = between(1, 3);
    const items = Array.from({ length: lineCount }, () => {
      const p = pick(products);
      return { productId: p.id, itemName: p.name, qty: between(1, 3), unitPrice: p.price.toNumber() };
    });
    const discount = rand() < 0.2 ? 10000 : 0;
    const shippingCost = pick([0, 9000, 12000, 15000, 18000]);
    const { subtotal, total } = calcOrderTotals(items, discount, shippingCost);
    const status = statusFor(daysAgo);
    counter++;
    await prisma.order.create({
      data: {
        storeId: store.id,
        customerId: customer.id,
        orderNumber: `INV-${String(counter).padStart(4, "0")}`,
        status,
        subtotal,
        discount,
        shippingCost,
        total,
        paymentMethod: pick(["Transfer", "Transfer", "E-wallet", "COD", "Tunai"]),
        trackingNumber: status === "shipped" || status === "done" ? `JNE${between(100000000, 999999999)}` : null,
        orderDate: new Date(now - daysAgo * DAY - between(0, 10) * 3_600_000),
        items: { create: items },
      },
    });
  }

  // Hitung ulang statistik pelanggan dari pesanan (aturan bisnis yang sama dengan aplikasi).
  for (const c of customers) {
    const orders = await prisma.order.findMany({ where: { customerId: c.id }, select: { status: true, total: true, orderDate: true } });
    const stats = computeCustomerStats(orders.map((o) => ({ ...o, total: o.total.toNumber() })));
    await prisma.customer.update({ where: { id: c.id }, data: stats });
  }

  // Interaksi & tugas.
  const interactionSamples = [
    { type: "whatsapp", content: "Tanya stok Kopi Gayo, sudah dikirim katalog." },
    { type: "call", content: "Konfirmasi alamat pengiriman kantor." },
    { type: "complaint", content: "Paket datang agak penyok. Diberi voucher 10% untuk pesanan berikutnya." },
    { type: "meeting", content: "Ketemu di bazar, tertarik paket hampers untuk lebaran." },
    { type: "note", content: "Prefer gilingan kasar untuk french press." },
  ] as const;
  for (const c of customers.slice(0, 20)) {
    const s = pick(interactionSamples);
    await prisma.interaction.create({
      data: { customerId: c.id, userId: pick([owner.id, staff.id]), type: s.type, content: s.content, createdAt: new Date(now - between(1, 40) * DAY) },
    });
  }
  const taskSamples: [string, number][] = [
    ["Tawarkan stok Toraja baru", -2],
    ["Follow-up penawaran hampers kantor", -1],
    ["Minta ulasan", 0],
    ["Konfirmasi pembayaran", 0],
    ["Kirim katalog reseller", 0],
    ["Tanya kepuasan French Press", 2],
    ["Ingatkan langganan bulanan", 5],
  ];
  for (const [i, [title, offset]] of taskSamples.entries()) {
    await prisma.task.create({
      data: {
        storeId: store.id,
        customerId: customers[i + 4].id,
        assignedTo: owner.id,
        title,
        dueDate: new Date(+today + offset * DAY),
        autoGenerated: title === "Minta ulasan",
      },
    });
  }

  console.log(`Seed selesai: ${customers.length} pelanggan, ${products.length} produk, ${counter} pesanan.`);
  console.log("Masuk dengan demo@tokoku.id / demo12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
