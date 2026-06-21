import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Migrating 12 legacy charts to Chart Library...');
  
  const legacyCharts = [
    {
      chart_name: 'Penjualan per Jam',
      chart_code: 'HOURLY_SALES',
      description: 'Tren penjualan berdasarkan jam sibuk',
      chart_type: 'bar',
      status: 'active',
      fields: [
        { field_label: 'name', field_role: 'x', required_data_type: 'string' },
        { field_label: 'value', field_role: 'y', required_data_type: 'number' }
      ]
    },
    {
      chart_name: 'Penjualan per Hari',
      chart_code: 'WEEKDAY_SALES',
      description: 'Tren penjualan berdasarkan hari dalam seminggu',
      chart_type: 'bar',
      status: 'active',
      fields: [
        { field_label: 'name', field_role: 'x', required_data_type: 'string' },
        { field_label: 'value', field_role: 'y', required_data_type: 'number' }
      ]
    },
    {
      chart_name: 'Penjualan per Kategori',
      chart_code: 'CATEGORY_SALES',
      description: 'Kontribusi omzet dari setiap kategori produk',
      chart_type: 'bar',
      status: 'active',
      fields: [
        { field_label: 'name', field_role: 'x', required_data_type: 'string' },
        { field_label: 'value', field_role: 'y', required_data_type: 'number' }
      ]
    },
    {
      chart_name: 'Performa Promo',
      chart_code: 'PROMO_CAMPAIGN',
      description: 'Analisis efektivitas campaign promo',
      chart_type: 'composed',
      status: 'active',
      fields: [
        { field_label: 'name', field_role: 'x', required_data_type: 'string' },
        { field_label: 'sales', field_role: 'y_bar', required_data_type: 'number' },
        { field_label: 'transactions', field_role: 'y_line', required_data_type: 'number' }
      ]
    },
    {
      chart_name: 'Segmen Pelanggan',
      chart_code: 'CUSTOMER_SEGMENT',
      description: 'Porsi tipe pelanggan',
      chart_type: 'pie',
      status: 'active',
      fields: [
        { field_label: 'name', field_role: 'x', required_data_type: 'string' },
        { field_label: 'value', field_role: 'y', required_data_type: 'number' }
      ]
    },
    {
      chart_name: 'Status Pemenuhan',
      chart_code: 'ORDER_FULFILLMENT',
      description: 'Status penyelesaian pesanan',
      chart_type: 'pie',
      status: 'active',
      fields: [
        { field_label: 'name', field_role: 'x', required_data_type: 'string' },
        { field_label: 'value', field_role: 'y', required_data_type: 'number' }
      ]
    },
    {
      chart_name: 'Efisiensi Kurir',
      chart_code: 'COURIER_EFFICIENCY',
      description: 'Performa kecepatan pengiriman tiap kurir',
      chart_type: 'composed',
      status: 'active',
      fields: [
        { field_label: 'name', field_role: 'x', required_data_type: 'string' },
        { field_label: 'avgTime', field_role: 'y_bar', required_data_type: 'number' },
        { field_label: 'orders', field_role: 'y_line', required_data_type: 'number' }
      ]
    },
    {
      chart_name: 'Pendapatan Meja',
      chart_code: 'TABLE_REVENUE',
      description: 'Peringkat omzet meja Dine-In',
      chart_type: 'horizontal_bar',
      status: 'active',
      fields: [
        { field_label: 'name', field_role: 'x', required_data_type: 'string' },
        { field_label: 'value', field_role: 'y', required_data_type: 'number' }
      ]
    },
    {
      chart_name: 'Promo ROI & Margin',
      chart_code: 'PROMO_ROI',
      description: 'Kesehatan margin dan Return on Investment Promo',
      chart_type: 'composed',
      status: 'active',
      fields: [
        { field_label: 'name', field_role: 'x', required_data_type: 'string' },
        { field_label: 'roi', field_role: 'y_bar', required_data_type: 'number' },
        { field_label: 'margin', field_role: 'y_line', required_data_type: 'number' }
      ]
    },
    {
      chart_name: 'Profitabilitas Varian',
      chart_code: 'VARIANT_PROFITABILITY',
      description: 'Pemetaan margin vs kuantitas (Scatter Plot)',
      chart_type: 'scatter',
      status: 'active',
      fields: [
        { field_label: 'name', field_role: 'label', required_data_type: 'string' },
        { field_label: 'qty', field_role: 'x', required_data_type: 'number' },
        { field_label: 'margin', field_role: 'y', required_data_type: 'number' },
        { field_label: 'revenue', field_role: 'z', required_data_type: 'number' }
      ]
    },
    {
      chart_name: 'Metode Pembayaran',
      chart_code: 'PAYMENT_PROVIDER',
      description: 'Distribusi penyedia pembayaran per tanggal',
      chart_type: 'crosstab',
      status: 'active',
      fields: [
        { field_label: 'name', field_role: 'x', required_data_type: 'string' }
      ]
    },
    {
      chart_name: 'Customer Loyalty Mix',
      chart_code: 'CUSTOMER_LOYALTY',
      description: 'Rasio Pelanggan Baru vs Lama',
      chart_type: 'crosstab',
      status: 'active',
      fields: [
        { field_label: 'name', field_role: 'x', required_data_type: 'string' }
      ]
    }
  ];

  // Try to find a formula template (fallback for basic chart insertion)
  const formulas = await prisma.formula_templates.findMany();
  const formulaId = formulas.length > 0 ? formulas[0].id : null;

  for (const chart of legacyCharts) {
    const exists = await prisma.chart_templates.findFirst({
      where: { chart_code: chart.chart_code }
    });
    if (exists) {
      console.log(`Skipping ${chart.chart_code}, already exists.`);
      continue;
    }

    await prisma.chart_templates.create({
      data: {
        chart_name: chart.chart_name,
        chart_code: chart.chart_code,
        description: chart.description,
        chart_type: chart.chart_type,
        status: chart.status,
        chart_fields: {
          create: chart.fields
        }
      }
    });
    console.log(`Created ${chart.chart_code}`);
  }

  console.log('Migration complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
