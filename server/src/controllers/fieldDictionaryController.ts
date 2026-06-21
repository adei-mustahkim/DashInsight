// DashInsight - Field Dictionary Controller
import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

// GET /api/admin/field-dictionary
export const getFieldDictionary = async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const where = status ? { status } : {};

    const fields = await prisma.field_dictionary.findMany({
      where,
      orderBy: { field_key: 'asc' },
    });
    return res.json({ fields });
  } catch {
    return res.status(500).json({ error: 'Gagal mengambil field dictionary' });
  }
};

// POST /api/admin/field-dictionary
export const createFieldDictionary = async (req: Request, res: Response) => {
  try {
    const {
      field_key, field_label, data_type, description,
      is_required_global, synonyms_json, status
    } = req.body;

    if (!field_key || !field_label || !data_type) {
      return res.status(400).json({ error: 'field_key, field_label, dan data_type wajib diisi' });
    }

    // Check if field_key already exists
    const existing = await prisma.field_dictionary.findUnique({ where: { field_key: String(field_key) } });
    if (existing) {
      return res.status(409).json({ error: 'field_key sudah digunakan' });
    }

    const field = await prisma.field_dictionary.create({
      data: {
        field_key: String(field_key),
        field_label: String(field_label),
        data_type: String(data_type),
        description: description ? String(description) : null,
        is_required_global: Boolean(is_required_global),
        synonyms_json: synonyms_json && Array.isArray(synonyms_json) ? synonyms_json as string[] : [],
        status: status ? String(status) : 'active',
      },
    });

    return res.status(201).json({ field });
  } catch {
    return res.status(500).json({ error: 'Gagal membuat field dictionary' });
  }
};

// GET /api/admin/field-dictionary/:id
export const getFieldDictionaryById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const field = await prisma.field_dictionary.findUnique({ where: { id } });

    if (!field) {
      return res.status(404).json({ error: 'Field dictionary tidak ditemukan' });
    }

    return res.json({ field });
  } catch {
    return res.status(500).json({ error: 'Gagal mengambil field dictionary' });
  }
};

// PUT /api/admin/field-dictionary/:id
export const updateFieldDictionary = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const {
      field_label, data_type, description,
      is_required_global, synonyms_json
    } = req.body;

    const field = await prisma.field_dictionary.update({
      where: { id },
      data: {
        field_label: field_label ? String(field_label) : undefined,
        data_type: data_type ? String(data_type) : undefined,
        description: description !== undefined ? (description ? String(description) : null) : undefined,
        is_required_global: is_required_global !== undefined ? Boolean(is_required_global) : undefined,
        synonyms_json: synonyms_json && Array.isArray(synonyms_json) ? synonyms_json as string[] : undefined,
      },
    });

    return res.json({ field });
  } catch {
    return res.status(500).json({ error: 'Gagal mengupdate field dictionary' });
  }
};

// PATCH /api/admin/field-dictionary/:id/status
export const updateFieldDictionaryStatus = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { status } = req.body;

    if (!['active', 'inactive'].includes(String(status))) {
      return res.status(400).json({ error: 'Status tidak valid' });
    }

    const field = await prisma.field_dictionary.update({
      where: { id },
      data: { status: String(status) },
    });

    return res.json({ field });
  } catch {
    return res.status(500).json({ error: 'Gagal mengupdate status field dictionary' });
  }
};

// DELETE /api/admin/field-dictionary/:id
export const deleteFieldDictionary = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await prisma.field_dictionary.delete({ where: { id } });
    return res.json({ message: 'Field dictionary dihapus' });
  } catch {
    return res.status(500).json({ error: 'Gagal menghapus field dictionary' });
  }
};
