import { prisma } from "@/lib/db";

/** Membuat toko + pemilik baru untuk satu tes. Setiap tes memakai toko sendiri, jadi tidak saling bentrok. */
export async function makeStore(name = "Toko Tes") {
  const store = await prisma.store.create({ data: { name, settings: { inactiveDays: 60 } } });
  const user = await prisma.user.create({
    data: {
      storeId: store.id,
      name: "Pemilik",
      email: `owner-${store.id}@test.local`,
      passwordHash: "x",
      role: "owner",
    },
  });
  return { store, user, storeId: store.id, userId: user.id };
}

let phoneSeq = 0;
/** Nomor unik acak agar tes bisa diulang tanpa reset database. */
export function randomPhone() {
  phoneSeq++;
  return "0812" + String(Date.now() % 1e6).padStart(6, "0") + String(phoneSeq).padStart(2, "0");
}
