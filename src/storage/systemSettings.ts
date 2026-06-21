export const ADMIN_SETTINGS_KEY = 'dashinsight_admin_settings_v1';
export interface SystemSettings { defaultSubscriptionDays: number; maxUploadMb: number; maxLocalRows: number; auditRetentionDays: number; maintenanceMode: boolean; allowClientUploads: boolean }
export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = { defaultSubscriptionDays: 30, maxUploadMb: 20, maxLocalRows: 10000, auditRetentionDays: 365, maintenanceMode: false, allowClientUploads: true };
export function loadSystemSettings(): SystemSettings { try { return { ...DEFAULT_SYSTEM_SETTINGS, ...(JSON.parse(localStorage.getItem(ADMIN_SETTINGS_KEY) || '{}') as Partial<SystemSettings>) }; } catch { return DEFAULT_SYSTEM_SETTINGS; } }
export function saveSystemSettings(settings: SystemSettings) { localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settings)); }
export function resetSystemSettings() { localStorage.removeItem(ADMIN_SETTINGS_KEY); }