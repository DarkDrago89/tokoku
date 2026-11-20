import { describe, expect, it } from "vitest";
import { can } from "./permissions";

describe("hak akses peran", () => {
  const actions = ["customer.delete", "report.view", "data.export", "settings.manage"] as const;
  it("staf tidak boleh hapus, laporan, ekspor, pengaturan", () => {
    for (const a of actions) expect(can("staff", a)).toBe(false);
  });
  it("admin boleh semua kecuali pengaturan", () => {
    expect(can("admin", "customer.delete")).toBe(true);
    expect(can("admin", "report.view")).toBe(true);
    expect(can("admin", "data.export")).toBe(true);
    expect(can("admin", "settings.manage")).toBe(false);
  });
  it("pemilik boleh semua", () => {
    for (const a of actions) expect(can("owner", a)).toBe(true);
  });
});
