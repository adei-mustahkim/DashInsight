// Formula Evaluator Engine
// Evaluates formula JSON from formula_templates against client data

import type { FieldMapping } from '../types/clientDashboard';
import type { FormulaTemplate, ChartTemplate, ChartFormula } from '../services/api';

// === Formula Operations ===

export interface FormulaContext {
  rows: Record<string, unknown>[];
  mappings: FieldMapping;
}

type OperationResult = number | string | boolean | null;

interface AggregationResult {
  value: number;
  count: number;
}

// Aggregation operations
function opSUM(values: number[]): number {
  return values.reduce((a, b) => a + (b || 0), 0);
}

function opCOUNT(values: unknown[]): number {
  return values.filter(v => v != null && v !== '').length;
}

function opAVG(values: number[]): number {
  const valid = values.filter(v => v != null && !isNaN(v));
  return valid.length > 0 ? opSUM(valid) / valid.length : 0;
}

function opMIN(values: number[]): number {
  const valid = values.filter(v => v != null && !isNaN(v));
  return valid.length > 0 ? Math.min(...valid) : 0;
}

function opMAX(values: number[]): number {
  const valid = values.filter(v => v != null && !isNaN(v));
  return valid.length > 0 ? Math.max(...valid) : 0;
}

function opCOUNT_DISTINCT(values: unknown[]): number {
  return new Set(values.filter(v => v != null && v !== '')).size;
}

// Math operations
function opSUBTRACT(a: number, b: number): number {
  return (a || 0) - (b || 0);
}

function opDIVIDE(a: number, b: number): number | null {
  return b !== 0 ? (a || 0) / b : null;
}

function opMULTIPLY(...values: number[]): number {
  return values.reduce((a, b) => a * (b || 0), 1);
}

function opPERCENTAGE(a: number, b: number): number {
  return b !== 0 ? ((a || 0) / b) * 100 : 0;
}

// Logic operations
function opIF(condition: boolean, thenVal: unknown, elseVal: unknown): unknown {
  return condition ? thenVal : elseVal;
}

function opAND(...values: boolean[]): boolean {
  return values.every(Boolean);
}

function opOR(...values: boolean[]): boolean {
  return values.some(Boolean);
}

// Comparison operations
function opEQ(a: unknown, b: unknown): boolean {
  return a === b;
}

function opNE(a: unknown, b: unknown): boolean {
  return a !== b;
}

function opGT(a: number, b: number): boolean {
  return (a || 0) > (b || 0);
}

function opGTE(a: number, b: number): boolean {
  return (a || 0) >= (b || 0);
}

function opLT(a: number, b: number): boolean {
  return (a || 0) < (b || 0);
}

function opLTE(a: number, b: number): boolean {
  return (a || 0) <= (b || 0);
}

// === Formula JSON Types ===

interface FormulaRule {
  type: string;
  operation?: string;
  field?: string;
  mapped_field?: string;
  params?: (FormulaRule | string | number)[];
  value?: unknown;
  condition?: FormulaRule;
  then?: FormulaRule;
  else?: FormulaRule;
  left?: FormulaRule | number;
  right?: FormulaRule | number;
  operator?: string;
}

// === Field Value Extraction ===

function getFieldValue(
  rows: Record<string, unknown>[],
  mappings: FieldMapping,
  fieldRole: string
): (number | null)[] {
  const mappedColumn = mappings[fieldRole] || fieldRole;
  if (!mappedColumn) return [];

  return rows.map(row => {
    const value = row[mappedColumn];
    if (value == null || value === '') return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
  });
}

// === Formula Evaluator ===

