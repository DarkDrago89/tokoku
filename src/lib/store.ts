import { cache } from "react";
import { prisma } from "./db";
import { readSettings } from "./utils";

/** Pengaturan toko (di-cache per request). */
export const getStoreSettings = cache(async (storeId: string) => {
  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { settings: true } });
  return readSettings(store?.settings);
});

export const getTemplates = cache(async (storeId: string) =>
  prisma.messageTemplate.findMany({
    where: { storeId },
    orderBy: { title: "asc" },
    select: { id: true, title: true, category: true, body: true },
  }),
);
