// Client Charts Page - Browse dan manage chart library
// User bisa lihat semua chart template dari admin, enable/disable, dan map fields

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  LineChart,
  PieChart,
  ScatterChart,
  Table,
  Grid3X3,
  TrendingUp,
  Map,
  GitBranch,
  LayoutGrid,
  Radar,
  Search,
  Filter,
  Check,
  X,
  ChevronRight,
  Settings,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  Upload,
  Plus,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../stores/useAuth';
import { useChartTemplates, filterTemplatesByCategory, getUniqueCategories } from '../../hooks/useChartTemplates';
import { loadWorkspace, saveWorkspace, type ClientWorkspace } from '../../storage/clientWorkspace';
import type { ChartTemplate } from '../../services/api';
import type { ClientChartConfig, FieldMapping } from '../../types/clientDashboard';
import { getRequiredFields, suggestDefaultMapping, checkMappingComplete } from '../../types/clientDashboard';
import FieldMappingModal from '../../components/Charts/FieldMappingModal';

// Chart type icons
const CHART_ICONS: Record<string, typeof BarChart3> = {
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
  doughnut: PieChart,
  area: LineChart,
  scatter: ScatterChart,
  radar: Radar,
  treemap: LayoutGrid,
  table: Table,
  smart_pareto: TrendingUp,
  smart_matrix: Grid3X3,
  smart_map: Map,
  smart_cross: GitBranch,
};

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  comparison: 'bg-blue-100 text-blue-700',
  trend: 'bg-green-100 text-green-700',
  composition: 'bg-purple-100 text-purple-700',
  table: 'bg-gray-100 text-gray-700',
  'smart analysis': 'bg-amber-100 text-amber-700',
};

