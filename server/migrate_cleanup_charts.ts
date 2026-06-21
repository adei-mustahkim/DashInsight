// Migration: Hapus chart templates yang tidak dipertahankan
// Jalankan: npx tsx migrate_cleanup_charts.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 11 chart codes yang dipertahankan (sama dengan BUILT_IN_TEMPLATE_CODES di frontend)
const KEEP_CODES = [
  'REVENUE_TREND',
  'TOP_PRODUCTS',
  'CATEGORY_MIX',
  'PARETO',
  'PRODUCT_MATRIX',
  'PROMO_ROI',
  'COURIER_EFFICIENCY',
  'VARIANT_PROFITABILITY',
  'BRANCH_PERF',
  'PAYMENT_MIX',
  'WEEKDAY_SALES',
];

async function main() {
  console.log('=== Chart Cleanup Migration ===');
  console.log(`Dipertahankan: ${KEEP_CODES.length} chart codes`);
  console.log(`Codes: ${KEEP_CODES.join(', ')}\n`);

  // 1. Lihat chart yang akan dihapus
  const toDelete = await prisma.chart_templates.findMany({
    where: {
      chart_code: { notIn: KEEP_CODES },
    },
    select: { id: true, chart_code: true, chart_name: true },
  });

  console.log(`Chart yang akan dihapus: ${toDelete.length}`);
  toDelete.forEach(c => console.log(`  - ${c.chart_code}: ${c.chart_name}`));

  if (toDelete.length === 0) {
    console.log('\nTidak ada chart yang perlu dihapus.');
    return;
  }

  // 2. Hapus chart_fields dan chart_template_formulas (cascade via DB constraint)
  // Tapi kita handle manual untuk safety
  const deleteIds = toDelete.map(c => c.id);

  const deletedFields = await prisma.chart_fields.deleteMany({
    where: { chart_template_id: { in: deleteIds } },
  });
  console.log(`\nDeleted ${deletedFields.count} chart_fields`);

  const deletedFormulas = await prisma.chart_template_formulas.deleteMany({
    where: { chart_template_id: { in: deleteIds } },
  });
  console.log(`Deleted ${deletedFormulas.count} chart_template_formulas`);

  const deletedCharts = await prisma.chart_templates.deleteMany({
    where: { chart_code: { notIn: KEEP_CODES } },
  });
  console.log(`Deleted ${deletedCharts.count} chart_templates`);

  // 3. Verify
  const remaining = await prisma.chart_templates.count();
  console.log(`\nSisa chart di database: ${remaining}`);
  console.log('=== Migration selesai ===');
}

main()
  .catch(e => {
    console.error('Migration error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
