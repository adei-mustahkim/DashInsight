# DashInsight — Dashboard Analitik & Insight Bisnis UMKM

DashInsight adalah platform dashboard analitik bisnis premium yang mengubah data penjualan mentah (dari file Excel/CSV atau database POS/marketplace) menjadi indikator kinerja utama (KPI), visualisasi grafik interaktif, laporan bisnis siap cetak, serta rekomendasi aksi otomatis (insight) bertenaga mesin aturan analis data.

Aplikasi ini didesain khusus untuk membantu UMKM/pemilik bisnis mengambil keputusan strategis berbasis data secara instan tanpa membutuhkan keahlian data science.

---

## 🚀 Fitur Utama & Keunggulan

### 1. Multi-POV Berbasis Jenis Bisnis (Business Profiles)
Menyediakan visualisasi, metrik KPI, dan urutan grafik yang disesuaikan secara otomatis berdasarkan 4 jenis profil bisnis utama:
*   **Retail:** Fokus pada manajemen stok, Pareto produk, profitabilitas varian (*Bubble Chart*), dan loyalitas pelanggan (*Customer Loyalty Mix*).
*   **F&B (Food & Beverages):** Fokus pada omzet per meja (*Table Revenue*), komposisi tipe pesanan (*Dine-in vs Takeaway*), produktivitas jam ramai (*Hourly Sales*), dan evaluasi efektivitas diskon (*Promo ROI*).
*   **Jasa (Services):** Fokus pada performa omzet per staf (*Staff Performance*), rata-rata durasi pengerjaan layanan (*Service Duration*), serta kontribusi penyedia pembayaran per metode (*Payment Provider Share*).
*   **Marketplace & E-Commerce:** Fokus pada efisiensi biaya kirim kurir (*Courier Efficiency*), peta sebaran omzet kota (*City Sales*), dan margin penjualan channel.

### 2. Normalisasi & Data Health Check Otomatis
*   Mengunggah file `.csv`, `.xlsx`, atau `.xls`.
*   Deteksi & pencocokan kolom cerdas (Auto-Mapping) dari berbagai jenis POS (Moka, Majoo, Kasir Pintar) dan e-commerce (Shopee, Tokopedia).
*   Data Health Check mendeteksi risiko kualitas data seperti tanggal tidak valid, transaksi duplikat, atau nilai omzet kosong.

### 3. Dashboard Interaktif Kustom (Widget Engine)
*   **Bebas Atur Layout:** Setiap visualisasi grafik dapat di-drag untuk diubah urutannya atau di-resize ukurannya.
*   **Simpan Preferensi:** Preferensi layout dashboard (urutan, ukuran, chart yang disembunyikan, rotasi sumbu, mode metrik) tersimpan otomatis per dataset.
*   **Formulas Builder:** Mesin kustomisasi rumus matematika/agregasi untuk mengubah kalkulasi metrik secara langsung dari antarmuka.

### 4. Chart Library & Kustom Template
*   Dukungan template chart bawaan serta kemampuan membuat template chart kustom.
*   Pemetaan visualisasi data langsung ke database melalui panel administrasi untuk fleksibilitas analitik tingkat tinggi.

### 5. Automated Insight & Laporan Siap Cetak
*   **Analis Insight Otomatis:** Deteksi cepat terhadap *Quick Wins*, *Aksi Prioritas*, serta *Confidence Score* dari rekomendasi aksi.
*   **Laporan PDF:** Fitur cetak laporan ringkasan analitik bisnis bulanan/mingguan yang terformat rapi dan profesional.
*   **Interactive HTML Export:** Mengunduh replika dashboard interaktif dalam satu file HTML vanilla (tanpa server) yang menyertakan data, preferensi layout, visualisasi Chart.js interaktif, serta kustomisasi Chart Library.

---

## 🛠️ Tech Stack

### Frontend (Client-side App)
*   **Core:** React 18 (TypeScript), Vite (Build Tool), Tailwind CSS (Styling)
*   **State Management & Utilities:** Lucide React (Icons), LocalStorage (Dashboard State Persistence)
*   **Data Visualization:** Recharts (Interaktif UI Dashboard), Chart.js (Interaktif HTML Export)

