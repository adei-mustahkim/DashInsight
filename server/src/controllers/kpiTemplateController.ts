import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

const includeFormula = { formula_template: true } as const;

export async function getKpiTemplates(_req: Request, res: Response) {
  try {
    const templates = await prisma.kpi_templates.findMany({ include: includeFormula, orderBy: { default_order: 'asc' } });
    return res.json({ templates });
  } catch {
    return res.status(500).json({ error: 'Gagal mengambil KPI templates' });
  }
}

export async function createKpiTemplate(req: Request, res: Response) {
  try {
    const { kpi_code, kpi_name, description, formula_template_id, display_format, icon, tone, default_order, status } = req.body;
    if (!kpi_code || !kpi_name || !formula_template_id) return res.status(400).json({ error: 'Kode, nama, dan formula KPI wajib diisi' });
    const template = await prisma.kpi_templates.create({
      data: {
        kpi_code: String(kpi_code).trim().toUpperCase(), kpi_name: String(kpi_name).trim(),
        description: description || null, formula_template_id: String(formula_template_id),
        display_format: display_format || 'number', icon: icon || 'Activity', tone: tone || 'emerald',
        default_order: Number(default_order) || 100, status: status || 'active',
      },
      include: includeFormula,
    });
    return res.status(201).json({ template });
  } catch {
    return res.status(500).json({ error: 'Gagal membuat KPI template' });
  }
}

export async function updateKpiTemplate(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const { kpi_name, description, formula_template_id, display_format, icon, tone, default_order, status } = req.body;
    const template = await prisma.kpi_templates.update({
      where: { id },
      data: { kpi_name, description: description || null, formula_template_id, display_format, icon, tone, default_order: Number(default_order), status },
      include: includeFormula,
    });
    return res.json({ template });
  } catch {
    return res.status(500).json({ error: 'Gagal memperbarui KPI template' });
  }
}

export async function updateKpiTemplateStatus(req: Request, res: Response) {
  try {
    const template = await prisma.kpi_templates.update({ where: { id: String(req.params.id) }, data: { status: String(req.body.status) }, include: includeFormula });
    return res.json({ template });
  } catch {
    return res.status(500).json({ error: 'Gagal mengubah status KPI template' });
  }
}

export async function deleteKpiTemplate(req: Request, res: Response) {
  try {
    await prisma.kpi_templates.delete({ where: { id: String(req.params.id) } });
    return res.json({ message: 'KPI template dihapus' });
  } catch {
    return res.status(500).json({ error: 'Gagal menghapus KPI template' });
  }
}
