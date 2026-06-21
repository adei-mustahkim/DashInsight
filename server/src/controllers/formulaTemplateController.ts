// DashInsight - Formula Template Controller
import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';

type FormulaNode = number | {
  operation?: string;
  field?: string;
  left?: FormulaNode;
  right?: FormulaNode;
};

type FormulaRow = Record<string, unknown>;

const asNumber = (value: unknown) => {
  const number = typeof value === 'string' ? Number(value.replace(/[^0-9.-]/g, '')) : Number(value);
  return Number.isFinite(number) ? number : 0;
};

const validateFormulaNode = (node: unknown): void => {
  if (typeof node === 'number') return;
  if (!node || typeof node !== 'object' || Array.isArray(node)) throw new Error('Node formula harus berupa object atau number');
  const formula = node as Exclude<FormulaNode, number>;
  const operation = String(formula.operation || '').toUpperCase();
  const allowed = ['SUM', 'COUNT', 'COUNT_DISTINCT', 'AVG', 'MIN', 'MAX', 'SUBTRACT', 'DIVIDE', 'MULTIPLY', 'PERCENTAGE', 'RANK', 'CUMULATIVE_SUM'];
  if (!allowed.includes(operation)) throw new Error(`Operation ${operation || '(kosong)'} tidak didukung`);
  if (['SUM', 'COUNT_DISTINCT', 'AVG', 'MIN', 'MAX'].includes(operation) && !formula.field) throw new Error(`${operation} membutuhkan field`);
  if (['SUBTRACT', 'DIVIDE', 'MULTIPLY', 'PERCENTAGE'].includes(operation)) {
    if (formula.left === undefined || formula.right === undefined) throw new Error(`${operation} membutuhkan left dan right`);
    validateFormulaNode(formula.left);
    validateFormulaNode(formula.right);
  }
};

const evaluateFormulaNode = (node: FormulaNode, rows: FormulaRow[]): number => {
  if (typeof node === 'number') return node;
  const operation = String(node.operation || '').toUpperCase();
  const values = node.field ? rows.map(row => asNumber(row[node.field!])) : [];
  if (operation === 'SUM') return values.reduce((total, value) => total + value, 0);
  if (operation === 'COUNT') return node.field ? rows.filter(row => row[node.field!] !== null && row[node.field!] !== undefined && row[node.field!] !== '').length : rows.length;
  if (operation === 'COUNT_DISTINCT') return new Set(rows.map(row => String(row[node.field!] ?? '')).filter(Boolean)).size;
  if (operation === 'AVG') return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
  if (operation === 'MIN') return values.length ? Math.min(...values) : 0;
  if (operation === 'MAX') return values.length ? Math.max(...values) : 0;
  const left = evaluateFormulaNode(node.left!, rows);
  const right = evaluateFormulaNode(node.right!, rows);
  if (operation === 'SUBTRACT') return left - right;
  if (operation === 'MULTIPLY') return left * right;
  if (operation === 'DIVIDE') return right === 0 ? 0 : left / right;
  if (operation === 'PERCENTAGE') return right === 0 ? 0 : (left / right) * 100;
  throw new Error(`${operation} memerlukan konteks ranking dan belum dapat dievaluasi sebagai angka tunggal`);
};
// GET /api/admin/formula-templates
export const getFormulaTemplates = async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const where = status ? { status } : {};

    const templates = await prisma.formula_templates.findMany({
      where,
      orderBy: { formula_name: 'asc' },
    });
    return res.json({ templates });
  } catch {
    return res.status(500).json({ error: 'Gagal mengambil formula templates' });
  }
};

// POST /api/admin/formula-templates
export const createFormulaTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const {
      formula_code, formula_name, description, category, output_type,
      formula_type, formula_json, status
    } = req.body;

    if (!formula_code || !formula_name || !formula_type || !formula_json) {
      return res.status(400).json({ error: 'formula_code, formula_name, formula_type, dan formula_json wajib diisi' });
    }

    // Check if formula_code already exists
    const existing = await prisma.formula_templates.findUnique({ where: { formula_code: String(formula_code) } });
    if (existing) {
      return res.status(409).json({ error: 'formula_code sudah digunakan' });
    }

    // Validate formula_json is valid JSON object
    if (typeof formula_json !== 'object' || formula_json === null) {
      return res.status(400).json({ error: 'formula_json harus berupa object JSON' });
    }

    const template = await prisma.formula_templates.create({
      data: {
        formula_code: String(formula_code),
        formula_name: String(formula_name),
        description: description ? String(description) : null,
        category: category ? String(category) : null,
        output_type: output_type ? String(output_type) : 'number',
        formula_type: String(formula_type),
        formula_json: formula_json as object,
        status: status ? String(status) : 'draft',
        created_by: req.user?.id,
      },
    });

    return res.status(201).json({ template });
  } catch {
    return res.status(500).json({ error: 'Gagal membuat formula template' });
  }
};

