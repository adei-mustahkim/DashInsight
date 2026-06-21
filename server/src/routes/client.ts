// DashInsight - Client Routes (MongoDB)
import { Router } from 'express';
import { authMiddleware, requireActiveClient, AuthRequest } from '../middlewares/auth.js';
import { prisma } from '../config/prisma.js';

const router = Router();

// All client routes require auth + active client
router.use(authMiddleware, requireActiveClient);

// GET /api/client/profile
router.get('/profile', async (req: AuthRequest, res) => {
  try {
    const client = await prisma.clients.findUnique({
      where: { user_id: req.user!.id },
    });

    if (!client) return res.status(404).json({ error: 'Client tidak ditemukan' });

    const datasets = await prisma.dataset_metadata.findMany({
      where: { client_id: client.id },
      orderBy: { created_at: 'desc' },
    });

    return res.json({ client: { ...client, datasets } });
  } catch {
    return res.status(500).json({ error: 'Gagal mengambil profil' });
  }
});

// GET /api/client/chart-templates
router.get('/chart-templates', async (req: AuthRequest, res) => {
  try {
    const charts = await prisma.chart_templates.findMany({
      where: { status: 'active' },
      orderBy: { default_order: 'asc' },
    });

    // Enrich with fields and formulas
    const enrichedCharts = await Promise.all(
      charts.map(async (chart) => {
        const chart_fields = await prisma.chart_fields.findMany({
          where: { chart_template_id: chart.id },
        });
        const chart_template_formulas = await prisma.chart_template_formulas.findMany({
          where: { chart_template_id: chart.id },
        });

        // Get formula details
        const formulas = await Promise.all(
          chart_template_formulas.map(async (link) => {
            const formula = await prisma.formula_templates.findUnique({
              where: { id: link.formula_template_id },
            });
            return { ...link, formula_template: formula };
          })
        );

        return { ...chart, chart_fields, chart_template_formulas: formulas };
      })
    );

    return res.json({ charts: enrichedCharts });
  } catch {
    return res.status(500).json({ error: 'Gagal mengambil chart templates' });
  }
});

// GET /api/client/formula-templates
router.get('/formula-templates', async (req: AuthRequest, res) => {
  try {
    const formulas = await prisma.formula_templates.findMany({
      where: { status: 'active' },
      orderBy: { formula_name: 'asc' },
    });
    return res.json({ formulas });
  } catch {
    return res.status(500).json({ error: 'Gagal mengambil formula templates' });
  }
});

// GET /api/client/kpi-templates
router.get('/kpi-templates', async (_req: AuthRequest, res) => {
  try {
    const kpis = await prisma.kpi_templates.findMany({
      where: { status: 'active' },
      include: { formula_template: true },
      orderBy: { default_order: 'asc' },
    });
    return res.json({ kpis });
  } catch {
    return res.status(500).json({ error: 'Gagal mengambil KPI templates' });
  }
});

// GET /api/client/field-dictionary
router.get('/field-dictionary', async (req: AuthRequest, res) => {
  try {
    const fields = await prisma.field_dictionary.findMany({
      where: { status: 'active' },
      orderBy: { field_key: 'asc' },
    });
    return res.json({ fields });
  } catch {
    return res.status(500).json({ error: 'Gagal mengambil field dictionary' });
  }
});

// GET /api/client/dataset-metadata
router.get('/dataset-metadata', async (req: AuthRequest, res) => {
  try {
    const client = await prisma.clients.findUnique({
      where: { user_id: req.user!.id },
      select: { id: true },
    });
    if (!client) return res.status(404).json({ error: 'Client tidak ditemukan' });

    const datasets = await prisma.dataset_metadata.findMany({
      where: { client_id: client.id },
      orderBy: { created_at: 'desc' },
    });
    return res.json({ datasets });
  } catch {
    return res.status(500).json({ error: 'Gagal mengambil dataset metadata' });
  }
});

// POST /api/client/dataset-metadata
router.post('/dataset-metadata', async (req: AuthRequest, res) => {
  try {
    const client = await prisma.clients.findUnique({
      where: { user_id: req.user!.id },
      select: { id: true },
    });
    if (!client) return res.status(404).json({ error: 'Client tidak ditemukan' });

    const { dataset_name, file_name, row_count, column_count, business_type, workspace_local_id } = req.body;

    const dataset = await prisma.dataset_metadata.create({
      data: {
        client_id: client.id,
        dataset_name,
        file_name,
        row_count,
        column_count,
        business_type,
        workspace_local_id,
      },
    });

    return res.status(201).json({ dataset });
  } catch {
    return res.status(500).json({ error: 'Gagal menyimpan dataset metadata' });
  }
});

// PUT /api/client/dataset-metadata/:id
router.put('/dataset-metadata/:id', async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id);
    const { dataset_name, last_opened_at } = req.body;

    const dataset = await prisma.dataset_metadata.update({
      where: { id },
      data: {
        dataset_name,
        last_opened_at: last_opened_at ? new Date(last_opened_at) : undefined,
      },
    });

    return res.json({ dataset });
  } catch {
    return res.status(500).json({ error: 'Gagal mengupdate dataset metadata' });
  }
});

// DELETE /api/client/dataset-metadata/:id
router.delete('/dataset-metadata/:id', async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id);
    await prisma.dataset_metadata.delete({ where: { id } });
    return res.json({ message: 'Dataset metadata dihapus' });
  } catch {
    return res.status(500).json({ error: 'Gagal menghapus dataset metadata' });
  }
});

export default router;
