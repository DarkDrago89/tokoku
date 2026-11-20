import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Role } from "./permissions";

export type SessionUser = { userId: string; storeId: string; role: Role; name: string };

/** Ambil pengguna yang sedang masuk; arahkan ke /masuk jika belum. */
export async function requireSession(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/masuk");
  return {
    userId: session.user.id,
    storeId: session.user.storeId,
    role: session.user.role,
    name: session.user.name ?? "",
  };
}
