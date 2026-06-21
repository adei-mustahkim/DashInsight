// @ts-nocheck
// DashInsight - Client Formula Evaluator
// Evaluates formula_json from FormulaTemplate against processed data rows

type FormulaNode = number | {
  operation?: string;
  field?: string;
  left?: FormulaNode;
  right?: FormulaNode;
};

type DataRow = Record<string, any>;

const asNumber = (value: any): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '').replace(',', '.');
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : 0;
  }
  return 0;
};

export function evaluateFormula(formulaJson: any, rows: DataRow[]): number {
  if (typeof formulaJson === 'number') return formulaJson;
  if (!formulaJson || typeof formulaJson !== 'object') return 0;

  const node = formulaJson as Exclude<FormulaNode, number>;
  const operation = String(node.operation || node.type || '').toUpperCase();

  if (operation === 'SUM') {
    return rows.reduce((sum, row) => sum + asNumber(row[node.field]), 0);
  }
  if (operation === 'COUNT') {
    return node.field
      ? rows.filter(row => row[node.field] !== null && row[node.field] !== undefined && row[node.field] !== '').length
      : rows.length;
  }
  if (operation === 'COUNT_DISTINCT') {
    return new Set(rows.map(row => String(row[node.field] ?? '')).filter(Boolean)).size;
  }
  if (operation === 'AVG') {
    const values = rows.map(row => asNumber(row[node.field])).filter(v => v !== 0);
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }
  if (operation === 'MIN') {
    const values = rows.map(row => asNumber(row[node.field])).filter(v => v !== 0);
    return values.length ? Math.min(...values) : 0;
  }
  if (operation === 'MAX') {
    const values = rows.map(row => asNumber(row[node.field])).filter(v => v !== 0);
    return values.length ? Math.max(...values) : 0;
  }

  const left = evaluateFormula(node.left, rows);
  const right = evaluateFormula(node.right, rows);

  if (operation === 'SUBTRACT') return left - right;
  if (operation === 'MULTIPLY') return left * right;
  if (operation === 'DIVIDE') return right === 0 ? 0 : left / right;
  if (operation === 'PERCENTAGE') return right === 0 ? 0 : (left / right) * 100;

  return 0;
}

// Aggregate data by a field for chart rendering
export function aggregateBy(rows: DataRow[], groupField: string, valueField: string, operation: 'sum' | 'count' | 'avg' = 'sum'): { name: string; value: number }[] {
  const groups: Record<string, DataRow[]> = {};
  rows.forEach(row => {
    const key = String(row[groupField] || 'Lainnya');
    if (!groups[key]) groups[key] = [];
    groups[key].push(row);
  });

  return Object.entries(groups).map(([name, groupRows]) => {
    let value = 0;
    if (operation === 'sum') {
      value = groupRows.reduce((sum, r) => sum + asNumber(r[valueField]), 0);
    } else if (operation === 'count') {
      value = groupRows.length;
    } else if (operation === 'avg') {
      const vals = groupRows.map(r => asNumber(r[valueField])).filter(v => v !== 0);
      value = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }
    return { name, value };
  }).sort((a, b) => b.value - a.value);
}

// Get available fields from processed data
export function getAvailableFields(rows: DataRow[]): string[] {
  if (!rows.length) return [];
  return Object.keys(rows[0]);
}