export function evaluateFormula(
  formulaJson: object,
  rows: Record<string, unknown>[],
  mappings: FieldMapping
): OperationResult {
  const rule = formulaJson as FormulaRule;
  const operation = rule.operation || rule.type;

  if (rule.left !== undefined && rule.right !== undefined) {
    const evaluateSide = (side: FormulaRule | number) => typeof side === 'number' ? side : evaluateFormula(side, rows, mappings);
    const values = [evaluateSide(rule.left), evaluateSide(rule.right)].map(value => typeof value === 'number' ? value : 0);
    return evaluateOperation(operation, values, rows, mappings, rule);
  }

  // Get mapped field from formula
  const mappedField = rule.mapped_field || rule.field;
  if (mappedField) {
    const operationName = operation.toUpperCase();
    if (operationName === 'COUNT' || operationName === 'COUNT_DISTINCT') {
      const mappedColumn = mappings[mappedField] || mappedField;
      const rawValues = rows.map(row => row[mappedColumn]).filter(value => value !== null && value !== undefined && value !== '');
      return operationName === 'COUNT_DISTINCT' ? new Set(rawValues).size : rawValues.length;
    }
    const values = getFieldValue(rows, mappings, mappedField);
    return evaluateOperation(operation, values, rows, mappings, rule);
  }

  // If it's a params-based formula
  if (rule.params) {
    const evaluatedParams = rule.params.map(param => {
      if (typeof param === 'object' && param !== null) {
        return evaluateFormula(param, rows, mappings);
      }
      return param;
    });
    return evaluateOperation(operation, evaluatedParams as (number | null)[], rows, mappings, rule);
  }

  // Fallback
  return null;
}

function evaluateOperation(
  type: string,
  values: (number | null)[],
  rows: Record<string, unknown>[],
  mappings: FieldMapping,
  rule: FormulaRule
): OperationResult {
  // Remove nulls for aggregation
  const validValues = values.filter(v => v !== null) as number[];

  switch (type.toUpperCase()) {
    case 'SUM':
      return opSUM(validValues);
    case 'COUNT':
      return opCOUNT(values.map(v => v ?? null));
    case 'AVG':
      return opAVG(validValues);
    case 'MIN':
      return opMIN(validValues);
    case 'MAX':
      return opMAX(validValues);
    case 'COUNT_DISTINCT':
      return opCOUNT_DISTINCT(values.map(v => v ?? null));
    case 'SUBTRACT':
      return opSUBTRACT(values[0] ?? 0, values[1] ?? 0);
    case 'DIVIDE':
      return opDIVIDE(values[0] ?? 0, values[1] ?? 1);
    case 'MULTIPLY':
      return opMULTIPLY(...validValues);
    case 'PERCENTAGE':
      return opPERCENTAGE(values[0] ?? 0, values[1] ?? 1);
    case 'IF':
      if (rule.condition && rule.then && rule.else) {
        const condResult = evaluateFormula(rule.condition, rows, mappings);
        const thenVal = evaluateFormula(rule.then, rows, mappings);
        const elseVal = evaluateFormula(rule.else, rows, mappings);
        const result = opIF(Boolean(condResult), thenVal, elseVal);
        return (result ?? null) as OperationResult;
      }
      return null;
    case 'AND':
      return opAND(...values.map(Boolean));
    case 'OR':
      return opOR(...values.map(Boolean));
    case 'EQ':
      return opEQ(values[0], values[1]);
    case 'NE':
      return opNE(values[0], values[1]);
    case 'GT':
      return opGT(values[0] ?? 0, values[1] ?? 0);
    case 'GTE':
      return opGTE(values[0] ?? 0, values[1] ?? 0);
    case 'LT':
      return opLT(values[0] ?? 0, values[1] ?? 0);
    case 'LTE':
      return opLTE(values[0] ?? 0, values[1] ?? 0);
    default:
      console.warn(`Unknown operation type: ${type}`);
      return null;
  }
}

// === Chart Data Processor ===

export interface ChartDataPoint {
  name: string;
  [key: string]: string | number | undefined;
}

