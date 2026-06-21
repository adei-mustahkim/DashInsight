// DashInsight - Client Management
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../stores/useAuth';
import { adminClientApi, type AdminClient } from '../../services/api';
import {
  Plus, Search, MoreVertical, RefreshCw, Ban, CheckCircle, Key, Eye, Pencil
} from 'lucide-react';
import Toast from '../Common/Toast';
import { useToast } from '../../hooks/useToast';

type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; client: AdminClient }
  | { type: 'extend'; client: AdminClient }
  | { type: 'reset-password'; client: AdminClient }
  | { type: 'detail'; clientId: string };

export default function ClientManagement() {
  const { token } = useAuth();
  const { toasts, hideToast, success, error } = useToast();
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) return;
      setLoading(true);
      try {
        const res = await adminClientApi.list(token);
        if (!cancelled) setClients(res.clients);
      } catch (error) {
        if (!cancelled) {
          console.error('Gagal memuat data client:', error);
          setClients([]);
        }
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [token, refreshKey]);

  const loadClients = useCallback(() => setRefreshKey(k => k + 1), []);

  const filtered = clients.filter(c => {
    const matchSearch = !search || c.business_name.toLowerCase().includes(search.toLowerCase()) ||
      c.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.owner_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleStatusChange = async (id: string, status: string) => {
    if (!token) return;
    try {
      await adminClientApi.updateStatus(token, id, status);
      success('Status client berhasil diubah');
      loadClients();
    } catch (err) {
      console.error('Gagal mengubah status:', err);
      error('Gagal mengubah status. Silakan coba lagi.');
    }
    setDropdownOpen(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manajemen Client</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola akun client DashInsight</p>
        </div>
        <button
          onClick={() => setModal({ type: 'create' })}
          className="flex items-center gap-2 bg-[#276749] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#1f533a] transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Tambah Client
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama bisnis, email, atau owner..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#276749] focus:border-transparent bg-gray-50 focus:bg-white"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#276749]"
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="expired">Expired</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-3">Nama Bisnis</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Pemilik</th>
                <th className="px-5 py-3">Tipe</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Aktif Hingga</th>
                <th className="px-5 py-3">Dataset</th>
                <th className="px-5 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(client => (
                <tr key={client.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-5 py-3 font-medium text-gray-900">{client.business_name}</td>
                  <td className="px-5 py-3 text-gray-500">{client.user?.email || '-'}</td>
                  <td className="px-5 py-3 text-gray-600">{client.owner_name}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{client.business_type}</span>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={client.status} />
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {client.active_until ? new Date(client.active_until).toLocaleDateString('id-ID') : '-'}
                  </td>
                  <td className="px-5 py-3 text-gray-500">{client.datasetCount || 0}</td>
                  <td className="px-5 py-3 relative">
                    <button
                      onClick={() => setDropdownOpen(dropdownOpen === client.id ? null : client.id)}
                      className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {dropdownOpen === client.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(null)} />
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                          <DropdownItem icon={Eye} label="Lihat Detail" onClick={() => { setModal({ type: 'detail', clientId: client.id }); setDropdownOpen(null); }} />
                          <DropdownItem icon={Pencil} label="Edit" onClick={() => { setModal({ type: 'edit', client }); setDropdownOpen(null); }} />
                          <DropdownItem icon={RefreshCw} label="Perpanjang" onClick={() => { setModal({ type: 'extend', client }); setDropdownOpen(null); }} />
                          <DropdownItem icon={Key} label="Reset Password" onClick={() => { setModal({ type: 'reset-password', client }); setDropdownOpen(null); }} />
                          {client.status === 'active' ? (
                            <DropdownItem icon={Ban} label="Nonaktifkan" onClick={() => handleStatusChange(client.id, 'inactive')} danger />
                          ) : (
                            <DropdownItem icon={CheckCircle} label="Aktifkan" onClick={() => handleStatusChange(client.id, 'active')} />
                          )}
                          {client.status !== 'suspended' && (
                            <DropdownItem icon={Ban} label="Suspend" onClick={() => handleStatusChange(client.id, 'suspended')} danger />
                          )}
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                  {loading ? 'Memuat data...' : 'Tidak ada client ditemukan'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {modal.type === 'create' && <ClientFormModal onClose={() => setModal({ type: 'none' })} onSaved={() => { loadClients(); setModal({ type: 'none' }); }} />}
      {modal.type === 'edit' && <ClientFormModal client={modal.client} onClose={() => setModal({ type: 'none' })} onSaved={() => { loadClients(); setModal({ type: 'none' }); }} />}
      {modal.type === 'extend' && <ExtendModal client={modal.client} onClose={() => setModal({ type: 'none' })} onSaved={() => { loadClients(); setModal({ type: 'none' }); }} />}
      {modal.type === 'reset-password' && <ResetPasswordModal client={modal.client} onClose={() => setModal({ type: 'none' })} />}
      {modal.type === 'detail' && <ClientDetailModal clientId={modal.clientId} onClose={() => setModal({ type: 'none' })} />}
      
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => hideToast(toast.id)}
        />
      ))}
    </div>
  );
}

// === Modals ===

