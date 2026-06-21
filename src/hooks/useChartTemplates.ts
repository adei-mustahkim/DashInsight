// Hook untuk fetch Chart Templates dari API
// Digunakan di Client untuk browse & manage chart library

import { useState, useEffect, useCallback } from 'react';
import { clientApi } from '../services/api';
import type { ChartTemplate } from '../services/api';

interface UseChartTemplatesOptions {
  autoFetch?: boolean;
}

interface UseChartTemplatesReturn {
  templates: ChartTemplate[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useChartTemplates(
  token: string | null,
  options: UseChartTemplatesOptions = { autoFetch: true }
): UseChartTemplatesReturn {
  const [templates, setTemplates] = useState<ChartTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await clientApi.charts(token);
      console.log('[useChartTemplates] Raw API response:', response);
      console.log('[useChartTemplates] Number of charts:', response.charts?.length);

      // Debug: log each chart's code and status
      response.charts?.forEach((chart: ChartTemplate) => {
        console.log(`  - ${chart.chart_code}: status=${chart.status}, type=${chart.chart_type}`);
      });

      // Filter hanya yang active
      const activeTemplates = response.charts.filter(
        (chart: ChartTemplate) => chart.status === 'active'
      );
      console.log('[useChartTemplates] Active charts:', activeTemplates.length);
      setTemplates(activeTemplates);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengambil daftar chart';
      setError(message);
      console.error('useChartTemplates error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (options.autoFetch) {
      fetchTemplates();
    }
  }, [options.autoFetch, fetchTemplates]);

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates,
  };
}

// Helper: Filter templates by category
export function filterTemplatesByCategory(
  templates: ChartTemplate[],
  category: string | null
): ChartTemplate[] {
  if (!category || category === 'all') return templates;
  return templates.filter(t => t.chart_category === category);
}

// Helper: Filter templates by business type
export function filterTemplatesByBusinessType(
  templates: ChartTemplate[],
  businessType: string | null
): ChartTemplate[] {
  if (!businessType || businessType === 'all') return templates;
  return templates.filter(
    t => t.business_type === null || t.business_type === businessType
  );
}

// Helper: Get unique categories from templates
export function getUniqueCategories(templates: ChartTemplate[]): string[] {
  const categories = new Set<string>();
  templates.forEach(t => {
    if (t.chart_category) categories.add(t.chart_category);
  });
  return Array.from(categories).sort();
}

// Helper: Get chart type icon (for UI display)
export function getChartTypeIcon(chartType: string): string {
  const icons: Record<string, string> = {
    bar: 'BarChart3',
    line: 'LineChart',
    pie: 'PieChart',
    doughnut: 'PieChart',
    area: 'AreaChart',
    scatter: 'ScatterChart',
    radar: 'Radar',
    treemap: 'LayoutGrid',
    table: 'Table',
    smart_pareto: 'TrendingUp',
    smart_matrix: 'Grid3X3',
    smart_map: 'Map',
    smart_cross: 'GitBranch',
    default: 'ChartBar',
  };
  return icons[chartType] || icons.default;
}
