// Types untuk Client Dashboard Configuration
// Extensi dari ClientWorkspace untuk menyimpan konfigurasi dashboard client

import type { ChartTemplate, ChartField, FormulaTemplate } from '../services/api';

// === Field Mapping ===

export interface FieldMapping {
  [fieldRole: string]: string | undefined; // e.g., { x: 'date', y: 'sales_amount', color: 'category' }
}

export interface FieldMappingWithStatus {
  isComplete: boolean; // true if all required fields are mapped
  unmappedRequired: string[]; // list of required fields that are not mapped
}

// === Chart Configuration ===

export interface ClientChartConfig {
  chartCode: string;
  chartTemplateId: string;
  enabled: boolean;
  title?: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  colorScheme?: string;
  fieldMapping: FieldMapping;
}

export interface ChartWithMapping {
  template: ChartTemplate;
  config: ClientChartConfig;
  mappingStatus: FieldMappingWithStatus;
  mappedColumns: string[]; // list of client columns used
}

// === Dashboard Config ===

export interface ClientDashboardConfig {
  version: number;
  charts: ClientChartConfig[];
  layout: {
    columns: number; // 1, 2, 3, or 4 column layout
    gap: number; // spacing between charts
  };
  globalFilters?: {
    defaultDateRange?: string;
    defaultCategory?: string;
    defaultChannel?: string;
  };
  lastUpdated: string;
}

// === Formula Evaluation ===

export interface FormulaEvaluationContext {
  row: Record<string, unknown>; // current row data
  allRows: Record<string, unknown>[]; // all rows for aggregation
  mappings: FieldMapping; // current field mappings
}

export interface FormulaResult {
  value: number | string;
  error?: string;
  isValid: boolean;
}

// === Operations Support ===

export type OperationType =
  | 'SUM'
  | 'COUNT'
  | 'COUNT_DISTINCT'
  | 'AVG'
  | 'MIN'
  | 'MAX'
  | 'SUBTRACT'
  | 'DIVIDE'
  | 'MULTIPLY'
  | 'PERCENTAGE'
  | 'RANK'
  | 'CUMULATIVE_SUM'
  | 'IF'
  | 'AND'
  | 'OR'
  | 'YEAR'
  | 'MONTH'
  | 'DAY'
  | 'CONCAT';

export interface FormulaOperation {
  type: OperationType;
  params: (string | number | FormulaOperation)[];
  field?: string; // field name for aggregation operations
}

// === Chart Field Helpers ===

export function getRequiredFields(chartTemplate: ChartTemplate): ChartField[] {
  return (chartTemplate.chart_fields || []).filter(f => f.is_required);
}

export function getOptionalFields(chartTemplate: ChartTemplate): ChartField[] {
  return (chartTemplate.chart_fields || []).filter(f => !f.is_required);
}

export function getAllFields(chartTemplate: ChartTemplate): ChartField[] {
  return chartTemplate.chart_fields || [];
}

export function checkMappingComplete(
  chartTemplate: ChartTemplate,
  mapping: FieldMapping
): FieldMappingWithStatus {
  const requiredFields = getRequiredFields(chartTemplate);
  const unmappedRequired: string[] = [];

  for (const field of requiredFields) {
    if (!mapping[field.field_role]) {
      unmappedRequired.push(field.field_role);
    }
  }

  const isComplete = unmappedRequired.length === 0;

  // Return only the status properties, not the full mapping
  return {
    isComplete,
    unmappedRequired,
  };
}

// === Data Type Helpers ===

export type DataType = 'number' | 'string' | 'date' | 'label' | 'any';

export function isDataTypeCompatible(
  fieldDataType: string | null,
  columnDataType: DataType
): boolean {
  if (!fieldDataType || fieldDataType === 'any') return true;

  // If field requires number, column should be number or be detected as number
  if (fieldDataType === 'number') {
    return columnDataType === 'number' || columnDataType === 'any';
  }

  // If field requires date, column should be date or be detected as date
  if (fieldDataType === 'date') {
    return columnDataType === 'date' || columnDataType === 'any';
  }

  // String, label, any are more flexible
  return true;
}

// === Sample Data Helper ===

export function getSampleValues(
  rows: Record<string, unknown>[],
  column: string,
  limit: number = 3
): unknown[] {
  const values: unknown[] = [];
  for (const row of rows) {
    if (values.length >= limit) break;
    const val = row[column];
    if (val !== undefined && val !== null && val !== '') {
      values.push(val);
    }
  }
  return values;
}

// === Detect Column Data Type ===

export function detectColumnDataType(
  values: unknown[]
): DataType {
  if (values.length === 0) return 'any';

  const sampleSize = Math.min(values.length, 10);
  let numberCount = 0;
  let dateCount = 0;

  for (let i = 0; i < sampleSize; i++) {
    const val = values[i];

    // Check if number
    if (typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '')) {
      numberCount++;
    }

    // Check if date
    if (typeof val === 'string') {
      const datePatterns = [
        /^\d{4}-\d{2}-\d{2}/, // ISO date
        /^\d{1,2}\/\d{1,2}\/\d{2,4}/, // US date
        /^\d{1,2}-\d{1,2}-\d{2,4}/, // EU date
      ];
      if (datePatterns.some(p => p.test(val))) {
        dateCount++;
      }
    }
  }

  const threshold = sampleSize * 0.7; // 70% match

  if (numberCount >= threshold) return 'number';
  if (dateCount >= threshold) return 'date';

  return 'string';
}

// === Default Mapping Generator ===

export function suggestDefaultMapping(
  chartTemplate: ChartTemplate,
  clientHeaders: string[]
): FieldMapping {
  const mapping: FieldMapping = {};
  const fields = getAllFields(chartTemplate);

  // Common field name aliases for auto-mapping
  const fieldAliases: Record<string, string[]> = {
    x: ['date', 'tanggal', 'bulan', 'tahun', 'category', 'kategori', 'product', 'produk', 'branch', 'cabang', 'channel', 'kanal'],
    y: ['sales', 'sales_amount', 'total', 'omzet', 'revenue', 'quantity', 'qty', 'jumlah', 'profit', 'transactions'],
    color: ['category', 'kategori', 'channel', 'kanal', 'branch', 'cabang', 'payment', 'pembayaran'],
    size: ['quantity', 'qty', 'jumlah', 'sales', 'total'],
    label: ['product', 'produk', 'name', 'nama', 'category', 'kategori'],
  };

  for (const field of fields) {
    const role = field.field_role;
    const aliases = fieldAliases[role] || [];

    // Try to find matching header
    for (const header of clientHeaders) {
      const normalizedHeader = header.toLowerCase().replace(/[_\s-]+/g, '');

      // Exact match
      if (normalizedHeader === role.toLowerCase()) {
        mapping[role] = header;
        break;
      }

      // Alias match
      for (const alias of aliases) {
        if (normalizedHeader.includes(alias.toLowerCase()) || alias.toLowerCase().includes(normalizedHeader)) {
          mapping[role] = header;
          break;
        }
      }

      if (mapping[role]) break;
    }
  }

  return mapping;
}
