// DashInsight - Auth Middleware
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '../config/prisma.js';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'client';
  status: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

// Verify JWT token and attach user to request
export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token tidak ditemukan' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };

    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User tidak ditemukan' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Akun Anda telah ditangguhkan' });
    }

    req.user = user as AuthUser;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token telah kadaluarsa' });
    }
    return res.status(401).json({ error: 'Token tidak valid' });
  }
};

// Require admin role
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak: admin only' });
  }
  next();
};

// Require client role
export const requireClient = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'client') {
    return res.status(403).json({ error: 'Akses ditolak: client only' });
  }
  next();
};

// Require active client (check subscription status)
export const requireActiveClient = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'client') {
    return res.status(403).json({ error: 'Akses ditolak: client only' });
  }

  const client = await prisma.clients.findUnique({
    where: { user_id: req.user.id },
    select: { status: true, active_until: true },
  });

  if (!client) {
    return res.status(404).json({ error: 'Data client tidak ditemukan' });
  }

  if (client.status === 'suspended') {
    return res.status(403).json({ error: 'Akun Anda telah ditangguhkan. Hubungi admin.' });
  }

  if (client.status === 'inactive') {
    return res.status(403).json({ error: 'Akun Anda belum aktif' });
  }

  if (client.active_until && client.active_until < new Date()) {
    return res.status(403).json({ error: 'Masa aktif akun Anda telah berakhir. Hubungi admin untuk perpanjangan.' });
  }

  next();
};
