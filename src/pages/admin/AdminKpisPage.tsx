import { useEffect, useState, type FormEvent } from 'react';
import { Activity, Eye, EyeOff, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '../../stores/useAuth';
import { adminFormulaApi, adminKpiApi, type CreateKpiPayload, type FormulaTemplate, type KpiTemplate } from '../../services/api';

const EMPTY: CreateKpiPayload = { kpi_code: '', kpi_name: '', description: '', formula_template_id: '', display_format: 'number', icon: 'Activity', tone: 'emerald', default_order: 100, status: 'active' };

export default function AdminKpisPage() {
  const { token } = useAuth();
  const [templates, setTemplates] = useState<KpiTemplate[]>([]);
  const [formulas, setFormulas] = useState<FormulaTemplate[]>([]);
  const [editing, setEditing] = useState<KpiTemplate | 'new' | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [kpiResponse, formulaResponse] = await Promise.all([adminKpiApi.list(token), adminFormulaApi.list(token, 'active')]);
      setTemplates(kpiResponse.templates);
      setFormulas(formulaResponse.templates);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Gagal memuat KPI Library.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [token]);

  const toggle = async (template: KpiTemplate) => {
    if (!token) return;
    await adminKpiApi.updateStatus(token, template.id, template.status === 'active' ? 'inactive' : 'active');
    await load();
  };
  const remove = async (template: KpiTemplate) => {
    if (!token || !confirm(`Hapus KPI ${template.kpi_name}?`)) return;
    await adminKpiApi.delete(token, template.id);
    await load();
  };

  return <div className="space-y-5">
    <div className="flex items-end justify-between gap-3"><div><h1 className="text-xl font-bold text-gray-900">KPI Library</h1><p className="mt-1 text-sm text-gray-600">Kelola definisi KPI yang dihitung dari data lokal client.</p></div><button onClick={() => setEditing('new')} className="inline-flex items-center gap-2 rounded-lg bg-[#276749] px-4 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> KPI Baru</button></div>
    {message && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{message}</div>}
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="grid grid-cols-[1fr_180px_100px_90px] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-600"><span>KPI</span><span>Formula</span><span>Status</span><span className="text-right">Aksi</span></div>
      {loading ? <p className="p-8 text-center text-sm text-gray-500">Memuat KPI...</p> : templates.map(template => <div key={template.id} className="grid grid-cols-[1fr_180px_100px_90px] items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-0">
        <div className="min-w-0"><p className="font-semibold text-gray-900">{template.kpi_name}</p><p className="truncate text-xs text-gray-500">{template.kpi_code} · {template.description}</p></div>
        <span className="truncate text-sm text-gray-700">{template.formula_template?.formula_name}</span>
        <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${template.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{template.status}</span>
        <div className="flex justify-end gap-1"><button title="Edit" onClick={() => setEditing(template)} className="rounded p-2 text-gray-600 hover:bg-gray-100"><Pencil className="h-4 w-4" /></button><button title={template.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'} onClick={() => toggle(template)} className="rounded p-2 text-gray-600 hover:bg-gray-100">{template.status === 'active' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button><button title="Hapus" onClick={() => remove(template)} className="rounded p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div>
      </div>)}
    </div>
    {editing && <KpiModal template={editing === 'new' ? undefined : editing} formulas={formulas} onClose={() => setEditing(null)} onSave={async data => { if (!token) return; if (editing === 'new') await adminKpiApi.create(token, data); else await adminKpiApi.update(token, editing.id, data); setEditing(null); await load(); }} />}
  </div>;
}

function KpiModal({ template, formulas, onClose, onSave }: { template?: KpiTemplate; formulas: FormulaTemplate[]; onClose: () => void; onSave: (data: CreateKpiPayload) => Promise<void> }) {
  const [data, setData] = useState<CreateKpiPayload>(() => template ? { kpi_code: template.kpi_code, kpi_name: template.kpi_name, description: template.description, formula_template_id: template.formula_template_id, display_format: template.display_format, icon: template.icon, tone: template.tone, default_order: template.default_order, status: template.status } : { ...EMPTY, formula_template_id: formulas[0]?.id || '' });
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent) => { event.preventDefault(); setSaving(true); try { await onSave(data); } finally { setSaving(false); } };
  const input = 'mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]';
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true"><button onClick={onClose} className="fixed inset-0 bg-black/50" aria-label="Tutup" /><form onSubmit={submit} className="relative w-full max-w-lg rounded-xl bg-white shadow-xl"><div className="flex items-start justify-between border-b border-gray-200 px-5 py-4"><div><h2 className="font-bold text-gray-900">{template ? 'Edit KPI' : 'KPI Baru'}</h2><p className="mt-1 text-sm text-gray-600">Pilih formula database untuk menghitung nilai lokal.</p></div><button type="button" onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-gray-100"><X className="h-5 w-5" /></button></div><div className="grid gap-4 p-5 sm:grid-cols-2">
    <label className="text-xs font-medium text-gray-700">Kode KPI<input value={data.kpi_code} disabled={!!template} onChange={e => setData({ ...data, kpi_code: e.target.value.toUpperCase().replace(/\s+/g, '_') })} className={input} required /></label>
    <label className="text-xs font-medium text-gray-700">Nama KPI<input value={data.kpi_name} onChange={e => setData({ ...data, kpi_name: e.target.value })} className={input} required /></label>
    <label className="text-xs font-medium text-gray-700 sm:col-span-2">Formula<select value={data.formula_template_id} onChange={e => { const formula = formulas.find(item => item.id === e.target.value); setData({ ...data, formula_template_id: e.target.value, display_format: formula?.output_type || data.display_format }); }} className={input}>{formulas.map(formula => <option key={formula.id} value={formula.id}>{formula.formula_name} ({formula.formula_code})</option>)}</select></label>
    <label className="text-xs font-medium text-gray-700">Format<select value={data.display_format} onChange={e => setData({ ...data, display_format: e.target.value })} className={input}><option value="number">Angka</option><option value="currency">Rupiah</option><option value="percent">Persen</option></select></label>
    <label className="text-xs font-medium text-gray-700">Urutan<input type="number" value={data.default_order} onChange={e => setData({ ...data, default_order: Number(e.target.value) })} className={input} /></label>
    <label className="text-xs font-medium text-gray-700 sm:col-span-2">Deskripsi<input value={data.description || ''} onChange={e => setData({ ...data, description: e.target.value })} className={input} /></label>
  </div><div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Batal</button><button disabled={saving} className="rounded-lg bg-[#276749] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan KPI'}</button></div></form></div>;
}
