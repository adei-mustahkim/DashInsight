// DashInsight - Computed Fields Utilities
// Growth %, Running Total, % of Total, Rank

type DataRow = Record<string, any>;

const asNumber = (val: any): number => {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]/g, '').replace(',', '.');
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : 0;
  }
  return 0;
};

// Growth %: compare each row to previous row
export function computeGrowth(rows: DataRow[], field: string): number[] {
  const values = rows.map(r => asNumber(r[field]));
  return values.map((val, i) => {
    if (i === 0) return 0;
    const prev = values[i - 1];
    if (prev === 0) return val > 0 ? 100 : 0;
    return ((val - prev) / Math.abs(prev)) * 100;
  });
}

// Running total: cumulative sum
export function computeRunningTotal(rows: DataRow[], field: string): number[] {
  const values = rows.map(r => asNumber(r[field]));
  let cum = 0;
  return values.map(val => {
    cum += val;
    return cum;
  });
}

// Percentage of total
export function computePercentOfTotal(rows: DataRow[], field: string): number[] {
  const values = rows.map(r => asNumber(r[field]));
  const total = values.reduce((s, v) => s + v, 0);
  if (total === 0) return values.map(() => 0);
  return values.map(v => (v / total) * 100);
}

// Rank: position in sorted array (1 = highest)
export function computeRank(rows: DataRow[], field: string, descending = true): number[] {
  const indexed = rows.map((r, i) => ({ idx: i, val: asNumber(r[field]) }));
  indexed.sort((a, b) => descending ? b.val - a.val : a.val - b.val);
  const ranks = new Array(rows.length).fill(0);
  indexed.forEach((item, rank) => {
    ranks[item.idx] = rank + 1;
  });
  return ranks;
}

// Format growth value for display
export function formatGrowth(val: number): string {
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(1)}%`;
}

// Add computed fields to a dataset
export function addComputedFields(
  rows: DataRow[],
  computed: Array<{ type: string; field: string; label: string }>
): DataRow[] {
  return rows.map((row, i) => {
    const newRow = { ...row };
    computed.forEach(c => {
      let values: number[];
      switch (c.type) {
        case 'growth':
          values = computeGrowth(rows, c.field);
          break;
        case 'running_total':
          values = computeRunningTotal(rows, c.field);
          break;
        case 'percent_total':
          values = computePercentOfTotal(rows, c.field);
          break;
        case 'rank':
          values = computeRank(rows, c.field);
          break;
        default:
          values = [];
      }
      if (values.length > i) {
        newRow[c.label] = values[i];
      }
    });
    return newRow;
  });
}