### Backend (Server-side & DB)
*   **Core API:** Node.js, Express.js
*   **Database ORM:** Prisma ORM dengan SQLite (Penyimpanan database relasional lokal untuk Chart Templates & Library Mappings)

---

## 📂 Struktur Penting Proyek

```text
├── src/
│   ├── App.tsx                        # Komponen UI utama, wizard upload, dan layout dashboard
│   ├── main.tsx                       # Entry point aplikasi React
│   ├── analytics/
│   │   └── dashboardAnalytics.ts      # Core Engine kalkulasi KPI, segmentasi, & formula evaluasi
│   ├── components/
│   │   ├── Demo/
│   │   │   └── InteractiveDemo.tsx    # Replika Dashboard Demo interaktif di Landing Page
│   │   └── Charts/
│   │       ├── DynamicChart.tsx       # Komponen wrapper chart Recharts utama di dashboard
│   │       └── TemplateChart.tsx      # Komponen render template chart kustom dari database
│   ├── utils/
│   │   ├── dashboardExportTemplate.ts # Template export HTML dasbor mandiri (vanilla JS + Chart.js)
│   │   ├── formulaEvaluator.ts        # Parser & evaluator formula metrik dinamis
│   │   └── dataMappingUtils.ts        # Helper normalisasi data mentah hasil upload
│   └── constants/
│       └── fields.ts                  # Kamus metadata dan definisi field POS
├── server/
│   ├── src/
│   │   └── index.ts                   # Express API server untuk autentikasi dan chart templates
│   ├── prisma/
│   │   ├── schema.prisma              # Schema database SQLite (Chart templates, mappings)
│   │   └── seed.ts                    # Seeding data template chart bawaan
│   └── .env                           # Konfigurasi port dan URL database lokal
└── backup-2026-06-21/                 # Salinan backup aman file inti sebelum pembersihan besar
```

---

## ⚙️ Cara Menjalankan Project

### Prerequisites
Pastikan Anda sudah menginstal **Node.js (versi 16 atau lebih tinggi)** dan **npm**.

### 1. Instalasi Dependensi
Jalankan perintah berikut di root folder dan folder `server/` untuk menginstal modul pustaka:
```bash
# Di folder root (frontend client)
npm install

# Di folder server
cd server
npm install
cd ..
```

### 2. Setup Database Lokal (SQLite & Prisma)
Jalankan migrasi database dan seed data bawaan di folder `server/`:
```bash
cd server
npx prisma migrate dev --name init
npx prisma db seed
cd ..
```

### 3. Menjalankan Mode Pengembangan (Dev Mode)
Jalankan frontend dan backend secara paralel:
```bash
# Di terminal 1 (Frontend):
npm run dev

# Di terminal 2 (Backend):
cd server
npm run dev
```

Aplikasi frontend dapat diakses di browser melalui URL default: `http://localhost:5173`.
Server backend berjalan di URL default: `http://localhost:3001`.

### 4. Build untuk Produksi
Untuk mengompilasi kode frontend menjadi bundle statis siap deploy:
```bash
npm run build
```
Hasil build akan berada di direktori `dist/`.

---

## 📊 Format Kolom Data Penjualan (CSV/XLSX)
DashInsight sangat fleksibel dalam mencocokkan kolom data. Contoh template input penjualan dapat ditemukan di:
*   `public/template-data-dashinsight.csv`
*   `public/template-data-dashinsight.xlsx`

Berikut daftar kolom rekomendasi utama untuk hasil insight terbaik:
*   `transaction_date` - Tanggal dan waktu penjualan
*   `transaction_id` - Nomor unik transaksi / invoice
*   `product_name` - Nama item produk / jasa
*   `category` - Pengelompokan produk
*   `quantity` - Jumlah barang terjual
*   `unit_price` - Harga jual satuan produk
*   `cogs` - Harga Pokok Penjualan (HPP) / modal per unit
*   `discount_amount` - Besaran diskon yang diberikan
*   `payment_method` - Metode pembayaran (QRIS, Tunai, Gopay, dll)
*   `sales_channel` - Saluran penjualan (Outlet Cabang A, Shopee, Gofood)
*   `staff` - Nama staf yang melayani transaksi (khusus profil Jasa)
*   `table_number` - Nomor meja pelanggan (khusus profil F&B)

