import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    storeId: string;
    role: "owner" | "admin" | "staff";
  }
  interface Session {
    user: { id: string; storeId: string; role: "owner" | "admin" | "staff" } & DefaultSession["user"];
  }
}
