import type { InteractionType, OrderStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { num } from "@/lib/utils";
import { NotFoundError } from "@/features/customers/service";

export const INTERACTION_LABEL: Record<InteractionType, string> = {
  whatsapp: "WhatsApp",
  call: "Telepon",
  meeting: "Tatap muka",
  complaint: "Keluhan",
  note: "Catatan",
};

export const interactionInputSchema = z.object({
  type: z.enum(["whatsapp", "call", "meeting", "complaint", "note"]),
  content: z.string().trim().min(1, "Isi catatan wajib diisi").max(2000),
});

export async function logInteraction(
  storeId: string,
  customerId: string,
  input: { type: InteractionType; content: string; userId: string },
) {
  const data = interactionInputSchema.parse(input);
  const customer = await prisma.customer.findFirst({ where: { id: customerId, storeId, deletedAt: null }, select: { id: true } });
  if (!customer) throw new NotFoundError();
  return prisma.interaction.create({ data: { ...data, customerId, userId: input.userId } });
}

export type TimelineEntry =
  | { kind: "interaction"; id: string; at: Date; type: InteractionType; content: string; by: string | null }
  | { kind: "order"; id: string; at: Date; orderNumber: string; status: OrderStatus; total: number; itemCount: number };

/** Gabungan pesanan dan interaksi, terbaru di atas (F-INT-02). */
export async function getTimeline(storeId: string, customerId: string, limit = 50): Promise<TimelineEntry[]> {
  const [interactions, orders] = await Promise.all([
    prisma.interaction.findMany({
      where: { customerId, customer: { storeId } },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { name: true } } },
    }),
    prisma.order.findMany({
      where: { customerId, storeId },
      orderBy: { orderDate: "desc" },
      take: limit,
      include: { _count: { select: { items: true } } },
    }),
  ]);
  const entries: TimelineEntry[] = [
    ...interactions.map((i) => ({
      kind: "interaction" as const,
      id: i.id,
      at: i.createdAt,
      type: i.type,
      content: i.content,
      by: i.user?.name ?? null,
    })),
    ...orders.map((o) => ({
      kind: "order" as const,
      id: o.id,
      at: o.orderDate,
      orderNumber: o.orderNumber,
      status: o.status,
      total: num(o.total),
      itemCount: o._count.items,
    })),
  ];
  return entries.sort((a, b) => +b.at - +a.at).slice(0, limit);
}
