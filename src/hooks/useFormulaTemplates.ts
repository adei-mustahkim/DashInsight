import type { FormulaTemplate } from '../services/api';
// Hook untuk fetch Formula Templates dari API
// Digunakan di Client untuk akses formula yang dibuat admin

import { useState, useEffect, useCallback } from 'react';
import { clientApi } from '../services/api';

interface UseFormulaTemplatesOptions {
  autoFetch?: boolean;
}

interface UseFormulaTemplatesReturn {
  formulas: FormulaTemplate[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFormulaTemplates(
  token: string | null,
  options: UseFormulaTemplatesOptions = { autoFetch: true }
): UseFormulaTemplatesReturn {
  const [formulas, setFormulas] = useState<FormulaTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFormulas = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await clientApi.formulas(token);
      // Filter hanya yang active
      const activeFormulas = response.formulas.filter(
        (formula: FormulaTemplate) => formula.status === 'active'
      );
      setFormulas(activeFormulas);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengambil daftar formula';
      setError(message);
      console.error('useFormulaTemplates error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (options.autoFetch) {
      fetchFormulas();
    }
  }, [options.autoFetch, fetchFormulas]);

  return {
    formulas,
    loading,
    error,
    refetch: fetchFormulas,
  };
}

// Helper: Filter formulas by category
export function filterFormulasByCategory(
  formulas: FormulaTemplate[],
  category: string | null
): FormulaTemplate[] {
  if (!category || category === 'all') return formulas;
  return formulas.filter(f => f.category === category);
}

// Helper: Get unique categories from formulas
export function getUniqueFormulaCategories(formulas: FormulaTemplate[]): string[] {
  const categories = new Set<string>();
  formulas.forEach(f => {
    if (f.category) categories.add(f.category);
  });
  return Array.from(categories).sort();
}

// Helper: Get formula type display name
export function getFormulaTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    aggregation: 'Agregasi',
    derived: 'Turunan',
    ratio: 'Rasio',
    comparison: 'Perbandingan',
    ranking: 'Peringkat',
    default: type,
  };
  return labels[type] || labels.default;
}

// Helper: Get output type display name
export function getOutputTypeLabel(outputType: string): string {
  const labels: Record<string, string> = {
    number: 'Angka',
    currency: 'Mata Uang',
    percent: 'Persentase',
    text: 'Teks',
    default: outputType,
  };
  return labels[outputType] || labels.default;
}
