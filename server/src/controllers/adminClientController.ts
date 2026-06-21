// DashInsight - Admin Client Controller
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { config } from '../config/index.js';
import { prisma } from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';

// GET /api/admin/clients
export const getClients = async (req: Request, res: Response) => {
  try {
    const clients = await prisma.clients.findMany({ orderBy: { created_at: 'desc' } });

    const enrichedClients = await Promise.all(
      clients.map(async (client) => {
        const user = await prisma.users.findUnique({
          where: { id: client.user_id },
          select: { id: true, email: true, last_login_at: true },
        });
        const datasetCount = await prisma.dataset_metadata.count({ where: { client_id: client.id } });
        return { ...client, user, datasetCount };
      })
    );

    return res.json({ clients: enrichedClients });
  } catch {
    return res.status(500).json({ error: 'Gagal mengambil data client' });
  }
};

// POST /api/admin/clients
export const createClient = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, business_name, business_type, owner_name, phone, address, duration_days } = req.body;

    if (!name || !email || !password || !business_name || !business_type || !owner_name) {
      return res.status(400).json({ error: 'Field wajib harus diisi' });
    }

    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) return res.status(409).json({ error: 'Email sudah terdaftar' });

    const password_hash = await bcrypt.hash(password, config.bcryptRounds);
    const active_until = new Date();
    active_until.setDate(active_until.getDate() + (duration_days || 30));

    const user = await prisma.users.create({
      data: { name, email, password_hash, role: 'client', status: 'active' },
    });

    const client = await prisma.clients.create({
      data: {
        user_id: user.id, business_name, business_type, owner_name, phone, address,
        status: 'active', active_until, created_by_admin_id: req.user?.id,
      },
    });

    await prisma.client_subscriptions.create({
      data: {
        client_id: client.id, start_date: new Date(), end_date: active_until,
        duration_days: duration_days || 30, status: 'active', created_by_admin_id: req.user?.id,
      },
    });

    await prisma.audit_logs.create({
      data: { user_id: req.user?.id, action: 'create_client', description: `Created client: ${business_name}`, metadata_json: { client_id: client.id, email } },
    });

    return res.status(201).json({ client, user: { id: user.id, name, email, role: 'client' } });
  } catch (err) {
    console.error('Create client error:', err);
    return res.status(500).json({ error: 'Gagal membuat client' });
  }
};

// GET /api/admin/clients/:id
export const getClientById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const client = await prisma.clients.findUnique({ where: { id } });
    if (!client) return res.status(404).json({ error: 'Client tidak ditemukan' });

    const user = await prisma.users.findUnique({
      where: { id: client.user_id },
      select: { id: true, email: true, last_login_at: true },
    });

    const subscriptions = await prisma.client_subscriptions.findMany({
      where: { client_id: client.id }, orderBy: { created_at: 'desc' }, take: 5,
    });

    const datasets = await prisma.dataset_metadata.findMany({
      where: { client_id: client.id }, orderBy: { created_at: 'desc' },
    });

    return res.json({ client: { ...client, user, subscriptions, datasets } });
  } catch {
    return res.status(500).json({ error: 'Gagal mengambil data client' });
  }
};

// PUT /api/admin/clients/:id
export const updateClient = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const { business_name, business_type, owner_name, phone, address } = req.body;

    const client = await prisma.clients.update({
      where: { id }, data: { business_name, business_type, owner_name, phone, address },
    });

    await prisma.audit_logs.create({
      data: { user_id: req.user?.id, action: 'update_client', description: `Updated client: ${client.business_name}`, metadata_json: { client_id: id } },
    });

    return res.json({ client });
  } catch {
    return res.status(500).json({ error: 'Gagal mengupdate client' });
  }
};

// PATCH /api/admin/clients/:id/status
export const updateClientStatus = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid' });
    }

    const client = await prisma.clients.findUnique({ where: { id } });
    if (!client) return res.status(404).json({ error: 'Client tidak ditemukan' });

    // Jika status diubah ke 'active' dan belum ada active_until, set default 30 hari
    const updateData: Record<string, unknown> = { status };
    if (status === 'active' && (!client.active_until || client.active_until < new Date())) {
      const newActiveUntil = new Date();
      newActiveUntil.setDate(newActiveUntil.getDate() + 30);
      updateData.active_until = newActiveUntil;

      // Buat subscription record
      await prisma.client_subscriptions.create({
        data: {
          client_id: id, start_date: new Date(), end_date: newActiveUntil,
          duration_days: 30, status: 'active', created_by_admin_id: req.user?.id,
        },
      });
    }

    const updatedClient = await prisma.clients.update({ where: { id }, data: updateData });

    await prisma.users.update({
      where: { id: client.user_id }, data: { status },
    });

    await prisma.audit_logs.create({
      data: { user_id: req.user?.id, action: 'update_client_status', description: `Changed client ${client.business_name} status to ${status}`, metadata_json: { client_id: id, new_status: status } },
    });

    return res.json({ client: updatedClient });
  } catch {
    return res.status(500).json({ error: 'Gagal mengupdate status client' });
  }
};

// PATCH /api/admin/clients/:id/extend
export const extendClient = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const { duration_days } = req.body;

    if (!duration_days || duration_days <= 0) {
      return res.status(400).json({ error: 'Durasi harus lebih dari 0 hari' });
    }

    const client = await prisma.clients.findUnique({ where: { id } });
    if (!client) return res.status(404).json({ error: 'Client tidak ditemukan' });

    const baseDate = client.active_until && client.active_until > new Date()
      ? client.active_until
      : new Date();
    const newActiveUntil = new Date(baseDate);
    newActiveUntil.setDate(newActiveUntil.getDate() + duration_days);

    const updatedClient = await prisma.clients.update({
      where: { id },
      data: { active_until: newActiveUntil, status: 'active' },
    });

    await prisma.users.update({
      where: { id: client.user_id }, data: { status: 'active' },
    });

    await prisma.client_subscriptions.create({
      data: {
        client_id: id, start_date: new Date(), end_date: newActiveUntil,
        duration_days, status: 'active', created_by_admin_id: req.user?.id,
      },
    });

    await prisma.audit_logs.create({
      data: { user_id: req.user?.id, action: 'extend_client', description: `Extended client ${client.business_name} by ${duration_days} days`, metadata_json: { client_id: id, duration_days, new_active_until: newActiveUntil } },
    });

    return res.json({ client: updatedClient });
  } catch {
    return res.status(500).json({ error: 'Gagal memperpanjang masa aktif' });
  }
};

// POST /api/admin/clients/:id/reset-password
export const resetClientPassword = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }

    const client = await prisma.clients.findUnique({ where: { id } });
    if (!client) return res.status(404).json({ error: 'Client tidak ditemukan' });

    const password_hash = await bcrypt.hash(new_password, config.bcryptRounds);

    await prisma.users.update({ where: { id: client.user_id }, data: { password_hash } });

    await prisma.audit_logs.create({
      data: { user_id: req.user?.id, action: 'reset_password', description: `Reset password for client: ${client.business_name}`, metadata_json: { client_id: id } },
    });

    return res.json({ message: 'Password berhasil direset' });
  } catch {
    return res.status(500).json({ error: 'Gagal reset password' });
  }
};