// GET /api/admin/formula-templates/:id
export const getFormulaTemplateById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const template = await prisma.formula_templates.findUnique({
      where: { id },
      include: {
        chart_template_formulas: {
          include: {
            chart_template: true,
          },
        },
      },
    });

    if (!template) {
      return res.status(404).json({ error: 'Formula template tidak ditemukan' });
    }

    return res.json({ template });
  } catch {
    return res.status(500).json({ error: 'Gagal mengambil formula template' });
  }
};

// PUT /api/admin/formula-templates/:id
export const updateFormulaTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const {
      formula_name, description, category, output_type,
      formula_type, formula_json
    } = req.body;

    // Check if formula is active and being modified
    const existing = await prisma.formula_templates.findUnique({ where: { id } });
    if (existing?.status === 'active') {
      return res.status(400).json({
        error: 'Formula active tidak boleh diedit langsung. Buat version baru.'
      });
    }

    const template = await prisma.formula_templates.update({
      where: { id },
      data: {
        formula_name: formula_name ? String(formula_name) : undefined,
        description: description ? String(description) : undefined,
        category: category ? String(category) : undefined,
        output_type: output_type ? String(output_type) : undefined,
        formula_type: formula_type ? String(formula_type) : undefined,
        formula_json: formula_json ? formula_json as object : undefined,
      },
    });

    return res.json({ template });
  } catch {
    return res.status(500).json({ error: 'Gagal mengupdate formula template' });
  }
};

// PATCH /api/admin/formula-templates/:id/status
export const updateFormulaTemplateStatus = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const { status } = req.body;

    if (!['draft', 'active', 'inactive', 'archived'].includes(String(status))) {
      return res.status(400).json({ error: 'Status tidak valid' });
    }

    const template = await prisma.formula_templates.update({
      where: { id },
      data: { status: String(status) },
    });

    return res.json({ template });
  } catch {
    return res.status(500).json({ error: 'Gagal mengupdate status formula template' });
  }
};

// POST /api/admin/formula-templates/:id/test
export const testFormulaTemplate = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const template = await prisma.formula_templates.findUnique({ where: { id } });
    if (!template) {
      return res.status(404).json({ error: 'Formula template tidak ditemukan' });
    }

    const formula = template.formula_json as FormulaNode;
    validateFormulaNode(formula);
    const input = req.body?.test_data;
    const rows = Array.isArray(input) ? input : (input && Array.isArray(input.rows) ? input.rows : []);
    const evaluated = rows.length ? evaluateFormulaNode(formula, rows as FormulaRow[]) : null;
    const result = {
      success: true,
      formula: template.formula_json,
      result: evaluated,
      message: rows.length ? `Formula berhasil diuji pada ${rows.length} baris` : 'Formula berhasil divalidasi; tambahkan test_data untuk menghitung hasil',
    };

    return res.json({ test: result });
  } catch {
    return res.status(500).json({ error: 'Gagal menguji formula template' });
  }
};

// POST /api/admin/formula-templates/:id/publish
export const publishFormulaTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);

    const template = await prisma.formula_templates.findUnique({ where: { id } });
    if (!template) {
      return res.status(404).json({ error: 'Formula template tidak ditemukan' });
    }

    if (template.status === 'archived') {
      return res.status(400).json({ error: 'Formula archived tidak bisa dipublish' });
    }

    const updated = await prisma.formula_templates.update({
      where: { id },
      data: { status: 'active' },
    });

    return res.json({ template: updated });
  } catch {
    return res.status(500).json({ error: 'Gagal mempublish formula template' });
  }
};

// POST /api/admin/formula-templates/:id/version
export const createFormulaVersion = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const { formula_json } = req.body;

    const existing = await prisma.formula_templates.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Formula template tidak ditemukan' });
    }

    const newVersion = await prisma.formula_templates.create({
      data: {
        formula_code: `${existing.formula_code}_v${existing.version + 1}`,
        formula_name: existing.formula_name,
        description: existing.description,
        category: existing.category,
        output_type: existing.output_type,
        formula_type: existing.formula_type,
        formula_json: formula_json || existing.formula_json as object,
        status: 'draft',
        version: existing.version + 1,
        created_by: req.user?.id,
      },
    });

    return res.status(201).json({ template: newVersion });
  } catch {
    return res.status(500).json({ error: 'Gagal membuat version baru' });
  }
};

// DELETE /api/admin/formula-templates/:id
export const deleteFormulaTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);

    // Check if referenced by KPI templates
    const kpiCount = await prisma.kpi_templates.count({
      where: { formula_template_id: id }
    });

    if (kpiCount > 0) {
      return res.status(400).json({
        error: 'Formula template ini tidak dapat dihapus karena sedang digunakan oleh satu atau lebih KPI template.'
      });
    }

    // Delete
    await prisma.formula_templates.delete({
      where: { id }
    });

    return res.json({ message: 'Formula template berhasil dihapus permanen' });
  } catch (error) {
    return res.status(500).json({ error: 'Gagal menghapus formula template' });
  }
};
