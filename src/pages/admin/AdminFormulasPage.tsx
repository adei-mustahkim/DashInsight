// DashInsight - Admin Formula Builder Page (Full Implementation)
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../../stores/useAuth';
import { adminFormulaApi, adminFieldApi, type FieldDictionary, type FormulaStatus, type FormulaTemplate } from '../../services/api';
import {
  Plus, FileText, Search, Eye, Edit2, Archive, CheckCircle, X, ChevronDown, ChevronUp, ArrowRight, Trash2
} from 'lucide-react';

const FORMULA_TYPES = ['aggregation', 'derived', 'ratio', 'comparison', 'ranking'];
const OUTPUT_TYPES = ['number', 'currency', 'percent', 'text'];
const FORMULA_CATEGORIES = ['kpi', 'margin', 'growth', 'ratio', 'custom'];
const OPERATIONS = ['SUM', 'COUNT', 'COUNT_DISTINCT', 'AVG', 'MIN', 'MAX', 'SUBTRACT', 'DIVIDE', 'MULTIPLY', 'PERCENTAGE', 'RANK', 'CUMULATIVE_SUM'];

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
  active: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  inactive: { bg: 'bg-amber-100', text: 'text-amber-700' },
  archived: { bg: 'bg-red-100', text: 'text-red-700' },
};

interface ModalState {
  type: 'none' | 'create' | 'view' | 'edit' | 'test' | 'version' | 'delete';
  data?: FormulaTemplate;
}

function isJsonObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}
export default function AdminFormulasPage() {
  const { token } = useAuth();
  const [formulas, setFormulas] = useState<FormulaTemplate[]>([]);
  const [fieldDictionary, setFieldDictionary] = useState<FieldDictionary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!token) return;
    const authToken = token;
    mountedRef.current = true;

    async function loadData() {
      try {
        const res = await adminFormulaApi.list(authToken, statusFilter || undefined);
        if (mountedRef.current) {
          setFormulas(res.templates);
          setLoading(false);
        }
      } catch (error: unknown) {
        if (mountedRef.current) {
          setFeedback({ type: 'error', message: getErrorMessage(error, 'Gagal memuat formula.') });
          setLoading(false);
        }
      }
    }

    loadData();
    return () => { mountedRef.current = false; };
  }, [token, statusFilter, refreshKey]);

  const filtered = useMemo(() => formulas.filter(f =>
    !search || f.formula_name.toLowerCase().includes(search.toLowerCase()) ||
    f.formula_code.toLowerCase().includes(search.toLowerCase())
  ), [formulas, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const paginatedData = useMemo(() => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [filtered, currentPage]);

  const handleStatusChange = useCallback(async (id: string, status: FormulaStatus) => {
    if (!token) return;
    setFeedback(null);
    try {
      await adminFormulaApi.updateStatus(token, id, status);
      setFeedback({ type: 'success', message: `Status formula diubah menjadi ${status}.` });
      setRefreshKey(k => k + 1);
    } catch (error: unknown) {
      setFeedback({ type: 'error', message: getErrorMessage(error, 'Gagal mengubah status formula.') });
    }
  }, [token]);

  const handlePublish = useCallback(async (id: string) => {
    if (!token) return;
    setFeedback(null);
    try {
      await adminFormulaApi.publish(token, id);
      setFeedback({ type: 'success', message: 'Formula berhasil dipublish.' });
      setRefreshKey(k => k + 1);
    } catch (error: unknown) {
      setFeedback({ type: 'error', message: getErrorMessage(error, 'Gagal mempublish formula.') });
    }
  }, [token]);

  const handleTestFormula = async (formula: FormulaTemplate) => {
    if (!token) return;
    setTesting(true);
    setTestResult(null);
    try {
      const response = await adminFormulaApi.test(token, formula.id);
      setTestResult(response.test.message || 'Formula berhasil diuji.');
    } catch {
      setTestResult('Formula belum dapat diuji. Periksa JSON atau coba lagi.');
    } finally {
      setTesting(false);
    }
  };

  const deleteFormula = async (formula: FormulaTemplate) => {
    if (!token) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      await adminFormulaApi.delete(token, formula.id);
      setFeedback({ type: 'success', message: 'Formula template berhasil dihapus permanen.' });
      setModal({ type: 'none' });
      setRefreshKey(k => k + 1);
    } catch (error: unknown) {
      setFeedback({ type: 'error', message: getErrorMessage(error, 'Gagal menghapus formula.') });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-5 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Metric & Formula Library</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {formulas.length} metric/formula • {formulas.filter(f => f.status === 'active').length} aktif untuk KPI dan chart
          </p>
        </div>
        <button
          onClick={() => setModal({ type: 'create' })}
          className="flex items-center gap-2 bg-[#276749] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#1f533a] transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Buat Metric / Formula
        </button>
      </div>

      {feedback && (
        <div
          role="status"
          className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm ${feedback.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="rounded p-1 hover:bg-black/5" aria-label="Tutup notifikasi">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Cari formula..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#276749]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#276749]"
        >
          <option value="">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Formula List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#276749]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada metric atau formula</p>
          <button
            onClick={() => setModal({ type: 'create' })}
            className="mt-3 text-sm text-[#276749] hover:underline"
          >
            Buat metric pertama
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="grid gap-4 p-5">
            {paginatedData.map(formula => (
              <FormulaCard
                key={formula.id}
                formula={formula}
                onView={() => setModal({ type: 'view', data: formula })}
                onEdit={() => setModal({ type: 'edit', data: formula })}
                onTest={() => { setTestResult(null); setModal({ type: 'test', data: formula }); }}
                onVersion={() => setModal({ type: 'version', data: formula })}
                onPublish={() => handlePublish(formula.id)}
                onStatusChange={status => handleStatusChange(formula.id, status)}
                onDelete={() => setModal({ type: 'delete', data: formula })}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">Menampilkan {Math.min((currentPage - 1) * PAGE_SIZE + 1, filtered.length)}-{Math.min(currentPage * PAGE_SIZE, filtered.length)} dari {filtered.length} items</p>
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
      )}

      {/* Modal - Create */}
      {modal.type === 'create' && (
        <FormulaModal fieldDictionary={fieldDictionary}
          title="Buat Metric / Formula"
          onClose={() => setModal({ type: 'none' })}
          onSave={async (data) => {
            if (!token) throw new Error('Sesi login tidak tersedia.');
            await adminFormulaApi.create(token, data);
            setModal({ type: 'none' });
            setFeedback({ type: 'success', message: 'Metric/formula baru berhasil dibuat.' });
            setRefreshKey(k => k + 1);
          }}
        />
      )}

      {/* Modal - View */}
      {modal.type === 'view' && modal.data && (
        <FormulaModal fieldDictionary={fieldDictionary}
          title="Detail Formula"
          mode="view"
          initialData={modal.data}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {modal.type === 'test' && modal.data && (
        <FormulaTestModal
          formula={modal.data}
          testing={testing}
          result={testResult}
          onTest={() => handleTestFormula(modal.data!)}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {modal.type === 'version' && modal.data && token && (
        <FormulaVersionModal
          formula={modal.data}
          onClose={() => setModal({ type: 'none' })}
          onCreate={async (formulaJson) => {
            await adminFormulaApi.createVersion(token, modal.data!.id, formulaJson);
            setModal({ type: 'none' });
            setFeedback({ type: 'success', message: `Versi baru untuk ${modal.data!.formula_name} berhasil dibuat sebagai draft.` });
            setRefreshKey(k => k + 1);
          }}
        />
      )}

      {/* Modal - Edit */}
      {modal.type === 'edit' && modal.data && (
        <FormulaModal fieldDictionary={fieldDictionary}
          title="Edit Formula"
          mode="edit"
          initialData={modal.data}
          onClose={() => setModal({ type: 'none' })}
          onSave={async (data) => {
            if (!token || !modal.data) throw new Error('Sesi atau formula tidak tersedia.');
            await adminFormulaApi.update(token, modal.data.id, data);
            setModal({ type: 'none' });
            setFeedback({ type: 'success', message: 'Formula berhasil diperbarui.' });
            setRefreshKey(k => k + 1);
          }}
        />
      )}

      {/* Modal - Delete Confirmation */}
      {modal.type === 'delete' && modal.data && (
        <DeleteConfirm
          formula={modal.data}
          loading={actionLoading}
          onClose={() => setModal({ type: 'none' })}
          onConfirm={() => deleteFormula(modal.data!)}
        />
      )}
    </div>
  );
}

function FormulaCard({
  formula, onView, onEdit, onTest, onVersion, onPublish, onStatusChange, onDelete
}: {
  formula: FormulaTemplate;
  onView: () => void;
  onEdit: () => void;
  onTest: () => void;
  onVersion: () => void;
  onPublish: () => void;
  onStatusChange: (status: FormulaStatus) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const statusStyle = STATUS_STYLES[formula.status] || STATUS_STYLES.draft;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900">{formula.formula_name}</h3>
              <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-600">
                {formula.formula_code}
              </code>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                {formula.status}
              </span>
              {formula.version > 1 && (
                <span className="text-xs text-gray-400">v{formula.version}</span>
              )}
            </div>
            {formula.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-1">{formula.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              <span>Type: {formula.formula_type}</span>
              <span>Output: {formula.output_type}</span>
              {formula.category && <span>Category: {formula.category}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onView}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Lihat"
            >
              <Eye className="w-4 h-4 text-gray-500" />
            </button>
            {formula.status !== 'archived' && formula.status !== 'active' && (
              <button
                onClick={onEdit}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Edit"
              >
                <Edit2 className="w-4 h-4 text-gray-500" />
              </button>
            )}
            <div className="flex items-center gap-1">
              <button
                onClick={onTest}
                className="p-1.5 rounded-md text-[#276749] hover:bg-[#F1FAF5] transition"
                title="Uji Formula"
              >
                <FileText className="w-4 h-4" />
              </button>
              {formula.status === 'draft' && (
                <button
                  onClick={onPublish}
                  className="p-1.5 rounded-md text-[#276749] hover:bg-[#F1FAF5] transition"
                  title="Publish"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
              {formula.status !== 'archived' && (
                <button
                  type="button"
                  onClick={onVersion}
                  className="p-1.5 rounded-md text-[#276749] hover:bg-[#F1FAF5] transition"
                  title="Buat Versi Baru"
                >
                  <FileText className="w-4 h-4" />
                </button>
              )}
              {formula.status === 'active' && (
                <button
                  type="button"
                  onClick={() => onStatusChange('inactive')}
                  className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition"
                  title="Nonaktifkan"
                >
                  <Archive className="w-4 h-4" />
                </button>
              )}
              {formula.status === 'inactive' && (
                <button
                  type="button"
                  onClick={() => onStatusChange('active')}
                  className="p-1.5 rounded-md text-[#276749] hover:bg-[#F1FAF5] transition"
                  title="Aktifkan"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onDelete}
                className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition"
                title="Hapus Permanen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* JSON Preview */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Sembunyikan' : 'Lihat'} JSON Rule
        </button>
        {expanded && (
          <div className="mt-2 p-3 bg-gray-900 rounded-lg text-xs font-mono overflow-x-auto">
            <pre className="text-emerald-400 whitespace-pre-wrap">
              {JSON.stringify(formula.formula_json, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function FormulaVersionModal({ formula, onCreate, onClose }: {
  formula: FormulaTemplate;
  onCreate: (formulaJson: object) => Promise<void>;
  onClose: () => void;
}) {
  const [jsonText, setJsonText] = useState(() => JSON.stringify(formula.formula_json, null, 2));
  const [jsonError, setJsonError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  const validateJson = (value: string) => {
    setJsonText(value);
    try {
      const parsed: unknown = JSON.parse(value);
      setJsonError(isJsonObject(parsed) ? '' : 'JSON rule harus berupa object.');
    } catch {
      setJsonError('JSON tidak valid.');
    }
  };

  const handleCreate = async () => {
    setSubmitError('');
    try {
      const parsed: unknown = JSON.parse(jsonText);
      if (!isJsonObject(parsed)) {
        setJsonError('JSON rule harus berupa object.');
        return;
      }
      setSaving(true);
      await onCreate(parsed);
    } catch (error: unknown) {
      setSubmitError(getErrorMessage(error, 'Gagal membuat versi formula.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="version-modal-title">
      <div className="fixed inset-0 bg-black/50" onClick={saving ? undefined : onClose} />
      <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div>
            <h2 id="version-modal-title" className="text-lg font-bold text-gray-900">Buat Versi Baru</h2>
            <p className="mt-1 text-sm text-gray-500">{formula.formula_name} - dari v{formula.version} ke v{formula.version + 1}</p>
          </div>
          <button onClick={onClose} disabled={saving} className="rounded-lg p-1 hover:bg-gray-100 disabled:opacity-50" aria-label="Tutup">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="mb-3 text-sm text-gray-600">Versi baru dibuat sebagai draft. Formula yang sedang aktif tidak akan berubah.</p>
          <label htmlFor="version-formula-json" className="mb-1 block text-xs font-medium text-gray-700">JSON Rule *</label>
          <textarea
            id="version-formula-json"
            value={jsonText}
            onChange={event => validateJson(event.target.value)}
            rows={14}
            spellCheck={false}
            className="w-full resize-y rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 font-mono text-xs text-emerald-400 focus:outline-none focus:ring-2 focus:ring-[#276749]"
          />
          {jsonError && <p className="mt-2 text-sm text-red-600">{jsonError}</p>}
          {submitError && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{submitError}</p>}
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} disabled={saving} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50">Batal</button>
          <button onClick={handleCreate} disabled={saving || !!jsonError} className="rounded-lg bg-[#276749] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f533a] disabled:opacity-50">
            {saving ? 'Membuat versi...' : 'Buat Versi Draft'}
          </button>
        </div>
      </div>
    </div>
  );
}
function FormulaTestModal({ formula, testing, result, onTest, onClose }: {
  formula: FormulaTemplate;
  testing: boolean;
  result: string | null;
  onTest: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Uji Formula</h2>
            <p className="text-sm text-gray-500 mt-1">{formula.formula_name} · v{formula.version}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100" aria-label="Tutup">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <pre className="mt-4 p-3 bg-gray-900 rounded-lg text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(formula.formula_json, null, 2)}
        </pre>
        <p className="mt-3 text-xs text-gray-500">
          Pengujian saat ini memvalidasi formula melalui server tanpa menjalankan kode dinamis.
        </p>
        {result && (
          <div className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700" role="status">
            {result}
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            Tutup
          </button>
          <button
            onClick={onTest}
            disabled={testing}
            className="px-4 py-2 text-sm font-semibold text-white bg-[#276749] rounded-lg hover:bg-[#1f533a] disabled:opacity-50"
          >
            {testing ? 'Menguji...' : 'Jalankan Uji'}
          </button>
        </div>
      </div>
    </div>
  );
}
interface FormulaModalProps {
  fieldDictionary: FieldDictionary[];
  title: string;
  mode?: 'view' | 'edit' | 'create';
  initialData?: FormulaTemplate;
  onClose: () => void;
  onSave?: (data: {
    formula_code: string;
    formula_name: string;
    description?: string;
    category?: string;
    output_type: string;
    formula_type: string;
    formula_json: object;
    status: FormulaStatus;
  }) => Promise<void> | void;
}

function FormulaModal({ fieldDictionary, title, mode = 'create', initialData, onClose, onSave }: FormulaModalProps) {
  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';

  const [formData, setFormData] = useState({
    formula_code: initialData?.formula_code || '',
    formula_name: initialData?.formula_name || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    output_type: initialData?.output_type || 'number',
    formula_type: initialData?.formula_type || 'aggregation',
    formula_json: initialData?.formula_json || { type: 'aggregation', operation: 'SUM', field: '' },
    status: initialData?.status || 'draft',
  });
  const [uiMode, setUiMode] = useState<'visual'|'json'>('visual');
  const [jsonText, setJsonText] = useState(() => JSON.stringify(formData.formula_json, null, 2));
  const [jsonError, setJsonError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleJsonChange = (jsonStr: string) => {
    setJsonText(jsonStr);
    try {
      const parsed: unknown = JSON.parse(jsonStr);
      if (!isJsonObject(parsed)) {
        setJsonError('JSON rule harus berupa object.');
        return;
      }
      setFormData({ ...formData, formula_json: parsed });
      setJsonError('');
    } catch {
      setJsonError('JSON tidak valid.');
    }
  };

  const applyExample = (json: object) => {
    setFormData({ ...formData, formula_json: json });
    setJsonText(JSON.stringify(json, null, 2));
    setJsonError('');
  };

  
  const syncFromVisual = (newJson: any) => {
    setFormData({ ...formData, formula_json: newJson });
    setJsonText(JSON.stringify(newJson, null, 2));
    setJsonError('');
  };

  const handleSave = async () => {
    if (!onSave || jsonError) return;
    if (!formData.formula_code || !formData.formula_name || !formData.formula_type) return;
    setSaving(true);
    setSubmitError('');
    try {
      await onSave(formData);
    } catch (error: unknown) {
      setSubmitError(getErrorMessage(error, 'Gagal menyimpan formula.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Kode Formula *</label>
              <input
                value={formData.formula_code}
                onChange={e => setFormData({ ...formData, formula_code: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                disabled={isView || isEdit}
                placeholder="TOTAL_REVENUE"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 font-mono focus:outline-none focus:ring-2 focus:ring-[#276749] disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nama *</label>
              <input
                value={formData.formula_name}
                onChange={e => setFormData({ ...formData, formula_name: e.target.value })}
                disabled={isView}
                placeholder="Total Revenue"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#276749] disabled:opacity-60 bg-gray-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipe Formula</label>
              <select
                value={formData.formula_type}
                onChange={e => setFormData({ ...formData, formula_type: e.target.value })}
                disabled={isView}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#276749] disabled:opacity-60"
              >
                {FORMULA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Output Type</label>
              <select
                value={formData.output_type}
                onChange={e => setFormData({ ...formData, output_type: e.target.value })}
                disabled={isView}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#276749] disabled:opacity-60"
              >
                {OUTPUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                disabled={isView}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#276749] disabled:opacity-60"
              >
                <option value="">-</option>
                {FORMULA_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Deskripsi</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              disabled={isView}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#276749] disabled:opacity-60 resize-none"
            />
          </div>

          {/* Formula Builder */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Aturan Formula</h3>
                <p className="text-xs text-gray-500 mt-0.5">Tentukan bagaimana nilai ini dihitung.</p>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
                <button
                  type="button"
                  onClick={() => setUiMode('visual')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${uiMode === 'visual' ? 'bg-[#276749] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >Visual Builder</button>
                <button
                  type="button"
                  onClick={() => setUiMode('json')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${uiMode === 'json' ? 'bg-[#276749] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >JSON Mentah</button>
              </div>
            </div>
            
            <div className="p-4">
              {uiMode === 'json' ? (
                <div>
                  {jsonError && <span className="text-xs text-red-500 mb-1 block">{jsonError}</span>}
                  <textarea
                    value={jsonText}
                    onChange={e => handleJsonChange(e.target.value)}
                    disabled={isView}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono bg-gray-900 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-[#276749] disabled:opacity-60 resize-none"
                    placeholder='{"type": "aggregation", "operation": "SUM", "field": "sales_amount"}'
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.formula_type === 'aggregation' && (
                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-700 block mb-1">Pilih Operasi</label>
                        <select
                          disabled={isView}
                          value={formData.formula_json.operation || 'SUM'}
                          onChange={e => syncFromVisual({ type: 'aggregation', operation: e.target.value, field: formData.formula_json.field || '' })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#276749] disabled:opacity-60"
                        >
                          <option value="SUM">Total (SUM)</option>
                          <option value="AVG">Rata-rata (AVG)</option>
                          <option value="COUNT">Jumlah Baris (COUNT)</option>
                          <option value="COUNT_DISTINCT">Jumlah Unik (COUNT DISTINCT)</option>
                          <option value="MAX">Nilai Tertinggi (MAX)</option>
                          <option value="MIN">Nilai Terendah (MIN)</option>
                        </select>
                      </div>
                      <div className="flex-none px-2 py-2 text-sm font-semibold text-gray-400">DARI</div>
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-700 block mb-1">Pilih Kolom Data</label>
                        <select
                          disabled={isView}
                          value={formData.formula_json.field || ''}
                          onChange={e => syncFromVisual({ type: 'aggregation', operation: formData.formula_json.operation || 'SUM', field: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#276749] disabled:opacity-60"
                        >
                          <option value="">-- Pilih Kolom --</option>
                          {fieldDictionary.map(f => (
                            <option key={f.field_key} value={f.field_key}>{f.field_label} ({f.field_key})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {formData.formula_type !== 'aggregation' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                      <p className="font-semibold mb-1">Mode Visual Belum Mendukung Tipe Ini</p>
                      <p>Visual Builder saat ini difokuskan untuk tipe <strong>aggregation</strong>. Untuk membuat rumus turunan (seperti Profit Margin = (Revenue - COGS) / Revenue), silakan gunakan mode <strong>JSON Mentah</strong> atau pilih dari contoh di bawah.</p>
                      <button type="button" onClick={() => setUiMode('json')} className="mt-3 px-3 py-1.5 bg-amber-600 text-white rounded-md text-xs font-semibold hover:bg-amber-700 transition">Beralih ke JSON Mentah</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Examples */}
          <details className="group">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
              Lihat contoh formula
            </summary>
            <div className="mt-2 space-y-2">
              <ExampleBox
                title="Total Revenue (SUM)"
                json={{ type: 'aggregation', operation: 'SUM', field: 'sales_amount' }}
                onApply={applyExample}
                disabled={isView}
              />
              <ExampleBox
                title="AOV (DIVIDE)"
                json={{
                  type: 'derived',
                  operation: 'DIVIDE',
                  left: { operation: 'SUM', field: 'sales_amount' },
                  right: { operation: 'COUNT_DISTINCT', field: 'transaction_id' }
                }}
                onApply={applyExample}
                disabled={isView}
              />
              <ExampleBox
                title="Profit Margin (MULTIPLY)"
                json={{
                  type: 'derived',
                  operation: 'MULTIPLY',
                  left: {
                    operation: 'DIVIDE',
                    left: {
                      operation: 'SUBTRACT',
                      left: { operation: 'SUM', field: 'sales_amount' },
                      right: { operation: 'SUM', field: 'cogs' }
                    },
                    right: { operation: 'SUM', field: 'sales_amount' }
                  },
                  right: 100
                }}
                onApply={applyExample}
                disabled={isView}
              />
            </div>
          </details>
        </div>

        {submitError && (
          <div className="mx-6 mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{submitError}</div>
        )}
        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            {isView ? 'Tutup' : 'Batal'}
          </button>
          {(isCreate || isEdit) && (
            <button
              onClick={handleSave}
              disabled={saving || !formData.formula_code || !formData.formula_name || !!jsonError}
              className="px-4 py-2 bg-[#276749] text-white text-sm rounded-lg hover:bg-[#1f533a] disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : isCreate ? 'Buat' : 'Simpan'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ExampleBox({
  title, json, onApply, disabled
}: {
  title: string;
  json: object;
  onApply: (json: object) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-gray-50 rounded-lg p-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700">{title}</span>
        <div className="flex gap-1">
          <button
            onClick={() => setOpen(!open)}
            className="p-1 hover:bg-gray-200 rounded text-gray-500"
          >
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <button
            onClick={() => onApply(json)}
            disabled={disabled}
            className="p-1 hover:bg-gray-200 rounded text-gray-500 disabled:opacity-50"
            title="Gunakan contoh ini"
          >
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
      {open && (
        <pre className="mt-2 p-2 bg-gray-900 rounded text-xs text-emerald-400 font-mono overflow-x-auto">
          {JSON.stringify(json, null, 2)}
        </pre>
      )}
    </div>
  );
}

function DeleteConfirm({ formula, loading, onClose, onConfirm }: { formula: FormulaTemplate; loading: boolean; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="delete-formula-title">
      <button className="fixed inset-0 cursor-default bg-black/50" onClick={loading ? undefined : onClose} aria-label="Batal hapus" />
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-red-50 p-2 text-red-700">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <h2 id="delete-formula-title" className="font-bold text-gray-900">Hapus formula template?</h2>
            <p className="mt-1 text-sm text-gray-600">
              <strong>{formula.formula_name}</strong> akan dihapus permanen. Pastikan formula ini tidak sedang digunakan oleh KPI atau Chart aktif.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} disabled={loading} className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50">Batal</button>
          <button onClick={onConfirm} disabled={loading} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
            {loading ? 'Menghapus...' : 'Hapus Permanen'}
          </button>
        </div>
      </div>
    </div>
  );
}
