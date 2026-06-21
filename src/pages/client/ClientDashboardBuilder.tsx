// ClientDashboardBuilder - Renders dashboard based on enabled charts
// Shows charts that client has enabled in Chart Library

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, LayoutGrid, Settings, RefreshCw, AlertCircle, FileSpreadsheet, Upload, BarChart3 } from 'lucide-react';
import { useAuth } from '../../stores/useAuth';
import { useChartTemplates } from '../../hooks/useChartTemplates';
import { loadWorkspace, saveWorkspace, type ClientWorkspace } from '../../storage/clientWorkspace';
import type { ChartTemplate } from '../../services/api';
import type { ClientChartConfig } from '../../types/clientDashboard';
import DynamicChart from '../../components/Charts/DynamicChart';

export default function ClientDashboardBuilder() {
  const { token } = useAuth();
  const navigate = useNavigate();

  // Load workspace data
  const workspace = loadWorkspace();

  // Fetch chart templates from API
  const { templates, loading: templatesLoading } = useChartTemplates(token);

  // Get enabled charts from workspace
  const [enabledCharts, setEnabledCharts] = useState<ClientChartConfig[]>(() => {
    return workspace?.enabledCharts || [];
  });

  // Sync with workspace on mount
  useEffect(() => {
    if (workspace?.enabledCharts) {
      setEnabledCharts(workspace.enabledCharts);
    }
  }, [workspace]);

  // Map templates to enabled configs
  const enabledChartData = useMemo(() => {
    return enabledCharts
      .filter(config => config.enabled)
      .map(config => {
        const template = templates.find(t => t.id === config.chartTemplateId);
        return template ? { template, config } : null;
      })
      .filter(Boolean) as { template: ChartTemplate; config: ClientChartConfig }[];
  }, [enabledCharts, templates]);

  // Refresh from workspace
  const handleRefresh = () => {
    const ws = loadWorkspace();
    if (ws?.enabledCharts) {
      setEnabledCharts(ws.enabledCharts);
    }
  };

  // No workspace - prompt to upload data
  if (!workspace) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600">Dashboard berbasis template</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-300" />
          <h2 className="mt-4 text-lg font-bold text-gray-900">Upload data terlebih dahulu</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
            Anda perlu mengupload dataset terlebih dahulu untuk bisa melihat dashboard.
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

  // No enabled charts
  if (!templatesLoading && enabledChartData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">
                {workspace.datasetName} · {workspace.rows.length.toLocaleString('id-ID')} baris
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/charts')}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Pilih Chart
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-300" />
          <h2 className="mt-4 text-lg font-bold text-gray-900">Belum ada chart aktif</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
            Pilih chart dari library untuk ditampilkan di dashboard.
          </p>
          <button
            onClick={() => navigate('/charts')}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#276749] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f533a]"
          >
            <LayoutGrid className="h-4 w-4" />
            Buka Visualisasi Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600">
              {workspace.datasetName} · {workspace.rows.length.toLocaleString('id-ID')} baris
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => navigate('/charts')}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Settings className="h-4 w-4" />
            Kelola Chart
          </button>
        </div>
      </div>

      {/* Loading State */}
      {templatesLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-2 text-sm text-gray-600">Memuat template...</p>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      {!templatesLoading && (
        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
          {enabledChartData.map(({ template, config }) => (
            <div
              key={config.chartCode}
              className="rounded-xl border border-gray-200 bg-white p-5 min-h-[350px]"
            >
              <DynamicChart
                chartTemplate={template}
                chartConfig={config}
                rows={workspace.rows}
              />
            </div>
          ))}
        </div>
      )}

      {/* Debug Info */}
      {enabledChartData.length > 0 && (
        <div className="rounded-lg bg-gray-50 p-4 text-xs text-gray-500">
          <p>Menampilkan {enabledChartData.length} dari {enabledCharts.length} chart yang dikonfigurasi</p>
          <p className="mt-1">
            Kolom: {workspace.headers.slice(0, 5).join(', ')}
            {workspace.headers.length > 5 && '...'}
          </p>
        </div>
      )}
    </div>
  );
}
