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
export function aggregateBy(rows: DataRow[], groupField: string, valueField: string, operation: 'sum' | 'count' | 'avg' | 'max' | 'min' | 'count_distinct' = 'sum'): { name: string; value: number }[] {
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
    } else if (operation === 'max') {
      const vals = groupRows.map(r => asNumber(r[valueField]));
      value = vals.length ? Math.max(...vals) : 0;
    } else if (operation === 'min') {
      const vals = groupRows.map(r => asNumber(r[valueField]));
      value = vals.length ? Math.min(...vals) : 0;
    } else if (operation === 'count_distinct') {
      value = new Set(groupRows.map(r => String(r[valueField] ?? '')).filter(Boolean)).size;
    }
    return { name, value };
  }).sort((a, b) => b.value - a.value);
}

// Aggregate data by multiple fields, calculate multiple measures with individual aggregation
export function aggregateByMultiMeasures(
  rows: DataRow[],
  dimensions: string[],
  measures: Array<{ field: string; aggregation: string; label?: string }>
): Array<Record<string, any>> {
  if (!rows.length || !dimensions.length || !measures.length) return [];

  // Group by composite dimension key
  const groups: Record<string, DataRow[]> = {};
  rows.forEach(row => {
    const key = dimensions.map(d => String(row[d] || 'Lainnya')).join('|||');
    if (!groups[key]) groups[key] = [];
    groups[key].push(row);
  });

  const result = Object.values(groups).map(groupRows => {
    const row: Record<string, any> = {};
    // Store dimension values
    dimensions.forEach(d => {
      row[d] = groupRows[0]?.[d] ?? 'Lainnya';
    });
    row['__dimKey'] = dimensions.map(d => String(groupRows[0]?.[d] || 'Lainnya')).join(' / ');
    row['__count'] = groupRows.length;

    // Calculate each measure
    measures.forEach(m => {
      const key = `${m.aggregation}(${m.field})`;
      const label = m.label || key;
      let value = 0;
      if (m.aggregation === 'sum') {
        value = groupRows.reduce((s, r) => s + asNumber(r[m.field]), 0);
      } else if (m.aggregation === 'count') {
        value = groupRows.length;
      } else if (m.aggregation === 'count_distinct') {
        value = new Set(groupRows.map(r => String(r[m.field] ?? '')).filter(Boolean)).size;
      } else if (m.aggregation === 'avg') {
        const vals = groupRows.map(r => asNumber(r[m.field])).filter(v => v !== 0);
        value = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      } else if (m.aggregation === 'max') {
        value = Math.max(...groupRows.map(r => asNumber(r[m.field])));
      } else if (m.aggregation === 'min') {
        value = Math.min(...groupRows.map(r => asNumber(r[m.field])));
      }
      row[key] = value;
      row[`__label_${key}`] = label;
    });

    return row;
  });

  // Sort by first measure descending
  if (measures.length > 0) {
    const sortKey = `${measures[0].aggregation}(${measures[0].field})`;
    result.sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0));
  }

  return result;
}

// Calculate totals row for a grouped dataset
export function calculateTotals(
  groups: Array<Record<string, any>>,
  measures: Array<{ field: string; aggregation: string; label?: string }>
): Record<string, any> {
  const totals: Record<string, any> = { __dimKey: 'TOTAL', __isTotal: true };
  measures.forEach(m => {
    const key = `${m.aggregation}(${m.field})`;
    // For sums/counts we can sum the group values; for avg/max/min we recalculate from groups
    if (m.aggregation === 'sum' || m.aggregation === 'count') {
      totals[key] = groups.reduce((sum, g) => sum + (g[key] || 0), 0);
    } else if (m.aggregation === 'count_distinct') {
      // Approximate: sum of group distincts (may overcount)
      totals[key] = groups.reduce((sum, g) => sum + (g[key] || 0), 0);
    } else {
      totals[key] = groups.length ? groups.reduce((best, g) => m.aggregation === 'max' ? Math.max(best, g[key] || 0) : m.aggregation === 'min' ? Math.min(best, g[key] || Infinity) : best, m.aggregation === 'min' ? Infinity : 0) : 0;
      if (m.aggregation === 'avg' && totals[key] !== 0) {
        totals[key] = groups.reduce((sum, g) => sum + (g[key] || 0), 0) / groups.length;
      }
    }
  });
  return totals;
}

// Get available fields from processed data
export function getAvailableFields(rows: DataRow[]): string[] {
  if (!rows.length) return [];
  return Object.keys(rows[0]);
}
