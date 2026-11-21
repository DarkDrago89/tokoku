"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireSession } from "@/lib/session";
import { zodFieldErrors, type FormState } from "@/lib/utils";
import { archiveProductForStore, createProductForStore, listProducts, updateProductForStore } from "./service";
import { num } from "@/lib/utils";

export async function saveProductAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const s = await requireSession();
  const id = String(formData.get("id") ?? "");
  const input = {
    name: String(formData.get("name") ?? ""),
    sku: String(formData.get("sku") ?? ""),
    price: String(formData.get("price") ?? "").replace(/\D/g, ""),
    category: String(formData.get("category") ?? ""),
    stock: String(formData.get("stock") ?? ""),
    repurchaseDays: String(formData.get("repurchaseDays") ?? ""),
  };
  try {
    if (id) await updateProductForStore(s.storeId, id, input);
    else await createProductForStore(s.storeId, input);
  } catch (e) {
    if (e instanceof ZodError) return { fieldErrors: zodFieldErrors(e.issues) };
    throw e;
  }
  revalidatePath("/produk");
  return { ok: true, message: id ? "Produk diperbarui" : "Produk ditambahkan" };
}

export async function archiveProductAction(id: string) {
  const s = await requireSession();
  await archiveProductForStore(s.storeId, id);
  revalidatePath("/produk");
}

export async function searchProductsAction(q: string) {
  const s = await requireSession();
  const rows = await listProducts(s.storeId, q);
  return rows.slice(0, 20).map((p) => ({ id: p.id, name: p.name, price: num(p.price), stock: p.stock }));
}
