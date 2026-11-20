import type { NextAuthConfig } from "next-auth";

const PUBLIC_PATHS = ["/masuk", "/daftar"];

/** Konfigurasi ringan (tanpa database) agar bisa dipakai middleware di Edge runtime. */
export const authConfig = {
  pages: { signIn: "/masuk" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isPublic = PUBLIC_PATHS.some((p) => request.nextUrl.pathname.startsWith(p));
      if (isPublic) {
        if (auth?.user) return Response.redirect(new URL("/hari-ini", request.nextUrl));
        return true;
      }
      return !!auth?.user;
    },
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id!;
        token.storeId = user.storeId;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.userId as string;
      session.user.storeId = token.storeId as string;
      session.user.role = token.role as "owner" | "admin" | "staff";
      return session;
    },
  },
} satisfies NextAuthConfig;
