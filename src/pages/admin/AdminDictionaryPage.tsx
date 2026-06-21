// @ts-nocheck
// DashInsight - Admin Field Dictionary (Phase 7)
import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import {
  BookOpen, CheckCircle2, Eye, Globe2, Pencil, Plus,
  Search, Tag, Trash2, X, XCircle,
} from 'lucide-react';
import { useAuth } from '../../stores/useAuth';
import {
  adminFieldApi, type CreateFieldPayload, type FieldDictionary, type FieldStatus,
} from '../../services/api';

const DATA_TYPES = ['string', 'number', 'date', 'time', 'boolean', 'label'];
const STATUS_STYLE: Record<FieldStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-gray-200 text-gray-700',
};

type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'view' | 'edit' | 'delete'; field: FieldDictionary };

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function AdminDictionaryPage() {
  const { token } = useAuth();
  const [fields, setFields] = useState<FieldDictionary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [globalOnly, setGlobalOnly] = useState(false);
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    if (!token) return;
    const authToken = token;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const response = await adminFieldApi.list(authToken);
        if (!cancelled) setFields(response.fields);
      } catch (error: unknown) {
        if (!cancelled) setFeedback({ type: 'error', message: getErrorMessage(error, 'Gagal memuat Field Dictionary.') });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [token, refreshKey]);

  const filteredFields = useMemo(() => fields.filter(field => {
    const query = search.trim().toLowerCase();
    const syns = field.synonyms_json || [];
    const matchesSearch = !query || field.field_key.toLowerCase().includes(query) || field.field_label.toLowerCase().includes(query) || syns.some(synonym => synonym.toLowerCase().includes(query));
    const matchesStatus = !statusFilter || field.status === statusFilter;
    const matchesType = !typeFilter || field.data_type === typeFilter;
    const matchesGlobal = !globalOnly || field.is_required_global;
    return matchesSearch && matchesStatus && matchesType && matchesGlobal;
  }), [fields, search, statusFilter, typeFilter, globalOnly]);

  const totalPages = Math.ceil(filteredFields.length / PAGE_SIZE);

  const paginatedData = useMemo(() => filteredFields.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [filteredFields, currentPage]);

  const refresh = () => setRefreshKey(key => key + 1);

  const saveField = async (data: CreateFieldPayload, field?: FieldDictionary) => {
    if (!token) throw new Error('Sesi login tidak tersedia.');
    if (field) {
      await adminFieldApi.update(token, field.id, data);
      setFeedback({ type: 'success', message: 'Field dictionary berhasil diperbarui.' });
    } else {
      await adminFieldApi.create(token, data);
      setFeedback({ type: 'success', message: 'Field dictionary berhasil dibuat.' });
    }
    setModal({ type: 'none' });
    refresh();
  };

  const changeStatus = async (field: FieldDictionary, status: FieldStatus) => {
    if (!token) return;
    try {
      await adminFieldApi.updateStatus(token, field.id, status);
      setFeedback({ type: 'success', message: `${field.field_label} sekarang ${status}.` });
      refresh();
    } catch (error: unknown) {
      setFeedback({ type: 'error', message: getErrorMessage(error, 'Gagal mengubah status field.') });
    }
  };

  const deleteField = async (field: FieldDictionary) => {
    if (!token) return;
    setActionLoading(true);
    try {
      await adminFieldApi.delete(token, field.id);
      setModal({ type: 'none' });
      setFeedback({ type: 'success', message: `${field.field_label} berhasil dihapus.` });
      refresh();
    } catch (error: unknown) {
      setFeedback({ type: 'error', message: getErrorMessage(error, 'Gagal menghapus field dictionary.') });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-5 min-h-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Field Dictionary</h1>
          <p className="mt-0.5 text-sm text-gray-600">{fields.length} field · {fields.filter(field => field.status === 'active').length} aktif · {fields.filter(field => field.is_required_global).length} wajib global</p>
        </div>
        <button onClick={() => setModal({ type: 'create' })} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#276749] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f533a] focus:outline-none focus:ring-2 focus:ring-[#276749] focus:ring-offset-2"><Plus className="h-4 w-4" /> Tambah Field</button>
      </div>

      {feedback && (
        <div role={feedback.type === 'error' ? 'alert' : 'status'} className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm ${feedback.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          <span>{feedback.message}</span><button onClick={() => setFeedback(null)} className="rounded p-1 hover:bg-black/5" aria-label="Tutup notifikasi"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={event => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Cari key, label, atau sinonim" className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]" />
        </div>
        <select value={statusFilter} onChange={event => { setStatusFilter(event.target.value); setCurrentPage(1); }} aria-label="Filter status" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]"><option value="">Semua status</option><option value="active">active</option><option value="inactive">inactive</option></select>
        <select value={typeFilter} onChange={event => { setTypeFilter(event.target.value); setCurrentPage(1); }} aria-label="Filter tipe data" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]"><option value="">Semua tipe</option>{DATA_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select>
        <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"><input type="checkbox" checked={globalOnly} onChange={event => { setGlobalOnly(event.target.checked); setCurrentPage(1); }} className="h-4 w-4 rounded border-gray-300 text-[#276749] focus:ring-[#276749]" /> Wajib global</label>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="hidden grid-cols-[minmax(220px,1.5fr)_110px_minmax(200px,1.5fr)_110px_100px_130px] gap-3 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-semibold text-gray-600 lg:grid"><span>Field</span><span>Tipe data</span><span>Sinonim</span><span>Cakupan</span><span>Status</span><span>Aksi</span></div>
        {loading ? <FieldSkeleton /> : filteredFields.length === 0 ? (
          <div className="px-6 py-16 text-center"><BookOpen className="mx-auto h-10 w-10 text-gray-300" /><h2 className="mt-3 font-semibold text-gray-900">Tidak ada field ditemukan</h2><p className="mt-1 text-sm text-gray-600">Ubah filter atau tambahkan field baru untuk auto-mapping.</p></div>
        ) : (
          <>
            {paginatedData.map(field => (
              <div key={field.id} className="relative grid gap-3 border-b border-gray-100 px-5 py-4 last:border-b-0 lg:grid-cols-[minmax(220px,1.5fr)_110px_minmax(200px,1.5fr)_110px_100px_130px] lg:items-center">
                <div className="flex min-w-0 items-start gap-3"><div className="mt-0.5 rounded-lg bg-purple-50 p-2 text-purple-700"><BookOpen className="h-5 w-5" /></div><div className="min-w-0"><button onClick={() => setModal({ type: 'view', field })} className="truncate text-left text-sm font-semibold text-gray-900 hover:text-[#276749]">{field.field_label}</button><code className="mt-0.5 block truncate text-xs text-gray-500">{field.field_key}</code>{field.description && <p className="mt-1 line-clamp-1 text-xs text-gray-600">{field.description}</p>}</div></div>
                <div><span className="rounded-md bg-blue-50 px-2 py-1 font-mono text-xs text-blue-700">{field.data_type}</span></div>
                <div className="flex flex-wrap gap-1">{(field.synonyms_json || []).length === 0 ? <span className="text-xs text-gray-500">Belum ada</span> : <>{(field.synonyms_json || []).slice(0, 3).map(synonym => <span key={synonym} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">{synonym}</span>)}{(field.synonyms_json || []).length > 3 && <span className="px-1 py-1 text-xs text-gray-500">+{(field.synonyms_json || []).length - 3}</span>}</>}</div>
                <div className="text-xs text-gray-700">{field.is_required_global ? <span className="inline-flex items-center gap-1"><Globe2 className="h-3.5 w-3.5 text-[#276749]" /> Wajib global</span> : 'Opsional'}</div>
                <div><span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLE[field.status]}`}>{field.status}</span></div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setModal({ type: 'view', field })} className="p-1.5 rounded-md text-[#276749] hover:bg-[#F1FAF5] transition" title="Lihat detail"><Eye className="w-4 h-4" /></button>
                  <button onClick={() => setModal({ type: 'edit', field })} className="p-1.5 rounded-md text-[#276749] hover:bg-[#F1FAF5] transition" title="Edit field"><Pencil className="w-4 h-4" /></button>
                  {field.status === 'active' ? <button onClick={() => changeStatus(field, 'inactive')} className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition" title="Nonaktifkan"><XCircle className="w-4 h-4" /></button> : <button onClick={() => changeStatus(field, 'active')} className="p-1.5 rounded-md text-[#276749] hover:bg-[#F1FAF5] transition" title="Aktifkan"><CheckCircle2 className="w-4 h-4" /></button>}
                  <button onClick={() => setModal({ type: 'delete', field })} className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition" title="Hapus permanen"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Menampilkan {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredFields.length)}-{Math.min(currentPage * PAGE_SIZE, filteredFields.length)} dari {filteredFields.length} items</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Sebelumnya</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = i + 1;
                return <button key={page} onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 text-xs font-medium rounded-md ${currentPage === page ? 'bg-[#276749] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>{page}</button>;
              })}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Selanjutnya</button>
            </div>
          </div>
        )}
      </div>

      {modal.type === 'create' && <FieldModal onClose={() => setModal({ type: 'none' })} onSave={data => saveField(data)} />}
      {(modal.type === 'view' || modal.type === 'edit') && <FieldModal field={modal.field} mode={modal.type} onClose={() => setModal({ type: 'none' })} onSave={data => saveField(data, modal.field)} />}
      {modal.type === 'delete' && <DeleteConfirm field={modal.field} loading={actionLoading} onClose={() => setModal({ type: 'none' })} onConfirm={() => deleteField(modal.field)} />}
    </div>
  );
}

function FieldSkeleton() {
  return <div aria-label="Memuat field dictionary">{[1, 2, 3, 4, 5].map(item => <div key={item} className="flex animate-pulse items-center gap-3 border-b border-gray-100 px-5 py-5"><div className="h-9 w-9 rounded-lg bg-gray-200" /><div className="flex-1"><div className="h-4 w-48 rounded bg-gray-200" /><div className="mt-2 h-3 w-64 max-w-full rounded bg-gray-100" /></div></div>)}</div>;
}

function normalizeSynonyms(values: string[]) {
  const seen = new Set<string>();
  return values.map(value => value.trim()).filter(Boolean).filter(value => {
    const key = value.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function FieldModal({ field, mode = 'create', onClose, onSave }: { field?: FieldDictionary; mode?: 'create' | 'view' | 'edit'; onClose: () => void; onSave: (data: CreateFieldPayload) => Promise<void> }) {
  const isView = mode === 'view';
  const [fieldKey, setFieldKey] = useState(field?.field_key || '');
  const [fieldLabel, setFieldLabel] = useState(field?.field_label || '');
  const [dataType, setDataType] = useState(field?.data_type || 'string');
  const [description, setDescription] = useState(field?.description || '');
  const [requiredGlobal, setRequiredGlobal] = useState(field?.is_required_global || false);
  const [status, setStatus] = useState<FieldStatus>(field?.status || 'active');
  const [synonyms, setSynonyms] = useState<string[]>(field?.synonyms_json || []);
  const [synonymDraft, setSynonymDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const commitDraft = () => {
    const values = normalizeSynonyms([...synonyms, ...synonymDraft.split(',')]);
    setSynonyms(values);
    setSynonymDraft('');
    return values;
  };

  const handleSynonymKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commitDraft();
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (isView) return;
    if (!fieldKey.trim() || !fieldLabel.trim() || !dataType) {
      setError('Field key, label, dan tipe data wajib diisi.');
      return;
    }
    const finalSynonyms = normalizeSynonyms([...synonyms, ...synonymDraft.split(',')]);
    setSaving(true);
    setError('');
    try {
      await onSave({ field_key: fieldKey.trim(), field_label: fieldLabel.trim(), data_type: dataType, description: description.trim() || null, is_required_global: requiredGlobal, synonyms_json: finalSynonyms, status });
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, 'Gagal menyimpan field dictionary.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="field-modal-title">
      <button className="fixed inset-0 cursor-default bg-black/50" onClick={saving ? undefined : onClose} aria-label="Tutup modal" />
      <form onSubmit={submit} className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4"><div><h2 id="field-modal-title" className="text-lg font-bold text-gray-900">{isView ? 'Detail Field' : field ? 'Edit Field' : 'Tambah Field'}</h2><p className="mt-0.5 text-sm text-gray-600">Definisikan field canonical dan kata-kata yang dapat dipetakan otomatis.</p></div><button type="button" onClick={onClose} disabled={saving} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50" aria-label="Tutup"><X className="h-5 w-5" /></button></div>
        <div className="space-y-5 px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium text-gray-700">Field key *<input value={fieldKey} disabled={isView || !!field} onChange={event => setFieldKey(event.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''))} placeholder="transaction_date" className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#276749] disabled:opacity-70" /></label>
            <label className="text-xs font-medium text-gray-700">Label *<input value={fieldLabel} disabled={isView} onChange={event => setFieldLabel(event.target.value)} placeholder="Tanggal Transaksi" className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#276749] disabled:opacity-70" /></label>
            <label className="text-xs font-medium text-gray-700">Tipe data *<select value={dataType} disabled={isView} onChange={event => setDataType(event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#276749] disabled:opacity-70">{DATA_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select></label>
            <label className="text-xs font-medium text-gray-700">Status<select value={status} disabled={isView || !!field} onChange={event => setStatus(event.target.value as FieldStatus)} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#276749] disabled:opacity-70"><option value="active">active</option><option value="inactive">inactive</option></select></label>
          </div>
          <label className="block text-xs font-medium text-gray-700">Deskripsi<textarea value={description} disabled={isView} onChange={event => setDescription(event.target.value)} rows={3} placeholder="Jelaskan penggunaan field ini" className="mt-1.5 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#276749] disabled:opacity-70" /></label>
          <label className="flex items-start gap-3 rounded-lg bg-emerald-50 p-3"><input type="checkbox" checked={requiredGlobal} disabled={isView} onChange={event => setRequiredGlobal(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#276749] focus:ring-[#276749]" /><span><span className="block text-sm font-medium text-emerald-900">Wajib untuk semua dataset</span><span className="block text-xs text-emerald-700">Field ini menjadi bagian pemeriksaan kelengkapan data global.</span></span></label>
          <div><label className="text-xs font-medium text-gray-700">Sinonim</label><p className="mt-0.5 text-xs text-gray-600">Tekan Enter atau koma untuk menambahkan kata yang biasa muncul di file pengguna.</p><div className="mt-2 flex min-h-11 flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 focus-within:ring-2 focus-within:ring-[#276749]">{synonyms.map(synonym => <span key={synonym} className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-1 text-xs text-purple-800"><Tag className="h-3 w-3" />{synonym}{!isView && <button type="button" onClick={() => setSynonyms(items => items.filter(item => item !== synonym))} className="rounded hover:bg-purple-200" aria-label={`Hapus sinonim ${synonym}`}><X className="h-3 w-3" /></button>}</span>)}{!isView && <input value={synonymDraft} onChange={event => setSynonymDraft(event.target.value)} onKeyDown={handleSynonymKey} onBlur={commitDraft} placeholder={synonyms.length ? 'Tambah sinonim' : 'tanggal, tgl, order date'} className="min-w-40 flex-1 bg-transparent px-1 py-1 text-sm outline-none" />}</div></div>
          {isView && field && <div className="flex flex-wrap gap-4 border-t border-gray-100 pt-4 text-xs text-gray-600"><span>Dibuat: <strong className="text-gray-800">{new Date(field.created_at).toLocaleDateString('id-ID')}</strong></span><span>Diperbarui: <strong className="text-gray-800">{new Date(field.updated_at).toLocaleDateString('id-ID')}</strong></span></div>}
          {error && <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        </div>
        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4"><button type="button" onClick={onClose} disabled={saving} className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50">{isView ? 'Tutup' : 'Batal'}</button>{!isView && <button type="submit" disabled={saving} className="rounded-lg bg-[#276749] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f533a] disabled:opacity-50">{saving ? 'Menyimpan...' : field ? 'Simpan Perubahan' : 'Tambah Field'}</button>}</div>
      </form>
    </div>
  );
}

function DeleteConfirm({ field, loading, onClose, onConfirm }: { field: FieldDictionary; loading: boolean; onClose: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="delete-field-title"><button className="fixed inset-0 cursor-default bg-black/50" onClick={loading ? undefined : onClose} aria-label="Batal hapus" /><div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl"><div className="flex items-start gap-3"><div className="rounded-lg bg-red-50 p-2 text-red-700"><Trash2 className="h-5 w-5" /></div><div><h2 id="delete-field-title" className="font-bold text-gray-900">Hapus field dictionary?</h2><p className="mt-1 text-sm text-gray-600"><strong>{field.field_label}</strong> akan dihapus permanen. Pastikan field ini tidak lagi digunakan untuk auto-mapping.</p></div></div><div className="mt-6 flex justify-end gap-3"><button onClick={onClose} disabled={loading} className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50">Batal</button><button onClick={onConfirm} disabled={loading} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">{loading ? 'Menghapus...' : 'Hapus Permanen'}</button></div></div></div>;
}