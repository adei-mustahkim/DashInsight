import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching formula templates...');
  const formulas = await prisma.formula_templates.findMany();
  if (formulas.length === 0) {
    console.log('No formulas found. Cannot attach metric.');
    return;
  }
  
  // Ambil formula pertama sebagai contoh (misal: gross profit atau total sales)
  const metricFormula = formulas[0];
  console.log('Selected metric for circular progress:', metricFormula.formula_name);

  console.log('Creating ChartTemplate for Circular Progress...');
  const chart = await prisma.chart_templates.create({
    data: {
      chart_code: 'CIRCULAR_PROGRESS_DEMO',
      chart_name: 'Pencapaian Target (Contoh)',
      description: 'Grafik target pencapaian Circular Progress menggunakan 1 metric.',
      chart_type: 'circular_progress',
      chart_category: 'metric',
      business_type: 'General',
      default_size: 4,
      default_order: 10,
      status: 'active',
      version: 1,
      chart_fields: {
        create: [
          {
            field_role: 'y',
            field_label: 'Nilai Target',
            required_data_type: 'number',
            is_required: true,
            allow_multiple: false
          }
        ]
      },
      chart_template_formulas: {
        create: [
          {
            formula_template_id: metricFormula.id,
            formula_role: 'primary',
            is_required: true,
            sort_order: 0
          }
        ]
      }
    }
  });
  
  console.log('Successfully created chart:', chart.chart_code);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
