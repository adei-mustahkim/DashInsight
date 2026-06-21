import fs from 'node:fs/promises';
import path from 'node:path';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';

const rootDir = process.cwd();
const outputDir = path.join(rootDir, 'public');
const previewDir = path.join(rootDir, 'dist', 'previews');
const outputPath = path.join(outputDir, 'template-data-dashinsight.xlsx');

const headers = [
  'transaction_date', 'transaction_time', 'transaction_id', 'product_id', 'product_name',
  'category', 'brand', 'variant', 'quantity', 'unit_price', 'discount_amount',
  'shipping_fee', 'cogs', 'gross_profit', 'sales_amount', 'return_amount',
  'return_quantity', 'payment_method', 'payment_status', 'customer_name', 'customer_id',
  'sales_channel', 'destination_city', 'branch', 'staff_name', 'staff_commission',
  'supplier', 'rating', 'duration_mins', 'tax', 'service_charge', 'platform_fee',
];

const sampleRows = [
  ['2026-06-01', '09:15', 'INV-1001', 'SKU-001', 'Kopi Susu Gula Aren', 'Minuman', 'House Brand', 'Regular', 2, 18000, 2000, 0, 18000, 16000, 36000, 0, 0, 'QRIS', 'Lunas', 'Dina', 'CUST-001', 'Toko Fisik', 'Bandung', 'Cabang Utama', 'Rani', 1500, 'Supplier A', 5, 0, 0, 0, 0],
  ['2026-06-01', '12:20', 'INV-1002', 'SKU-002', 'Nasi Ayam Geprek', 'Makanan', 'House Brand', 'Pedas', 1, 25000, 0, 5000, 14000, 11000, 25000, 0, 0, 'GoPay', 'Lunas', 'Budi', 'CUST-002', 'GoFood', 'Bandung', 'Cabang Utama', 'Adi', 1000, 'Supplier B', 4, 0, 0, 0, 2500],
  ['2026-06-02', '15:45', 'INV-1003', 'SKU-003', 'Keripik Singkong', 'Cemilan', 'UMKM Lokal', 'Original', 3, 15000, 5000, 10000, 21000, 19000, 45000, 0, 0, 'Transfer', 'Lunas', 'Sari', 'CUST-003', 'Shopee', 'Tangerang', 'Cabang Selatan', 'Maya', 1200, 'Supplier C', 5, 0, 0, 0, 3000],
  ['2026-06-03', '10:30', 'INV-1004', 'SKU-004', 'Cuci Sepatu Premium', 'Jasa', 'Service Pro', 'Deep Clean', 1, 50000, 0, 0, 18000, 32000, 50000, 0, 0, 'Tunai', 'Lunas', 'Rizky', 'CUST-004', 'Toko Fisik', 'Jakarta', 'Cabang Utama', 'Fajar', 5000, 'Supplier Jasa', 5, 60, 0, 0, 0],
];

const guideRows = [
  ['Kolom', 'Wajib', 'Keterangan'],
  ['transaction_date', 'Ya', 'Tanggal transaksi. Gunakan format yyyy-mm-dd.'],
  ['transaction_id', 'Disarankan', 'Nomor invoice atau order. Dipakai untuk menghitung transaksi unik.'],
  ['product_name', 'Ya', 'Nama produk atau layanan yang dijual.'],
  ['category', 'Disarankan', 'Kategori produk untuk analisis portofolio.'],
  ['quantity', 'Disarankan', 'Jumlah item. Jika kosong, aplikasi menganggap 1.'],
  ['sales_amount', 'Ya', 'Total penjualan kotor sebelum pilihan rumus dashboard.'],
  ['cogs', 'Opsional', 'Harga pokok atau modal. Dibutuhkan untuk analisis margin.'],
  ['gross_profit', 'Opsional', 'Laba kotor jika sudah dihitung dari sistem kasir.'],
  ['discount_amount', 'Opsional', 'Nominal diskon atau voucher.'],
  ['return_amount', 'Opsional', 'Nilai retur atau refund.'],
  ['sales_channel', 'Disarankan', 'Toko fisik, marketplace, GoFood, reseller, dan sejenisnya.'],
  ['branch', 'Opsional', 'Cabang, outlet, atau lokasi bisnis.'],
  ['customer_id', 'Opsional', 'ID pelanggan untuk analisis repeat customer.'],
  ['platform_fee', 'Opsional', 'Biaya marketplace atau delivery platform.'],
];

const workbook = Workbook.create();
const template = workbook.worksheets.add('Template Transaksi');
const guide = workbook.worksheets.add('Panduan Kolom');

template.showGridLines = false;
guide.showGridLines = false;

template.getRangeByIndexes(0, 0, sampleRows.length + 1, headers.length).values = [headers, ...sampleRows];
template.getRange('A1:AF1').format = {
  fill: '#276749',
  font: { bold: true, color: '#FFFFFF' },
  wrapText: true,
};
template.getRange('A1:AF5').format.borders = { preset: 'all', style: 'thin', color: '#D8E8DF' };
template.getRange('A:E').format.columnWidthPx = 150;
template.getRange('F:AF').format.columnWidthPx = 120;
template.getRange('A:A').setNumberFormat('yyyy-mm-dd');
template.getRange('I:Q').setNumberFormat('#,##0');
template.getRange('Z:AF').setNumberFormat('#,##0');
template.freezePanes.freezeRows(1);
template.tables.add('A1:AF5', true, 'TemplateTransaksi');

guide.getRangeByIndexes(0, 0, guideRows.length, 3).values = guideRows;
guide.getRange('A1:C1').format = {
  fill: '#276749',
  font: { bold: true, color: '#FFFFFF' },
};
guide.getRange(`A1:C${guideRows.length}`).format.borders = { preset: 'all', style: 'thin', color: '#D8E8DF' };
guide.getRange('A:A').format.columnWidthPx = 160;
guide.getRange('B:B').format.columnWidthPx = 110;
guide.getRange('C:C').format.columnWidthPx = 520;
guide.getRange(`C2:C${guideRows.length}`).format.wrapText = true;
guide.freezePanes.freezeRows(1);
guide.tables.add(`A1:C${guideRows.length}`, true, 'PanduanKolom');

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });

const inspect = await workbook.inspect({
  kind: 'table',
  range: 'Template Transaksi!A1:H5',
  include: 'values,formulas',
  tableMaxRows: 6,
  tableMaxCols: 8,
});
console.log(inspect.ndjson);

const errors = await workbook.inspect({
  kind: 'match',
  searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
  options: { useRegex: true, maxResults: 50 },
  summary: 'formula error scan',
});
console.log(errors.ndjson);

const preview = await workbook.render({
  sheetName: 'Template Transaksi',
  range: 'A1:H5',
  scale: 1,
  format: 'png',
});
await fs.writeFile(path.join(previewDir, 'template-data-umkm-preview.png'), new Uint8Array(await preview.arrayBuffer()));

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
await fs.rm(`${outputPath}.inspect.ndjson`, { force: true });
console.log(outputPath);
