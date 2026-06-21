// DashInsight - Date Intelligence Utilities
// Auto-detect dates, group by period, recommend smart defaults

export type DatePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

// Check if a string looks like a date
const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}/,           // YYYY-MM-DD
  /^\d{2}\/\d{2}\/\d{4}/,        // DD/MM/YYYY
  /^\d{2}-\d{2}-\d{4}/,          // DD-MM-YYYY
  /^\d{4}\/\d{2}\/\d{2}/,        // YYYY/MM/DD
];

export function isDateColumn(rows: any[], col: string): boolean {
  if (!rows.length || !col) return false;
  // Check if field name suggests a date
  const nameHints = ['date', 'tanggal', 'waktu', 'time', 'created', 'updated', 'month', 'year', 'quarter'];
  const nameLower = col.toLowerCase();
  const nameIsDate = nameHints.some(h => nameLower.includes(h));
  
  // Check actual values
  const sample = rows.slice(0, 20);
  let dateCount = 0;
  for (const row of sample) {
    const val = String(row[col] || '');
    if (!val) continue;
    // Direct Date parse check
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime()) && val.length >= 8) {
      dateCount++;
      continue;
    }
    // Pattern match
    if (DATE_PATTERNS.some(p => p.test(val))) {
      dateCount++;
    }
  }
  
  return dateCount > sample.length * 0.5 || (nameIsDate && dateCount > 0);
}

// Get all date columns from a dataset
export function detectDateColumns(rows: any[]): string[] {
  if (!rows.length) return [];
  const cols = Object.keys(rows[0]).filter(c => !c.startsWith('__'));
  return cols.filter(c => isDateColumn(rows, c));
}

// Parse date value to Date object
function parseDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  const str = String(val).trim();
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

// Get period key from a date
function getPeriodKey(date: Date, period: DatePeriod): string {
  const y = date.getFullYear();
  const m = date.getMonth();
  
  if (period === 'year') return `${y}`;
  if (period === 'quarter') return `${y}-Q${Math.floor(m / 3) + 1}`;
  if (period === 'month') return `${y}-${String(m + 1).padStart(2, '0')}`;
  if (period === 'week') {
    // ISO week
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }
  // day
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Format period key for display
export function formatPeriodLabel(key: string, period: DatePeriod): string {
  if (period === 'year') return key;
  if (period === 'quarter') {
    const [y, q] = key.split('-Q');
    return `Q${q} ${y}`;
  }
  if (period === 'month') {
    const [y, m] = key.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${months[parseInt(m) - 1]} ${y}`;
  }
  if (period === 'week') {
    return key.replace('-', ' ');
  }
  // day
  const d = new Date(key);
  if (isNaN(d.getTime())) return key;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// Get display label for a period (shorter for charts)
export function shortPeriodLabel(key: string, period: DatePeriod): string {
  if (period === 'year') return key;
  if (period === 'quarter') return key;
  if (period === 'month') {
    const [y, m] = key.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${months[parseInt(m) - 1]} '${y.slice(2)}`;
  }
  if (period === 'week') return key;
  // day
  const d = new Date(key);
  if (isNaN(d.getTime())) return key;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

// Recommend a period based on date range
export function recommendPeriod(rows: any[], dateCol: string): DatePeriod {
  const dates = rows.map(r => parseDate(r[dateCol])).filter(Boolean) as Date[];
  if (dates.length < 2) return 'month';
  
  const min = new Date(Math.min(...dates.map(d => d.getTime())));
  const max = new Date(Math.max(...dates.map(d => d.getTime())));
  const diffDays = (max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24);
  
  if (diffDays <= 31) return 'day';
  if (diffDays <= 90) return 'week';
  if (diffDays <= 730) return 'month';
  if (diffDays <= 1825) return 'quarter';
  return 'year';
}

// Group rows by date period
export function groupByPeriod(
  rows: any[],
  dateCol: string,
  period: DatePeriod
): { key: string; label: string; rows: any[] }[] {
  const groups: Record<string, any[]> = {};
  
  rows.forEach(row => {
    const date = parseDate(row[dateCol]);
    const key = date ? getPeriodKey(date, period) : 'Unknown';
    if (!groups[key]) groups[key] = [];
    groups[key].push(row);
  });
  
  // Sort keys chronologically
  const sortedKeys = Object.keys(groups).sort((a, b) => {
    if (a === 'Unknown') return 1;
    if (b === 'Unknown') return -1;
    return a.localeCompare(b);
  });
  
  return sortedKeys.map(key => ({
    key,
    label: formatPeriodLabel(key, period),
    rows: groups[key],
  }));
}

// Filter rows by date range
export function filterByDateRange(
  rows: any[],
  dateCol: string,
  from: string | null,
  to: string | null
): any[] {
  if (!from && !to) return rows;
  
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  if (toDate) toDate.setHours(23, 59, 59, 999);
  
  return rows.filter(row => {
    const date = parseDate(row[dateCol]);
    if (!date) return true; // keep rows without dates
    if (fromDate && date < fromDate) return false;
    if (toDate && date > toDate) return false;
    return true;
  });
}

// Get date range from rows
export function getDateRange(rows: any[], dateCol: string): { min: string; max: string } | null {
  const dates = rows.map(r => parseDate(r[dateCol])).filter(Boolean) as Date[];
  if (!dates.length) return null;
  
  const min = new Date(Math.min(...dates.map(d => d.getTime())));
  const max = new Date(Math.max(...dates.map(d => d.getTime())));
  
  return {
    min: min.toISOString().split('T')[0],
    max: max.toISOString().split('T')[0],
  };
}

// Date range presets
export function getDatePresets(): { label: string; from: string; to: string }[] {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  const daysAgo = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  };
  
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString().split('T')[0];
  
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
  const endOfYear = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
  
  const lastYear = now.getFullYear() - 1;
  const lastYearStart = `${lastYear}-01-01`;
  const lastYearEnd = `${lastYear}-12-31`;
  
  return [
    { label: '7 hari terakhir', from: daysAgo(7), to: today },
    { label: '30 hari terakhir', from: daysAgo(30), to: today },
    { label: '90 hari terakhir', from: daysAgo(90), to: today },
    { label: 'Bulan ini', from: startOfMonth, to: endOfMonth },
    { label: 'Kuartal ini', from: startOfQuarter, to: today },
    { label: 'Tahun ini', from: startOfYear, to: endOfYear },
    { label: 'Tahun lalu', from: lastYearStart, to: lastYearEnd },
  ];
}
