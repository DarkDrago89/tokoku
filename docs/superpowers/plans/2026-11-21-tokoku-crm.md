# TokoKu CRM (MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CRM web mobile-first berbahasa Indonesia untuk UMKM: pelanggan, pesanan, produk, interaksi, tugas "Hari Ini", template WhatsApp, dashboard, impor/ekspor CSV, tim dengan peran.

**Architecture:** Satu proyek Next.js (App Router) full-stack. Halaman = Server Components yang membaca via Prisma; mutasi = Server Actions tervalidasi Zod. Semua query difilter `storeId` dari sesi. Aturan bisnis di `src/lib/domain/*` (fungsi murni, diuji Vitest).

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS 4, Prisma 6 + PostgreSQL, Auth.js v5 (Credentials, JWT), bcryptjs, Zod, Papaparse, lucide-react, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-21-tokoku-crm-design.md`

## Global Constraints
- Seluruh teks UI Bahasa Indonesia; tanggal `dd/mm/yyyy`; uang `Rp 1.250.000` (`Intl.NumberFormat('id-ID')`, tanpa desimal).
- Tampilan: latar putih, aksen monokrom (hitam/abu: `zinc` Tailwind). Warna hanya untuk status semantik, versi redup (mis. `red-50/red-700` untuk terlambat).
- Mobile first, nyaman pada lebar 360 px; target sentuh ≥ 44 px.
- Wajib saat tambah pelanggan hanya nama + nomor WhatsApp.
- Nomor disimpan format `62xxx`; unik per toko (`@@unique([storeId, phone])`).
- Setiap query/mutasi menyertakan `storeId` sesi; peran diperiksa di server.
- Kata sandi di-hash bcrypt (cost 10).
- Status pesanan enum: `pending, paid, packed, shipped, done, cancelled` → label: Menunggu Bayar, Dibayar, Dikemas, Dikirim, Selesai, Batal.
- Tidak Aktif bawaan 60 hari (dapat diatur di `store.settings.inactiveDays`); Baru = dibuat ≤ 30 hari dan belum ada pesanan Selesai.

## Review Focus
1. Nomor dengan spasi/strip/`+62`/`62`/`08` harus menghasilkan nomor yang sama → uji di Task 2 (`normalizePhone`).
2. Pesanan Selesai lalu diubah Batal → total belanja pelanggan turun → uji di Task 2 (`computeCustomerStats`).
3. Pengguna toko A membuka URL `/pelanggan/<id toko B>` → 404 → uji di Task 5 (helper `getCustomerForStore`).
4. CSV dengan BOM, pemisah `;`, nomor ganda di dalam file dan dengan data lama → ditandai, tidak menggagalkan seluruh impor → uji di Task 11 (`analyzeImport`).
5. Template berisi `{resi}` saat pesanan belum ada resi → peringatan sebelum WhatsApp dibuka → uji di Task 2 (`renderTemplate`).

---

### Task 1: Scaffold proyek, skema database, git

**Files:** Create: `package.json`, `prisma/schema.prisma`, `src/lib/db.ts`, `vitest.config.ts`, `.env.example`, `docker-compose.yml`, `.gitignore`, `src/app/globals.css`

**Interfaces:** Produces: `prisma` client di `src/lib/db.ts`; model Prisma: `Store, User, Customer, Tag, CustomerTag, Product, Order, OrderItem, Interaction, Task, MessageTemplate` (kolom sesuai bagian 6 dokumen kebutuhan, camelCase, `@@map` snake_case). Enum `Role {owner admin staff}`, `OrderStatus`, `InteractionType {whatsapp call meeting complaint note}`. `Order.orderNumber` unik per toko. Indeks sesuai bagian 6.3.

- [ ] `git init`; `npx create-next-app@15` (TS, Tailwind, App Router, `src/`), tambah dependensi di atas.
- [ ] Tulis skema; `docker-compose.yml` Postgres 16; `.env.example` (`DATABASE_URL`, `AUTH_SECRET`).
- [ ] Run `npx prisma migrate dev --name init` → sukses. Run `npx vitest run` → "No test files" tanpa error konfigurasi.
- [ ] Commit `chore: scaffold Next.js, Prisma schema`.

### Task 2: Aturan bisnis (domain murni)

**Files:** Create `src/lib/domain/{phone,order,customer,template,format}.ts` + `*.test.ts` berdampingan.

**Interfaces (Produces):**
- `normalizePhone(raw: string): string | null` — hasil `62` + digit, panjang 10–15; tidak valid → `null`.
- `calcOrderTotals(items: {qty:number; unitPrice:number}[], discount:number, shippingCost:number): {subtotal:number; total:number}` (total tidak negatif).
- `computeCustomerStats(orders: {status:OrderStatus; total:number; orderDate:Date}[]): {totalSpent:number; orderCount:number; lastOrderAt:Date|null}` — hanya `done`.
- `customerStatus(c:{createdAt:Date; lastOrderAt:Date|null; orderCount:number}, now:Date, inactiveDays=60): 'baru'|'aktif'|'tidak_aktif'`.
- `isLoyal(orderCount:number): boolean` (≥3).
- `renderTemplate(body:string, vars:Record<string,string|undefined>): {text:string; missing:string[]}` — variabel kosong dibiarkan `{x}` dan dicatat di `missing`.
- `waLink(phone:string, text?:string): string` → `https://wa.me/62…?text=<encoded>`.
- `formatRupiah(n:number)`, `formatDate(d:Date)` (dd/mm/yyyy, zona `Asia/Jakarta`).

