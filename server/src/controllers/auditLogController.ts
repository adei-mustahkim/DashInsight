// DashInsight - Audit Log Controller
import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

// GET /api/admin/audit-logs
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(String(req.query.limit || '50'));
    const offset = parseInt(String(req.query.offset || '0'));
    const { user_id, action } = req.query;

    const where: {
      user_id?: string;
      action?: string;
    } = {};
    if (user_id) where.user_id = String(user_id);
    if (action) where.action = String(action);

    const [logs, total] = await Promise.all([
      prisma.audit_logs.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.audit_logs.count({ where }),
    ]);

    return res.json({ logs, total, limit, offset });
  } catch {
    return res.status(500).json({ error: 'Gagal mengambil audit logs' });
  }
};

// POST /api/admin/audit-logs (for testing)
export const createAuditLog = async (req: Request, res: Response) => {
  try {
    const { user_id, action, description, metadata_json } = req.body;

    const log = await prisma.audit_logs.create({
      data: {
        user_id: user_id ? String(user_id) : null,
        action: String(action),
        description: description ? String(description) : null,
        metadata_json: metadata_json as object || null,
      },
    });

    return res.status(201).json({ log });
  } catch {
    return res.status(500).json({ error: 'Gagal membuat audit log' });
  }
};
