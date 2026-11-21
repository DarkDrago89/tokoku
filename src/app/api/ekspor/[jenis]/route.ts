import { auth } from "@/auth";
import { loadActiveUser } from "@/lib/session-user";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { toCsv } from "@/features/csv/analyze";
import { formatDate } from "@/lib/domain/format";
import { ORDER_STATUS_LABEL } from "@/lib/domain/order";
import { num } from "@/lib/utils";

const CONTOH_HEADERS = ["Nama", "Nomor WhatsApp", "Email", "Kota", "Alamat", "Tanggal Lahir", "Sumber", "Catatan"];

/** GET /api/ekspor/pelanggan | pesanan | contoh → unduh CSV. */
export async function GET(_req: Request, { params }: { params: Promise<{ jenis: string }> }) {
  const { jenis } = await params;

  if (jenis === "contoh") {
    const csv = toCsv(
      [
        { Nama: "Ani Wijaya", "Nomor WhatsApp": "0812-3456-7890", Kota: "Bandung", "Tanggal Lahir": "17/08/1995", Sumber: "Instagram" },
        { Nama: "Budi Santoso", "Nomor WhatsApp": "+62 813 1111 2222", Kota: "Surabaya", Sumber: "WhatsApp", Catatan: "Reseller" },
      ],
      CONTOH_HEADERS,
    );
    return file(csv, "contoh-impor-pelanggan.csv");
  }

  const session = await auth();
  const user = session?.user?.id ? await loadActiveUser(session.user.id) : null;
  if (!user) return new Response("Silakan masuk dulu.", { status: 401 });
  if (!can(user.role, "data.export")) return new Response("Anda tidak punya akses ekspor.", { status: 403 });
  const storeId = user.storeId;
  const stamp = new Date().toISOString().slice(0, 10);

  if (jenis === "pelanggan") {
    const rows = await prisma.customer.findMany({
      where: { storeId, deletedAt: null },
      orderBy: { name: "asc" },
      include: { tags: { include: { tag: true } } },
    });
    const headers = [...CONTOH_HEADERS, "Tag", "Total Belanja", "Jumlah Pesanan", "Terakhir Beli", "Dicatat"];
    const csv = toCsv(
      rows.map((c) => ({
        Nama: c.name,
        "Nomor WhatsApp": `+${c.phone}`,
        Email: c.email,
        Kota: c.city,
        Alamat: c.address,
        "Tanggal Lahir": c.birthday ? formatDate(c.birthday) : "",
        Sumber: c.source,
        Catatan: c.notes,
        Tag: c.tags.map((t) => t.tag.name).join(", "),
        "Total Belanja": num(c.totalSpent),
        "Jumlah Pesanan": c.orderCount,
        "Terakhir Beli": c.lastOrderAt ? formatDate(c.lastOrderAt) : "",
        Dicatat: formatDate(c.createdAt),
      })),
      headers,
    );
    return file(csv, `pelanggan-${stamp}.csv`);
  }

  if (jenis === "pesanan") {
    const rows = await prisma.order.findMany({
      where: { storeId },
      orderBy: { orderDate: "desc" },
      include: { customer: { select: { name: true, phone: true } }, items: true },
    });
    const headers = ["Nomor", "Tanggal", "Pelanggan", "Nomor WhatsApp", "Barang", "Subtotal", "Diskon", "Ongkir", "Total", "Status", "Pembayaran", "Resi", "Catatan"];
    const csv = toCsv(
      rows.map((o) => ({
        Nomor: o.orderNumber,
        Tanggal: formatDate(o.orderDate),
        Pelanggan: o.customer.name,
        "Nomor WhatsApp": `+${o.customer.phone}`,
        Barang: o.items.map((i) => `${i.itemName} x${i.qty}`).join("; "),
        Subtotal: num(o.subtotal),
        Diskon: num(o.discount),
        Ongkir: num(o.shippingCost),
        Total: num(o.total),
        Status: ORDER_STATUS_LABEL[o.status],
        Pembayaran: o.paymentMethod,
        Resi: o.trackingNumber,
        Catatan: o.notes,
      })),
      headers,
    );
    return file(csv, `pesanan-${stamp}.csv`);
  }

  return new Response("Jenis ekspor tidak dikenal.", { status: 404 });
}

function file(csv: string, name: string) {
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"` },
  });
}
