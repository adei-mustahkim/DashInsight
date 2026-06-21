# DashInsight - Dokumentasi Pengembangan

Dokumentasi lengkap untuk pengembangan, pemeliharaan, dan ekstensi proyek DashInsight.

---

## Daftar Isi

1. [Ringkasan Proyek](#ringkasan-proyek)
2. [Arsitektur & Struktur File](#arsitektur--struktur-file)
3. [Tech Stack](#tech-stack)
4. [Alur Data (Data Pipeline)](#alur-data-data-pipeline)
5. [Modul & Fungsi Referensi](#modul--fungsi-referensi)
6. [Sistem Kolom & Mapping](#sistem-kolom--mapping)
7. [State Management](#state-management)
8. [Sistem Chart & Visualisasi](#sistem-chart--visualisasi)
9. [Pengaturan Dashboard (Settings)](#pengaturan-dashboard-settings)
10. [Penyimpanan Layout & Preferensi](#penyimpanan-layout--preferensi)
11. [Export & Report](#export--report)
12. [Setup Development](#setup-development)
13. [Build & Deploy](#build--deploy)
14. [Rekomendasi Pengembangan](#rekomendasi-pengembangan)
15. [Troubleshooting](#troubleshooting)

---

## Ringkasan Proyek

**DashInsight** adalah platform dashboard analitik bisnis berbasis web yang membantu bisnis mengubah file penjualan Excel/CSV menjadi KPI, chart, insight otomatis, dan laporan bisnis. Aplikasi ini berjalan sepenuhnya di browser (client-side) tanpa backend.

### Fitur Utama

- Upload file `.csv`, `.xlsx`, atau `.xls`
- Deteksi & pencocokan kolom otomatis (auto-mapping) dari berbagai format kasir/POS
- Normalisasi data: angka, tanggal, jam, label channel, metode pembayaran
- KPI penjualan: omzet, transaksi, AOV, profit, margin, retur, diskon, rating
- Analisis produk: top produk, Pareto 80/20, matriks volume vs margin (BCG-style)
- Analisis operasional: cabang, channel, kota, staff, jam ramai, hari ramai
- Analisis silang: kategori x cabang, waktu x kategori, channel x kategori, staff x kategori
- Data health check otomatis
- Insight otomatis berisi temuan, dampak, dan rekomendasi aksi
- Halaman Insight Bisnis, Laporan, Pengaturan, Bantuan
- Export dashboard ke HTML interaktif
- Preferensi layout per dataset (ukuran chart, urutan, tipe visual, rotasi, metrik)

---

## Arsitektur & Struktur File

```
umkm-insight/
├── index.html                      # Entry point HTML
├── package.json                    # Dependencies & scripts
├── vite.config.ts                  # Konfigurasi Vite (code splitting)
├── tailwind.config.js              # Konfigurasi Tailwind CSS
├── tsconfig.json                   # TypeScript config
├── tsconfig.app.json               # TypeScript app config
├── tsconfig.node.json              # TypeScript node config
├── eslint.config.js                # ESLint config
├── postcss.config.js               # PostCSS config
│
├── public/                         # Static assets
│   ├── favicon.svg                 # Ikon favicon
│   ├── icons.svg                   # Ikon SVG
│   ├── indonesia.json              # GeoJSON Indonesia
│   ├── indonesia-simple.json       # GeoJSON Indonesia (sederhana)
│   ├── template-data-dashinsight.csv      # Template CSV contoh
│   └── template-data-dashinsight.xlsx     # Template Excel contoh
│
├── scripts/
│   └── build-template-workbook.mjs # Script generate template Excel
│
├── src/
│   ├── main.tsx                    # Entry point React
│   ├── App.tsx                     # Komponen utama (~6000 baris)
│   ├── App.css                     # Style App
│   ├── index.css                   # Global CSS (Tailwind)
│   ├── dashboardAnalytics.ts       # Perhitungan KPI, chart data, insight
│   ├── dataPreparation.ts          # Normalisasi & enrich rows
│   ├── dashboardStorage.ts         # Dataset key & layout storage
│   ├── formatting.ts               # Format rupiah, angka, shortCurrency
│   ├── templateAssets.ts           # URL template assets
│   └── assets/                     # Static assets di src
│
├── dist/                           # Build output
└── archive/                        # File arsip/lama
```

### Alur Modul

```
File Upload (CSV/XLSX)
    ↓
parseCSV() / XLSX.read() + extractSheetData()
    ↓
autoMapColumns() → FIELD_SYNONYMS + fuzzy match
    ↓
normalizeRows() → normalizeLabel, parsePreparedNumber, normalizeDateValue
    ↓
prepareRows() → enrichRow() (quality flags, computed fields)
    ↓
computeDashboardAnalytics() → KPI, charts, insights, pareto, growth
    ↓
React UI Rendering (Recharts, custom components)
```

---

## Tech Stack

| Layer | Teknologi | Versi |
|-------|-----------|-------|
| Framework | React | 19.x |
| Language | TypeScript | ~6.0 |
| Build Tool | Vite | 8.x |
| CSS | Tailwind CSS | 4.x |
| Charts | Recharts | 3.x |
| Excel Parser | xlsx (SheetJS) | 0.18.x |
| Icons | lucide-react | 1.x |
| Browser Testing | Playwright | 1.61.x |

### Code Splitting (Vite Manual Chunks)

| Chunk | Isi |
|-------|-----|
| `vendor-react` | react, scheduler |
| `vendor-charts` | recharts, d3-* |
| `vendor-excel` | xlsx, cfb, ssf |
| `vendor-icons` | lucide-react |
| `vendor` | node_modules lainnya |

---

## Alur Data (Data Pipeline)

### 1. Upload & Parsing

```
User Upload File
    ↓
handleFileUpload()
    ├── CSV → parseCSV() → { headers, data }
    └── XLSX/XLS → XLSX.read() → profileSheet() → { headers, data, score }
        ↓
    Jika multi-sheet → profileSheet() scoring → user pilih sheet
        ↓
    autoMapColumns() → columnMapping[]
```

### 2. Auto-Mapping Columns

`autoMapColumns()` mengonversi kolom mentah ke field standar menggunakan:

1. **User Memory (LocalStorage)** - Confidence 100%
2. **Synonym Matching** - FIELD_SYNONYMS dictionary
3. **Fuzzy Match (Levenshtein)** - Similarity > 80%
4. **Data Profiling** - Deteksi waktu (HH:MM), angka besar
5. **Partial Match** - Header mengandung sinonim

### 3. Normalisasi Data

`prepareRows()` → `enrichRow()` pada setiap baris:

- **Label Normalization**: Title case, alias mapping (GoFood, QRIS, dll)
- **Numeric Normalization**: Hapus RP, ribuan, parse ke number
- **Date Normalization**: Format ISO `yyyy-mm-dd`, Excel serial number
- **Time Normalization**: Format `HH:MM`
- **Computed Fields**: `gross_profit` = `sales_amount - cogs`
- **Quality Flags**: `invalid_sales`, `invalid_date`, `invalid_rating`

### 4. Kalkulasi Dashboard

`computeDashboardAnalytics(processedData, filters, settings)`:

**Input:**
- `processedData[]` - Data yang sudah dinormalisasi
- `filters` - { dateFilter, trendGranularity, categoryFilter, channelFilter, branchFilter, paymentFilter }
- `settings` - { netRevenueFormula, profitFormula, aovFormula, metricView, businessType }

**Output:**
```typescript
{
  kpis: { totalOmzet, totalTransaksi, avgTransaksi, totalProfit, profitMargin, ... }
  charts: { trendSales, topProducts, categorySales, channelSales, ... }
  insights: [{ type, text }]
  dimensions: { date, product, category, channel, branch, ... }
  dataHealth: { score, label, issues }
  pareto: { products, categories, channels }
  businessProfile: { type, focus }
  growth: { omzet, transaksi, profit, aov, label }
  customerSegments: { total, repeat, repeatRate, vip, atRisk }
  dateRange: { start, end }
  rowStats: { filteredRows, totalRows }
}
```

---

## Modul & Fungsi Referensi

### `src/dashboardAnalytics.ts`

| Fungsi | Deskripsi |
|--------|-----------|
| `parseTransactionDate(value)` | Parse tanggal dari berbagai format termasuk Excel serial number |
| `toCleanLabel(value, fallback)` | Bersihkan & trim label, return fallback jika kosong |
| `getCalculatedMetrics(row, settings)` | Hitung netRev, profit, rawSales berdasarkan formula settings |
| `groupSum(rows, key, fallback, settings)` | Agregasi data berdasarkan key (kategori, channel, dll) |
| `profileDataHealth(rows, dimensions)` | Skor kualitas data 0-100, label Baik/Perlu Dicek/Bermasalah |
| `computePareto(items)` | Hitung Pareto 80/20: countFor80, top20Share, cumulative share |
| `computeDashboardAnalytics(data, filters, settings)` | Fungsi utama - menghitung semua KPI, chart data, insight |

### `src/dataPreparation.ts`

| Fungsi | Deskripsi |
|--------|-----------|
| `normalizeText(value)` | Hapus spasi berlebih & trim |
| `normalizeLabel(field, value)` | Normalisasi label: title case, alias, exceptions (QRIS, GOPI) |
| `parsePreparedNumber(value)` | Parse angka dari format Rupiah, ribuan, koma, dsb |
| `normalizeDateValue(value)` | Konversi ke format ISO yyyy-mm-dd |
| `normalizeTimeValue(value)` | Format ke HH:MM |
| `enrichRow(row)` | Enrich 1 baris: normalize, compute, quality flags |
| `prepareRows(rows)` | Map enrichRow ke semua baris |

### `src/dashboardStorage.ts`

| Fungsi | Deskripsi |
|--------|-----------|
| `buildDatasetKey(rows, sourceName)` | Generate hash unik untuk dataset berdasarkan signature data |
| `DASHBOARD_LAYOUT_PREFIX` | Prefix key localStorage untuk layout: `umkm_dashboard_layout_` |

### `src/formatting.ts`

| Fungsi | Deskripsi |
|--------|-----------|
| `formatRupiah(value)` | Format ke `Rp 1.000.000` |
| `formatNumber(value)` | Format angka dengan pemisah ribuan |
| `shortCurrency(value)` | Format pendek: `Rp50Rb`, `Rp1.2Jt`, `Rp3.5M` |

### `src/templateAssets.ts`

| Konstanta | Nilai |
|-----------|-------|
| `TEMPLATE_DATA_URL` | `/template-data-dashinsight.csv` |
| `TEMPLATE_WORKBOOK_URL` | `/template-data-dashinsight.xlsx` |

---

## Sistem Kolom & Mapping

### Field Standar (31 kolom)

| Field Key | Label Indonesia | Tipe | Wajib |
|-----------|-----------------|------|-------|
| `transaction_date` | Tanggal Transaksi | date | Ya |
| `transaction_time` | Jam Transaksi | time | - |
| `transaction_id` | Nomor Transaksi | string | Disarankan |
| `product_id` | SKU / Kode Produk | string | - |
| `product_name` | Nama Produk | string | Ya |
| `category` | Kategori Produk | string | Disarankan |
| `brand` | Merek / Brand | string | - |
| `variant` | Varian | string | - |
| `quantity` | Jumlah Barang | number | Disarankan |
| `unit_price` | Harga Satuan | number | - |
| `discount_amount` | Diskon | number | - |
| `shipping_fee` | Biaya Kirim | number | - |
| `cogs` | Harga Pokok (HPP) | number | Opsional |
| `gross_profit` | Laba Kotor | number | Opsional |
| `sales_amount` | Total Penjualan | number | Ya |
| `return_amount` | Nilai Retur | number | - |
| `return_quantity` | Qty Retur | number | - |
| `payment_method` | Metode Pembayaran | label | Disarankan |
| `payment_status` | Status Pesanan | label | - |
| `customer_name` | Nama Pelanggan | label | - |
| `customer_id` | ID Pelanggan | string | - |
| `sales_channel` | Channel Penjualan | label | Disarankan |
| `destination_city` | Kota Pengiriman | label | - |
| `branch` | Cabang | label | - |
| `staff_name` | Nama Staff/Karyawan | label | - |
| `staff_commission` | Komisi Staff | number | - |
| `supplier` | Supplier / Pemasok | label | - |
| `rating` | Rating/Ulasan | number | - |
| `duration_mins` | Durasi Layanan | number | - |
| `tax` | Pajak / PPN | number | - |
| `service_charge` | Service Charge | number | - |
| `platform_fee` | Biaya Platform | number | - |

### FIELD_SYNONYMS (Kamus Sinonim)

Setiap field memiliki daftar sinonim untuk auto-mapping. Contoh:

```typescript
transaction_date: ['tanggal', 'tgl', 'order date', 'trx date', 'date', ...]
sales_amount: ['total', 'grand total', 'omzet', 'penjualan', 'revenue', ...]
payment_method: ['metode pembayaran', 'pembayaran', 'payment', 'cara bayar', ...]
```

### Label Aliases (Normalisasi Label)

```typescript
sales_channel: { gofood: 'GoFood', shopeefood: 'ShopeeFood', offline: 'Toko Fisik', ... }
payment_method: { qris: 'QRIS', cash: 'Tunai', gopay: 'GoPay', ... }
payment_status: { selesai: 'Selesai', completed: 'Selesai', cancel: 'Dibatalkan', ... }
```

---

## State Management

State utama di `App.tsx` (komponen `DashInsight`):

### State Navigasi
| State | Tipe | Deskripsi |
|-------|------|-----------|
| `currentView` | string | `'home'` / `'wizard'` / `'dashboard'` / `'data'` / `'insight'` / `'laporan'` / `'pengaturan'` / `'bantuan'` |
| `wizardStep` | number | Step wizard: 1 (bisnis), 2 (upload), 25 (sheet picker), 3 (mapping), 4 (done) |

### State Data
| State | Tipe | Deskripsi |
|-------|------|-----------|
| `businessType` | string | Jenis bisnis: Retail, Kuliner, Fashion, dll |
| `rawFile` | File | File asli yang di-upload |
| `rawHeaders` | string[] | Header kolom mentah |
| `rawData` | object[] | Data mentah dari file |
| `columnMapping` | MappingItem[] | Hasil auto-mapping |
| `processedData` | object[] | Data setelah normalisasi |
| `availableSheets` | SheetProfile[] | Profil sheet Excel |
| `selectedSheetName` | string | Sheet yang dipilih |

### State Filter & Tampilan
| State | Tipe | Deskripsi |
|-------|------|-----------|
| `metricView` | string | `'revenue'` atau `'quantity'` |
| `dateFilter` | string | `'all'` / `'7days'` / `'30days'` / `'mtd'` / `'mom'` / `'yoy'` / `'ytd'` |
| `trendGranularity` | string | `'daily'` / `'weekly'` / `'monthly'` |
| `categoryFilter` | string | Filter kategori |
| `channelFilter` | string | Filter channel |
| `branchFilter` | string | Filter cabang |
| `paymentFilter` | string | Filter metode pembayaran |

### State Layout Dashboard
| State | Tipe | Deskripsi |
|-------|------|-----------|
| `hiddenCharts` | string[] | Chart yang disembunyikan |
| `chartOrder` | string[] | Urutan chart |
| `chartSizes` | object | Ukuran per chart (grid span) |
| `chartViews` | object | Tipe visual per chart (bar/pie/radar/treemap) |
| `chartRotations` | object | Rotasi landscape/portrait per chart |

### State Persistensi
| State | Tipe | Lokasi |
|-------|------|--------|
| `dashboardSettings` | object | localStorage: `dashboardSettings` |
| `datasetHistory` | array | localStorage: `umkm_dataset_history` |
| `userColumnMappings` | object | localStorage: `userColumnMappings` |
| Layout per dataset | object | localStorage: `umkm_dashboard_layout_{hash}` |

---

## Sistem Chart & Visualisasi

### Daftar Chart (24 chart)

| ID | Nama | Default Size | Tipe |
|----|------|-------------|------|
| `pareto` | Pareto Produk (80/20) | 12 (full) | Composed (bar + line) |
| `productMatrix` | Volume vs Margin (BCG) | 12 (full) | Scatter |
| `topProducts` | Top Produk | 6 | Bar (horizontal) |
| `categorySales` | Category Revenue Mix | 6 | Bar/Doughnut/Treemap |
| `channelSales` | Channel Mix | 6 | Doughnut/Bar |
| `branchSales` | Branch Performance | 6 | Bar/Doughnut |
| `crossCategoryBranch` | Category by Branch | 6 | Stacked Bar |
| `hourlySales` | Peak Hour Pattern | 12 (full) | Composed (bar + line) |
| `crossTimeCategory` | Hourly Category Demand | 6 | Stacked Area |
| `discount` | Discount Effectiveness | 6 | Scatter |
| `staffSales` | Staff Revenue | 6 | Bar/Radar |
| `serviceDuration` | Service Duration | 6 | Bar |
| `weekdaySales` | Revenue by Day | 4 | Bar |
| `basketSize` | Basket Size Distribution | 4 | Bar |
| `paymentMethods` | Payment Mix | 4 | Doughnut/Bar |
| `citySales` | Destination City | 4 | Map/Bar |
| `brandSales` | Brand Revenue | 4 | Bar |
| `supplierSales` | Supplier Revenue | 4 | Bar |
| `dataTable` | Tabel Detail Produk | 12 (full) | Tabel |
| `crossChannelCategory` | Category per Channel | 6 | Stacked Bar |
| `crossPaymentChannel` | Payment per Channel | 6 | Stacked Bar |
| `crossStaffCategory` | Staff per Category | 6 | Stacked Bar |
| `channelEfficiency` | Channel Efficiency | 6 | Bar |
| `categoryProfitability` | Category Profitability | 6 | Bar |

### Tipe Visual (chartViews)

- `auto` - Rekomendasi otomatis berdasarkan jumlah data
- `bar` - Bar chart (horizontal/vertikal)
- `pie` - Doughnut/Pie chart
- `radar` - Radar chart
- `treemap` - Treemap HTML

### Analyst Chart Plan

Fungsi `buildAnalystChartPlan(data)` menentukan urutan & ukuran chart berdasarkan:

1. **Business Profile**: Jasa → fokus staff/durasi; Marketplace → fokus channel/kota; F&B → fokus waktu; Retail → fokus produk/brand
2. **Essentials**: pareto, productMatrix, topProducts, channelSales, categorySales selalu ditampilkan jika ada
3. **Availability**: Chart hanya ditampilkan jika data tersedia

---

## Pengaturan Dashboard (Settings)

### Formula Kalkulasi

| Setting | Opsi | Default | Deskripsi |
|---------|------|---------|-----------|
| `netRevenueFormula` | `gross` / `net_of_returns` / `net_of_discounts_returns` | `gross` | Cara hitung net revenue |
| `profitFormula` | `auto` / `gross_profit` / `operating_profit` | `auto` | Cara hitung profit |
| `aovFormula` | `net` / `gross` | `net` | Cara hitung Average Order Value |

### Rumus Profit

- **auto**: `gross_profit` jika ada, else `sales_amount - cogs`
- **gross_profit**: `netRevenue - cogs`
- **operating_profit**: `netRevenue - cogs - tax - commission - platformFee`

### Metric View

- **revenue**: Semua chart menampilkan nilai Rupiah
- **quantity**: Semua chart menampilkan jumlah item (qty)

---

## Penyimpanan Layout & Preferensi

### Dataset Key

Setiap dataset diidentifikasi dengan hash unik:
```
umkm_dashboard_layout_{hash}
```

Hash dihitung dari: sourceName, jumlah baris, tanggal/product pertama & terakhir.

### Struktur Layout yang Disimpan

```json
{
  "chartOrder": ["pareto", "topProducts", ...],
  "chartSizes": { "pareto": 12, "topProducts": 6 },
  "hiddenCharts": ["citySales", "brandSales"],
  "chartViews": { "categorySales": "pie", "channelSales": "treemap" },
  "chartRotations": { "hourlySales": true },
  "metricView": "revenue",
  "savedAt": "2026-06-19T10:00:00.000Z"
}
```

### Dataset History

Disimpan di `umkm_dataset_history` (maks 8 item):
```json
[
  {
    "id": "dataset_12345",
    "name": "penjualan-juni.xlsx",
    "rows": 500,
    "businessType": "Kuliner",
    "savedAt": "19/6/2026 10.00.00"
  }
]
```

### User Column Mappings

Disimpan di `userColumnMappings` untuk auto-mapping di sesi berikutnya:
```json
{
  "Tanggal Order": "transaction_date",
  "Total Bayar": "sales_amount",
  "Nama Barang": "product_name"
}
```

---

## Export & Report

### Export HTML Interaktif

Fungsi `exportInteractiveHTML()` menghasilkan file HTML standalone yang berisi:

- KPI cards
- Filter interaktif (periode, kategori, channel, cabang, pembayaran)
- Revenue trend chart (Chart.js)
- Deep dive charts (pareto, kategori, channel, cabang, dll)
- Data table
- Insight section

HTML menggunakan CDN:
- Chart.js: `https://cdn.jsdelivr.net/npm/chart.js`
- Font: Google Fonts Inter

### Export Laporan (Laporan View)

Halaman Laporan (`currentView === 'laporan'`) menampilkan:
- KPI summary
- Executive summary
- Analyst findings
- Rekomendasi aksi
- Kualitas data
- Format siap cetak (CSS @media print)

---

## Setup Development

### Prasyarat

- Node.js >= 18
- npm >= 9

### Instalasi

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Server berjalan di `http://localhost:5173` (Vite default).

### Scripts

| Script | Deskripsi |
|--------|-----------|
| `npm run dev` | Start development server |
| `npm run build` | Build produksi (tsc + vite build) |
| `npm run build:template` | Generate template Excel dari scripts/ |
| `npm run check` | Build template + lint + build |
| `npm run lint` | Jalankan ESLint |
| `npm run preview` | Preview build produksi |

### Build Template Excel

```bash
npm run build:template
```

Menggunakan `scripts/build-template-workbook.mjs` dengan library `@oai/artifact-tool` untuk generate `public/template-data-dashinsight.xlsx` dengan:
- Sheet "Template Transaksi" - 4 baris sample data + 31 kolom
- Sheet "Panduan Kolom" - Deskripsi kolom & keterangan

---

## Build & Deploy

### Build Produksi

```bash
npm run build
```

Output di folder `dist/` dengan code splitting:
- `vendor-react-DpZQQiqz.js`
- `vendor-charts-BTAHHLy9.js`
- `vendor-excel-KN2ETrJ7.js`
- `vendor-Bw3iE6Sg.js`
- `index-BZSADest.js`

### Deploy

Aplikasi adalah SPA static. Deploy ke:
- Vercel / Netlify / GitHub Pages
- Any static hosting

Tidak ada backend yang diperlukan.

---

## Rekomendasi Pengembangan

### Prioritas Tinggi

1. **Pecah `App.tsx`** (~6000 baris) menjadi komponen kecil:
   - `src/components/Wizard/` - BusinessTypeStep, UploadStep, MappingStep
   - `src/components/Dashboard/` - KPICard, ChartCard, FilterBar
   - `src/components/Charts/` - ParetoChart, ProductMatrix, MapChart
   - `src/components/Insight/` - InsightBisnis, ExecutiveSummary
   - `src/components/Laporan/` - LaporanPrint
   - `src/components/Pengaturan/` - SettingsForm

2. **Hapus `@ts-nocheck`** secara bertahap:
   - Tambahkan type definitions untuk data structures
   - Typekan props & state dengan benar
   - Gunakan generic types untuk fungsi agregasi

3. **Pecah `dashboardAnalytics.ts`** (~1000 baris):
   - `analytics/kpi.ts` - KPI calculations
   - `analytics/charts.ts` - Chart data preparation
   - `analytics/insights.ts` - Insight generation
   - `analytics/pareto.ts` - Pareto analysis
   - `analytics/growth.ts` - Growth calculations

### Prioritas Sedang

4. **Unit Tests** - Test fungsi murni:
   - `parsePreparedNumber`, `normalizeLabel`, `normalizeDateValue`
   - `groupSum`, `computePareto`, `getCalculatedMetrics`
   - `autoMapColumns`, `levenshtein`, `getSimilarity`

5. **Custom Hooks** - Extract logic dari App.tsx:
   - `useDashboardAnalytics(processedData, filters, settings)`
   - `useLocalStorage(key, initialValue)`
   - `useColumnMapping(headers, data)`
   - `useChartLayout(datasetKey)`

6. **Export PDF** - Tanpa dialog cetak browser:
   - Gunakan `@react-pdf/renderer` atau `html2canvas` + `jspdf`

### Prioritas Rendah

7. **Backend / API** - Jika ingin multi-user:
   - Auth system (login/register)
   - Database untuk store dataset
   - API untuk upload & analisis

8. **Progressive Web App (PWA)**:
   - Service worker untuk offline mode
   - Manifest untuk install di homescreen

9. **Internationalization (i18n)**:
   - English translation
   - Currency selector (IDR/USD)

---

## Troubleshooting

### Masalah Umum

| Masalah | Solusi |
|---------|--------|
| `npm run dev` gagal | Cek Node.js version >= 18, hapus `node_modules` & `npm install` ulang |
| File Excel tidak terbaca | Pastikan file tidak corrupt, coba export ulang dari sistem kasir |
| Kolom tidak ter-deteksi | Cek header kolom, gunakan sinonim yang didukung (lihat FIELD_SYNONYMS) |
| Chart tidak muncul | Cek apakah data tersedia untuk chart tersebut (dimensi harus ada) |
| `@ts-nocheck` errors | Temporary - TypeScript check di-skip untuk App.tsx & dashboardAnalytics.ts |
| Build template gagal | Pastikan `@oai/artifact-tool` terinstall |

### Debug Mode

Untuk melihat data mentah & mapping:
1. Buka browser DevTools (F12)
2. Tab Console
3. Data `processedData` bisa diakses dari React DevTools

### Performance

- Dataset besar (>10k baris) mungkin lambat di filter
- Pertimbangkan virtualisasi untuk tabel data besar
- Chart re-render bisa dioptimasi dengan `React.memo`

---

## Catatan Penting

1. **Tidak ada backend** - Semua data diproses di browser. Tidak ada data yang dikirim ke server.
2. **LocalStorage** - Layout, preferensi, dan history disimpan di browser. Data asli tidak disimpan.
3. **Ukuran file** - Maksimum 20MB untuk upload. Untuk dataset >50k baris, pertimbangkan streaming.
4. **Browser compatibility** - Target: Chrome 90+, Firefox 90+, Safari 15+, Edge 90+.
5. **Indonesia Map** - Koordinat kota hardcoded di `INDONESIA_CITY_COORDS` (~100 kota). Bisa ditambah sesuai kebutuhan.

---

*Terakhir diperbarui: 19 Juni 2026*