function ClientFormModal({ client, onClose, onSaved }: { client?: AdminClient; onClose: () => void; onSaved: () => void }) {
  const { token } = useAuth();
  const [form, setForm] = useState({
    name: client ? '' : '',
    email: client?.user?.email || '',
    password: '',
    business_name: client?.business_name || '',
    business_type: client?.business_type || 'Retail',
    owner_name: client?.owner_name || '',
    phone: client?.phone || '',
    address: client?.address || '',
    duration_days: 30,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEdit = !!client;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!form.business_name || !form.owner_name || (!isEdit && !form.email) || (!isEdit && !form.password)) {
      setError('Field wajib harus diisi');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (isEdit) {
        await adminClientApi.update(token, client.id, {
          business_name: form.business_name,
          business_type: form.business_type,
          owner_name: form.owner_name,
          phone: form.phone,
          address: form.address,
        });
      } else {
        await adminClientApi.create(token, form);
      }
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    }
    setLoading(false);
  };

  const inputClass = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#276749] focus:border-transparent bg-gray-50 focus:bg-white";

  return (
    <Modal onClose={onClose} title={isEdit ? 'Edit Client' : 'Tambah Client Baru'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        {!isEdit && (
          <>
            <Field label="Nama Lengkap (Login)" required>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputClass} placeholder="Nama untuk login" />
            </Field>
            <Field label="Email" required>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inputClass} placeholder="email@contoh.com" />
            </Field>
            <Field label="Password" required>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className={inputClass} placeholder="Minimal 6 karakter" />
            </Field>
          </>
        )}
        <Field label="Nama Bisnis" required>
          <input value={form.business_name} onChange={e => setForm({...form, business_name: e.target.value})} className={inputClass} placeholder="Toko / Nama Usaha" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipe Bisnis" required>
            <select value={form.business_type} onChange={e => setForm({...form, business_type: e.target.value})} className={inputClass}>
              {['Retail', 'Kuliner', 'Fashion', 'Online Shop', 'Jasa', 'Lainnya'].map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Pemilik" required>
            <input value={form.owner_name} onChange={e => setForm({...form, owner_name: e.target.value})} className={inputClass} placeholder="Nama pemilik" />
          </Field>
        </div>
        <Field label="Telepon">
          <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={inputClass} placeholder="08xxx" />
        </Field>
        <Field label="Alamat">
          <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} className={inputClass + ' resize-none'} rows={2} placeholder="Alamat bisnis" />
        </Field>
        {!isEdit && (
          <Field label="Masa Aktif (hari)" required>
            <input type="number" value={form.duration_days} onChange={e => setForm({...form, duration_days: parseInt(e.target.value) || 30})} className={inputClass} min={1} />
          </Field>
        )}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Batal</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-[#276749] text-white text-sm font-semibold rounded-lg hover:bg-[#1f533a] transition disabled:opacity-50">
            {loading ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Buat Client'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ExtendModal({ client, onClose, onSaved }: { client: AdminClient; onClose: () => void; onSaved: () => void }) {
  const { token } = useAuth();
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);

  const handleExtend = async () => {
    if (!token) return;
    setLoading(true);
    try {
      await adminClientApi.extend(token, client.id, days);
      onSaved();
    } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <Modal onClose={onClose} title="Perpanjang Masa Aktif" size="sm">
      <div className="p-5 space-y-4">
        <p className="text-sm text-gray-600">
          Perpanjang masa aktif <strong>{client.business_name}</strong> selama:
        </p>
        <div className="flex gap-2">
          {[7, 14, 30, 60, 90].map(d => (
            <button key={d} onClick={() => setDays(d)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${days === d ? 'bg-[#276749] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {d}h
            </button>
          ))}
        </div>
        <input type="number" value={days} onChange={e => setDays(parseInt(e.target.value) || 30)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]" min={1} />
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Batal</button>
          <button onClick={handleExtend} disabled={loading} className="px-4 py-2 bg-[#276749] text-white text-sm font-semibold rounded-lg hover:bg-[#1f533a] transition disabled:opacity-50">
            {loading ? 'Memproses...' : 'Perpanjang'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ResetPasswordModal({ client, onClose }: { client: AdminClient; onClose: () => void }) {
  const { token } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    if (!token || password.length < 6) return;
    setLoading(true);
    try {
      await adminClientApi.resetPassword(token, client.id, password);
      setSuccess(true);
    } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <Modal onClose={onClose} title="Reset Password" size="sm">
      <div className="p-5 space-y-4">
        <p className="text-sm text-gray-600">
          Reset password untuk <strong>{client.business_name}</strong> ({client.user?.email}):
        </p>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password baru (minimal 6 karakter)"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]"
        />
        {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-2">Password berhasil direset!</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Tutup</button>
          {!success && (
            <button onClick={handleReset} disabled={loading || password.length < 6} className="px-4 py-2 bg-[#276749] text-white text-sm font-semibold rounded-lg hover:bg-[#1f533a] transition disabled:opacity-50">
              {loading ? 'Meriset...' : 'Reset'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function ClientDetailModal({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const { token } = useAuth();
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    adminClientApi.getById(token, clientId)
      .then(res => setData(res.client))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, clientId]);

  return (
    <Modal onClose={onClose} title="Detail Client" size="lg">
      <div className="p-5">
        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#276749]" /></div>
        ) : !data ? (
          <p className="text-center text-gray-400 py-8">Gagal memuat data</p>
        ) : (
          <pre className="bg-gray-50 rounded-lg p-4 text-xs text-gray-700 overflow-auto max-h-80">{JSON.stringify(data, null, 2)}</pre>
        )}
      </div>
    </Modal>
  );
}

// === Shared Components ===

function Modal({ children, onClose, title, size = 'sm' }: { children: React.ReactNode; onClose: () => void; title: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className={`bg-white rounded-xl shadow-2xl w-full ${sizeClass} relative z-10 max-h-[85vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label} {required && <span className="text-red-400">*</span>}</label>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    expired: 'bg-amber-100 text-amber-700',
    suspended: 'bg-red-100 text-red-700',
    inactive: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.inactive}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function DropdownItem({ icon: Icon, label, onClick, danger }: { icon: typeof Pencil; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition ${danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'}`}
    >
      <Icon className="w-4 h-4" />{label}
    </button>
  );
}
