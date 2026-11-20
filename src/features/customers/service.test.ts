import { describe, expect, it } from "vitest";
import { makeStore, randomPhone } from "@/test/factory";
import {
  createCustomerForStore,
  DuplicatePhoneError,
  getCustomerForStore,
  listCustomers,
  setCustomerTags,
  softDeleteCustomer,
} from "./service";

describe("layanan pelanggan", () => {
  it("toko lain tidak bisa melihat pelanggan toko ini", async () => {
    const a = await makeStore("A");
    const b = await makeStore("B");
    const c = await createCustomerForStore(a.storeId, { name: "Ani", phone: randomPhone() });
    expect(await getCustomerForStore(a.storeId, c.id)).not.toBeNull();
    expect(await getCustomerForStore(b.storeId, c.id)).toBeNull();
  });

  it("menolak nomor ganda dalam satu toko (format berbeda tetap terdeteksi)", async () => {
    const a = await makeStore();
    const phone = randomPhone(); // 0812...
    const first = await createCustomerForStore(a.storeId, { name: "Ani", phone });
    const asIntl = "+62 " + phone.slice(1);
    await expect(createCustomerForStore(a.storeId, { name: "Budi", phone: asIntl })).rejects.toBeInstanceOf(
      DuplicatePhoneError,
    );
    try {
      await createCustomerForStore(a.storeId, { name: "Budi", phone: asIntl });
    } catch (e) {
      expect((e as DuplicatePhoneError).existing.id).toBe(first.id);
    }
  });

  it("nomor yang sama boleh dipakai di toko berbeda", async () => {
    const a = await makeStore();
    const b = await makeStore();
    const phone = randomPhone();
    await createCustomerForStore(a.storeId, { name: "Ani", phone });
    await expect(createCustomerForStore(b.storeId, { name: "Ani", phone })).resolves.toBeTruthy();
  });

  it("hapus bersifat soft delete dan menyembunyikan dari daftar", async () => {
    const a = await makeStore();
    const c = await createCustomerForStore(a.storeId, { name: "Ani", phone: randomPhone() });
    await softDeleteCustomer(a.storeId, c.id);
    expect(await getCustomerForStore(a.storeId, c.id)).toBeNull();
    const list = await listCustomers(a.storeId, {}, 60);
    expect(list.items.find((x) => x.id === c.id)).toBeUndefined();
  });

  it("menambah pelanggan dengan nomor milik pelanggan terhapus akan memulihkannya", async () => {
    const a = await makeStore();
    const phone = randomPhone();
    const c = await createCustomerForStore(a.storeId, { name: "Ani", phone });
    await softDeleteCustomer(a.storeId, c.id);
    const again = await createCustomerForStore(a.storeId, { name: "Ani Baru", phone });
    expect(again.id).toBe(c.id);
    expect(again.name).toBe("Ani Baru");
  });

  it("mencari berdasarkan nama atau nomor, dan filter tag", async () => {
    const a = await makeStore();
    const phone = randomPhone();
    const ani = await createCustomerForStore(a.storeId, { name: "Ani Wijaya", phone });
    await createCustomerForStore(a.storeId, { name: "Budi", phone: randomPhone() });
    await setCustomerTags(a.storeId, ani.id, ["VIP"]);
    expect((await listCustomers(a.storeId, { q: "wija" }, 60)).items.map((c) => c.name)).toEqual(["Ani Wijaya"]);
    expect((await listCustomers(a.storeId, { q: phone }, 60)).items.map((c) => c.name)).toEqual(["Ani Wijaya"]);
    const tagId = (await listCustomers(a.storeId, {}, 60)).items.find((c) => c.id === ani.id)!.tags[0].tag.id;
    expect((await listCustomers(a.storeId, { tagId }, 60)).total).toBe(1);
  });
});
