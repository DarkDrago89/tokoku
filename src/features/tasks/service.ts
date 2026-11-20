import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jakartaToday } from "@/lib/utils";
import { NotFoundError, statusWhere } from "@/features/customers/service";

export const taskInputSchema = z.object({
  title: z.string().trim().min(1, "Judul tugas wajib diisi").max(200),
  dueDate: z.coerce.date({ message: "Tanggal tidak valid" }),
  customerId: z.string().uuid().nullish(),
  notes: z.string().trim().nullish(),
  assignedTo: z.string().uuid().nullish(),
});

export type TaskInput = z.input<typeof taskInputSchema>;

export async function createTaskForStore(storeId: string, input: TaskInput) {
  const data = taskInputSchema.parse(input);
  if (data.customerId) {
    const c = await prisma.customer.findFirst({ where: { id: data.customerId, storeId, deletedAt: null }, select: { id: true } });
    if (!c) throw new NotFoundError();
  }
  return prisma.task.create({
    data: {
      storeId,
      title: data.title,
      dueDate: data.dueDate,
      customerId: data.customerId || null,
      notes: data.notes || null,
      assignedTo: data.assignedTo || null,
    },
  });
}

/** Tandai tugas selesai; catatan opsional disimpan sebagai interaksi pelanggan. */
export async function completeTask(storeId: string, taskId: string, opts: { note?: string; userId: string }) {
  const task = await prisma.task.findFirst({ where: { id: taskId, storeId } });
  if (!task) throw new NotFoundError();
  await prisma.$transaction(async (tx) => {
    await tx.task.update({ where: { id: taskId }, data: { isDone: true } });
    const note = opts.note?.trim();
    if (note && task.customerId) {
      await tx.interaction.create({
        data: { customerId: task.customerId, userId: opts.userId, type: "note", content: `${task.title}: ${note}` },
      });
    }
  });
}

export async function reopenTask(storeId: string, taskId: string) {
  const res = await prisma.task.updateMany({ where: { id: taskId, storeId }, data: { isDone: false } });
  if (!res.count) throw new NotFoundError();
}

const taskInclude = { customer: { select: { id: true, name: true, phone: true } } } satisfies Prisma.TaskInclude;
export type TaskWithCustomer = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

export type BirthdayCustomer = { id: string; name: string; phone: string; birthday: Date };

/** Isi halaman "Hari Ini" (F-INT-04, F-INT-06). */
export async function getToday(storeId: string, now: Date, inactiveDays: number) {
  const today = jakartaToday(now);
  const month = today.getUTCMonth() + 1;
  const day = today.getUTCDate();

  const [overdue, dueToday, birthdays, inactive] = await Promise.all([
    prisma.task.findMany({
      where: { storeId, isDone: false, dueDate: { lt: today }, OR: [{ customerId: null }, { customer: { deletedAt: null } }] },
      orderBy: { dueDate: "asc" },
      include: taskInclude,
    }),
    prisma.task.findMany({
      where: { storeId, isDone: false, dueDate: today, OR: [{ customerId: null }, { customer: { deletedAt: null } }] },
      orderBy: { createdAt: "asc" },
      include: taskInclude,
    }),
    prisma.$queryRaw<BirthdayCustomer[]>`
      SELECT id, name, phone, birthday FROM customers
      WHERE store_id = ${storeId}::uuid AND deleted_at IS NULL AND birthday IS NOT NULL
        AND EXTRACT(MONTH FROM birthday) = ${month} AND EXTRACT(DAY FROM birthday) = ${day}
      ORDER BY name`,
    prisma.customer.findMany({
      where: { storeId, deletedAt: null, orderCount: { gt: 0 }, ...statusWhere("tidak_aktif", now, inactiveDays) },
      orderBy: { lastOrderAt: "asc" },
      take: 10,
      select: { id: true, name: true, phone: true, lastOrderAt: true, totalSpent: true },
    }),
  ]);
  return { today, overdue, dueToday, birthdays, inactive };
}

export async function listOpenTasksForCustomer(storeId: string, customerId: string) {
  return prisma.task.findMany({
    where: { storeId, customerId, isDone: false },
    orderBy: { dueDate: "asc" },
  });
}