- [ ] Tes: `normalizePhone('0812-3456 7890')==='6281234567890'`, `'+62 812 3456 7890'` sama, `'812345678901'` → `'62812345678901'`, `'abc'`→null, `'0812'`→null. `calcOrderTotals([{qty:2,unitPrice:50000}],10000,15000)` → `{subtotal:100000,total:105000}`. Stats dengan satu `done` 100000 + satu `cancelled` 50000 → `totalSpent 100000, orderCount 1`. Status: tanpa pesanan dibuat 10 hari lalu → `baru`; pesanan terakhir 61 hari → `tidak_aktif`; 59 hari → `aktif`. `renderTemplate('Halo {nama}, resi {resi}',{nama:'Ani'})` → `missing:['resi']`. `formatRupiah(1250000)==='Rp 1.250.000'` (normalisasi NBSP). `formatDate(new Date('2026-11-21T20:00:00Z'))==='22/11/2026'`.
- [ ] Run `npx vitest run src/lib/domain` → FAIL; implementasi; → PASS.
- [ ] Commit `feat: domain rules`.

### Task 3: Autentikasi, toko, peran

**Files:** Create `src/auth.ts`, `src/middleware.ts`, `src/lib/session.ts`, `src/lib/permissions.ts` (+test), `src/app/(auth)/masuk/page.tsx`, `src/app/(auth)/daftar/page.tsx`, `src/app/(auth)/actions.ts`

**Interfaces (Produces):**
- `requireSession(): Promise<{userId:string; storeId:string; role:Role; name:string}>` (redirect `/masuk` jika tidak ada).
- `can(role:Role, action:'customer.delete'|'report.view'|'data.export'|'settings.manage'): boolean` mengikuti matriks dokumen 3.1.
- `assertCan(role, action)` melempar error "Anda tidak punya akses".
- Daftar: nama, nama toko, email, kata sandi (≥8) → buat Store + User owner + template bawaan (Task 9 menyediakan `DEFAULT_TEMPLATES`; sampai Task 9, array kosong) → masuk otomatis.

- [ ] Tes `can`: staff tidak bisa `customer.delete/report.view/data.export/settings.manage`; admin bisa semua kecuali `settings.manage`; owner semua.
- [ ] Implementasi, halaman masuk/daftar (pesan galat Indonesia, "Email atau kata sandi salah"); middleware melindungi semua rute selain `/masuk`, `/daftar`.
- [ ] Manual: daftar → diarahkan ke `/hari-ini`; keluar → `/masuk`. Commit.

### Task 4: Kerangka UI & komponen

**Files:** Create `src/components/ui/{Button,Input,Select,Textarea,Card,Badge,Sheet,EmptyState,PageHeader,Toast}.tsx`, `src/components/shell/{BottomNav,Sidebar,QuickAddSheet}.tsx`, `src/app/(app)/layout.tsx`, `src/app/(app)/lainnya/page.tsx`

**Interfaces (Produces):** `Button` varian `primary` (hitam, teks putih) | `secondary` (border zinc) | `ghost` | `danger`; `PageHeader({title, action?})`; `Sheet({open,onClose,title,children})` (bottom sheet di ponsel, dialog di desktop); `Badge({tone:'neutral'|'success'|'warning'|'danger'})`.
- Ponsel: bilah bawah Hari Ini · Pelanggan · (+) · Pesanan · Lainnya. ≥1024 px: sidebar kiri. (+) → lembar: Pelanggan baru, Pesanan baru, Catatan, Tugas. "Lainnya": Dashboard, Produk, Template Pesan, Impor/Ekspor, Pengaturan, Keluar (item disembunyikan sesuai `can`).
- [ ] Implementasi; cek manual di 360 px dan 1280 px: tidak ada scroll horizontal. Commit.

### Task 5: Pelanggan

**Files:** Create `src/app/(app)/pelanggan/{page,baru/page,[id]/page,[id]/ubah/page}.tsx`, `src/features/customers/{queries,actions,schema}.ts`, `src/features/customers/CustomerForm.tsx`, `queries.test.ts`

