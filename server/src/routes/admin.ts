// DashInsight - Admin Routes
import { Router } from 'express';
import { authMiddleware, requireAdmin } from '../middlewares/auth.js';
import {
  getClients,
  createClient,
  getClientById,
  updateClient,
  updateClientStatus,
  extendClient,
  resetClientPassword,
} from '../controllers/adminClientController.js';
import {
  getChartTemplates,
  createChartTemplate,
  getChartTemplateById,
  updateChartTemplate,
  updateChartTemplateStatus,
  deleteChartTemplate,
} from '../controllers/chartTemplateController.js';
import {
  getFormulaTemplates,
  createFormulaTemplate,
  getFormulaTemplateById,
  updateFormulaTemplate,
  updateFormulaTemplateStatus,
  testFormulaTemplate,
  publishFormulaTemplate,
  createFormulaVersion,
  deleteFormulaTemplate,
} from '../controllers/formulaTemplateController.js';
import {
  getFieldDictionary,
  createFieldDictionary,
  getFieldDictionaryById,
  updateFieldDictionary,
  updateFieldDictionaryStatus,
  deleteFieldDictionary,
} from '../controllers/fieldDictionaryController.js';
import {
  getAuditLogs,
  createAuditLog,
} from '../controllers/auditLogController.js';
import { createKpiTemplate, deleteKpiTemplate, getKpiTemplates, updateKpiTemplate, updateKpiTemplateStatus } from '../controllers/kpiTemplateController.js';
import { getAdmins, createAdmin, updateAdmin, resetAdminPassword } from '../controllers/adminUserController.js';

const router = Router();

router.use(authMiddleware, requireAdmin);

// === Admin User Management ===
router.get('/admins', getAdmins);
router.post('/admins', createAdmin);
router.put('/admins/:id', updateAdmin);
router.post('/admins/:id/reset-password', resetAdminPassword);

// === Client Management ===
router.get('/clients', getClients);
router.post('/clients', createClient);
router.get('/clients/:id', getClientById);
router.put('/clients/:id', updateClient);
router.patch('/clients/:id/status', updateClientStatus);
router.patch('/clients/:id/extend', extendClient);
router.post('/clients/:id/reset-password', resetClientPassword);

// === Chart Templates ===
router.get('/chart-templates', getChartTemplates);
router.post('/chart-templates', createChartTemplate);
router.get('/chart-templates/:id', getChartTemplateById);
router.put('/chart-templates/:id', updateChartTemplate);
router.patch('/chart-templates/:id/status', updateChartTemplateStatus);
router.delete('/chart-templates/:id', deleteChartTemplate);

// === KPI Templates ===
router.get('/kpi-templates', getKpiTemplates);
router.post('/kpi-templates', createKpiTemplate);
router.put('/kpi-templates/:id', updateKpiTemplate);
router.patch('/kpi-templates/:id/status', updateKpiTemplateStatus);
router.delete('/kpi-templates/:id', deleteKpiTemplate);

// === Formula Templates ===
router.get('/formula-templates', getFormulaTemplates);
router.post('/formula-templates', createFormulaTemplate);
router.get('/formula-templates/:id', getFormulaTemplateById);
router.put('/formula-templates/:id', updateFormulaTemplate);
router.patch('/formula-templates/:id/status', updateFormulaTemplateStatus);
router.post('/formula-templates/:id/test', testFormulaTemplate);
router.post('/formula-templates/:id/publish', publishFormulaTemplate);
router.post('/formula-templates/:id/version', createFormulaVersion);
router.delete('/formula-templates/:id', deleteFormulaTemplate);

// === Field Dictionary ===
router.get('/field-dictionary', getFieldDictionary);
router.post('/field-dictionary', createFieldDictionary);
router.get('/field-dictionary/:id', getFieldDictionaryById);
router.put('/field-dictionary/:id', updateFieldDictionary);
router.patch('/field-dictionary/:id/status', updateFieldDictionaryStatus);
router.delete('/field-dictionary/:id', deleteFieldDictionary);

// === Audit Logs ===
router.get('/audit-logs', getAuditLogs);
router.post('/audit-logs', createAuditLog);

export default router;
