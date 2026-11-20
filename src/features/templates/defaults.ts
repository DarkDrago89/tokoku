export const TEMPLATE_CATEGORIES = [
  "Terima kasih",
  "Konfirmasi pesanan",
  "Info resi",
  "Promo",
  "Pengingat",
  "Ulang tahun",
] as const;

/** Template bawaan yang dipasang saat toko baru mendaftar. */
export const DEFAULT_TEMPLATES: { title: string; category: string; body: string }[] = [
  {
    title: "Konfirmasi pesanan",
    category: "Konfirmasi pesanan",
    body: "Halo Kak {nama} 👋\nPesanan Kakak sudah kami catat:\n{produk}\n\nTotal: {total}\nSilakan lakukan pembayaran, lalu kirim bukti transfer ke sini ya. Terima kasih 🙏",
  },
  {
    title: "Info resi",
    category: "Info resi",
    body: "Halo Kak {nama}, pesanan Kakak sudah dikirim 📦\nNomor resi: {resi}\nTerima kasih sudah belanja di toko kami!",
  },
  {
    title: "Terima kasih",
    category: "Terima kasih",
    body: "Terima kasih Kak {nama} sudah belanja di toko kami 🙏 Semoga suka dengan produknya. Kalau berkenan, boleh minta ulasannya ya Kak 😊",
  },
  {
    title: "Pengingat belanja lagi",
    category: "Pengingat",
    body: "Halo Kak {nama}, apa kabar? 😊 Sudah lama tidak mampir nih. Stok terbaru sudah datang, mau kami kirimkan katalognya?",
  },
  {
    title: "Promo pelanggan setia",
    category: "Promo",
    body: "Halo Kak {nama}! Khusus pelanggan setia, ada diskon 10% untuk pembelian minggu ini 🎉 Balas chat ini untuk pesan ya.",
  },
  {
    title: "Ucapan ulang tahun",
    category: "Ulang tahun",
    body: "Selamat ulang tahun Kak {nama}! 🎂 Semoga sehat dan bahagia selalu. Ada hadiah kecil dari kami: diskon 15% untuk pesanan berikutnya 🎁",
  },
];
