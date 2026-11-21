import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { makeStore } from "@/test/factory";
import { loadActiveUser } from "./session-user";

describe("sesi mengikuti data terbaru", () => {
  it("peran diambil dari database, anggota yang dihapus ditolak", async () => {
    const s = await makeStore();
    const staff = await prisma.user.create({
      data: { storeId: s.storeId, name: "Staf", email: `staf-${s.storeId}@test.local`, passwordHash: "x", role: "admin" },
    });
    await prisma.user.update({ where: { id: staff.id }, data: { role: "staff" } });
    expect((await loadActiveUser(staff.id))?.role).toBe("staff");
    await prisma.user.delete({ where: { id: staff.id } });
    expect(await loadActiveUser(staff.id)).toBeNull();
  });
});
