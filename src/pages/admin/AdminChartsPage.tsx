// @ts-nocheck
// DashInsight - Admin Chart Library (Phase 6)
import { useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import {
  Archive, BarChart3, CheckCircle2, Eye, LineChart,
  Pencil, PieChart, Plus, Search, Table2, Trash2, X,
} from 'lucide-react';
import { useAuth } from '../../stores/useAuth';
import {
  adminChartApi, adminFieldApi, adminFormulaApi, type ChartStatus, type ChartTemplate,
  type CreateChartPayload, type FieldDictionary, type FormulaTemplate,
} from '../../services/api';

const CHART_TYPES = ['bar', 'line', 'pie', 'doughnut', 'table', 'scatter', 'smart_pareto', 'smart_matrix', 'smart_map', 'smart_cross', 'circular_progress'];
const CHART_TYPE_LABELS: Record<string, string> = {
  bar: 'Bar Chart  -  Comparative Analysis',
  line: 'Line Chart  -  Trend Analysis',
  pie: 'Pie Chart  -  Proportional Distribution',
  doughnut: 'Donut Chart  -  Composition Analysis',
  table: 'Tabular Detail  -  Audit View',
  scatter: 'Scatter Plot  -  Correlation Analysis',
  smart_pareto: 'Pareto Analysis  -  Revenue Concentration',
  smart_matrix: 'Bubble Matrix  -  Volume vs Margin',
  smart_map: 'Geographic Distribution  -  City Performance',
  smart_cross: 'Cross-Category Analysis  -  Channel Mix',
  circular_progress: 'Circular Progress  -  Single Metric Target',
};
const CHART_CATEGORIES = ['comparison', 'trend', 'composition', 'distribution', 'metric'];
const BUSINESS_TYPES = ['General', 'Retail', 'Kuliner', 'Fashion', 'Online Shop', 'Jasa'];
const FIELD_ROLES = ['x', 'y', 'color', 'size', 'filter', 'label'];
const DATA_TYPES = ['number', 'string', 'date', 'label'];
const FORMULA_ROLES = ['primary', 'secondary', 'derived'];

const FIELD_ROLE_LABELS: Record<string, string> = {
  x: 'Sumbu X (Bawah)',
  y: 'Nilai Y (Utama)',
  color: 'Warna Pembeda',
  size: 'Ukuran Gelembung',
  filter: 'Filter / Kategori',
  label: 'Label Teks'
};

const FORMULA_ROLE_LABELS: Record<string, string> = {
  primary: 'Angka Utama',
  secondary: 'Pembanding 1',
  derived: 'Pembanding 2'
};

const FIELD_OPTIONS = [
  { key: 'transaction_date', label: 'Tanggal Transaksi', type: 'date' },
  { key: 'transaction_time', label: 'Jam Transaksi', type: 'string' },
  { key: 'product_name', label: 'Nama Produk', type: 'label' },
  { key: 'category', label: 'Kategori Produk', type: 'label' },
  { key: 'sales_channel', label: 'Channel Penjualan', type: 'label' },
  { key: 'payment_method', label: 'Metode Pembayaran', type: 'label' },
  { key: 'branch', label: 'Cabang', type: 'label' },
  { key: 'staff_name', label: 'Staff', type: 'label' },
  { key: 'customer_name', label: 'Pelanggan', type: 'label' },
  { key: 'destination_city', label: 'Kota Tujuan', type: 'label' },
  { key: 'brand', label: 'Brand', type: 'label' },
  { key: 'supplier', label: 'Supplier', type: 'label' },
  { key: 'net_revenue', label: 'Net Revenue', type: 'number' },
  { key: 'total_revenue', label: 'Total Revenue', type: 'number' },
  { key: 'gross_profit', label: 'Laba Kotor', type: 'number' },
  { key: 'quantity', label: 'Unit Terjual', type: 'number' },
  { key: 'discount', label: 'Diskon', type: 'number' },
  { key: 'rating', label: 'Rating', type: 'number' },
  { key: 'shipping_cost', label: 'Ongkir', type: 'number' },
  { key: 'cogs', label: 'COGS / HPP', type: 'number' },
];
const DIMENSION_OPTIONS = FIELD_OPTIONS.filter(field => field.type !== 'number');
const BREAKDOWN_OPTIONS = FIELD_OPTIONS.filter(field => field.type !== 'number' && !['transaction_date', 'transaction_time'].includes(field.key));
const SMART_CHART_FIELDS: Record<string, Array<{ key: string; role: string; required?: boolean }>> = {
  smart_pareto: [
    { key: 'product_name', role: 'x' },
    { key: 'sales_amount', role: 'y' },
  ],
  smart_matrix: [
    { key: 'product_name', role: 'label' },
    { key: 'quantity', role: 'x' },
    { key: 'gross_profit', role: 'y', required: false },
    { key: 'sales_amount', role: 'size' },
  ],
  smart_map: [
    { key: 'destination_city', role: 'x' },
    { key: 'sales_amount', role: 'y' },
  ],
  smart_cross: [
    { key: 'category', role: 'x' },
    { key: 'sales_channel', role: 'color' },
    { key: 'sales_amount', role: 'y' },
  ],
};
const CHART_GOAL_OPTIONS = [
  {
    title: 'Comparative Benchmarking',
    description: 'Ranking & perbandingan antar dimensi  -  Top Produk, Cabang Terbaik, Staff Terbaik, atau Supplier Terbaik.',
    chartType: 'bar',
    category: 'comparison',
    size: 6,
  },
  {
    title: 'Temporal Trend Analysis',
    description: 'Melacak pola perubahan omzet & transaksi  -  harian, mingguan, atau bulanan.',
    chartType: 'line',
    category: 'trend',
    size: 12,
  },
  {
    title: 'Compositional Breakdown',
    description: 'Menganalisis proporsi & kontribusi  -  Kategori, Channel, Payment Method, atau Brand.',
    chartType: 'doughnut',
    category: 'composition',
    size: 6,
  },
  {
    title: 'Detailed Audit Table',
    description: 'Tabel ringkas untuk audit  -  Produk, Cabang, atau Transaksi dengan kolom lengkap.',
    chartType: 'table',
    category: 'comparison',
    size: 12,
  },
  {
    title: 'Pre-built Analytics',
    description: 'Analisis siap pakai  -  Pareto, Volume vs Margin, Geographic Distribution, dan Cross-category.',
    chartType: 'smart_pareto',
    category: 'comparison',
    size: 12,
  },
  {
    title: 'Single Metric Progress',
    description: 'Menampilkan persentase tunggal dalam grafis melingkar  -  cocok untuk target pencapaian.',
    chartType: 'circular_progress',
    category: 'metric',
    size: 4,
  },
];

const STATUS_STYLE: Record<ChartStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-amber-100 text-amber-700',
  archived: 'bg-gray-200 text-gray-700',
};

