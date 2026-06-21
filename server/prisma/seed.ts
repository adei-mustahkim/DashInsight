// DashInsight - Database Seed (MongoDB)
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('[DashInsight] Seeding database...');

  // 1. Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.users.upsert({
    where: { email: 'admin@dashinsight.id' },
    update: {},
    create: {
      name: 'Admin DashInsight',
      email: 'admin@dashinsight.id',
      password_hash: adminPassword,
      role: 'admin',
      status: 'active',
    },
  });
  console.log(`[DashInsight] Admin user: ${admin.email}`);

  // 2. Create default field dictionary
  const defaultFields = [
    { field_key: 'transaction_date', field_label: 'Tanggal Transaksi', data_type: 'date', is_required_global: true, synonyms_json: ['tanggal', 'tgl', 'order date', 'trx date', 'date'] },
    { field_key: 'transaction_time', field_label: 'Jam Transaksi', data_type: 'time', is_required_global: false, synonyms_json: ['jam', 'waktu', 'time'] },
    { field_key: 'transaction_id', field_label: 'Nomor Transaksi', data_type: 'string', is_required_global: false, synonyms_json: ['invoice', 'no invoice', 'order id'] },
    { field_key: 'product_name', field_label: 'Nama Produk', data_type: 'string', is_required_global: true, synonyms_json: ['produk', 'nama produk', 'barang', 'item', 'menu'] },
    { field_key: 'category', field_label: 'Kategori Produk', data_type: 'string', is_required_global: false, synonyms_json: ['kategori', 'category', 'jenis', 'tipe'] },
    { field_key: 'quantity', field_label: 'Jumlah Barang', data_type: 'number', is_required_global: false, synonyms_json: ['qty', 'quantity', 'jumlah'] },
    { field_key: 'unit_price', field_label: 'Harga Satuan', data_type: 'number', is_required_global: false, synonyms_json: ['harga', 'price', 'harga jual'] },
    { field_key: 'sales_amount', field_label: 'Total Penjualan', data_type: 'number', is_required_global: true, synonyms_json: ['total', 'omzet', 'penjualan', 'revenue', 'amount'] },
    { field_key: 'cogs', field_label: 'Harga Pokok (HPP)', data_type: 'number', is_required_global: false, synonyms_json: ['cogs', 'hpp', 'modal', 'harga beli'] },
    { field_key: 'gross_profit', field_label: 'Laba Kotor', data_type: 'number', is_required_global: false, synonyms_json: ['profit', 'laba', 'laba kotor'] },
    { field_key: 'discount_amount', field_label: 'Diskon', data_type: 'number', is_required_global: false, synonyms_json: ['diskon', 'potongan', 'discount'] },
    { field_key: 'return_amount', field_label: 'Nilai Retur', data_type: 'number', is_required_global: false, synonyms_json: ['retur', 'refund', 'return'] },
    { field_key: 'payment_method', field_label: 'Metode Pembayaran', data_type: 'label', is_required_global: false, synonyms_json: ['pembayaran', 'payment', 'cara bayar'] },
    { field_key: 'sales_channel', field_label: 'Channel Penjualan', data_type: 'label', is_required_global: false, synonyms_json: ['channel', 'marketplace', 'platform'] },
    { field_key: 'branch', field_label: 'Cabang', data_type: 'label', is_required_global: false, synonyms_json: ['cabang', 'toko', 'outlet', 'lokasi'] },
    { field_key: 'staff_name', field_label: 'Nama Staff', data_type: 'label', is_required_global: false, synonyms_json: ['staff', 'kasir', 'karyawan'] },
    { field_key: 'customer_name', field_label: 'Nama Pelanggan', data_type: 'label', is_required_global: false, synonyms_json: ['customer', 'pelanggan', 'pembeli'] },
    { field_key: 'customer_id', field_label: 'ID Pelanggan', data_type: 'string', is_required_global: false, synonyms_json: ['id pelanggan', 'customer id', 'member id'] },
    { field_key: 'destination_city', field_label: 'Kota Tujuan', data_type: 'label', is_required_global: false, synonyms_json: ['kota', 'city', 'tujuan'] },
    { field_key: 'brand', field_label: 'Merek / Brand', data_type: 'label', is_required_global: false, synonyms_json: ['merek', 'brand', 'merk'] },
    { field_key: 'supplier', field_label: 'Supplier', data_type: 'label', is_required_global: false, synonyms_json: ['supplier', 'pemasok', 'vendor'] },
    { field_key: 'rating', field_label: 'Rating', data_type: 'number', is_required_global: false, synonyms_json: ['rating', 'penilaian', 'bintang'] },
    { field_key: 'duration_mins', field_label: 'Durasi (Menit)', data_type: 'number', is_required_global: false, synonyms_json: ['durasi', 'menit', 'waktu layanan'] },
    { field_key: 'staff_commission', field_label: 'Komisi Staff', data_type: 'number', is_required_global: false, synonyms_json: ['komisi', 'insentif', 'bonus'] },
    { field_key: 'shipping_fee', field_label: 'Biaya Kirim', data_type: 'number', is_required_global: false, synonyms_json: ['ongkir', 'biaya kirim', 'shipping'] },
    { field_key: 'tax', field_label: 'Pajak / PPN', data_type: 'number', is_required_global: false, synonyms_json: ['ppn', 'pajak', 'tax'] },
    { field_key: 'platform_fee', field_label: 'Biaya Platform', data_type: 'number', is_required_global: false, synonyms_json: ['fee platform', 'biaya aplikasi', 'mdr'] },
    { field_key: 'promo_code', field_label: 'Kode Promo / Voucher', data_type: 'label', is_required_global: false, synonyms_json: ['kode promo', 'promo code', 'voucher code', 'kode voucher', 'kupon', 'coupon', 'kode diskon'] },
    { field_key: 'customer_type', field_label: 'Tipe Pelanggan', data_type: 'label', is_required_global: false, synonyms_json: ['tipe pelanggan', 'customer type', 'member type', 'jenis pelanggan', 'membership', 'grup pelanggan', 'tipe member', 'kategori pelanggan'] },
    { field_key: 'variant', field_label: 'Varian Produk', data_type: 'label', is_required_global: false, synonyms_json: ['varian', 'variant', 'ukuran', 'size', 'warna', 'color', 'rasa', 'flavour', 'model'] },
    { field_key: 'payment_status', field_label: 'Status Pesanan', data_type: 'label', is_required_global: false, synonyms_json: ['status pesanan', 'payment status', 'status pembayaran', 'status', 'order status', 'status trx', 'status order'] },
    { field_key: 'expense_amount', field_label: 'Beban Operasional Lain', data_type: 'number', is_required_global: false, synonyms_json: ['pengeluaran', 'operational expense', 'biaya operasional', 'beban', 'expense', 'opex', 'pengeluaran lain', 'biaya opex', 'biaya lain'] },
    { field_key: 'order_type', field_label: 'Tipe Pesanan', data_type: 'label', is_required_global: false, synonyms_json: ['tipe order', 'order type', 'layanan', 'dine in', 'takeaway', 'delivery', 'tipe layanan', 'jenis layanan'] },
    { field_key: 'payment_provider', field_label: 'Penyedia Pembayaran', data_type: 'label', is_required_global: false, synonyms_json: ['penyedia pembayaran', 'payment provider', 'bank', 'shopeepay', 'gopay', 'ovo', 'bca', 'mandiri', 'dana', 'linkaja', 'qris', 'tunai', 'cash', 'gateway', 'payment gateway'] },
    { field_key: 'shipping_courier', field_label: 'Kurir Pengiriman', data_type: 'label', is_required_global: false, synonyms_json: ['kurir pengiriman', 'kurir', 'ekspedisi', 'courier', 'shipping courier', 'jne', 'jnt', 'sicepat', 'gosend', 'grabexpress', 'pos', 'tiki', 'wahana', 'anteraja'] },
    { field_key: 'table_number', field_label: 'Nomor Meja', data_type: 'string', is_required_global: false, synonyms_json: ['nomor meja', 'no meja', 'meja', 'table number', 'table no', 'table', 'nomor meja/area'] },
  ];

  for (const field of defaultFields) {
    await prisma.field_dictionary.upsert({
      where: { field_key: field.field_key },
      update: field,
      create: field,
    });
  }
  console.log(`[DashInsight] Field dictionary: ${defaultFields.length} fields`);

  // 3. Create default formula templates
  const formulas = [
    {
      formula_code: 'TOTAL_REVENUE',
      formula_name: 'Total Revenue',
      description: 'Total omzet penjualan kotor',
      category: 'kpi',
      output_type: 'currency',
      formula_type: 'aggregation',
      formula_json: { type: 'aggregation', operation: 'SUM', field: 'sales_amount' },
      status: 'active',
    },
    {
      formula_code: 'NET_REVENUE',
      formula_name: 'Net Revenue',
      description: 'Omzet bersih setelah retur',
      category: 'kpi',
      output_type: 'currency',
      formula_type: 'derived',
      formula_json: {
        type: 'derived',
        operation: 'SUBTRACT',
        left: { operation: 'SUM', field: 'sales_amount' },
        right: { operation: 'SUM', field: 'return_amount' },
      },
      status: 'active',
    },
    {
      formula_code: 'TOTAL_TRANSACTIONS',
      formula_name: 'Total Transaksi',
      description: 'Jumlah transaksi unik',
      category: 'kpi',
      output_type: 'number',
      formula_type: 'aggregation',
      formula_json: { type: 'aggregation', operation: 'COUNT_DISTINCT', field: 'transaction_id' },
      status: 'active',
    },
    {
      formula_code: 'AOV',
      formula_name: 'Average Order Value',
      description: 'Rata-rata nilai per transaksi',
      category: 'kpi',
      output_type: 'currency',
      formula_type: 'derived',
      formula_json: {
        type: 'derived',
        operation: 'DIVIDE',
        left: { operation: 'SUM', field: 'sales_amount' },
        right: { operation: 'COUNT_DISTINCT', field: 'transaction_id' },
      },
      status: 'active',
    },
    {
      formula_code: 'PROFIT_MARGIN',
      formula_name: 'Profit Margin',
      description: 'Persentase laba terhadap omzet',
      category: 'margin',
      output_type: 'percent',
      formula_type: 'derived',
      formula_json: {
        type: 'derived',
        operation: 'MULTIPLY',
        left: {
          operation: 'DIVIDE',
          left: {
            operation: 'SUBTRACT',
            left: { operation: 'SUM', field: 'sales_amount' },
            right: { operation: 'SUM', field: 'cogs' },
          },
          right: { operation: 'SUM', field: 'sales_amount' },
        },
        right: 100,
      },
      status: 'active',
    },
    { formula_code: 'GROSS_PROFIT', formula_name: 'Laba Kotor', description: 'Total laba kotor', category: 'kpi', output_type: 'currency', formula_type: 'aggregation', formula_json: { type: 'aggregation', operation: 'SUM', field: 'gross_profit' }, status: 'active' },
    { formula_code: 'TOTAL_DISCOUNT', formula_name: 'Total Diskon', description: 'Total potongan harga', category: 'kpi', output_type: 'currency', formula_type: 'aggregation', formula_json: { type: 'aggregation', operation: 'SUM', field: 'discount_amount' }, status: 'active' },
    { formula_code: 'TOTAL_SHIPPING', formula_name: 'Total Ongkir', description: 'Total biaya pengiriman', category: 'kpi', output_type: 'currency', formula_type: 'aggregation', formula_json: { type: 'aggregation', operation: 'SUM', field: 'shipping_fee' }, status: 'active' },
    { formula_code: 'TOTAL_COMMISSION', formula_name: 'Komisi Staff', description: 'Total komisi staff', category: 'kpi', output_type: 'currency', formula_type: 'aggregation', formula_json: { type: 'aggregation', operation: 'SUM', field: 'staff_commission' }, status: 'active' },
    { formula_code: 'TOTAL_TAX', formula_name: 'Pajak / PPN', description: 'Total pajak', category: 'kpi', output_type: 'currency', formula_type: 'aggregation', formula_json: { type: 'aggregation', operation: 'SUM', field: 'tax' }, status: 'active' },
    { formula_code: 'TOTAL_SERVICE_CHARGE', formula_name: 'Service Charge', description: 'Total biaya layanan', category: 'kpi', output_type: 'currency', formula_type: 'aggregation', formula_json: { type: 'aggregation', operation: 'SUM', field: 'service_charge' }, status: 'active' },
    { formula_code: 'TOTAL_PLATFORM_FEE', formula_name: 'Fee Platform', description: 'Total biaya platform', category: 'kpi', output_type: 'currency', formula_type: 'aggregation', formula_json: { type: 'aggregation', operation: 'SUM', field: 'platform_fee' }, status: 'active' },
    { formula_code: 'AVERAGE_RATING', formula_name: 'Rata-rata Rating', description: 'Rata-rata penilaian pelanggan', category: 'kpi', output_type: 'number', formula_type: 'aggregation', formula_json: { type: 'aggregation', operation: 'AVG', field: 'rating' }, status: 'active' },
    { formula_code: 'TOTAL_UNITS', formula_name: 'Unit Terjual', description: 'Total jumlah barang', category: 'kpi', output_type: 'number', formula_type: 'aggregation', formula_json: { type: 'aggregation', operation: 'SUM', field: 'quantity' }, status: 'active' },
    { formula_code: 'TOTAL_CUSTOMERS', formula_name: 'Pelanggan', description: 'Jumlah pelanggan unik', category: 'kpi', output_type: 'number', formula_type: 'aggregation', formula_json: { type: 'aggregation', operation: 'COUNT_DISTINCT', field: 'customer_id' }, status: 'active' },
    { formula_code: 'DATA_ROWS', formula_name: 'Data Terpakai', description: 'Jumlah baris data', category: 'kpi', output_type: 'number', formula_type: 'aggregation', formula_json: { type: 'aggregation', operation: 'COUNT', field: 'sales_amount' }, status: 'active' },
    {
      formula_code: 'NET_PROFIT',
      formula_name: 'Net Profit',
      description: 'Laba bersih setelah beban opex dan platform fee',
      category: 'kpi',
      output_type: 'currency',
      formula_type: 'derived',
      formula_json: {
        type: 'derived',
        operation: 'SUBTRACT',
        left: {
          operation: 'SUBTRACT',
          left: { operation: 'SUM', field: 'gross_profit' },
          right: { operation: 'SUM', field: 'platform_fee' }
        },
        right: { operation: 'SUM', field: 'expense_amount' }
      },
      status: 'active',
    },
    {
      formula_code: 'OPEX_RATIO',
      formula_name: 'Opex Ratio',
      description: 'Rasio beban operasional terhadap omzet kotor',
      category: 'margin',
      output_type: 'percent',
      formula_type: 'derived',
      formula_json: {
        type: 'derived',
        operation: 'PERCENTAGE',
        left: { operation: 'SUM', field: 'expense_amount' },
        right: { operation: 'SUM', field: 'sales_amount' }
      },
      status: 'active',
    },
    {
      formula_code: 'DISCOUNT_RATE',
      formula_name: 'Discount Rate',
      description: 'Rasio potongan harga terhadap omzet kotor',
      category: 'margin',
      output_type: 'percent',
      formula_type: 'derived',
      formula_json: {
        type: 'derived',
        operation: 'PERCENTAGE',
        left: { operation: 'SUM', field: 'discount_amount' },
        right: { operation: 'SUM', field: 'sales_amount' }
      },
      status: 'active',
    },
    {
      formula_code: 'REVENUE_PER_STAFF',
      formula_name: 'Revenue per Staff',
      description: 'Rata-rata omzet penjualan per staff',
      category: 'kpi',
      output_type: 'currency',
      formula_type: 'derived',
      formula_json: {
        type: 'derived',
        operation: 'DIVIDE',
        left: { operation: 'SUM', field: 'sales_amount' },
        right: { operation: 'COUNT_DISTINCT', field: 'staff_name' }
      },
      status: 'active',
    },
    {
      formula_code: 'AUP',
      formula_name: 'Average Unit Price',
      description: 'Rata-rata harga jual per unit produk',
      category: 'kpi',
      output_type: 'currency',
      formula_type: 'derived',
      formula_json: {
        type: 'derived',
        operation: 'DIVIDE',
        left: { operation: 'SUM', field: 'sales_amount' },
        right: { operation: 'SUM', field: 'quantity' }
      },
      status: 'active',
    },
    {
      formula_code: 'RETURN_RATE',
      formula_name: 'Return Rate',
      description: 'Rasio nilai retur barang terhadap omzet kotor',
      category: 'margin',
      output_type: 'percent',
      formula_type: 'derived',
      formula_json: {
        type: 'derived',
        operation: 'PERCENTAGE',
        left: { operation: 'SUM', field: 'return_amount' },
        right: { operation: 'SUM', field: 'sales_amount' }
      },
      status: 'active',
    },
  ];

  for (const formula of formulas) {
    const existing = await prisma.formula_templates.findUnique({ where: { formula_code: formula.formula_code } });
    if (!existing) {
      await prisma.formula_templates.create({
        data: { ...formula, created_by: admin.id },
      });
    }
  }
  console.log(`[DashInsight] Formula templates: ${formulas.length} formulas`);

  // 4. Create default chart templates
  const fieldTypeByKey = Object.fromEntries(defaultFields.map(field => [field.field_key, field.data_type]));
  const formulaByCode = new Map(
    (await prisma.formula_templates.findMany()).map(formula => [formula.formula_code, formula])
  );

  // 4. Create default KPI templates. Only definitions live in the database;
  // values are always evaluated against each client's local dataset.
  const kpis = [
    { kpi_code: 'TOTAL_REVENUE', kpi_name: 'Omzet', description: 'Total nilai penjualan', formula: 'TOTAL_REVENUE', display_format: 'currency', icon: 'TrendingUp', tone: 'emerald', default_order: 1 },
    { kpi_code: 'NET_REVENUE', kpi_name: 'Net Revenue', description: 'Omzet setelah retur', formula: 'NET_REVENUE', display_format: 'currency', icon: 'TrendingUp', tone: 'emerald', default_order: 2 },
    { kpi_code: 'TOTAL_TRANSACTIONS', kpi_name: 'Transaksi', description: 'Jumlah transaksi unik', formula: 'TOTAL_TRANSACTIONS', display_format: 'number', icon: 'ShoppingBag', tone: 'blue', default_order: 3 },
    { kpi_code: 'AOV', kpi_name: 'Rata-rata Order', description: 'Nilai rata-rata per transaksi', formula: 'AOV', display_format: 'currency', icon: 'Target', tone: 'amber', default_order: 4 },
    { kpi_code: 'PROFIT_MARGIN', kpi_name: 'Profit Margin', description: 'Persentase laba terhadap omzet', formula: 'PROFIT_MARGIN', display_format: 'percent', icon: 'Activity', tone: 'emerald', default_order: 5 },
    { kpi_code: 'GROSS_PROFIT', kpi_name: 'Laba Kotor', description: 'Total laba kotor', formula: 'GROSS_PROFIT', display_format: 'currency', icon: 'Activity', tone: 'emerald', default_order: 6 },
    { kpi_code: 'TOTAL_DISCOUNT', kpi_name: 'Diskon', description: 'Potongan harga', formula: 'TOTAL_DISCOUNT', display_format: 'currency', icon: 'Tag', tone: 'rose', default_order: 7 },
    { kpi_code: 'TOTAL_SHIPPING', kpi_name: 'Ongkir', description: 'Biaya pengiriman', formula: 'TOTAL_SHIPPING', display_format: 'currency', icon: 'Truck', tone: 'orange', default_order: 8 },
    { kpi_code: 'TOTAL_COMMISSION', kpi_name: 'Komisi Staff', description: 'Insentif staff', formula: 'TOTAL_COMMISSION', display_format: 'currency', icon: 'Award', tone: 'blue', default_order: 9 },
    { kpi_code: 'TOTAL_TAX', kpi_name: 'Pajak / PPN', description: 'Pajak dikenakan', formula: 'TOTAL_TAX', display_format: 'currency', icon: 'FileText', tone: 'slate', default_order: 10 },
    { kpi_code: 'TOTAL_SERVICE_CHARGE', kpi_name: 'Service Charge', description: 'Biaya layanan', formula: 'TOTAL_SERVICE_CHARGE', display_format: 'currency', icon: 'FileText', tone: 'slate', default_order: 11 },
    { kpi_code: 'TOTAL_PLATFORM_FEE', kpi_name: 'Fee Platform', description: 'Biaya aplikasi', formula: 'TOTAL_PLATFORM_FEE', display_format: 'currency', icon: 'FileText', tone: 'slate', default_order: 12 },
    { kpi_code: 'AVERAGE_RATING', kpi_name: 'Rating', description: 'Rata-rata ulasan', formula: 'AVERAGE_RATING', display_format: 'number', icon: 'Target', tone: 'amber', default_order: 13 },
    { kpi_code: 'TOTAL_UNITS', kpi_name: 'Unit Terjual', description: 'Total unit terjual', formula: 'TOTAL_UNITS', display_format: 'number', icon: 'Package', tone: 'violet', default_order: 14 },
    { kpi_code: 'TOTAL_CUSTOMERS', kpi_name: 'Pelanggan', description: 'Pelanggan unik', formula: 'TOTAL_CUSTOMERS', display_format: 'number', icon: 'Users', tone: 'cyan', default_order: 15 },
    { kpi_code: 'DATA_ROWS', kpi_name: 'Data Terpakai', description: 'Baris setelah filter', formula: 'DATA_ROWS', display_format: 'number', icon: 'Activity', tone: 'slate', default_order: 16 },
    { kpi_code: 'NET_PROFIT', kpi_name: 'Net Profit', description: 'Laba bersih setelah opex', formula: 'NET_PROFIT', display_format: 'currency', icon: 'TrendingUp', tone: 'emerald', default_order: 17 },
    { kpi_code: 'OPEX_RATIO', kpi_name: 'Opex Ratio', description: 'Rasio operasional terhadap omzet', formula: 'OPEX_RATIO', display_format: 'percent', icon: 'Activity', tone: 'rose', default_order: 18 },
    { kpi_code: 'DISCOUNT_RATE', kpi_name: 'Discount Rate', description: 'Persentase diskon', formula: 'DISCOUNT_RATE', display_format: 'percent', icon: 'Tag', tone: 'orange', default_order: 19 },
    { kpi_code: 'REVENUE_PER_STAFF', kpi_name: 'Omzet per Staff', description: 'Rata-rata omzet per karyawan', formula: 'REVENUE_PER_STAFF', display_format: 'currency', icon: 'Users', tone: 'blue', default_order: 20 },
    { kpi_code: 'AUP', kpi_name: 'Harga Unit Rata-rata', description: 'Rata-rata harga per barang', formula: 'AUP', display_format: 'currency', icon: 'Target', tone: 'amber', default_order: 21 },
    { kpi_code: 'RETURN_RATE', kpi_name: 'Return Rate', description: 'Tingkat retur barang', formula: 'RETURN_RATE', display_format: 'percent', icon: 'Activity', tone: 'rose', default_order: 22 },
  ];
  for (const kpi of kpis) {
    const formula = formulaByCode.get(kpi.formula);
    if (!formula) continue;
    await prisma.kpi_templates.upsert({
      where: { kpi_code: kpi.kpi_code },
      update: {},
      create: {
        kpi_code: kpi.kpi_code, kpi_name: kpi.kpi_name, description: kpi.description,
        formula_template_id: formula.id, display_format: kpi.display_format,
        icon: kpi.icon, tone: kpi.tone, default_order: kpi.default_order,
        status: 'active', created_by: admin.id,
      },
    });
  }
  console.log(`[DashInsight] KPI templates: ${kpis.length} KPIs`);

  // 5. Create default chart templates
  const chartField = (fieldKey: string, fieldRole: string, isRequired = true) => ({
    field_role: fieldRole,
    field_label: fieldKey,
    required_data_type: fieldTypeByKey[fieldKey] || 'string',
    is_required: isRequired,
    allow_multiple: false,
  });

  const charts = [
    {
      chart_code: 'REVENUE_TREND', chart_name: 'Revenue Trend & Transaction Momentum', chart_type: 'line', chart_category: 'trend', default_size: 12, default_order: 1,
      fields: [chartField('transaction_date', 'x'), chartField('sales_amount', 'y'), chartField('transaction_id', 'label', false)],
      formulas: ['TOTAL_REVENUE', 'TOTAL_TRANSACTIONS'],
    },
    {
      chart_code: 'TOP_PRODUCTS', chart_name: 'Product Revenue Drivers', chart_type: 'bar', chart_category: 'comparison', default_size: 6, default_order: 2,
      fields: [chartField('product_name', 'x'), chartField('sales_amount', 'y'), chartField('quantity', 'size', false)],
      formulas: ['TOTAL_REVENUE'],
    },
    {
      chart_code: 'CATEGORY_MIX', chart_name: 'Category Revenue Mix', chart_type: 'doughnut', chart_category: 'composition', default_size: 6, default_order: 3,
      fields: [chartField('category', 'label'), chartField('sales_amount', 'y')],
      formulas: ['TOTAL_REVENUE'],
    },
    {
      chart_code: 'WEEKDAY_SALES', chart_name: 'Revenue by Day of Week', chart_type: 'bar', chart_category: 'distribution', default_size: 4, default_order: 4,
      fields: [chartField('transaction_date', 'x'), chartField('sales_amount', 'y')],
      formulas: ['TOTAL_REVENUE'],
    },
    {
      chart_code: 'PAYMENT_MIX', chart_name: 'Payment Method Mix', chart_type: 'doughnut', chart_category: 'composition', default_size: 4, default_order: 5,
      fields: [chartField('payment_method', 'label'), chartField('sales_amount', 'y')],
      formulas: ['TOTAL_REVENUE'],
    },
    {
      chart_code: 'BRANCH_PERF', chart_name: 'Branch / Outlet Performance Analysis', chart_type: 'bar', chart_category: 'comparison', default_size: 6, default_order: 6,
      fields: [chartField('branch', 'x'), chartField('sales_amount', 'y')],
      formulas: ['TOTAL_REVENUE'],
    },
    {
      chart_code: 'PARETO', chart_name: 'Revenue Concentration Analysis (Pareto 80/20)', chart_type: 'bar', chart_category: 'comparison', default_size: 12, default_order: 7,
      fields: [chartField('product_name', 'x'), chartField('sales_amount', 'y')],
      formulas: ['TOTAL_REVENUE'],
    },
    {
      chart_code: 'PRODUCT_MATRIX', chart_name: 'Product Portfolio Matrix (Volume vs Margin)', chart_type: 'scatter', chart_category: 'distribution', default_size: 12, default_order: 8,
      fields: [chartField('product_name', 'label'), chartField('quantity', 'x'), chartField('gross_profit', 'y', false), chartField('sales_amount', 'size')],
      formulas: ['TOTAL_REVENUE', 'PROFIT_MARGIN'],
    },
    {
      chart_code: 'PROMO_ROI', chart_name: 'Promo Cost vs Net Revenue', chart_type: 'bar', chart_category: 'comparison', default_size: 6, default_order: 9,
      fields: [chartField('promo_code', 'x'), chartField('discount_amount', 'y'), chartField('sales_amount', 'y')],
      formulas: ['TOTAL_REVENUE', 'TOTAL_DISCOUNT'],
    },
    {
      chart_code: 'COURIER_EFFICIENCY', chart_name: 'Courier Revenue vs Fees', chart_type: 'bar', chart_category: 'comparison', default_size: 6, default_order: 10,
      fields: [chartField('shipping_courier', 'x'), chartField('shipping_fee', 'y'), chartField('sales_amount', 'y')],
      formulas: ['TOTAL_REVENUE', 'TOTAL_SHIPPING'],
    },
    {
      chart_code: 'VARIANT_PROFITABILITY', chart_name: 'Variant Margin vs Volume Matrix', chart_type: 'scatter', chart_category: 'distribution', default_size: 6, default_order: 11,
      fields: [chartField('variant', 'label'), chartField('cogs', 'x'), chartField('quantity', 'y'), chartField('sales_amount', 'size')],
      formulas: ['TOTAL_REVENUE', 'PROFIT_MARGIN'],
    },
  ];

  for (const chart of charts) {
    const { fields, formulas: attachedFormulaCodes, ...chartData } = chart;
    const template = await prisma.chart_templates.upsert({
      where: { chart_code: chart.chart_code },
      update: chartData,
      create: { ...chartData, created_by: admin.id },
    });

    await prisma.chart_fields.deleteMany({ where: { chart_template_id: template.id } });
    await prisma.chart_fields.createMany({
      data: fields.map(field => ({ ...field, chart_template_id: template.id })),
    });

    await prisma.chart_template_formulas.deleteMany({ where: { chart_template_id: template.id } });
    const formulaLinks = attachedFormulaCodes
      .map((formulaCode, index) => {
        const formula = formulaByCode.get(formulaCode);
        if (!formula) return null;
        return {
          chart_template_id: template.id,
          formula_template_id: formula.id,
          formula_role: index === 0 ? 'primary' : 'secondary',
          is_required: index === 0,
          sort_order: index,
        };
      })
      .filter((link): link is NonNullable<typeof link> => Boolean(link));
    if (formulaLinks.length) {
      await prisma.chart_template_formulas.createMany({ data: formulaLinks });
    }
  }
  console.log(`[DashInsight] Chart templates: ${charts.length} charts`);

  console.log('[DashInsight] Seeding completed!');
}

main()
  .catch((e) => {
    console.error('[DashInsight] Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
