import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Role } from "./permissions";
import { loadActiveUser } from "./session-user";

export type SessionUser = { userId: string; storeId: string; role: Role; name: string };

/**
 * Ambil pengguna yang sedang masuk; arahkan ke /masuk jika belum masuk atau akunnya sudah dihapus.
 * Peran & toko dibaca dari database (bukan dari token) agar perubahan oleh pemilik langsung berlaku.
 */
export const requireSession = cache(async (): Promise<SessionUser> => {
  const session = await auth();
  const user = session?.user?.id ? await loadActiveUser(session.user.id) : null;
  if (!user) redirect("/api/keluar");
  return { userId: user.id, storeId: user.storeId, role: user.role, name: user.name };
});