**Interfaces (Produces):** `getCustomerForStore(storeId, id)` → pelanggan atau `null` (abaikan `deletedAt`); `listCustomers(storeId, {q?, tagId?, city?, source?, status?, page})` (q cocok nama `ilike` atau nomor ter-normalisasi, 20/hal.); actions `createCustomer`, `updateCustomer`, `deleteCustomer` (soft, perlu `customer.delete`), `setCustomerTags`, `createTag`; `findDuplicate(storeId, phone)`.
- Sumber: Instagram, WhatsApp, Tokopedia, Shopee, Offline, Lainnya.
- Form: nama + WhatsApp di atas, sisanya di "Detail tambahan" (terlipat). Saat nomor diisi (debounce) tampilkan "Nomor ini sudah dipakai oleh <nama>" + tautan.
- Detail: nama, status badge, tombol utama **Chat WhatsApp**, statistik (total belanja, jumlah pesanan, terakhir beli), tag, lalu tab Timeline / Tugas (diisi Task 8).
- [ ] Tes integrasi (DB tes, `DATABASE_URL` tes): `getCustomerForStore(storeB, customerA.id)` → null; `createCustomer` dua kali nomor sama → galat "Nomor sudah terdaftar".
- [ ] Implementasi → PASS; commit.

### Task 6: Produk

**Files:** `src/app/(app)/produk/page.tsx`, `src/features/products/{actions,queries,ProductForm}.ts(x)`
**Interfaces:** `listProducts(storeId, q?)`, `createProduct`, `updateProduct`, `deleteProduct` (set `isActive=false`). Field: nama, SKU?, harga, kategori?, stok?, `repurchaseDays?`.
- [ ] Implementasi daftar + form di Sheet; manual cek; commit.

### Task 7: Pesanan

**Files:** `src/app/(app)/pesanan/{page,baru/page,[id]/page}.tsx`, `src/features/orders/{actions,queries,schema,OrderForm,StatusStepper}.ts(x)`, `actions.test.ts`
**Interfaces (Produces):** `createOrder(input)` (nomor `INV-0001` berikutnya per toko dalam transaksi), `updateOrderStatus(orderId, status, {trackingNumber?})`, `duplicateOrder(orderId)` → id pesanan baru `pending`; `recomputeCustomerStats(tx, customerId)` memakai `computeCustomerStats`.
- Form: cari/pilih pelanggan (atau "+ Pelanggan baru" inline), baris item (pilih produk atau ketik manual), diskon, ongkir, metode bayar (Transfer, COD, E-wallet, Tunai), catatan; total langsung terhitung (`calcOrderTotals`). `?pelanggan=<id>` mengisi otomatis.
- Daftar: chip filter status, rentang tanggal; kartu: nomor, pelanggan, total, badge status.
- Detail: stepper status; ke "Dikirim" meminta resi; ke `done` membuat Task "Minta ulasan" `dueDate = +3 hari`, `autoGenerated=true`. Tombol "Pesan ulang".
- [ ] Tes: set `done` → customer `totalSpent` = total & task ulasan dibuat; lalu `cancelled` → `totalSpent` 0. Dua `createOrder` → `INV-0001`, `INV-0002`.
- [ ] Implementasi → PASS; commit.

### Task 8: Interaksi, timeline, tugas, Hari Ini

**Files:** `src/features/interactions/{actions,Timeline,InteractionForm}.ts(x)`, `src/features/tasks/{actions,queries,TaskForm}.ts(x)`, `src/app/(app)/hari-ini/page.tsx`, `src/features/tasks/today.test.ts`
**Interfaces (Produces):** `logInteraction(customerId, type, content)`; `getTimeline(storeId, customerId)` → gabungan pesanan+interaksi urut terbaru; `createTask`, `completeTask(id, note?)` (note → interaksi `note`); `getToday(storeId, now)` → `{overdue, dueToday, birthdays, inactive}` (inactive maksimal 10, urut terlama).
- Hari Ini: sapaan + tanggal, bagian Terlambat (badge merah redup), Hari Ini, Ulang Tahun, Lama Tidak Belanja; tiap kartu punya tombol WhatsApp + "Selesai". Kosong → EmptyState "Semua beres untuk hari ini 🎉".
- [ ] Tes `getToday`: tugas kemarin belum selesai ∈ overdue; ulang tahun hari ini (tahun berapapun) ∈ birthdays; pelanggan beli 70 hari lalu ∈ inactive.
- [ ] Implementasi → PASS; commit.

### Task 9: Template WhatsApp

