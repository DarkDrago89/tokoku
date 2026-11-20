# Desain: TokoKu CRM (MVP)

Tanggal: 21/11/2026 · Sumber kebutuhan: "Dokumen Perangkat Lunak CRM untuk UMKM dan Toko Online" v1.0

## 1. Tujuan dan alasan
- Dipakai sungguhan oleh pemilik (toko sendiri) untuk mencatat pelanggan, pesanan, dan follow-up lewat WhatsApp.
- Menjadi proyek portofolio di GitHub: kode rapi, README jelas (fitur, tangkapan layar, arsitektur, cara instal, akun demo).

## 2. Sasaran (MVP, sesuai bagian 10.2 dokumen)
1. Daftar, masuk, keluar (email + kata sandi). Pendaftaran membuat toko baru; pendaftar = Pemilik.
2. Pelanggan: tambah, ubah, hapus (soft delete), cari nama/nomor, filter tag/kota/sumber/status, tag manual, deteksi nomor ganda, detail + timeline.
3. Pesanan sederhana: item manual atau dari produk, qty, harga, diskon, ongkir, metode bayar, resi, status (Menunggu Bayar → Dibayar → Dikemas → Dikirim → Selesai / Batal), daftar dengan filter status & tanggal, pesan ulang cepat.
4. Produk sederhana (nama, SKU, harga, kategori, stok opsional) untuk dipilih di pesanan.
5. Interaksi (chat, telepon, tatap muka, keluhan, catatan) dan timeline gabungan pesanan + interaksi.
6. Tugas follow-up + halaman **Hari Ini** (jatuh tempo, terlambat, ulang tahun hari ini, pelanggan tidak aktif).
7. Tombol WhatsApp (wa.me) + template pesan dengan variabel `{nama} {produk} {total} {resi}`, peringatan jika variabel kosong, interaksi otomatis tercatat.
8. Dashboard minimal: omzet, jumlah pesanan, pelanggan baru, rata-rata nilai pesanan (periode: 7/30 hari, bulan ini).
9. Anggota tim dengan peran Pemilik/Admin/Staf sesuai matriks hak akses dokumen.
10. Seed data demo + akun demo untuk portofolio.
11. Impor pelanggan dari CSV (pratinjau, pemetaan kolom, tandai nomor ganda/tidak valid, laporan hasil) dan ekspor pelanggan & pesanan ke CSV (Pemilik/Admin saja).

## 3. Bukan sasaran (tahap ini)
Reset kata sandi via email, notifikasi email/browser, segmen, grafik lengkap, invoice PDF, gabung pelanggan ganda, WhatsApp Business API, integrasi marketplace, aplikasi native. Dicatat sebagai roadmap di README.

## 4. Anti-sasaran
- Rumit dipakai: menambah pelanggan/pesanan > 3 langkah atau > 30 detik dianggap gagal.
- Data satu toko terlihat oleh toko lain.
- Istilah teknis/Inggris di antarmuka.

## 5. Batasan
Bahasa Indonesia, format dd/mm/yyyy dan Rp, mobile first (≥360 px), tombol nyaman disentuh, hosting gratis (Vercel + Neon), kata sandi di-hash, isolasi per `storeId` di setiap query.

## 6. Pendekatan
| Opsi | Trade-off |
|---|---|
| A. Next.js + data di browser | Cepat & demo mudah, tapi data hilang/terkunci di satu perangkat; tidak multi-user |
| **B. Next.js full-stack + PostgreSQL (dipilih)** | Aman dipakai sungguhan, multi-perangkat & multi-user, satu repo + satu link demo; setup lebih banyak |
| C. Laravel + PostgreSQL | Matang, tapi deploy gratis lebih repot / dua proyek |

Dipilih B oleh pemilik karena memenuhi dua tujuan sekaligus.

## 7. Keputusan teknis (keputusan saya, dapat dikoreksi)
- Next.js (App Router) + TypeScript + Tailwind CSS; komponen UI sendiri yang ringan (ikon: lucide-react).
- Prisma + PostgreSQL (lokal via Docker atau Neon). Skema mengikuti bagian 6 dokumen.
- Auth.js (Credentials) + bcrypt; sesi JWT berisi `userId`, `storeId`, `role`.
- Mutasi lewat Server Actions; validasi Zod. Endpoint REST dokumen tidak dibuat terpisah (Server Actions cukup untuk satu klien web); dicatat di README.
- Aturan bisnis di modul murni yang diuji unit (Vitest): normalisasi nomor (0812→62812, +62→62), hitung total pesanan, status pelanggan (Baru/Aktif/Tidak Aktif, bawaan 60 hari), render template + deteksi variabel kosong.
- Statistik pelanggan (`totalSpent`, `orderCount`, `lastOrderAt`) dihitung ulang dari pesanan berstatus Selesai setiap kali status pesanan berubah (memenuhi aturan pembatalan mengurangi total).
- Pesanan Selesai → tugas otomatis "Minta ulasan" 3 hari kemudian (tanpa cron; dibuat saat status diubah). Ulang tahun & tidak aktif dihitung saat halaman Hari Ini dibuka.
- Nomor pesanan per toko: `INV-0001` dst.
- Navigasi ponsel: bilah bawah Hari Ini · Pelanggan · (+) · Pesanan · Lainnya; desktop: sidebar. Tombol (+) membuka lembar aksi cepat.
- PWA dasar (manifest + ikon) agar bisa dipasang.

## 8. Diserahkan ke pembangun
Detail visual dalam arahan pemilik: **latar putih, aksen monokrom** (hitam/abu, tanpa warna merek; warna hanya untuk status semantik seperti terlambat/berhasil, dibuat redup), tipografi, struktur folder, paginasi, susunan tes tambahan.
