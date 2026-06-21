// @ts-nocheck
// DashInsight - API Service
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiOptions { method?: string; body?: unknown; token?: string; }

class ApiError extends Error {
  status: number; data: unknown;
  constructor(message: string, status: number, data: unknown) { super(message); this.name = 'ApiError'; this.status = status; this.data = data; }
}

async function request(endpoint: string, options: ApiOptions = {}): Promise<any> {
  const { method = 'GET', body, token } = options;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (!res.ok) throw new ApiError(data.error || 'Permintaan gagal', res.status, data);
    return data;
  } catch (error) { clearTimeout(timeoutId); if (error instanceof Error && error.name === 'AbortError') throw new ApiError('Permintaan timeout', 408, null); throw error; }
}

export const authApi = {
  login: (email: string, password: string) => request('/auth/login', { method: 'POST', body: { email, password } }),
  logout: (token: string) => request('/auth/logout', { method: 'POST', token }),
  getMe: (token: string) => request('/auth/me', { token }),
};

export const adminClientApi = {
  list: (token: string) => request('/admin/clients', { token }),
  getById: (token: string, id: string) => request(`/admin/clients/${id}`, { token }),
  create: (token: string, data: any) => request('/admin/clients', { method: 'POST', body: data, token }),
  update: (token: string, id: string, data: any) => request(`/admin/clients/${id}`, { method: 'PUT', body: data, token }),
  updateStatus: (token: string, id: string, status: string) => request(`/admin/clients/${id}/status`, { method: 'PATCH', body: { status }, token }),
  extend: (token: string, id: string, duration_days: number) => request(`/admin/clients/${id}/extend`, { method: 'PATCH', body: { duration_days }, token }),
  resetPassword: (token: string, id: string, new_password: string) => request(`/admin/clients/${id}/reset-password`, { method: 'POST', body: { new_password }, token }),
};

export const adminUserApi = {
  list: (token: string) => request('/admin/admins', { token }),
  create: (token: string, data: any) => request('/admin/admins', { method: 'POST', body: data, token }),
  update: (token: string, id: string, data: any) => request(`/admin/admins/${id}`, { method: 'PUT', body: data, token }),
  resetPassword: (token: string, id: string, new_password: string) => request(`/admin/admins/${id}/reset-password`, { method: 'POST', body: { new_password }, token }),
};

export const settingsApi = {
  getPublic: () => request('/settings/public'),
  getAll: (token: string) => request('/settings', { token }),
  update: (token: string, data: any) => request('/settings', { method: 'PUT', body: data, token }),
};

export const adminChartApi = {
  list: (token: string, filter?: any) => request('/admin/chart-templates' + (filter ? `?${new URLSearchParams(filter)}` : ''), { token }),
  getById: (token: string, id: string) => request(`/admin/chart-templates/${id}`, { token }),
  create: (token: string, data: any) => request('/admin/chart-templates', { method: 'POST', body: data, token }),
  update: (token: string, id: string, data: any) => request(`/admin/chart-templates/${id}`, { method: 'PUT', body: data, token }),
  updateStatus: (token: string, id: string, status: any) => request(`/admin/chart-templates/${id}/status`, { method: 'PATCH', body: { status }, token }),
  delete: (token: string, id: string) => request(`/admin/chart-templates/${id}`, { method: 'DELETE', token }),
};

export const adminFieldApi = {
  list: (token: string) => request('/admin/field-dictionary', { token }),
  getById: (token: string, id: string) => request(`/admin/field-dictionary/${id}`, { token }),
  create: (token: string, data: any) => request('/admin/field-dictionary', { method: 'POST', body: data, token }),
  update: (token: string, id: string, data: any) => request(`/admin/field-dictionary/${id}`, { method: 'PUT', body: data, token }),
  updateStatus: (token: string, id: string, status: any) => request(`/admin/field-dictionary/${id}/status`, { method: 'PATCH', body: { status }, token }),
  delete: (token: string, id: string) => request(`/admin/field-dictionary/${id}`, { method: 'DELETE', token }),
};

export const adminKpiApi = {
  list: (token: string, statusFilter?: any) => request('/admin/kpi-templates' + (statusFilter ? `?status=${statusFilter}` : ''), { token }),
  create: (token: string, data: any) => request('/admin/kpi-templates', { method: 'POST', body: data, token }),
  update: (token: string, id: string, data: any) => request(`/admin/kpi-templates/${id}`, { method: 'PUT', body: data, token }),
  updateStatus: (token: string, id: string, status: string) => request(`/admin/kpi-templates/${id}/status`, { method: 'PATCH', body: { status }, token }),
  delete: (token: string, id: string) => request(`/admin/kpi-templates/${id}`, { method: 'DELETE', token }),
};

export const adminFormulaApi = {
  list: (token: string, statusFilter?: any) => request('/admin/formula-templates' + (statusFilter ? `?status=${statusFilter}` : ''), { token }),
  create: (token: string, data: any) => request('/admin/formula-templates', { method: 'POST', body: data, token }),
  update: (token: string, id: string, data: any) => request(`/admin/formula-templates/${id}`, { method: 'PUT', body: data, token }),
  updateStatus: (token: string, id: string, status: string) => request(`/admin/formula-templates/${id}/status`, { method: 'PATCH', body: { status }, token }),
  test: (token: string, id: string, data?: any) => request(`/admin/formula-templates/${id}/test`, { method: 'POST', body: data, token }),
  publish: (token: string, id: string) => request(`/admin/formula-templates/${id}/publish`, { method: 'POST', token }),
  createVersion: (token: string, id: string, data?: any) => request(`/admin/formula-templates/${id}/version`, { method: 'POST', body: data, token }),
  delete: (token: string, id: string) => request(`/admin/formula-templates/${id}`, { method: 'DELETE', token }),
};