---

## 🌐 Panduan Deploy ke Layanan Gratisan (Vercel & Render)

Karena aplikasi ini terdiri dari **Frontend (React/Vite)** dan **Backend (Node.js/Prisma/SQLite)**, Anda dapat men-deploy keduanya secara gratis menggunakan kombinasi **Vercel** (untuk Frontend) dan **Render** (untuk Backend).

### 1. Deploy Backend (Node.js & SQLite) ke Render
Render menawarkan hosting gratis yang sangat cocok untuk backend Express.js.

#### Langkah-langkah:
1. Hubungkan akun GitHub Anda ke [Render](https://render.com/).
2. Buat layanan baru: klik **New +** > **Web Service**.
3. Pilih repository GitHub proyek Anda.
4. Konfigurasikan detail berikut:
   * **Name**: `dashinsight-api` (atau nama unik lainnya)
   * **Environment**: `Node`
   * **Region**: Pilih yang terdekat (misal: `Singapore`)
   * **Branch**: `main`
   * **Build Command**: `cd server && npm install && npx prisma generate && npm run build`
   * **Start Command**: `cd server && node dist/index.js`
   * **Instance Type**: `Free`
5. Tambahkan **Environment Variables** di bagian **Advanced**:
   * `NODE_ENV` = `production`
   * `DATABASE_URL` = `file:./dev.db` (menggunakan database SQLite lokal bawaan)
   * `PORT` = `10000` (atau biarkan Render menentukan otomatis)
6. Klik **Create Web Service**. Setelah build selesai, Render akan memberikan URL API publik Anda (contoh: `https://dashinsight-api.onrender.com`).

> [!WARNING]
> Layanan gratis Render akan masuk ke mode "tidur" (*spin down*) jika tidak ada aktivitas selama 15 menit. Request pertama setelah tidur membutuhkan waktu ~30 detik untuk bangun kembali.
> Karena SQLite berbasis file lokal, data transaksi baru yang ditambahkan di production akan terhapus jika Render melakukan restart / deploy ulang. Untuk database persisten gratis, disarankan untuk mengubah adapter database Prisma ke PostgreSQL (misalnya menggunakan **Neon.tech** atau **Supabase**) di `schema.prisma`.

---

### 2. Deploy Frontend (React/Vite) ke Vercel
Vercel jadi **akses utama client** untuk frontend DashInsight. Semua halaman publik, landing page, dan route React diakses dari URL Vercel.

#### Langkah-langkah:
1. Hubungkan akun GitHub Anda ke [Vercel](https://vercel.com/).
2. Klik **Add New** > **Project**.
3. Pilih repository proyek Anda dan klik **Import**.
4. Konfigurasikan pengaturan build:
   * **Framework Preset**: `Vite` (terdeteksi otomatis)
   * **Root Directory**: `./` (biarkan default root folder)
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
5. Tambahkan **Environment Variables** sebelum men-deploy:
   * **Key**: `VITE_API_URL`
   * **Value**: URL backend publik yang dipakai app client. Contoh: `https://dashinsight-api.onrender.com/api`
6. Klik **Deploy**. Selesai! Vercel akan menghasilkan URL frontend publik Anda, dan itulah URL yang dipakai client untuk akses utama.

> [!IMPORTANT]
> Frontend di Vercel tidak boleh mengandalkan `localhost` saat production. Pastikan `VITE_API_URL` menunjuk ke backend publik yang aktif.

> [!TIP]
> Untuk testing lokal, `npm run dev` tetap boleh pakai backend lokal di `http://localhost:3001/api`. Saat deploy, ganti lewat env Vercel.
