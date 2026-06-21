// DashInsight - Chart Template Controller
import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';

// GET /api/admin/chart-templates
export const getChartTemplates = async (_req: Request, res: Response) => {
  try {
    const templates = await prisma.chart_templates.findMany({
      orderBy: { default_order: 'asc' },
      include: {
        chart_fields: true,
        chart_template_formulas: {
          include: {
            formula_template: true,
          },
        },
      },
    });
    return res.json({ templates });
  } catch {
    return res.status(500).json({ error: 'Gagal mengambil chart templates' });
  }
};

// POST /api/admin/chart-templates
export const createChartTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const {
      chart_code, chart_name, description, chart_type, chart_category,
      business_type, default_size, default_order, status, fields, formulas
    } = req.body;

    if (!chart_code || !chart_name || !chart_type) {
      return res.status(400).json({ error: 'chart_code, chart_name, dan chart_type wajib diisi' });
    }

    // Check if chart_code already exists
    const existing = await prisma.chart_templates.findUnique({ where: { chart_code: String(chart_code) } });
    if (existing) {
      return res.status(409).json({ error: 'chart_code sudah digunakan' });
    }

    const template = await prisma.chart_templates.create({
      data: {
        chart_code: String(chart_code),
        chart_name: String(chart_name),
        description: description ? String(description) : null,
        chart_type: String(chart_type),
        chart_category: chart_category ? String(chart_category) : null,
        business_type: business_type ? String(business_type) : null,
        default_size: default_size ? Number(default_size) : 6,
        default_order: default_order ? Number(default_order) : 100,
        status: status ? String(status) : 'active',
        created_by: req.user?.id,
        chart_fields: fields && Array.isArray(fields) ? {
          create: fields.map((f) => ({
            field_role: String(f.field_role),
            field_label: String(f.field_label),
            required_data_type: f.required_data_type ? String(f.required_data_type) : null,
            is_required: Boolean(f.is_required),
            allow_multiple: Boolean(f.allow_multiple),
          })),
        } : undefined,
        chart_template_formulas: formulas && Array.isArray(formulas) ? {
          create: formulas.map((f, index) => ({
            formula_template_id: String(f.formula_template_id),
            formula_role: String(f.formula_role || 'primary'),
            is_required: Boolean(f.is_required),
            sort_order: Number(f.sort_order ?? index),
          })),
        } : undefined,
      },
      include: {
        chart_fields: true,
        chart_template_formulas: {
          include: { formula_template: true },
        },
      },
    });

    return res.status(201).json({ template });
  } catch {
    return res.status(500).json({ error: 'Gagal membuat chart template' });
  }
};

// GET /api/admin/chart-templates/:id
export const getChartTemplateById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const template = await prisma.chart_templates.findUnique({
      where: { id },
      include: {
        chart_fields: true,
        chart_template_formulas: {
          include: {
            formula_template: true,
          },
        },
      },
    });

    if (!template) {
      return res.status(404).json({ error: 'Chart template tidak ditemukan' });
    }

    return res.json({ template });
  } catch {
    return res.status(500).json({ error: 'Gagal mengambil chart template' });
  }
};

// PUT /api/admin/chart-templates/:id
export const updateChartTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const {
      chart_name, description, chart_type, chart_category, business_type,
      default_size, default_order, fields, formulas
    } = req.body;

    await prisma.chart_templates.update({
      where: { id },
      data: {
        chart_name: chart_name ? String(chart_name) : undefined,
        description: description !== undefined ? (description ? String(description) : null) : undefined,
        chart_type: chart_type ? String(chart_type) : undefined,
        chart_category: chart_category !== undefined ? (chart_category ? String(chart_category) : null) : undefined,
        business_type: business_type !== undefined ? (business_type ? String(business_type) : null) : undefined,
        default_size: default_size ? Number(default_size) : undefined,
        default_order: default_order ? Number(default_order) : undefined,
      },
    });

    // Update fields if provided
    if (fields && Array.isArray(fields)) {
      // Delete existing fields
      await prisma.chart_fields.deleteMany({ where: { chart_template_id: id } });

      // Create new fields
      await prisma.chart_fields.createMany({
        data: fields.map((f) => ({
          chart_template_id: id,
          field_role: String(f.field_role),
          field_label: String(f.field_label),
          required_data_type: f.required_data_type ? String(f.required_data_type) : null,
          is_required: Boolean(f.is_required),
          allow_multiple: Boolean(f.allow_multiple),
        })),
      });
    }

    if (formulas && Array.isArray(formulas)) {
      await prisma.chart_template_formulas.deleteMany({ where: { chart_template_id: id } });
      if (formulas.length > 0) {
        await prisma.chart_template_formulas.createMany({
          data: formulas.map((f, index) => ({
            chart_template_id: id,
            formula_template_id: String(f.formula_template_id),
            formula_role: String(f.formula_role || 'primary'),
            is_required: Boolean(f.is_required),
            sort_order: Number(f.sort_order ?? index),
          })),
        });
      }
    }

    const updated = await prisma.chart_templates.findUnique({
      where: { id },
      include: {
        chart_fields: true,
        chart_template_formulas: {
          include: { formula_template: true },
        },
      },
    });

    return res.json({ template: updated });
  } catch {
    return res.status(500).json({ error: 'Gagal mengupdate chart template' });
  }
};

// PATCH /api/admin/chart-templates/:id/status
export const updateChartTemplateStatus = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const { status } = req.body;

    if (!['active', 'inactive', 'archived'].includes(String(status))) {
      return res.status(400).json({ error: 'Status tidak valid' });
    }

    const template = await prisma.chart_templates.update({
      where: { id },
      data: { status: String(status) },
    });

    return res.json({ template });
  } catch {
    return res.status(500).json({ error: 'Gagal mengupdate status chart template' });
  }
};

// DELETE /api/admin/chart-templates/:id
export const deleteChartTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    await prisma.chart_templates.delete({ where: { id } });
    return res.json({ message: 'Chart template dihapus' });
  } catch {
    return res.status(500).json({ error: 'Gagal menghapus chart template' });
  }
};