export default function ClientChartsPage() {
  const { token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const workspace = loadWorkspace();

  // Fetch chart templates
  const { templates, loading, error } = useChartTemplates(token);

  // Wait for auth to load
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [enabledCharts, setEnabledCharts] = useState<ClientChartConfig[]>(workspace?.enabledCharts || []);
  const [selectedChart, setSelectedChart] = useState<ChartTemplate | null>(null);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [mappingModalChart, setMappingModalChart] = useState<ChartTemplate | null>(null);

  // Get unique categories
  const categories = useMemo(() => getUniqueCategories(templates), [templates]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let result = templates;

    // Category filter
    if (categoryFilter !== 'all') {
      result = filterTemplatesByCategory(result, categoryFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        t =>
          t.chart_name.toLowerCase().includes(query) ||
          t.chart_code.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [templates, categoryFilter, searchQuery]);

  // Check if chart is enabled
  const isChartEnabled = useCallback(
    (chartCode: string) => enabledCharts.some(c => c.chartCode === chartCode),
    [enabledCharts]
  );

  // Get config for a chart
  const getChartConfig = useCallback(
    (chartCode: string) => enabledCharts.find(c => c.chartCode === chartCode),
    [enabledCharts]
  );

  // Handle enable chart
  const handleEnableChart = useCallback(
    (chart: ChartTemplate) => {
      if (isChartEnabled(chart.chart_code)) {
        // Disable
        setEnabledCharts(prev => prev.filter(c => c.chartCode !== chart.chart_code));
      } else {
        // Enable with suggested mapping
        const suggestedMapping = suggestDefaultMapping(chart, workspace?.headers || []);
        const newConfig: ClientChartConfig = {
          chartCode: chart.chart_code,
          chartTemplateId: chart.id,
          enabled: true,
          position: { x: 0, y: 0, w: 6, h: 4 },
          fieldMapping: suggestedMapping,
        };
        setEnabledCharts(prev => [...prev, newConfig]);
      }
    },
    [isChartEnabled, workspace?.headers]
  );

  // Handle open mapping modal
  const handleOpenMapping = useCallback(
    (chart: ChartTemplate) => {
      setMappingModalChart(chart);
      setShowMappingModal(true);
    },
    []
  );

  // Handle save mapping
  const handleSaveMapping = useCallback(
    (chartCode: string, mapping: FieldMapping) => {
      setEnabledCharts(prev =>
        prev.map(c =>
          c.chartCode === chartCode
            ? { ...c, fieldMapping: mapping }
            : c
        )
      );
      setShowMappingModal(false);
      setMappingModalChart(null);
    },
    []
  );

  // Save to workspace
  const handleSaveToWorkspace = useCallback(() => {
    if (!workspace) return;
    const updatedWorkspace: ClientWorkspace = {
      ...workspace,
      enabledCharts,
      savedAt: new Date().toISOString(),
    };
    saveWorkspace(updatedWorkspace);
  }, [workspace, enabledCharts]);

  // Go to dashboard
  const handleGoToDashboard = useCallback(() => {
    handleSaveToWorkspace();
    navigate('/my-dashboard');
  }, [handleSaveToWorkspace, navigate]);

  // No workspace?
  if (!workspace) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Visualisasi Data</h1>
          <p className="mt-0.5 text-sm text-gray-600">Pilih dan konfigurasi chart untuk dashboard Anda</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-300" />
          <h2 className="mt-4 text-lg font-bold text-gray-900">Upload data terlebih dahulu</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
            Anda perlu mengupload dataset terlebih dahulu untuk bisa memilih dan mengkonfigurasi chart.
          </p>
          <button
            onClick={() => navigate('/upload')}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#276749] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f533a]"
          >
            <Upload className="h-4 w-4" />
            Upload Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Visualisasi Data</h1>
          <p className="mt-0.5 text-sm text-gray-600">
            {loading ? 'Memuat...' : `${templates.length} chart tersedia`} · {enabledCharts.length} chart aktif
          </p>
          {error && (
            <p className="mt-1 text-sm text-red-600">Error: {error}</p>
          )}
          {/* Debug info */}
          {!token && (
            <p className="mt-1 text-sm text-amber-600">⚠️ Token belum tersedia</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSaveToWorkspace}
            disabled={enabledCharts.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Layers className="h-4 w-4" />
            Simpan
          </button>
          <button
            onClick={handleGoToDashboard}
            disabled={enabledCharts.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-[#276749] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1f533a] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Eye className="h-4 w-4" />
            Lihat Dashboard
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari chart..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="appearance-none rounded-lg border border-gray-200 py-2 pl-10 pr-8 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="all">Semua Kategori</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <span className="ml-2 text-sm text-gray-600">Memuat chart library...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map(chart => {
            const enabled = isChartEnabled(chart.chart_code);
            const config = getChartConfig(chart.chart_code);
            const requiredFields = getRequiredFields(chart);
            const hasCompleteMapping = config
              ? checkMappingComplete(chart, config.fieldMapping).isComplete
              : false;
            const IconComponent = CHART_ICONS[chart.chart_type] || BarChart3;
            const categoryColor = CATEGORY_COLORS[chart.chart_category || ''] || 'bg-gray-100 text-gray-700';

            return (
              <div
                key={chart.id}
                className={`rounded-xl border bg-white p-4 transition-all ${
                  enabled ? 'border-emerald-300 shadow-md' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${enabled ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                      <IconComponent className={`h-5 w-5 ${enabled ? 'text-emerald-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{chart.chart_name}</h3>
                      <p className="text-xs text-gray-500">{chart.chart_code}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColor}`}>
                    {chart.chart_category || 'general'}
                  </span>
                </div>

                {/* Description */}
                {chart.description && (
                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">{chart.description}</p>
                )}

                {/* Required Fields */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {requiredFields.slice(0, 3).map(field => {
                    const isMapped = config?.fieldMapping[field.field_role];
                    return (
                      <span
                        key={field.field_role}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                          isMapped ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {isMapped ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        {field.field_label}
                      </span>
                    );
                  })}
                  {requiredFields.length > 3 && (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      +{requiredFields.length - 3}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  {enabled ? (
                    <>
                      <button
                        onClick={() => handleOpenMapping(chart)}
                        className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Settings className="mr-1 inline h-4 w-4" />
                        Konfigurasi
                      </button>
                      <button
                        onClick={() => handleEnableChart(chart)}
                        className="flex items-center gap-1 rounded-lg border border-red-200 py-2 px-3 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <EyeOff className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleEnableChart(chart)}
                      className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      <Plus className="mr-1 inline h-4 w-4" />
                      Aktifkan
                    </button>
                  )}
                </div>

                {/* Mapping Status */}
                {enabled && !hasCompleteMapping && (
                  <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    <AlertCircle className="mr-1 inline h-3 w-3" />
                    Konfigurasi belum lengkap - beberapa field belum di-mapping
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredTemplates.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-300" />
          <h2 className="mt-4 text-lg font-bold text-gray-900">
            {searchQuery || categoryFilter !== 'all'
              ? 'Tidak ada chart yang cocok'
              : 'Belum ada chart tersedia'}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
            {searchQuery || categoryFilter !== 'all'
              ? 'Coba ubah filter atau kata kunci pencarian'
              : 'Admin belum membuat chart template. Hubungi admin untuk menambahkan chart.'}
          </p>
        </div>
      )}

      {/* Field Mapping Modal */}
      {showMappingModal && mappingModalChart && (
        <FieldMappingModal
          chartTemplate={mappingModalChart}
          clientHeaders={workspace?.headers || []}
          clientRows={workspace?.rows || []}
          existingMapping={getChartConfig(mappingModalChart.chart_code)?.fieldMapping || {}}
          onSave={mapping => handleSaveMapping(mappingModalChart.chart_code, mapping)}
          onClose={() => {
            setShowMappingModal(false);
            setMappingModalChart(null);
          }}
        />
      )}
    </div>
  );
}