type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'view' | 'edit' | 'delete'; chart: ChartTemplate };

type FieldInput = {
  field_role: string;
  field_label: string;
  required_data_type: string | null;
  is_required: boolean;
  allow_multiple: boolean;
};

type FormulaInput = {
  formula_template_id: string;
  formula_role: string;
  is_required: boolean;
  sort_order: number;
};

type ChartFormData = {
  chart_code: string;
  chart_name: string;
  description: string;
  chart_type: string;
  chart_category: string;
  business_type: string;
  default_size: number;
  default_order: number;
  status: ChartStatus;
  fields: FieldInput[];
  formulas: FormulaInput[];
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function ChartTypeIcon({ type, className = 'h-5 w-5' }: { type: string; className?: string }) {
  if (type === 'line') return <LineChart className={className} />;
  if (type === 'pie' || type === 'doughnut') return <PieChart className={className} />;
  if (type === 'table') return <Table2 className={className} />;
  return <BarChart3 className={className} />;
}

function collectFormulaFields(value: unknown, result = new Set<string>()) {
  if (!value || typeof value !== 'object') return result;
  if (Array.isArray(value)) {
    value.forEach(item => collectFormulaFields(item, result));
    return result;
  }
  const objectValue = value as Record<string, unknown>;
  if (typeof objectValue.field === 'string') result.add(objectValue.field);
  Object.values(objectValue).forEach(item => collectFormulaFields(item, result));
  return result;
}

function fieldInputFromKey(fieldKey: string, role: string, required = true): FieldInput {
  const meta = FIELD_OPTIONS.find(field => field.key === fieldKey);
  return {
    field_role: role,
    field_label: meta?.key || fieldKey,
    required_data_type: meta?.type || 'string',
    is_required: required,
    allow_multiple: false,
  };
}

function dedupeFields(fields: FieldInput[]) {
  const seen = new Set<string>();
  return fields.filter(field => {
    const key = field.field_label.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function AdminChartsPage() {
  const { token } = useAuth();
  const [charts, setCharts] = useState<ChartTemplate[]>([]);
  const [formulas, setFormulas] = useState<FormulaTemplate[]>([]);
  const [fieldDictionary, setFieldDictionary] = useState<FieldDictionary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [businessFilter, setBusinessFilter] = useState('');
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
        const [chartResponse, formulaResponse, fieldResponse] = await Promise.all([
          adminChartApi.list(authToken),
          adminFormulaApi.list(authToken, 'active'),
          adminFieldApi.list(authToken, 'active'),
        ]);
        if (!cancelled) {
          setCharts(chartResponse.templates);
          setFormulas(formulaResponse.templates);
          setFieldDictionary(fieldResponse.fields);
        }
      } catch (error: unknown) {
        if (!cancelled) setFeedback({ type: 'error', message: getErrorMessage(error, 'Gagal memuat Chart Library.') });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [token, refreshKey]);

  const filteredCharts = useMemo(() => charts.filter(chart => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || chart.chart_name.toLowerCase().includes(query) || chart.chart_code.toLowerCase().includes(query);
    const matchesStatus = !statusFilter || chart.status === statusFilter;
    const matchesType = !typeFilter || chart.chart_type === typeFilter;
    const matchesBusiness = !businessFilter || chart.business_type === businessFilter;
    return matchesSearch && matchesStatus && matchesType && matchesBusiness;
  }), [charts, search, statusFilter, typeFilter, businessFilter]);

  const totalPages = Math.ceil(filteredCharts.length / PAGE_SIZE);

  const paginatedData = useMemo(() => filteredCharts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [filteredCharts, currentPage]);

  const refresh = () => setRefreshKey(key => key + 1);

  const changeStatus = async (chart: ChartTemplate, status: ChartStatus) => {
    if (!token) return;
    setFeedback(null);
    try {
      await adminChartApi.updateStatus(token, chart.id, status);
      setFeedback({ type: 'success', message: `Status ${chart.chart_name} diubah menjadi ${status}.` });
      refresh();
    } catch (error: unknown) {
      setFeedback({ type: 'error', message: getErrorMessage(error, 'Gagal mengubah status chart.') });
    }
  };

  const deleteChart = async (chart: ChartTemplate) => {
    if (!token) return;
    setActionLoading(true);
    try {
      await adminChartApi.delete(token, chart.id);
      setModal({ type: 'none' });
      setFeedback({ type: 'success', message: `${chart.chart_name} berhasil dihapus.` });
      refresh();
    } catch (error: unknown) {
      setFeedback({ type: 'error', message: getErrorMessage(error, 'Gagal menghapus chart.') });
    } finally {
      setActionLoading(false);
    }
  };

  const saveChart = async (data: CreateChartPayload, chart?: ChartTemplate) => {
    if (!token) throw new Error('Sesi login tidak tersedia.');
    if (chart) {
      await adminChartApi.update(token, chart.id, data);
      setFeedback({ type: 'success', message: 'Chart template berhasil diperbarui.' });
    } else {
      await adminChartApi.create(token, data);
      setFeedback({ type: 'success', message: 'Chart template berhasil dibuat.' });
    }
    setModal({ type: 'none' });
    refresh();
  };

  return (
    <div className="space-y-5 min-h-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Chart Library</h1>
          <p className="mt-0.5 text-sm text-gray-600">
            {charts.length} template · {charts.filter(chart => chart.status === 'active').length} aktif
          </p>
        </div>
        <button
          onClick={() => setModal({ type: 'create' })}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#276749] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f533a] focus:outline-none focus:ring-2 focus:ring-[#276749] focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" /> Buat Chart Baru
        </button>
      </div>

      {feedback && (
        <div role={feedback.type === 'error' ? 'alert' : 'status'} className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm ${feedback.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="rounded p-1 hover:bg-black/5" aria-label="Tutup notifikasi"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:flex-wrap">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={event => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Cari nama atau kode chart" className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]" />
        </div>
        <FilterSelect label="Status" value={statusFilter} onChange={v => { setStatusFilter(v); setCurrentPage(1); }} options={['active', 'inactive', 'archived']} />
        <FilterSelect label="Tipe" value={typeFilter} onChange={v => { setTypeFilter(v); setCurrentPage(1); }} options={CHART_TYPES} labels={CHART_TYPE_LABELS} />
        <FilterSelect label="Bisnis" value={businessFilter} onChange={v => { setBusinessFilter(v); setCurrentPage(1); }} options={BUSINESS_TYPES} />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="hidden grid-cols-[minmax(220px,2fr)_110px_130px_100px_100px_120px] gap-3 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-semibold text-gray-600 lg:grid">
          <span>Template</span><span>Tipe</span><span>Target bisnis</span><span>Fields</span><span>Status</span><span>Aksi</span>
        </div>
        {loading ? (
          <ChartListSkeleton />
        ) : filteredCharts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <BarChart3 className="mx-auto h-10 w-10 text-gray-300" />
            <h2 className="mt-3 font-semibold text-gray-900">Tidak ada chart template</h2>
            <p className="mt-1 text-sm text-gray-600">Ubah filter atau buat template pertama untuk dashboard client.</p>
          </div>
        ) : (
          <>
            {paginatedData.map(chart => (
              <div key={chart.id} className="relative grid gap-3 border-b border-gray-100 px-5 py-4 last:border-b-0 lg:grid-cols-[minmax(220px,2fr)_110px_130px_100px_100px_120px] lg:items-center">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-700"><ChartTypeIcon type={chart.chart_type} /></div>
                  <div className="min-w-0">
                    <button onClick={() => setModal({ type: 'view', chart })} className="truncate text-left text-sm font-semibold text-gray-900 hover:text-[#276749]">{chart.chart_name}</button>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <code>{chart.chart_code}</code><span>v{chart.version}</span><span>urutan {chart.default_order}</span>
                    </div>
                    {chart.description && <p className="mt-1 line-clamp-1 text-xs text-gray-600">{chart.description}</p>}
                  </div>
                </div>
                <div className="text-sm text-gray-700"><span className="lg:hidden text-xs text-gray-500">Tipe: </span>{CHART_TYPE_LABELS[chart.chart_type] || chart.chart_type}</div>
                <div className="text-sm text-gray-700">{chart.business_type || 'Semua bisnis'}</div>
                <div className="text-sm text-gray-700">{chart.chart_fields?.length || 0} field · {chart.chart_template_formulas?.length || 0} formula</div>
                <div><span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLE[chart.status]}`}>{chart.status}</span></div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setModal({ type: 'view', chart })} className="p-1.5 rounded-md text-[#276749] hover:bg-[#F1FAF5] transition" title="Lihat detail"><Eye className="w-4 h-4" /></button>
                  {chart.status !== 'archived' && <button onClick={() => setModal({ type: 'edit', chart })} className="p-1.5 rounded-md text-[#276749] hover:bg-[#F1FAF5] transition" title="Edit template"><Pencil className="w-4 h-4" /></button>}
                  {chart.status === 'active' && <button onClick={() => changeStatus(chart, 'inactive')} className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition" title="Nonaktifkan"><Archive className="w-4 h-4" /></button>}
                  {chart.status === 'inactive' && <button onClick={() => changeStatus(chart, 'active')} className="p-1.5 rounded-md text-[#276749] hover:bg-[#F1FAF5] transition" title="Aktifkan"><CheckCircle2 className="w-4 h-4" /></button>}
                  <button onClick={() => setModal({ type: 'delete', chart })} className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition" title="Hapus permanen"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Menampilkan {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredCharts.length)}-{Math.min(currentPage * PAGE_SIZE, filteredCharts.length)} dari {filteredCharts.length} chart</p>
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

      {modal.type === 'create' && <ChartFormModal formulas={formulas} fieldDictionary={fieldDictionary} onClose={() => setModal({ type: 'none' })} onSave={data => saveChart(data)} />}
      {(modal.type === 'view' || modal.type === 'edit') && (
        <ChartFormModal chart={modal.chart} formulas={formulas} fieldDictionary={fieldDictionary} mode={modal.type} onClose={() => setModal({ type: 'none' })} onSave={data => saveChart(data, modal.chart)} />
      )}
      {modal.type === 'delete' && <DeleteConfirm chart={modal.chart} loading={actionLoading} onClose={() => setModal({ type: 'none' })} onConfirm={() => deleteChart(modal.chart)} />}
    </div>
  );
}

function FilterSelect({ label, value, options, labels = {}, onChange }: { label: string; value: string; options: string[]; labels?: Record<string, string>; onChange: (value: string) => void }) {
  return <div className="min-w-40"><SearchableSelect value={value} onChange={onChange} options={[{ value: '', label: `Semua ${label}` }, ...options.map(option => ({ value: option, label: labels[option] || option }))]} /></div>;
}

function ChartListSkeleton() {
  return <div aria-label="Memuat chart templates">{[1, 2, 3, 4].map(item => <div key={item} className="flex animate-pulse items-center gap-3 border-b border-gray-100 px-5 py-5"><div className="h-9 w-9 rounded-lg bg-gray-200" /><div className="flex-1"><div className="h-4 w-48 rounded bg-gray-200" /><div className="mt-2 h-3 w-72 max-w-full rounded bg-gray-100" /></div></div>)}</div>;
}

function makeInitialData(chart?: ChartTemplate): ChartFormData {
  return {
    chart_code: chart?.chart_code || '',
    chart_name: chart?.chart_name || '',
    description: chart?.description || '',
    chart_type: chart?.chart_type || 'bar',
    chart_category: chart?.chart_category || '',
    business_type: chart?.business_type || 'General',
    default_size: chart?.default_size || 6,
    default_order: chart?.default_order || 100,
    status: chart?.status || 'active',
    fields: chart?.chart_fields?.map(field => ({
      field_role: field.field_role,
      field_label: field.field_label,
      required_data_type: field.required_data_type,
      is_required: field.is_required,
      allow_multiple: field.allow_multiple,
    })) || [],
    formulas: chart?.chart_template_formulas?.map(formula => ({
      formula_template_id: formula.formula_template_id,
      formula_role: formula.formula_role,
      is_required: formula.is_required,
      sort_order: formula.sort_order,
    })) || [],
  };
}

function ChartFormModal({ chart, formulas, fieldDictionary, mode = 'create', onClose, onSave }: { chart?: ChartTemplate; formulas: FormulaTemplate[]; fieldDictionary: FieldDictionary[]; mode?: 'create' | 'view' | 'edit'; onClose: () => void; onSave: (data: CreateChartPayload) => Promise<void> }) {
  const isView = mode === 'view';
  const [data, setData] = useState<ChartFormData>(() => makeInitialData(chart));
  const [wizardStep, setWizardStep] = useState(isView ? 3 : 1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [builderDimension, setBuilderDimension] = useState(DIMENSION_OPTIONS[0]?.key || '');
  const [builderMetricId, setBuilderMetricId] = useState('');
  const [builderBreakdown, setBuilderBreakdown] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const selectedBuilderMetricId = builderMetricId || formulas[0]?.id || '';
  const isSmartChart = Boolean(SMART_CHART_FIELDS[data.chart_type]);
  const readyIssues = [
    !data.chart_name.trim() && 'Nama chart belum diisi',
    !data.chart_code.trim() && 'Kode internal belum diisi',
    data.fields.length === 0 && 'Kolom client belum diisi',
    data.formulas.length === 0 && 'Rumus belum dipasang',
  ].filter((issue): issue is string => Boolean(issue));
  const readinessLabel = readyIssues.length === 0 ? 'Siap Dipakai' : readyIssues.length === 1 ? 'Hampir Siap' : 'Perlu Dilengkapi';
  const selectedFormulaNames = data.formulas
    .map(item => formulas.find(formula => formula.id === item.formula_template_id)?.formula_name)
    .filter(Boolean);
  const selectedFieldLabels = data.fields.map(field => field.field_label).filter(Boolean);

  useEffect(() => {
    if (fieldDictionary.length === 0) return;
    setData(current => {
      let changed = false;
      const fields = current.fields.map(field => {
        const dictionaryField = fieldDictionary.find(option => option.field_key === field.field_label);
        if (!dictionaryField || field.required_data_type === dictionaryField.data_type) return field;
        changed = true;
        return { ...field, required_data_type: dictionaryField.data_type };
      });
      return changed ? { ...current, fields } : current;
    });
  }, [fieldDictionary]);

  const addField = () => setData(current => {
    const available = fieldDictionary.find(option => !current.fields.some(field => field.field_label === option.field_key));
    if (!available) return current;
    return {
      ...current,
      fields: [...current.fields, {
        field_role: current.fields.length === 0 ? 'x' : 'y',
        field_label: available.field_key,
        required_data_type: available.data_type,
        is_required: true,
        allow_multiple: false,
      }],
    };
  });
  const updateField = (index: number, patch: Partial<FieldInput>) => setData(current => ({ ...current, fields: current.fields.map((field, fieldIndex) => fieldIndex === index ? { ...field, ...patch } : field) }));
  const selectDictionaryField = (index: number, fieldKey: string) => {
    const selected = fieldDictionary.find(field => field.field_key === fieldKey);
    updateField(index, {
      field_label: fieldKey,
      required_data_type: selected?.data_type || 'string',
    });
  };
  const removeField = (index: number) => setData(current => ({ ...current, fields: current.fields.filter((_, fieldIndex) => fieldIndex !== index) }));

  const addFormula = () => {
    const available = formulas.find(formula => !data.formulas.some(item => item.formula_template_id === formula.id));
    if (!available) return;
    setData(current => ({ ...current, formulas: [...current.formulas, { formula_template_id: available.id, formula_role: 'primary', is_required: true, sort_order: current.formulas.length }] }));
  };
  const updateFormula = (index: number, patch: Partial<FormulaInput>) => setData(current => ({ ...current, formulas: current.formulas.map((formula, formulaIndex) => formulaIndex === index ? { ...formula, ...patch } : formula) }));
  const removeFormula = (index: number) => setData(current => ({ ...current, formulas: current.formulas.filter((_, formulaIndex) => formulaIndex !== index).map((formula, sortOrder) => ({ ...formula, sort_order: sortOrder })) }));

  const applyBuilder = () => {
    const metric = formulas.find(formula => formula.id === selectedBuilderMetricId);
    const metricFields = Array.from(collectFormulaFields(metric?.formula_json));
    const smartFields = SMART_CHART_FIELDS[data.chart_type];
    const nextFields = smartFields
      ? dedupeFields(smartFields.map(field => fieldInputFromKey(field.key, field.role, field.required !== false)))
      : dedupeFields([
        fieldInputFromKey(builderDimension, 'x', true),
        ...(builderBreakdown ? [fieldInputFromKey(builderBreakdown, 'color', false)] : []),
        ...metricFields.map(field => fieldInputFromKey(field, 'y', true)),
      ]);

    setData(current => ({
      ...current,
      fields: nextFields,
      formulas: metric ? [{
        formula_template_id: metric.id,
        formula_role: 'primary',
        is_required: true,
        sort_order: 0,
      }] : current.formulas,
    }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (isView) return;
    if (!data.chart_code.trim() || !data.chart_name.trim() || !data.chart_type) {
      setError('Kode, nama, dan tipe chart wajib diisi.');
      return;
    }
    if (data.fields.some(field => !field.field_label.trim())) {
      setError('Setiap field harus memiliki label.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        chart_code: data.chart_code.trim(),
        chart_name: data.chart_name.trim(),
        description: data.description.trim() || null,
        chart_type: data.chart_type,
        chart_category: data.chart_category || null,
        business_type: data.business_type || null,
        default_size: data.default_size,
        default_order: data.default_order,
        status: data.status,
        fields: data.fields,
        formulas: data.formulas,
      });
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, 'Gagal menyimpan chart template.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="chart-modal-title">
      <button className="fixed inset-0 cursor-default bg-black/50" onClick={saving ? undefined : onClose} aria-label="Tutup modal" />
      <form onSubmit={submit} className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4">
          <div><h2 id="chart-modal-title" className="text-lg font-bold text-gray-900">{isView ? 'Detail Chart' : chart ? 'Edit Chart' : 'Buat Chart Baru'}</h2><p className="mt-0.5 text-sm text-gray-600">Tentukan chart ini mau membandingkan apa, angka apa yang dihitung, dan kolom apa yang perlu dimapping client.</p></div>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50" aria-label="Tutup"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-7 px-6 py-5">
          {!isView && (
            <div className="grid gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2 sm:grid-cols-3">
              {[
                ['1', 'Pilih Tujuan'],
                ['2', 'Kolom & Rumus'],
                ['3', 'Review'],
              ].map(([step, label]) => {
                const active = wizardStep === Number(step);
                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setWizardStep(Number(step))}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${active ? 'bg-white text-[#276749] shadow-sm' : 'text-gray-500 hover:bg-white/70 hover:text-gray-900'}`}
                  >
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${active ? 'bg-[#276749] text-white' : 'bg-white text-gray-500'}`}>{step}</span>
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {(isView || wizardStep === 1) && <section>
            <h3 className="text-sm font-semibold text-gray-900">Informasi template</h3>
            {!isView && (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {CHART_GOAL_OPTIONS.map(option => {
                  const active = data.chart_type === option.chartType && data.chart_category === option.category;
                  return (
                    <button
                      key={option.title}
                      type="button"
                      onClick={() => setData(current => ({ ...current, chart_type: option.chartType, chart_category: option.category, default_size: option.size }))}
                      className={`rounded-lg border p-3 text-left transition ${active ? 'border-[#276749] bg-[#F1FAF5] text-[#143826]' : 'border-gray-200 bg-white text-gray-700 hover:border-[#276749]'}`}
                    >
                      <p className="text-sm font-bold">{option.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-gray-600">{option.description}</p>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <FormInput label="Kode chart *" value={data.chart_code} disabled={isView || !!chart} onChange={value => setData({ ...data, chart_code: value.toUpperCase().replace(/\s+/g, '_') })} placeholder="REVENUE_TREND" mono />
              <FormInput label="Nama chart *" value={data.chart_name} disabled={isView} onChange={value => setData({ ...data, chart_name: value })} placeholder="Revenue Trend" />
              <FormSelect label="Tipe chart *" value={data.chart_type} disabled={isView} options={CHART_TYPES} labels={CHART_TYPE_LABELS} onChange={value => setData({ ...data, chart_type: value })} />
              <FormSelect label="Kategori" value={data.chart_category} disabled={isView} options={CHART_CATEGORIES} allowEmpty onChange={value => setData({ ...data, chart_category: value })} />
              <FormSelect label="Target bisnis" value={data.business_type} disabled={isView} options={BUSINESS_TYPES} onChange={value => setData({ ...data, business_type: value })} />
              <div className="grid grid-cols-2 gap-3">
                <FormNumber label="Lebar grid" value={data.default_size} min={1} max={12} disabled={isView} onChange={value => setData({ ...data, default_size: value })} />
                <FormNumber label="Urutan" value={data.default_order} min={0} max={999} disabled={isView} onChange={value => setData({ ...data, default_order: value })} />
              </div>
            </div>
            <label className="mt-4 block text-xs font-medium text-gray-700">Deskripsi</label>
            <textarea value={data.description} disabled={isView} onChange={event => setData({ ...data, description: event.target.value })} rows={2} className="mt-1 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#276749] disabled:opacity-70" />
          </section>}

          {!isView && wizardStep === 2 && (
            <section className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Isi Chart Otomatis</h3>
                <p className="mt-0.5 text-xs text-emerald-900">
                  {isSmartChart
                    ? 'Chart analisis siap pakai punya pola kolom khusus. Pilih angka yang dihitung, lalu sistem mengisi kolom wajib chart tersebut.'
                    : 'Cara cepat untuk admin: pilih kolom pembanding dan angka yang ingin dihitung. Sistem akan mengisi daftar kolom dan rumus di bawah.'}
                </p>
              </div>
              {isSmartChart && (
                <div className="mt-3 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs text-emerald-900">
                  Tipe ini memakai komponen analisis siap pakai di dashboard client. Admin cukup mengatur nama, urutan, lebar, kolom, dan rumusnya.
                </div>
              )}
              <div className={`mt-3 grid gap-3 ${isSmartChart ? 'md:grid-cols-1' : 'md:grid-cols-3'}`}>
                {!isSmartChart && (
                <label className="text-xs font-medium text-gray-700">
                  1. Bandingkan berdasarkan
                  <SearchableSelect value={builderDimension} onChange={setBuilderDimension} options={DIMENSION_OPTIONS.map(field => ({ value: field.key, label: `${field.label} (${field.key})` }))} className="mt-1.5 border-emerald-200 bg-white" />
                  <span className="mt-1 block text-[11px] font-normal text-emerald-800">Contoh: kategori produk, channel, cabang, tanggal.</span>
                </label>
                )}
                <label className="text-xs font-medium text-gray-700">
                  {isSmartChart ? 'Angka utama yang dihitung' : '2. Angka yang dihitung'}
                  <SearchableSelect value={selectedBuilderMetricId} onChange={setBuilderMetricId} options={formulas.map(formula => ({ value: formula.id, label: `${formula.formula_name} (${formula.formula_code})` }))} placeholder={formulas.length ? 'Cari metric...' : 'Belum ada formula aktif'} disabled={formulas.length === 0} className="mt-1.5 border-emerald-200 bg-white" />
                  <span className="mt-1 block text-[11px] font-normal text-emerald-800">Contoh: total omzet, net revenue, AOV.</span>
                </label>
                {!isSmartChart && (
                <label className="text-xs font-medium text-gray-700">
                  3. Pecah lagi berdasarkan
                  <SearchableSelect value={builderBreakdown} onChange={setBuilderBreakdown} options={[{ value: '', label: 'Tidak perlu' }, ...BREAKDOWN_OPTIONS.map(field => ({ value: field.key, label: `${field.label} (${field.key})` }))]} className="mt-1.5 border-emerald-200 bg-white" />
                  <span className="mt-1 block text-[11px] font-normal text-emerald-800">Opsional, misalnya kategori per channel.</span>
                </label>
                )}
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-emerald-800">
                  {isSmartChart ? 'Contoh: Pareto Produk otomatis memakai kolom produk dan omzet untuk membaca konsentrasi penjualan.' : 'Contoh: Kategori Produk + Net Revenue = chart komposisi omzet per kategori.'}
                </p>
                <button type="button" onClick={applyBuilder} disabled={!builderDimension || !selectedBuilderMetricId} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#276749] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f533a] disabled:cursor-not-allowed disabled:opacity-50">
                  <Plus className="h-4 w-4" /> Isi Kolom & Rumus
                </button>
              </div>
            </section>
          )}

          {(isView || wizardStep === 2) && <>
          {!isView && (
            <section className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Ringkasan Chart</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Chart ini akan menampilkan <strong>{selectedFormulaNames[0] || 'angka yang dipilih'}</strong>
                    {' '}berdasarkan <strong>{FIELD_OPTIONS.find(field => field.key === builderDimension)?.label || 'kolom pembanding'}</strong>.
                  </p>
                </div>
                <button type="button" onClick={() => setShowAdvanced(value => !value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  {showAdvanced ? 'Sembunyikan Pengaturan Lanjutan' : 'Pengaturan Lanjutan'}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className={`rounded-full px-2.5 py-1 font-semibold ${readyIssues.length === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{readinessLabel}</span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">{data.fields.length} kolom</span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">{data.formulas.length} rumus</span>
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-gray-900">Kolom yang Dibutuhkan Client</h3><p className="mt-0.5 text-xs text-gray-600">Pilih kolom dari Field Dictionary. Tipe data akan terisi otomatis.</p></div>{!isView && <button type="button" onClick={addField} disabled={fieldDictionary.length === 0 || data.fields.length >= fieldDictionary.length} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-3.5 w-3.5" /> Tambah kolom</button>}</div>
            {!showAdvanced && !isView ? (
              <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                {selectedFieldLabels.length ? selectedFieldLabels.join(', ') : 'Belum ada kolom. Klik Isi Kolom & Rumus dulu.'}
              </div>
            ) : <div className="mt-3 space-y-2">
              {data.fields.length === 0 ? <EmptyConfig text="Belum ada kolom. Gunakan 'Isi Kolom & Rumus' di atas atau tambah kolom manual." /> : data.fields.map((field, index) => (
                <div key={index} className="grid gap-2 rounded-lg bg-gray-50 p-3 md:grid-cols-[110px_minmax(160px,1fr)_130px_100px_110px_36px] md:items-center">
                  <FormSelect label="Role" value={field.field_role} disabled={isView} options={FIELD_ROLES} labels={FIELD_ROLE_LABELS} onChange={value => updateField(index, { field_role: value })} compact />
                  <label className="text-xs font-medium text-gray-700">Kolom
                    <SearchableSelect
                      value={field.field_label}
                      disabled={isView}
                      onChange={value => selectDictionaryField(index, value)}
                      options={[
                        ...(!fieldDictionary.some(option => option.field_key === field.field_label) && field.field_label ? [{ value: field.field_label, label: `${field.field_label} (field lama)` }] : []),
                        ...fieldDictionary.map(option => ({ value: option.field_key, label: `${option.field_label} (${option.field_key})`, disabled: data.fields.some((item, itemIndex) => itemIndex !== index && item.field_label === option.field_key) })),
                      ]}
                      className="mt-1 bg-white"
                    />
                  </label>
                  <FormSelect label="Tipe data" value={field.required_data_type || ''} disabled options={DATA_TYPES} allowEmpty onChange={() => undefined} compact />
                  <Checkbox label="Wajib" checked={field.is_required} disabled={isView} onChange={checked => updateField(index, { is_required: checked })} />
                  <Checkbox label="Multiple" checked={field.allow_multiple} disabled={isView} onChange={checked => updateField(index, { allow_multiple: checked })} />
                  {!isView && <button type="button" onClick={() => removeField(index)} className="rounded p-2 text-red-600 hover:bg-red-50" aria-label={`Hapus field ${index + 1}`}><Trash2 className="h-4 w-4" /></button>}
                </div>
              ))}
            </div>}
          </section>

          <section>
            <div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-gray-900">Rumus yang Dipakai Chart</h3><p className="mt-0.5 text-xs text-gray-600">Pilih metric dari Metric & Formula Library untuk menghitung nilai chart.</p></div>{!isView && <button type="button" onClick={addFormula} disabled={formulas.length === data.formulas.length} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"><Plus className="h-3.5 w-3.5" /> Tambah rumus</button>}</div>
            {!showAdvanced && !isView ? (
              <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                {selectedFormulaNames.length ? selectedFormulaNames.join(', ') : 'Belum ada rumus. Klik Isi Kolom & Rumus dulu.'}
              </div>
            ) : <div className="mt-3 space-y-2">
              {data.formulas.length === 0 ? <EmptyConfig text={formulas.length === 0 ? 'Belum ada formula aktif yang tersedia.' : 'Belum ada rumus. Gunakan tombol otomatis di atas atau tambah rumus manual.'} /> : data.formulas.map((formula, index) => (
                <div key={`${formula.formula_template_id}-${index}`} className="grid gap-2 rounded-lg bg-gray-50 p-3 md:grid-cols-[minmax(220px,1fr)_140px_110px_36px] md:items-center">
                  <label className="text-xs font-medium text-gray-700">Formula<SearchableSelect value={formula.formula_template_id} disabled={isView} onChange={value => updateFormula(index, { formula_template_id: value })} options={formulas.filter(option => option.id === formula.formula_template_id || !data.formulas.some(item => item.formula_template_id === option.id)).map(option => ({ value: option.id, label: `${option.formula_name} (${option.formula_code})` }))} className="mt-1 bg-white" /></label>
                  <FormSelect label="Role" value={formula.formula_role} disabled={isView} options={FORMULA_ROLES} labels={FORMULA_ROLE_LABELS} onChange={value => updateFormula(index, { formula_role: value })} compact />
                  <Checkbox label="Wajib" checked={formula.is_required} disabled={isView} onChange={checked => updateFormula(index, { is_required: checked })} />
                  {!isView && <button type="button" onClick={() => removeFormula(index)} className="rounded p-2 text-red-600 hover:bg-red-50" aria-label={`Hapus formula ${index + 1}`}><Trash2 className="h-4 w-4" /></button>}
                </div>
              ))}
            </div>}
          </section>
          </>}

          {!isView && wizardStep === 3 && (
            <section className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{data.chart_name || 'Chart baru'}</h3>
                    <p className="mt-1 text-sm text-gray-600">{CHART_TYPE_LABELS[data.chart_type] || data.chart_type} - {data.business_type || 'Semua bisnis'}</p>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${readyIssues.length === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{readinessLabel}</span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-500">Bentuk tampilan</p>
                    <p className="mt-1 text-sm font-bold text-gray-900">{CHART_TYPE_LABELS[data.chart_type] || data.chart_type}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-500">Lebar & urutan</p>
                    <p className="mt-1 text-sm font-bold text-gray-900">{data.default_size}/12 - urutan {data.default_order}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-500">Status</p>
                    <p className="mt-1 text-sm font-bold text-gray-900">{data.status}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <h3 className="text-sm font-bold text-gray-900">Kolom Client</h3>
                  <p className="mt-1 text-xs text-gray-600">Kolom ini akan muncul di pengaturan mapping client.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedFieldLabels.length ? selectedFieldLabels.map(field => <span key={field} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">{field}</span>) : <span className="text-sm text-gray-500">Belum ada kolom</span>}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <h3 className="text-sm font-bold text-gray-900">Rumus Chart</h3>
                  <p className="mt-1 text-xs text-gray-600">Rumus ini menghitung nilai utama chart.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedFormulaNames.length ? selectedFormulaNames.map(name => <span key={name} className="rounded-full bg-[#F1FAF5] px-2.5 py-1 text-xs font-semibold text-[#276749]">{name}</span>) : <span className="text-sm text-gray-500">Belum ada rumus</span>}
                  </div>
                </div>
              </div>

              {readyIssues.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <h3 className="text-sm font-bold text-amber-900">Perlu dilengkapi</h3>
                  <ul className="mt-2 space-y-1 text-sm text-amber-800">
                    {readyIssues.map(issue => <li key={issue}>- {issue}</li>)}
                  </ul>
                </div>
              )}
            </section>
          )}

          {isView && chart && <section className="flex flex-wrap gap-4 border-t border-gray-100 pt-4 text-xs text-gray-600"><span>Status: <strong className="text-gray-800">{chart.status}</strong></span><span>Versi: <strong className="text-gray-800">v{chart.version}</strong></span><span>Diperbarui: <strong className="text-gray-800">{new Date(chart.updated_at).toLocaleDateString('id-ID')}</strong></span></section>}
          {error && <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        </div>

        <div className="sticky bottom-0 flex flex-col gap-3 border-t border-gray-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50">{isView ? 'Tutup' : 'Batal'}</button>
          {!isView && (
            <div className="flex justify-end gap-3">
              {wizardStep > 1 && <button type="button" onClick={() => setWizardStep(step => Math.max(1, step - 1))} disabled={saving} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">Kembali</button>}
              {wizardStep < 3 ? (
                <button type="button" onClick={() => setWizardStep(step => Math.min(3, step + 1))} disabled={saving} className="rounded-lg bg-[#276749] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f533a] disabled:opacity-50">Lanjut</button>
              ) : (
                <button type="submit" disabled={saving} className="rounded-lg bg-[#276749] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f533a] disabled:opacity-50">{saving ? 'Menyimpan...' : chart ? 'Simpan Perubahan' : 'Buat Chart'}</button>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

function FormInput({ label, value, onChange, disabled, placeholder, mono = false, compact = false }: { label: string; value: string; onChange: (value: string) => void; disabled: boolean; placeholder?: string; mono?: boolean; compact?: boolean }) {
  return <label className="text-xs font-medium text-gray-700">{label}<input value={value} onChange={event => onChange(event.target.value)} disabled={disabled} placeholder={placeholder} className={`${compact ? 'mt-1' : 'mt-1.5'} w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#276749] disabled:opacity-70 ${mono ? 'font-mono' : ''}`} /></label>;
}

type SearchableOption = { value: string; label: string; disabled?: boolean };

function SearchableSelect({ value, options, onChange, disabled = false, placeholder = 'Cari atau pilih...', className = '' }: { value: string; options: SearchableOption[]; onChange: (value: string) => void; disabled?: boolean; placeholder?: string; className?: string }) {
  const listId = useId();
  const selectedLabel = options.find(option => option.value === value)?.label || value;
  const [query, setQuery] = useState(selectedLabel);

  useEffect(() => {
    setQuery(selectedLabel);
  }, [selectedLabel]);

  const commit = (input: string) => {
    setQuery(input);
    const normalized = input.trim().toLowerCase();
    const match = options.find(option => !option.disabled && (option.label.toLowerCase() === normalized || option.value.toLowerCase() === normalized));
    if (match) onChange(match.value);
  };

  return (
    <div className="relative">
      <input
        type="text"
        list={disabled ? undefined : listId}
        value={query}
        disabled={disabled}
        placeholder={placeholder}
        onChange={event => commit(event.target.value)}
        onFocus={event => event.currentTarget.select()}
        onBlur={() => setQuery(options.find(option => option.value === value)?.label || value)}
        className={`w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#276749] disabled:opacity-70 ${className}`}
      />
      {!disabled && <Search className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />}
      <datalist id={listId}>
        {options.filter(option => !option.disabled).map(option => <option key={`${option.value}-${option.label}`} value={option.label} />)}
      </datalist>
    </div>
  );
}

function FormSelect({ label, value, options, labels = {}, onChange, disabled, allowEmpty = false, compact = false }: { label: string; value: string; options: string[]; labels?: Record<string, string>; onChange: (value: string) => void; disabled: boolean; allowEmpty?: boolean; compact?: boolean }) {
  const searchableOptions = [
    ...(allowEmpty ? [{ value: '', label: '-' }] : []),
    ...options.map(option => ({ value: option, label: labels[option] || option })),
  ];
  return <label className="text-xs font-medium text-gray-700">{label}<SearchableSelect value={value} options={searchableOptions} onChange={onChange} disabled={disabled} className={compact ? 'mt-1' : 'mt-1.5'} /></label>;
}

function FormNumber({ label, value, min, max, onChange, disabled }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void; disabled: boolean }) {
  return <label className="text-xs font-medium text-gray-700">{label}<input type="number" value={value} min={min} max={max} disabled={disabled} onChange={event => onChange(Number(event.target.value))} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#276749] disabled:opacity-70" /></label>;
}

function Checkbox({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (checked: boolean) => void; disabled: boolean }) {
  return <label className="flex items-center gap-2 text-xs font-medium text-gray-700"><input type="checkbox" checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#276749] focus:ring-[#276749]" />{label}</label>;
}

function EmptyConfig({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-gray-300 px-4 py-5 text-center text-sm text-gray-600">{text}</div>;
}

function DeleteConfirm({ chart, loading, onClose, onConfirm }: { chart: ChartTemplate; loading: boolean; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="delete-chart-title">
      <button className="fixed inset-0 cursor-default bg-black/50" onClick={loading ? undefined : onClose} aria-label="Batal hapus" />
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start gap-3"><div className="rounded-lg bg-red-50 p-2 text-red-700"><Trash2 className="h-5 w-5" /></div><div><h2 id="delete-chart-title" className="font-bold text-gray-900">Hapus chart template?</h2><p className="mt-1 text-sm text-gray-600"><strong>{chart.chart_name}</strong> dan seluruh relasi field/formula akan dihapus permanen.</p></div></div>
        <div className="mt-6 flex justify-end gap-3"><button onClick={onClose} disabled={loading} className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50">Batal</button><button onClick={onConfirm} disabled={loading} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">{loading ? 'Menghapus...' : 'Hapus Permanen'}</button></div>
      </div>
    </div>
  );
}
