import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { makeStore, randomPhone } from "@/test/factory";
import { createCustomerForStore } from "@/features/customers/service";
import { completeTask, createTaskForStore, getToday } from "./service";
import { getTimeline, logInteraction } from "@/features/interactions/service";
import { addDays, jakartaToday } from "@/lib/utils";

const DAY = 86_400_000;

describe("Hari Ini", () => {
  it("mengelompokkan tugas terlambat, hari ini, ulang tahun, dan tidak aktif", async () => {
    const s = await makeStore();
    const now = new Date();
    const today = jakartaToday(now);
    const ani = await createCustomerForStore(s.storeId, { name: "Ani", phone: randomPhone() });
    await createTaskForStore(s.storeId, { title: "Kemarin", dueDate: addDays(today, -1), customerId: ani.id });
    await createTaskForStore(s.storeId, { title: "Sekarang", dueDate: today, customerId: ani.id });
    await createTaskForStore(s.storeId, { title: "Besok", dueDate: addDays(today, 1) });

    const bday = await createCustomerForStore(s.storeId, {
      name: "Ultah",
      phone: randomPhone(),
      birthday: `1995-${today.toISOString().slice(5, 10)}`,
    });
    const old = await createCustomerForStore(s.storeId, { name: "Lama", phone: randomPhone() });
    await prisma.customer.update({
      where: { id: old.id },
      data: { orderCount: 2, lastOrderAt: new Date(+now - 70 * DAY), createdAt: new Date(+now - 200 * DAY) },
    });

    const t = await getToday(s.storeId, now, 60);
    expect(t.overdue.map((x) => x.title)).toEqual(["Kemarin"]);
    expect(t.dueToday.map((x) => x.title)).toEqual(["Sekarang"]);
    expect(t.birthdays.map((x) => x.id)).toEqual([bday.id]);
    expect(t.inactive.map((x) => x.id)).toEqual([old.id]);
  });

  it("menyelesaikan tugas dengan catatan mencatat interaksi di timeline", async () => {
    const s = await makeStore();
    const ani = await createCustomerForStore(s.storeId, { name: "Ani", phone: randomPhone() });
    const task = await createTaskForStore(s.storeId, { title: "Tanya kabar", dueDate: jakartaToday(), customerId: ani.id });
    await completeTask(s.storeId, task.id, { note: "Sudah dihubungi, mau order minggu depan", userId: s.userId });
    const done = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
    expect(done.isDone).toBe(true);
    await logInteraction(s.storeId, ani.id, { type: "complaint", content: "Paket penyok", userId: s.userId });
    const timeline = await getTimeline(s.storeId, ani.id);
    expect(timeline.map((e) => e.kind)).toEqual(["interaction", "interaction"]);
    expect(timeline[0].kind === "interaction" && timeline[0].type).toBe("complaint");
  });

  it("tidak bisa menyelesaikan tugas toko lain", async () => {
    const a = await makeStore();
    const b = await makeStore();
    const task = await createTaskForStore(a.storeId, { title: "X", dueDate: jakartaToday() });
    await expect(completeTask(b.storeId, task.id, { userId: b.userId })).rejects.toThrow();
  });
});