export function processChartData(
  chartTemplate: ChartTemplate,
  rows: Record<string, unknown>[],
  mappings: FieldMapping,
  formulas: FormulaTemplate[]
): ChartDataPoint[] {
  const chartFields = chartTemplate.chart_fields || [];
  const chartFormulas = chartTemplate.chart_template_formulas || [];

  // Find dimension field (usually 'x' role - for grouping)
  const dimensionField = chartFields.find(f => f.field_role === 'x');
  const mappedDimension = dimensionField ? mappings[dimensionField.field_role] : null;

  // Find metric fields (usually 'y' role)
  const metricFields = chartFields.filter(f => f.field_role === 'y' || f.field_role === 'value');
  const mappedMetrics = metricFields.map(f => ({
    field: f,
    mappedColumn: mappings[f.field_role],
  }));

  // Group data by dimension
  const groupedData = new Map<string, Record<string, unknown>[]>();

  for (const row of rows) {
    const key = mappedDimension ? String(row[mappedDimension] || 'Unknown') : 'Total';
    if (!groupedData.has(key)) {
      groupedData.set(key, []);
    }
    groupedData.get(key)!.push(row);
  }

  // Build chart data points
  const result: ChartDataPoint[] = [];

  for (const [name, groupRows] of groupedData) {
    const dataPoint: ChartDataPoint = { name };

    // Calculate metrics for each group
    for (const { field, mappedColumn } of mappedMetrics) {
      const values = groupRows.map(row => {
        const value = row[mappedColumn!];
        return value == null ? 0 : Number(value) || 0;
      });

      // If there's a formula linked, use it
      const linkedFormula = chartFormulas.find(f => f.formula_role === 'primary' || f.formula_role === field.field_role);
      if (linkedFormula?.formula_template) {
        const formulaResult = evaluateFormula(
          linkedFormula.formula_template.formula_json,
          groupRows,
          mappings
        );
        dataPoint[field.field_role] = typeof formulaResult === 'number' ? formulaResult : 0;
      } else if (mappedColumn) {
        // Default: sum of values
        dataPoint[field.field_role] = opSUM(values);
      }
    }

    // If no metric field mapped, try to use any numeric column
    if (mappedMetrics.length === 0 || mappedMetrics.every(m => !m.mappedColumn)) {
      const numericColumns = Object.keys(groupRows[0] || {}).filter(col => {
        const sample = groupRows[0][col];
        return typeof sample === 'number' || !isNaN(Number(sample));
      });

      if (numericColumns.length > 0) {
        const col = numericColumns[0];
        dataPoint['value'] = opSUM(groupRows.map(r => Number(r[col]) || 0));
      }
    }

    result.push(dataPoint);
  }

  // Sort by value descending
  result.sort((a, b) => {
    const valA = a['value'] ?? a['y'] ?? 0;
    const valB = b['value'] ?? b['y'] ?? 0;
    return (typeof valB === 'number' ? valB : 0) - (typeof valA === 'number' ? valA : 0);
  });

  return result;
}

// === KPI Calculator ===

export interface KPISummary {
  label: string;
  value: number;
  formatted: string;
  type: 'number' | 'currency' | 'percent';
}

export function calculateKPI(
  formulaTemplate: FormulaTemplate,
  rows: Record<string, unknown>[],
  mappings: FieldMapping
): KPISummary {
  const result = evaluateFormula(formulaTemplate.formula_json, rows, mappings);
  const numericValue = typeof result === 'number' ? result : 0;

  let formatted: string;
  switch (formulaTemplate.output_type) {
    case 'currency':
      formatted = formatCurrency(numericValue);
      break;
    case 'percent':
      formatted = `${numericValue.toFixed(1)}%`;
      break;
    default:
      formatted = formatNumber(numericValue);
  }

  return {
    label: formulaTemplate.formula_name,
    value: numericValue,
    formatted,
    type: formulaTemplate.output_type as 'number' | 'currency' | 'percent',
  };
}

// === Formatters ===

function formatNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}jt`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}rb`;
  }
  return value.toLocaleString('id-ID');
}

function formatCurrency(value: number): string {
  return `Rp${formatNumber(value)}`;
}

// === Validation ===

export function validateFormula(
  formulaJson: object,
  mappings: FieldMapping
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if all required fields are mapped
  const rule = formulaJson as FormulaRule;
  if (rule.mapped_field && !mappings[rule.mapped_field]) {
    errors.push(`Field "${rule.mapped_field}" belum di-mapping`);
  }

  // Recursively check params
  if (rule.params) {
    for (const param of rule.params) {
      if (typeof param === 'object' && param !== null) {
        const paramErrors = validateFormula(param, mappings).errors;
        errors.push(...paramErrors);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
