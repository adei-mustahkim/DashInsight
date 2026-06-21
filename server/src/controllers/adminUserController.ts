// DashInsight - Admin User Management Controller
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { config } from '../config/index.js';
import { prisma } from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';

// GET /api/admin/admins
export const getAdmins = async (req: Request, res: Response) => {
  try {
    const admins = await prisma.users.findMany({
      where: { role: 'admin' },
      select: { id: true, name: true, email: true, status: true, last_login_at: true, created_at: true },
      orderBy: { created_at: 'desc' },
    });
    return res.json({ admins });
  } catch {
    return res.status(500).json({ error: 'Gagal mengambil data admin' });
  }
};

// POST /api/admin/admins
export const createAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nama, email, dan password wajib diisi' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }

    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email sudah terdaftar' });
    }

    const password_hash = await bcrypt.hash(password, config.bcryptRounds);

    const admin = await prisma.users.create({
      data: { name, email, password_hash, role: 'admin', status: 'active' },
      select: { id: true, name: true, email: true, role: true, status: true, created_at: true },
    });

    await prisma.audit_logs.create({
      data: {
        user_id: req.user?.id,
        action: 'create_admin',
        description: `Admin baru ditambahkan: ${name} (${email})`,
        metadata_json: { new_admin_id: admin.id, email },
      },
    });

    return res.status(201).json({ admin });
  } catch (err) {
    console.error('Create admin error:', err);
    return res.status(500).json({ error: 'Gagal membuat admin' });
  }
};

// PUT /api/admin/admins/:id
export const updateAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const { name, email, status } = req.body;

    if (id === req.user?.id) {
      return res.status(400).json({ error: 'Tidak dapat mengubah akun sendiri' });
    }

    const existing = await prisma.users.findUnique({ where: { id } });
    if (!existing || existing.role !== 'admin') {
      return res.status(404).json({ error: 'Admin tidak ditemukan' });
    }

    if (email && email !== existing.email) {
      const emailTaken = await prisma.users.findUnique({ where: { email } });
      if (emailTaken) {
        return res.status(409).json({ error: 'Email sudah digunakan' });
      }
    }

    const updated = await prisma.users.update({
      where: { id },
      data: { name, email, status },
      select: { id: true, name: true, email: true, role: true, status: true, created_at: true },
    });

    await prisma.audit_logs.create({
      data: {
        user_id: req.user?.id,
        action: 'update_admin',
        description: `Admin diperbarui: ${updated.name}`,
        metadata_json: { admin_id: id },
      },
    });

    return res.json({ admin: updated });
  } catch (err) {
    console.error('Update admin error:', err);
    return res.status(500).json({ error: 'Gagal mengupdate admin' });
  }
};

// POST /api/admin/admins/:id/reset-password
export const resetAdminPassword = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }

    const target = await prisma.users.findUnique({ where: { id } });
    if (!target || target.role !== 'admin') {
      return res.status(404).json({ error: 'Admin tidak ditemukan' });
    }

    const password_hash = await bcrypt.hash(new_password, config.bcryptRounds);
    await prisma.users.update({ where: { id }, data: { password_hash } });

    await prisma.audit_logs.create({
      data: {
        user_id: req.user?.id,
        action: 'reset_admin_password',
        description: `Password admin direset: ${target.email}`,
        metadata_json: { admin_id: id },
      },
    });

    return res.json({ message: 'Password berhasil direset' });
  } catch (err) {
    console.error('Reset admin password error:', err);
    return res.status(500).json({ error: 'Gagal reset password admin' });
  }
};
