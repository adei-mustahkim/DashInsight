// DashInsight - Centralized Constants

import type { ChartId, ChartSize } from '../types';

// === Chart IDs ===
export const ALL_CHART_IDS: ChartId[] = [
  'pareto', 'productMatrix', 'topProducts', 'categorySales', 'channelSales', 'branchSales',
  'crossCategoryBranch', 'hourlySales', 'crossTimeCategory', 'discount', 'staffSales',
  'serviceDuration', 'weekdaySales', 'basketSize', 'paymentMethods', 'citySales',
  'brandSales', 'supplierSales', 'dataTable',
  'crossChannelCategory', 'crossPaymentChannel', 'crossStaffCategory',
  'channelEfficiency', 'categoryProfitability'
];

export const DEFAULT_ORDER: ChartId[] = ALL_CHART_IDS;

// === Chart Sizes (grid span) ===
export const DEFAULT_CHART_SIZES: Record<ChartId, ChartSize> = {
  pareto: 12,
  productMatrix: 12,
  topProducts: 6,
  categorySales: 6,
  channelSales: 6,
  branchSales: 6,
  crossCategoryBranch: 6,
  hourlySales: 12,
  crossTimeCategory: 6,
  discount: 6,
  staffSales: 6,
  serviceDuration: 6,
  weekdaySales: 4,
  basketSize: 4,
  paymentMethods: 4,
  citySales: 4,
  brandSales: 4,
  supplierSales: 4,
  dataTable: 12,
  crossChannelCategory: 6,
  crossPaymentChannel: 6,
  crossStaffCategory: 6,
  channelEfficiency: 6,
  categoryProfitability: 6,
};

// === Colors ===
export const COLORS = {
  primary: '#276749',
  primaryHover: '#1F513A',
  pastelGreen: '#DCF4E7',
  softGreen: '#F1FAF5',
  bg: '#F8FAF9',
  textMain: '#1F2937',
  textSecondary: '#6B7280',
  warning: '#F5B942',
  softRed: '#DC6B6B',
  border: '#E5E7EB',
} as const;

export const ANALYST_COLORS = {
  primary: '#276749',
  secondary: '#A7B8AE',
  grid: '#E5E7EB',
  axis: '#6B7280',
  muted: '#F1FAF5',
  pastel: '#DCF4E7',
} as const;

export const CHART_COLORS = [ANALYST_COLORS.primary, ANALYST_COLORS.secondary];

// === Business Types ===
export const BUSINESS_TYPES = ['Retail', 'Kuliner', 'Fashion', 'Online Shop', 'Jasa', 'Lainnya'] as const;

// === Date Filters ===
export const DATE_FILTER_LABELS: Record<string, string> = {
  all: 'Semua Periode',
  '7days': '7 Hari Terakhir',
  '30days': '30 Hari Terakhir',
  mtd: 'Month to Date',
  mom: 'Month over Month',
  yoy: 'Year over Year',
  ytd: 'Year to Date',
};

// === Trend Granularity ===
export const TREND_GRANULARITY_LABELS: Record<string, string> = {
  daily: 'Harian',
  weekly: 'Mingguan',
  monthly: 'Bulanan',
};

// === Metric View ===
export const METRIC_VIEW_LABELS: Record<string, string> = {
  revenue: 'Omzet (Rp)',
  quantity: 'Kuantitas (Qty)',
};

// === Limits ===
export const LIMITS = {
  maxFileSizeMB: 20,
  maxFileSizeBytes: 20 * 1024 * 1024,
  maxRowsPerDataset: 50000,
  maxWorkspacesPerClient: 5,
  maxHistoryItems: 8,
  maxFeaturedCharts: 7,
  maxParetoDisplay: 30,
  maxTopCustomers: 10,
  maxCityMapDisplay: 8,
} as const;

// === Excel Serial Date Epoch ===
export const EXCEL_EPOCH_OFFSET = 25569;

// === Fuzzy Match Thresholds ===
export const FUZZY_THRESHOLDS = {
  exactMatch: 100,
  highConfidence: 90,
  partialMatch: 80,
  lowConfidence: 50,
} as const;

// === Basket Size Thresholds (IDR) ===
export const BASKET_SIZE_THRESHOLDS = {
  low: 50000,
  medium: 100000,
  high: 250000,
  veryHigh: 500000,
} as const;

export const BASKET_SIZE_LABELS = [
  { name: '< 50Rb', count: 0, sort: 1 },
  { name: '50-100Rb', count: 0, sort: 2 },
  { name: '100-250Rb', count: 0, sort: 3 },
  { name: '250-500Rb', count: 0, sort: 4 },
  { name: '> 500Rb', count: 0, sort: 5 },
] as const;

// === Excel Serial Date Threshold ===
export const EXCEL_DATE_THRESHOLD = 10000;
