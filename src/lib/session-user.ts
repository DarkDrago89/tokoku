import { prisma } from "./db";

/**
 * Data pengguna terbaru dari database. Sesi JWT hanya menyimpan userId saat login, jadi peran dan
 * keanggotaan dicek ulang di setiap request: anggota yang dihapus atau diturunkan perannya langsung terdampak.
 */
export async function loadActiveUser(userId: string) {
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, storeId: true, role: true, name: true },
  });
}
