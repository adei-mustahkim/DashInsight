// @ts-nocheck
// DashInsight - Admin Clients Page
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../stores/useAuth';
import StatusBadge from '../../components/Common/StatusBadge';
import Modal from '../../components/Common/Modal';
import { adminClientApi, type AdminClient, type AdminClientDetail } from '../../services/api';
import { Plus, Search, Ban, CheckCircle, Key, Eye, Edit2, Building2, User, Phone, MapPin, Calendar } from 'lucide-react';
const BUSINESS_TYPES = ['Retail', 'Kuliner', 'Fashion', 'Online Shop', 'Jasa', 'Lainnya'];
const DURATION_OPTIONS = [
  { label: '7 hari', value: 7 },
  { label: '14 hari', value: 14 },
  { label: '30 hari', value: 30 },
  { label: '60 hari', value: 60 },
  { label: '90 hari', value: 90 },
  { label: '180 hari', value: 180 },
  { label: '365 hari', value: 365 },
];
interface ModalState {
  type: 'none' | 'create' | 'edit' | 'extend' | 'reset-password' | 'detail';
  data?: AdminClient | AdminClientDetail;
}
export default function AdminClientsPage() {
  const { token } = useAuth();
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [modalLoading, setModalLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', business_name: '', business_type: 'Retail',
    owner_name: '', phone: '', address: '', duration_days: 30,
  });
  const [extendDays, setExtendDays] = useState(30);
  const [newPassword, setNewPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [pageError, setPageError] = useState('');
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) return;
      setLoading(true);
      setPageError('');
      try {
        const res = await adminClientApi.list(token);
        if (!cancelled) setClients(res.clients);
      } catch (err) {
        if (!cancelled) setPageError(err instanceof Error ? err.message : 'Gagal memuat data client');
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [token, refreshKey]);
  const loadClients = useCallback(() => setRefreshKey(k => k + 1), []);
  const filtered = useMemo(() => clients.filter(c => {
    const matchSearch = !search || c.business_name.toLowerCase().includes(search.toLowerCase()) ||
      c.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.owner_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  }), [clients, search, filterStatus]);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedData = useMemo(() => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [filtered, currentPage]);
  const handleSearchChange = useCallback((value: string) => { setSearch(value); setCurrentPage(1); }, []);
  const handleFilterChange = useCallback((value: string) => { setFilterStatus(value); setCurrentPage(1); }, []);
  const openModal = (type: ModalState['type'], data?: AdminClient | AdminClientDetail) => {
    setModal({ type, data });
    setFormError('');
    if (type === 'edit' && data) {
      setFormData({ name: data.owner_name, email: data.user?.email || '', password: '', business_name: data.business_name, business_type: data.business_type, owner_name: data.owner_name, phone: data.phone || '', address: data.address || '', duration_days: 30 });
    } else if (type === 'extend' && data) {
      setExtendDays(30);
    } else if (type === 'reset-password' && data) {
      setNewPassword('');
    } else if (type === 'create') {
      setFormData({ name: '', email: '', password: '', business_name: '', business_type: 'Retail', owner_name: '', phone: '', address: '', duration_days: 30 });
    }
  };
  const handleCreate = async () => {
    if (!token) return;
    if (!formData.name || !formData.email || !formData.password || !formData.business_name || !formData.owner_name) { setFormError('Field wajib harus diisi'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setFormError('Format email tidak valid'); return; }
    if (formData.password.length < 6) { setFormError('Password minimal 6 karakter'); return; }
    if (formData.phone && !/^[\d\s\-+()]{8,15}$/.test(formData.phone)) { setFormError('Format nomor telepon tidak valid'); return; }
    setModalLoading(true); setFormError('');
    try { await adminClientApi.create(token, formData); setModal({ type: 'none' }); loadClients(); }
    catch (err) { setFormError(err instanceof Error ? err.message : 'Gagal membuat client'); }
    finally { setModalLoading(false); }
  };
  const handleExtend = async () => {
    if (!token || !modal.data) return;
    setModalLoading(true); setFormError('');
    try { await adminClientApi.extend(token, modal.data.id, extendDays); setModal({ type: 'none' }); loadClients(); }
    catch (err) { setFormError(err instanceof Error ? err.message : 'Gagal memperpanjang'); }
    finally { setModalLoading(false); }
  };
  const handleResetPassword = async () => {
    if (!token || !modal.data) return;
    if (!newPassword || newPassword.length < 6) { setFormError('Password minimal 6 karakter'); return; }
    setModalLoading(true); setFormError('');
    try { await adminClientApi.resetPassword(token, modal.data.id, newPassword); setModal({ type: 'none' }); }
    catch (err) { setFormError(err instanceof Error ? err.message : 'Gagal reset password'); }
    finally { setModalLoading(false); }
  };
  const handleEdit = async () => {
    if (!token || !modal.data) return;
    if (!formData.name || !formData.email || !formData.business_name || !formData.owner_name) { setFormError('Field wajib harus diisi'); return; }
    setModalLoading(true); setFormError('');
    try { await adminClientApi.update(token, modal.data.id, formData); setModal({ type: 'none' }); loadClients(); }
    catch (err) { setFormError(err instanceof Error ? err.message : 'Gagal mengupdate client'); }
    finally { setModalLoading(false); }
  };
  const handleStatusChange = useCallback(async (id: string, status: string) => {
    if (!token) return;
    try { await adminClientApi.updateStatus(token, id, status); loadClients(); }
    catch (err) { setFormError(err instanceof Error ? err.message : 'Gagal mengubah status'); }
  }, [token, loadClients]);
  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#276749]" /></div>;
  }
  return (
    <div className="space-y-6 min-h-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-xl font-bold text-gray-900">Manajemen Client</h1><p className="text-sm text-gray-500 mt-1">{filtered.length} client terdaftar</p></div>
        <button onClick={() => openModal('create')} className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-semibold transition" style={{ backgroundColor: "#276749" }}><Plus className="w-4 h-4" /> Tambah Client</button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => handleSearchChange(e.target.value)} placeholder="Cari nama bisnis, email, atau owner..." className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#276749] bg-gray-50" />
        </div>
        <select value={filterStatus} onChange={e => handleFilterChange(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#276749]">
          <option value="all">Semua Status</option><option value="active">Aktif</option><option value="expired">Expired</option><option value="suspended">Suspended</option><option value="inactive">Inactive</option>
        </select>
      </div>
      {pageError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg flex items-center justify-between"><span>{pageError}</span><button onClick={loadClients} className="text-sm underline hover:text-red-900">Coba lagi</button></div>}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <th className="px-5 py-3">Nama Bisnis</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Pemilik</th><th className="px-5 py-3">Tipe</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Aktif Hingga</th><th className="px-5 py-3">Dataset</th><th className="px-5 py-3 text-right">Aksi</th>
            </tr></thead>
            <tbody>
              {paginatedData.map(client => (
                <tr key={client.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-5 py-3 font-medium text-gray-900">{client.business_name}</td>
                  <td className="px-5 py-3 text-gray-500">{client.user?.email || '-'}</td>
                  <td className="px-5 py-3 text-gray-600">{client.owner_name}</td>
                  <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{client.business_type}</span></td>
                  <td className="px-5 py-3"><StatusBadge status={client.status} /></td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{client.active_until ? new Date(client.active_until).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="px-5 py-3 text-gray-500">{client.datasetCount || 0}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openModal('detail', client)} className="p-1.5 rounded-md text-[#276749] hover:bg-[#F1FAF5] transition" title="Detail"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openModal('edit', client)} className="p-1.5 rounded-md text-[#276749] hover:bg-[#F1FAF5] transition" title="Edit"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => openModal('extend', client)} className="p-1.5 rounded-md text-[#276749] hover:bg-[#F1FAF5] transition" title="Perpanjang"><Calendar className="w-4 h-4" /></button>
                      <button onClick={() => openModal('reset-password', client)} className="p-1.5 rounded-md text-[#276749] hover:bg-[#F1FAF5] transition" title="Reset Password"><Key className="w-4 h-4" /></button>
                      <button onClick={() => handleStatusChange(client.id, client.status === 'active' ? 'inactive' : 'active')} className={`p-1.5 rounded-md transition ${client.status === 'active' ? 'text-red-500 hover:bg-red-50' : 'text-[#276749] hover:bg-[#F1FAF5]'}`} title={client.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}>
                        {client.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedData.length === 0 && <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-400">Tidak ada data client</td></tr>}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Halaman {currentPage} dari {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-50">Sebelumnya</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-50">Selanjutnya</button>
            </div>
          </div>
        )}
      </div>
      {/* Modal - Create */}
      {modal.type === 'create' && (
        <Modal onClose={() => setModal({ type: 'none' })} title="Tambah Client Baru">
          <div className="space-y-4">
            {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{formError}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Nama *</label><input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Email *</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Password *</label><input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Nama Bisnis *</label><input value={formData.business_name} onChange={e => setFormData({ ...formData, business_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Tipe Bisnis *</label><select value={formData.business_type} onChange={e => setFormData({ ...formData, business_type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]" onMouseDown={e => e.stopPropagation()}>{BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Pemilik *</label><input value={formData.owner_name} onChange={e => setFormData({ ...formData, owner_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Telepon</label><input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Durasi (hari)</label><input type="number" value={formData.duration_days} onChange={e => setFormData({ ...formData, duration_days: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]" /></div>
            </div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Alamat</label><textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#276749] resize-none" /></div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setModal({ type: 'none' })} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
              <button onClick={handleCreate} disabled={modalLoading} className="px-4 py-2 text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: "#276749" }}>{modalLoading ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
        </Modal>
      )}
      {/* Modal - Edit */}
      {modal.type === 'edit' && modal.data && (
        <Modal onClose={() => setModal({ type: 'none' })} title="Edit Client">
          <div className="space-y-4">
            {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{formError}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Nama Pemilik</label><input value={formData.owner_name} onChange={e => setFormData({ ...formData, owner_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Email</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Nama Bisnis</label><input value={formData.business_name} onChange={e => setFormData({ ...formData, business_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Tipe Bisnis</label><select value={formData.business_type} onChange={e => setFormData({ ...formData, business_type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]" onMouseDown={e => e.stopPropagation()}>{BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Telepon</label><input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]" /></div>
            </div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Alamat</label><textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#276749] resize-none" /></div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setModal({ type: 'none' })} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
              <button onClick={handleEdit} disabled={modalLoading} className="px-4 py-2 text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: "#276749" }}>{modalLoading ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
        </Modal>
      )}
      {/* Modal - Extend */}
      {modal.type === 'extend' && modal.data && (
        <Modal onClose={() => setModal({ type: 'none' })} title="Perpanjang Masa Aktif">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Perpanjang masa aktif untuk <strong>{modal.data.business_name}</strong></p>
            {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{formError}</div>}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Durasi</label>
              <select value={extendDays} onChange={e => setExtendDays(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]" onMouseDown={e => e.stopPropagation()}>
                {DURATION_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Atau masukkan hari manual</label>
              <input type="number" value={extendDays} onChange={e => setExtendDays(Number(e.target.value))} min={1} max={3650} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]" />
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p className="text-gray-600">Aktif hingga:</p>
              <p className="font-medium">
                {(() => {
                  const base = modal.data.active_until && new Date(modal.data.active_until) > new Date()
                    ? new Date(modal.data.active_until) : new Date();
                  base.setDate(base.getDate() + extendDays);
                  return base.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                })()}
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setModal({ type: 'none' })} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
              <button onClick={handleExtend} disabled={modalLoading} className="px-4 py-2 text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: "#276749" }}>{modalLoading ? 'Menyimpan...' : 'Perpanjang'}</button>
            </div>
          </div>
        </Modal>
      )}
      {/* Modal - Reset Password */}
      {modal.type === 'reset-password' && modal.data && (
        <Modal onClose={() => setModal({ type: 'none' })} title="Reset Password">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Reset password untuk <strong>{modal.data.business_name}</strong></p>
            {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{formError}</div>}
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Password Baru *</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimal 6 karakter" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]" /></div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setModal({ type: 'none' })} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
              <button onClick={handleResetPassword} disabled={modalLoading} className="px-4 py-2 text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: "#276749" }}>{modalLoading ? 'Menyimpan...' : 'Reset Password'}</button>
            </div>
          </div>
        </Modal>
      )}
      {/* Modal - Detail */}
      {modal.type === 'detail' && modal.data && (
        <Modal onClose={() => setModal({ type: 'none' })} title="Detail Client">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <DetailItem label="Nama Bisnis" value={modal.data.business_name} icon={Building2} />
              <DetailItem label="Tipe Bisnis" value={modal.data.business_type} icon={Building2} />
              <DetailItem label="Nama Owner" value={modal.data.owner_name} icon={User} />
              <DetailItem label="Email" value={modal.data.user?.email || '-'} icon={User} />
              <DetailItem label="Telepon" value={modal.data.phone || '-'} icon={Phone} />
              <DetailItem label="Alamat" value={modal.data.address || '-'} icon={MapPin} />
              <DetailItem label="Status" value={<StatusBadge status={modal.data.status} />} />
              <DetailItem label="Aktif Hingga" value={modal.data.active_until ? new Date(modal.data.active_until).toLocaleDateString('id-ID') : '-'} icon={Calendar} />
            </div>
            <div className="flex justify-end pt-2"><button onClick={() => setModal({ type: 'none' })} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Tutup</button></div>
          </div>
        </Modal>
      )}
    </div>
  );
}
function DetailItem({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: typeof User }) {
  return <div className="flex items-start gap-3">{Icon && <Icon className="w-4 h-4 text-gray-400 mt-0.5" />}<div><p className="text-xs text-gray-500">{label}</p><p className="text-sm font-medium text-gray-900">{value}</p></div></div>;
}