**Files:** `src/app/(app)/template/page.tsx`, `src/features/templates/{actions,defaults,SendWhatsAppSheet}.ts(x)`
**Interfaces (Produces):** `DEFAULT_TEMPLATES` (6 kategori: Terima kasih, Konfirmasi pesanan, Info resi, Promo, Pengingat, Ulang tahun) dipasang saat daftar; CRUD template; `SendWhatsAppSheet({customer, order?})`: pilih template → pratinjau via `renderTemplate` (vars `nama, produk, total, resi`); jika `missing` tidak kosong tampilkan peringatan "Data {resi} belum ada" dengan tombol "Tetap kirim"; kirim → `logInteraction(type 'whatsapp', text)` lalu `window.open(waLink(...))`. Editor menyediakan chip variabel yang bisa diketuk.
- [ ] Hubungkan ke detail pelanggan, detail pesanan, kartu Hari Ini. Manual cek: interaksi muncul di timeline. Commit.

### Task 10: Dashboard

**Files:** `src/app/(app)/dashboard/page.tsx`, `src/features/dashboard/queries.ts` (+test)
**Interfaces:** `getSummary(storeId, from, to)` → `{revenue, orderCount, newCustomers, avgOrderValue, prevRevenue}` (omzet = pesanan `done` berdasarkan `orderDate`); `topCustomers(storeId, 5)`; `topProducts(storeId, 5)`. Periode: 7 hari, 30 hari, Bulan ini. Kartu menampilkan perubahan vs periode sebelumnya ("▲ 12% dari minggu lalu"). Grafik batang omzet harian sederhana (SVG, monokrom). Perlu `report.view`.
- [ ] Tes `getSummary` dengan 2 pesanan done + 1 cancelled. Implementasi; commit.

### Task 11: Impor & ekspor CSV

**Files:** `src/app/(app)/impor-ekspor/page.tsx`, `src/features/csv/{analyze,export,actions,ImportWizard}.ts(x)`, `analyze.test.ts`, `src/app/api/ekspor/[jenis]/route.ts`
**Interfaces:** `analyzeImport(rows: Record<string,string>[], mapping: Partial<Record<'name'|'phone'|'email'|'city'|'address'|'birthday'|'source'|'notes', string>>, existingPhones:Set<string>)` → `{valid: CustomerInput[], duplicates:{row:number; phone:string; reason:'di_file'|'sudah_ada'}[], invalid:{row:number; reason:string}[]}`; `importCustomers(valid)` (createMany skipDuplicates) → laporan; ekspor `GET /api/ekspor/pelanggan|pesanan` → CSV UTF-8 BOM (perlu `data.export`).
- Wizard 3 langkah: Unggah (Papaparse, auto-deteksi `,`/`;`) → Cocokkan kolom (tebak otomatis dari judul: "nama", "no hp", "whatsapp", "telepon", "kota") + pratinjau 5 baris → Konfirmasi dengan ringkasan "180 siap, 15 ganda, 5 tidak valid" → Laporan. Unduh contoh CSV tersedia.
- [ ] Tes `analyzeImport`: nomor sama dua kali di file → kedua `di_file`; nomor ada di DB → `sudah_ada`; nama kosong → invalid "Nama kosong"; nomor "abc" → invalid. Tanggal lahir `dd/mm/yyyy` diparse.
- [ ] Implementasi → PASS; commit.

### Task 12: Pengaturan & tim

**Files:** `src/app/(app)/pengaturan/page.tsx`, `src/features/settings/actions.ts`
**Interfaces:** `updateStore({name, phone, address, inactiveDays})`; `addMember({name,email,password,role})`, `changeRole`, `removeMember` (semua `settings.manage`; pemilik tidak bisa menghapus diri sendiri).
- [ ] Implementasi; manual: akun staf tidak melihat Dashboard/Impor-Ekspor/Pengaturan dan aksi server menolak. Commit.

### Task 13: Seed demo, PWA, README

**Files:** `prisma/seed.ts`, `public/manifest.webmanifest`, `public/icons/*`, `README.md`, `docs/screenshots/*`
- Seed: toko "Toko Demo Kopi Nusantara", akun `demo@tokoku.id` / `demo12345` (owner) + staf, 40 pelanggan, 12 produk, 120 pesanan tersebar 90 hari, interaksi, tugas (beberapa terlambat), template bawaan.
- README (Bahasa Indonesia): ringkasan & masalah yang diselesaikan, tangkapan layar (ponsel), fitur, tech stack & alasan, arsitektur (diagram mermaid), skema data, aturan bisnis, cara menjalankan lokal (Docker + `prisma migrate` + `db seed` + `npm run dev`), deploy Vercel + Neon, akun demo, pengujian, roadmap (reset sandi, notifikasi, segmen, WA Business API, marketplace), lisensi MIT.
- [ ] `npx vitest run` → PASS semua; `npm run build` → sukses; ambil tangkapan layar via browser pane. Commit `docs: README`.
