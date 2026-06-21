import { useState } from 'react';
import { Save, Shield, Trash2, Download, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../stores/useAuth';
import { clearWorkspace, loadPreferences, loadWorkspace, savePreferences, exportWorkspace, importWorkspace, type ClientPreferences } from '../../storage/clientWorkspace';

export default function ClientSettingsPage() {
  const { client } = useAuth();
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<ClientPreferences>(() => loadPreferences());
  const [saved, setSaved] = useState(false);
  const workspace = loadWorkspace();
  const update = <K extends keyof ClientPreferences>(key: K, value: ClientPreferences[K]) => setPreferences(current => ({ ...current, [key]: value }));
  const save = () => { savePreferences(preferences); setSaved(true); window.setTimeout(() => setSaved(false), 2000); };
  const clear = () => {
    if (!window.confirm('Hapus dataset lokal aktif dari perangkat ini?')) return;
    clearWorkspace();
    localStorage.removeItem('dashinsight_workspace');
    localStorage.removeItem('dashboardSettings');
    localStorage.removeItem('dashinsight_chart_mappings');
    localStorage.removeItem('dashinsight_client_preferences_v1');
    localStorage.removeItem('userColumnMappings');
    localStorage.removeItem('umkm_dataset_history');
    localStorage.removeItem('dashinsight_hidden_kpis');
    localStorage.removeItem('dashinsight_show_analysis_summary');
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('dashinsight_layout_') || key.startsWith('umkm_layout_'))) {
        localStorage.removeItem(key);
      }
    }
    navigate('/');
  };
  const [importMsg, setImportMsg] = useState('');
  const [importError, setImportError] = useState('');
  const handleExport = () => { try { exportWorkspace(); } catch (e: any) { alert(e.message); } };
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMsg('');
    setImportError('');
    try {
      const result = await importWorkspace(file);
      setImportMsg(result.message);
      window.setTimeout(() => { setImportMsg(''); window.location.reload(); }, 1500);
    } catch (err: any) {
      setImportError(err.message);
    }
    e.target.value = '';
  };
  return <div className="space-y-6"><div><h1 className="text-xl font-bold text-gray-900">Pengaturan</h1><p className="mt-0.5 text-sm text-gray-600">Konfigurasi workspace dan kalkulasi dashboard.</p></div><section className="rounded-xl border border-gray-200 bg-white p-5"><h2 className="font-semibold text-gray-900">Informasi Bisnis</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><Info label="Nama Bisnis" value={client?.business_name} /><Info label="Tipe Bisnis" value={client?.business_type} /><Info label="Pemilik" value={client?.owner_name} /><Info label="Status" value={client?.status} /></div></section><section className="rounded-xl border border-gray-200 bg-white p-5"><h2 className="font-semibold text-gray-900">Formula Kalkulasi</h2><div className="mt-4 grid gap-4 md:grid-cols-3"><Select label="Pendapatan bersih" value={preferences.netRevenueFormula} options={[['gross','Penjualan kotor'],['net_of_returns','Setelah retur'],['net_of_discounts_returns','Setelah diskon & retur']]} onChange={value => update('netRevenueFormula', value as ClientPreferences['netRevenueFormula'])} /><Select label="Profit" value={preferences.profitFormula} options={[['auto','Otomatis'],['gross_profit','Laba kotor'],['operating_profit','Laba operasional']]} onChange={value => update('profitFormula', value as ClientPreferences['profitFormula'])} /><Select label="Average order value" value={preferences.aovFormula} options={[['net','Pendapatan bersih'],['gross','Penjualan kotor']]} onChange={value => update('aovFormula', value as ClientPreferences['aovFormula'])} /></div><label className="mt-4 flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={preferences.compactNumbers} onChange={event => update('compactNumbers', event.target.checked)} className="h-4 w-4 rounded text-[#276749] focus:ring-[#276749]" /> Gunakan format angka ringkas pada dashboard</label><button onClick={save} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#276749] px-4 py-2 text-sm font-semibold text-white"><Save className="h-4 w-4" /> {saved ? 'Tersimpan' : 'Simpan Preferensi'}</button></section><section className="rounded-xl border border-gray-200 bg-white p-5">
    <h2 className="font-semibold text-gray-900">Backup & Restore</h2>
    <p className="mt-1 text-sm text-gray-500">Export dataset ke file atau import dari file backup (.dashinsight).</p>
    <div className="mt-4 flex flex-wrap gap-3">
      <button onClick={handleExport} disabled={!workspace} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><Download className="h-4 w-4" /> Export Backup</button>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><Upload className="h-4 w-4" /> Import Backup<input type="file" accept=".dashinsight,.dsi" onChange={handleImport} className="hidden" /></label>
    </div>
    {importMsg && <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{importMsg}</p>}
    {importError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{importError}</p>}
  </section>
  <section className="rounded-xl bg-[#276749] p-5 text-white"><div className="flex items-center gap-2"><Shield className="h-5 w-5" /><h2 className="font-semibold">Penyimpanan Lokal</h2></div><p className="mt-2 text-sm text-white/80">Data transaksi tidak dikirim ke cloud. Metadata dataset dapat disimpan untuk administrasi, tanpa isi transaksi.</p><div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white/10 p-3"><div><p className="text-sm font-medium">{workspace?.datasetName || 'Tidak ada dataset aktif'}</p>{workspace && <p className="text-xs text-white/70">{workspace.rows.length.toLocaleString('id-ID')} baris · {workspace.fileName}</p>}</div>{workspace && <button onClick={clear} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-red-700"><Trash2 className="h-4 w-4" /> Hapus Data Lokal</button>}</div></section></div>;
}
function Info({ label, value }: { label: string; value?: string }) { return <div><p className="text-xs text-gray-500">{label}</p><p className="mt-1 font-medium text-gray-900">{value || '-'}</p></div>; }
function Select({ label, value, options, onChange }: { label: string; value: string; options: string[][]; onChange: (value: string) => void }) { return <label className="text-xs font-medium text-gray-700">{label}<select value={value} onChange={event => onChange(event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:ring-2 focus:ring-[#276749]">{options.map(([option,labelText]) => <option key={option} value={option}>{labelText}</option>)}</select></label>; }