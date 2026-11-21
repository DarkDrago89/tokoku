import { signOut } from "@/auth";

/** Menghapus sesi lalu kembali ke halaman masuk (dipakai saat akun sudah tidak aktif). */
export async function GET() {
  await signOut({ redirectTo: "/masuk" });
}
