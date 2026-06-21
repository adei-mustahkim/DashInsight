// @ts-nocheck
import { useState, useEffect } from 'react';
import { useAuth } from '../../stores/useAuth';
import { adminUserApi, settingsApi, type AdminUser } from '../../services/api';
import { Database, RotateCcw, Save, Server, ShieldCheck, Users, Plus, X, Edit2, Key, Phone } from 'lucide-react';
import { DEFAULT_SYSTEM_SETTINGS as defaults, type SystemSettings as Settings } from '../../storage/systemSettings';

export default function AdminSettingsPage() {
  const { token, user } = useAuth();
  
  // Extend Settings type to include admin_whatsapp
  type ExtendedSettings = Settings & { admin_whatsapp?: string };
  
  const [settings, setSettings] = useState<ExtendedSettings>({ ...defaults, admin_whatsapp: '6285373328500' });
  const [message, setMessage] = useState('');
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [showResetPw, setShowResetPw] = useState<string | null>(null);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
  const [resetPw, setResetPw] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const set = <K extends keyof ExtendedSettings>(key: K, value: ExtendedSettings[K]) => setSettings(current => ({ ...current, [key]: value }));
  
  const save = async () => { 
    if (!token) return;
    try {
      await settingsApi.update(token, settings);
      setMessage('Pengaturan berhasil disimpan ke database global.'); 
    } catch (err) {
      setMessage('Gagal menyimpan pengaturan.');
    }
  };
  
  const reset = () => { setSettings({ ...defaults, admin_whatsapp: '6285373328500' }); setMessage('Pengaturan dikembalikan ke default (belum disimpan).'); };

  useEffect(() => {
    if (!token) return;
    setLoadingAdmins(true);
    setLoadingSettings(true);
    
    Promise.all([
      adminUserApi.list(token).catch(() => ({ admins: [] })),
      settingsApi.getAll(token).catch(() => ({}))
    ]).then(([adminRes, settingsRes]) => {
      if (adminRes.admins) setAdmins(adminRes.admins);
      if (Object.keys(settingsRes).length > 0) {
        // Merge DB settings with defaults
        setSettings(prev => ({ ...prev, ...settingsRes }));
      }
    }).finally(() => {
      setLoadingAdmins(false);
      setLoadingSettings(false);
    });
  }, [token]);

  const handleCreateAdmin = async () => {
    if (!token) return;
    setAdminError('');
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) { setAdminError('Semua field wajib diisi'); return; }
    if (newAdmin.password.length < 6) { setAdminError('Password minimal 6 karakter'); return; }
    setAdminLoading(true);
    try {
      await adminUserApi.create(token, newAdmin);
      const res = await adminUserApi.list(token);
      setAdmins(res.admins);
      setShowCreateAdmin(false);
      setNewAdmin({ name: '', email: '', password: '' });
    } catch (err: any) { setAdminError(err.message || 'Gagal membuat admin'); } finally { setAdminLoading(false); }
  };

  const handleResetAdminPw = async (id: string) => {
    if (!token) return;
    setAdminError('');
    if (!resetPw || resetPw.length < 6) { setAdminError('Password minimal 6 karakter'); return; }
    setAdminLoading(true);
    try {
      await adminUserApi.resetPassword(token, id, resetPw);
      setShowResetPw(null);
      setResetPw('');
    } catch (err: any) { setAdminError(err.message || 'Gagal reset password'); } finally { setAdminLoading(false); }
  };

  return (
    <div className="space-y-6 min-h-full">
      <div><h1 className="text-xl font-bold text-gray-900">Pengaturan Sistem</h1><p className="mt-0.5 text-sm text-gray-600">Default operasional untuk workspace DashInsight.</p></div>
      {message && <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

      {/* Admin Management */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Users className="h-5 w-5 text-[#276749]" /><h2 className="font-semibold text-gray-900">Kelola Akun Admin</h2></div>
          <button onClick={() => { setShowCreateAdmin(true); setAdminError(''); setNewAdmin({ name: '', email: '', password: '' }); }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#276749] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1f533a] transition">
            <Plus className="h-3.5 w-3.5" /> Tambah Admin
          </button>
        </div>
        {loadingAdmins ? (
          <div className="py-8 text-center text-sm text-gray-400">Memuat...</div>
        ) : (
          <div className="mt-4 space-y-2">
            {admins.map(a => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#276749] rounded-full flex items-center justify-center text-white text-xs font-bold">{a.name?.charAt(0)?.toUpperCase() || 'A'}</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{a.name} {a.id === user?.id && <span className="text-[10px] text-[#276749] bg-[#F1FAF5] px-1.5 py-0.5 rounded-full ml-1">Anda</span>}</p>
                    <p className="text-xs text-gray-500">{a.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${a.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{a.status === 'active' ? 'Aktif' : 'Nonaktif'}</span>
                  {a.id !== user?.id && (
                    <button onClick={() => { setShowResetPw(a.id); setResetPw(''); setAdminError(''); }}
                      className="p-1.5 rounded-md text-gray-400 hover:bg-gray-200 transition" title="Reset Password">
                      <Key className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Admin Modal */}
        {showCreateAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCreateAdmin(false)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Tambah Admin Baru</h3>
                <button onClick={() => setShowCreateAdmin(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nama *</label>
                  <input type="text" value={newAdmin.name} onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]" placeholder="Nama admin" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
                  <input type="email" value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]" placeholder="admin@dashinsight.id" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Password *</label>
                  <input type="password" value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]" placeholder="Min. 6 karakter" />
                </div>
                {adminError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{adminError}</p>}
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setShowCreateAdmin(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                  <button onClick={handleCreateAdmin} disabled={adminLoading}
                    className="px-4 py-2 bg-[#276749] text-white text-sm rounded-lg hover:bg-[#1f533a] disabled:opacity-50">
                    {adminLoading ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {showResetPw && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowResetPw(null)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Reset Password Admin</h3>
                <button onClick={() => setShowResetPw(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Password baru untuk admin: <strong>{admins.find(a => a.id === showResetPw)?.email}</strong></p>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Password Baru *</label>
                  <input type="password" value={resetPw} onChange={e => setResetPw(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]" placeholder="Min. 6 karakter" />
                </div>
                {adminError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{adminError}</p>}
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setShowResetPw(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                  <button onClick={() => handleResetAdminPw(showResetPw)} disabled={adminLoading}
                    className="px-4 py-2 bg-[#276749] text-white text-sm rounded-lg hover:bg-[#1f533a] disabled:opacity-50">
                    {adminLoading ? 'Menyimpan...' : 'Reset Password'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2"><Server className="h-5 w-5 text-[#276749]" /><h2 className="font-semibold text-gray-900">Batas Operasional</h2></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <NumberField label="Durasi subscription default" suffix="hari" value={settings.defaultSubscriptionDays} min={1} max={3650} onChange={value => set('defaultSubscriptionDays', value)} />
          <NumberField label="Ukuran upload maksimum" suffix="MB" value={settings.maxUploadMb} min={1} max={100} onChange={value => set('maxUploadMb', value)} />
          <NumberField label="Baris dataset lokal maksimum" suffix="baris" value={settings.maxLocalRows} min={100} max={100000} onChange={value => set('maxLocalRows', value)} />
          <NumberField label="Retensi audit log" suffix="hari" value={settings.auditRetentionDays} min={30} max={3650} onChange={value => set('auditRetentionDays', value)} />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[#276749]" /><h2 className="font-semibold text-gray-900">Kontrol Akses</h2></div>
        <div className="mt-4 space-y-3">
          <Toggle label="Izinkan client mengunggah dataset" description="Mematikan opsi ini menyembunyikan alur upload baru." checked={settings.allowClientUploads} onChange={value => set('allowClientUploads', value)} />
          <Toggle label="Mode maintenance" description="Penanda operasional untuk menghentikan aktivitas client saat pemeliharaan." checked={settings.maintenanceMode} onChange={value => set('maintenanceMode', value)} />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2"><Phone className="h-5 w-5 text-[#276749]" /><h2 className="font-semibold text-gray-900">Kontak & Layanan</h2></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField label="Nomor WhatsApp Admin (Pendaftaran)" placeholder="Contoh: 6285373328500" value={settings.admin_whatsapp || ''} onChange={value => set('admin_whatsapp', value)} />
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <button onClick={reset} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><RotateCcw className="h-4 w-4" /> Reset</button>
        <button onClick={save} className="inline-flex items-center gap-2 rounded-lg bg-[#276749] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f533a]"><Save className="h-4 w-4" /> Simpan Pengaturan</button>
      </div>
    </div>
  );
}

function TextField({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (value: string) => void }) {
  return <label className="text-xs font-medium text-gray-700">{label}<div className="mt-1.5 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 focus-within:ring-2 focus-within:ring-[#276749]"><input type="text" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="w-full bg-transparent px-3 py-2 text-sm outline-none" /></div></label>;
}

function NumberField({ label, suffix, value, min, max, onChange }: { label: string; suffix: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return <label className="text-xs font-medium text-gray-700">{label}<div className="mt-1.5 flex overflow-hidden rounded-lg border border-gray-200 bg-gray-50 focus-within:ring-2 focus-within:ring-[#276749]"><input type="number" value={value} min={min} max={max} onChange={event => onChange(Number(event.target.value))} className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none" /><span className="border-l border-gray-200 px-3 py-2 text-sm text-gray-500">{suffix}</span></div></label>;
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg bg-gray-50 p-3"><span><span className="block text-sm font-medium text-gray-900">{label}</span><span className="block text-xs text-gray-600">{description}</span></span><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="h-5 w-5 rounded text-[#276749] focus:ring-[#276749]" /></label>;
}
