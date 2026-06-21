import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, requireAdmin } from '../middlewares/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Get public settings (e.g. for landing page)
router.get('/public', async (req, res) => {
  try {
    const settings = await prisma.system_settings.findMany({
      where: {
        setting_key: {
          in: ['admin_whatsapp', 'maintenance_mode']
        }
      }
    });

    const result: Record<string, any> = {};
    settings.forEach(s => {
      result[s.setting_key] = s.setting_val;
    });

    // Defaults if not set
    if (!result.admin_whatsapp) result.admin_whatsapp = '6285373328500';
    if (result.maintenance_mode === undefined) result.maintenance_mode = false;

    res.json(result);
  } catch (error) {
    console.error('Error fetching public settings:', error);
    res.status(500).json({ error: 'Failed to fetch public settings' });
  }
});

// Get all settings (admin only)
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const settings = await prisma.system_settings.findMany();
    const result: Record<string, any> = {};
    settings.forEach(s => {
      result[s.setting_key] = s.setting_val;
    });
    res.json(result);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update settings (admin only)
router.put('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const updates = req.body; // e.g. { admin_whatsapp: '62812345678', maxUploadMb: 50 }
    
    // Process updates in transaction
    const updatePromises = Object.keys(updates).map(key => {
      return prisma.system_settings.upsert({
        where: { setting_key: key },
        update: { setting_val: updates[key] },
        create: {
          setting_key: key,
          setting_val: updates[key]
        }
      });
    });

    await prisma.$transaction(updatePromises);

    // Audit log
    await prisma.audit_logs.create({
      data: {
        user_id: (req as any).user?.id,
        action: 'UPDATE_SYSTEM_SETTINGS',
        description: 'Admin updated system settings',
        metadata_json: updates
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
