// DashInsight - Auth Controller
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';

// POST /api/auth/register (publik)
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, business_name, business_type, phone, address } = req.body;

    if (!name || !email || !password || !business_name || !business_type) {
      return res.status(400).json({ error: 'Field wajib harus diisi' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }

    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email sudah terdaftar' });
    }

    const password_hash = await bcrypt.hash(password, config.bcryptRounds);

    const user = await prisma.users.create({
      data: {
        name,
        email,
        password_hash,
        role: 'client',
        status: 'inactive',
      },
    });

    const client = await prisma.clients.create({
      data: {
        user_id: user.id,
        business_name,
        business_type,
        owner_name: name,
        phone: phone || null,
        address: address || null,
        status: 'inactive',
      },
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        user_id: user.id,
        action: 'register',
        description: `Client baru mendaftar: ${business_name} (${email})`,
        metadata_json: { client_id: client.id, email, business_name, business_type },
      },
    });

    return res.status(201).json({
      message: 'Pendaftaran berhasil. Menunggu approval admin.',
      client: { id: client.id, business_name, status: 'inactive' },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password harus diisi' });
    }

    const user = await prisma.users.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Akun Anda telah ditangguhkan' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    await prisma.users.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    await prisma.audit_logs.create({
      data: {
        user_id: user.id,
        action: 'login',
        description: `${user.email} logged in`,
      },
    });

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as jwt.SignOptions);

    let client = null;
    let clientActive = true;
    let clientExpiredMessage = '';

    if (user.role === 'client') {
      client = await prisma.clients.findUnique({ where: { user_id: user.id } });

      if (client) {
        if (client.status === 'suspended') {
          clientActive = false;
          clientExpiredMessage = 'Akun Anda telah ditangguhkan';
        } else if (client.status === 'inactive') {
          clientActive = false;
          clientExpiredMessage = 'Akun Anda belum aktif. Menunggu approval admin.';
        } else if (client.active_until && client.active_until < new Date()) {
          clientActive = false;
          clientExpiredMessage = 'Masa aktif akun Anda telah berakhir';
        }
      }
    }

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      client,
      clientActive,
      clientExpiredMessage,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

// POST /api/auth/logout
export const logout = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user) {
      await prisma.audit_logs.create({
        data: {
          user_id: req.user.id,
          action: 'logout',
          description: `${req.user.email} logged out`,
        },
      });
    }
    return res.json({ message: 'Logout berhasil' });
  } catch {
    return res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

// GET /api/auth/me
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Tidak terautentikasi' });
    }

    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, status: true, last_login_at: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    let client = null;
    if (user.role === 'client') {
      client = await prisma.clients.findUnique({
        where: { user_id: user.id },
        select: { id: true, business_name: true, business_type: true, status: true, active_until: true },
      });
    }

    return res.json({ user, client });
  } catch {
    return res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};