export const adminAuditApi = {
  list: (token: string, limit?: any, offset?: any, search?: any, action?: any) => {
    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    if (offset) params.set('offset', String(offset));
    if (search) params.set('search', String(search));
    if (action) params.set('action', String(action));
    const qs = params.toString();
    return request('/admin/audit-logs' + (qs ? `?${qs}` : ''), { token });
  },
};

export const clientApi = {
  charts: (token: string) => request('/client/chart-templates', { token }),
  formulas: (token: string) => request('/client/formula-templates', { token }),
  getProfile: (token: string) => request('/client/profile', { token }),
  getChartTemplates: (token: string) => request('/client/chart-templates', { token }),
  getFormulaTemplates: (token: string) => request('/client/formula-templates', { token }),
  getKpiTemplates: (token: string) => request('/client/kpi-templates', { token }),
  getFieldDictionary: (token: string) => request('/client/field-dictionary', { token }),
  getDatasetMetadata: (token: string) => request('/client/dataset-metadata', { token }),
  saveDatasetMetadata: (token: string, data: any) => request('/client/dataset-metadata', { method: 'POST', body: data, token }),
  updateDatasetMetadata: (token: string, id: string, data: any) => request(`/client/dataset-metadata/${id}`, { method: 'PUT', body: data, token }),
  deleteDatasetMetadata: (token: string, id: string) => request(`/client/dataset-metadata/${id}`, { method: 'DELETE', token }),
  createDataset: (token: string, data: any) => request('/client/dataset-metadata', { method: 'POST', body: data, token }),
};

export interface User { id: string; name: string; email: string; role: 'admin' | 'client'; status?: string; last_login_at?: string | null; }
export interface Client { id: string; user_id: string; business_name: string; business_type: string; owner_name: string; phone?: string; address?: string; status: string; active_until?: string; created_at: string; }
export interface AdminClient extends Client { user?: { id: string; email: string; last_login_at: string | null }; datasetCount?: number; }
export interface AdminClientDetail extends Client { user?: { id: string; email: string; last_login_at: string | null }; subscriptions?: any[]; datasets?: any[]; }
export interface AdminUser { id: string; name: string; email: string; role: string; status: string; last_login_at?: string | null; created_at: string; }
export interface Subscription { id: string; client_id: string; start_date: string; end_date: string; duration_days: number; status: string; notes?: string; created_at: string; }
export interface ChartTemplate { id: string; chart_code: string; chart_name: string; description?: string; chart_type: string; chart_category?: string; business_type?: string; default_size: number; default_order: number; status: string; version: number; updated_at?: string; chart_fields?: any[]; chart_template_formulas?: any[]; }
export interface ChartField { id: string; chart_template_id: string; field_role: string; field_label: string; required_data_type?: string; is_required: boolean; allow_multiple: boolean; }
export interface ChartFormulaLink { id: string; chart_template_id: string; formula_template_id: string; formula_role: string; is_required: boolean; sort_order: number; formula_template?: any; }
export type ChartFormula = ChartFormulaLink;
export interface FormulaTemplate { id: string; formula_code: string; formula_name: string; description?: string; category?: string; output_type: string; formula_type: string; formula_json: any; status: string; version: number; }
export interface KpiTemplate { id: string; kpi_code: string; kpi_name: string; description?: string; formula_template_id: string; display_format: string; icon: string; tone: string; default_order: number; status: string; formula_template?: any; }
export interface FieldDictionary { id: string; field_key: string; field_label: string; data_type: string; description?: string; is_required_global: boolean; synonyms_json?: any; status: string; created_at?: string; updated_at?: string; }
export interface AuditLog { id: string; user_id?: string; action: string; description?: string; metadata_json?: any; created_at: string; user?: any; }
export interface DatasetMeta { id: string; client_id: string; dataset_name: string; file_name?: string; row_count?: number; column_count?: number; business_type?: string; storage_type: string; last_opened_at?: string; created_at: string; }
export type ChartStatus = string;
export type FieldStatus = string;
export type FormulaStatus = string;
export interface CreateClientPayload { name: string; email: string; password: string; business_name: string; business_type: string; owner_name: string; phone?: string; address?: string; duration_days?: number; }
export interface CreateChartPayload { chart_code: string; chart_name: string; description?: string; chart_type: string; chart_category?: string; business_type?: string; default_size?: number; default_order?: number; fields?: any[]; }
export interface FieldInput { field_role: string; field_label: string; required_data_type?: string; is_required: boolean; allow_multiple: boolean; }
export interface CreateKpiPayload { kpi_code: string; kpi_name: string; description?: string; formula_template_id?: string; display_format?: string; icon?: string; tone?: string; default_order?: number; status?: string; formula_json?: any; }
export interface CreateFormulaPayload { formula_code: string; formula_name: string; description?: string; category?: string; output_type?: string; formula_type: string; formula_json: any; status?: string; }
export interface CreateFieldPayload { field_key: string; field_label: string; data_type: string; description?: string; is_required_global?: boolean; synonyms_json?: string[]; }
export interface CreateDatasetPayload { dataset_name: string; file_name?: string; row_count?: number; column_count?: number; business_type?: string; workspace_local_id?: string; }
