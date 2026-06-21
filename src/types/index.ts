// DashInsight - Core Type Definitions

// === Data Row Types ===

export type DataRow = Record<string, unknown>;

export interface PreparedRow extends DataRow {
  __qualityFlags: string[];
}

// === Column Mapping ===

export interface ColumnMappingItem {
  sourceColumn: string;
  targetField: string | null;
  confidence: number;
  sampleValues: unknown[];
  confirmedByUser: boolean;
}

// === Sheet Profiling ===

export interface SheetProfile {
  name: string;
  type: 'Transaksi' | 'Dokumentasi' | 'Master Data' | 'Ringkasan' | 'Lainnya';
  score: number;
  recommended: boolean;
  headers: string[];
  data: DataRow[];
  headerRowIndex: number;
  rowCount: number;
  columnCount: number;
  sample: DataRow[];
}

// === Dashboard Settings ===

export type NetRevenueFormula = 'gross' | 'net_of_returns' | 'net_of_discounts_returns';
export type ProfitFormula = 'auto' | 'gross_profit' | 'operating_profit';
export type AovFormula = 'net' | 'gross';
export type MetricView = 'revenue' | 'quantity';

export interface DashboardSettings {
  netRevenueFormula: NetRevenueFormula;
  profitFormula: ProfitFormula;
  aovFormula: AovFormula;
}

// === Filters ===

export type DateFilter = 'all' | '7days' | '30days' | 'mtd' | 'mom' | 'yoy' | 'ytd';
export type TrendGranularity = 'daily' | 'weekly' | 'monthly';

export interface DashboardFilters {
  dateFilter: DateFilter;
  trendGranularity: TrendGranularity;
  categoryFilter: string;
  channelFilter: string;
  branchFilter: string;
  paymentFilter: string;
}

// === KPI Types ===

export interface KPISummary {
  totalOmzet: number;
  totalTransaksi: number;
  produkTerjual: number;
  avgTransaksi: number;
  jumlahPelanggan: number;
  avgItems: number;
  totalProfit: number;
  profitMargin: number;
  avgRating: number;
  totalTax: number;
  totalServiceCharge: number;
  totalPlatformFee: number;
  totalDiskon: number;
  netRevenue: number;
  totalRetur: number;
}

// === Chart Data Types ===

export interface ChartDataItem {
  name: string;
  sales: number;
  quantity?: number;
  qty?: number;
  transactions?: number;
  profit?: number;
  value?: number;
}

export interface TrendDataPoint {
  date: string;
  sales: number | null;
  transactions: number | null;
  forecastSales?: number;
  forecastTransactions?: number;
  isForecast?: boolean;
  isForecastStart?: boolean;
  sort: number;
}

export interface ProductMatrixItem {
  name: string;
  x: number;
  y: number;
  z: number;
  quadrant?: string;
  recommendation?: string;
}

export interface CrossDimensionData {
  name: string;
  [key: string]: string | number;
}

export interface HourlyData {
  name: string;
  sales: number;
  transactions: number;
}

export interface BasketSizeItem {
  name: string;
  count: number;
  sort: number;
}

// === Analytics Output ===

export interface DashboardAnalyticsOutput {
  kpis: KPISummary;
  charts: {
    trendSales: TrendDataPoint[];
    topProducts: ChartDataItem[];
    categorySales: ChartDataItem[];
    channelSales: ChartDataItem[];
    branchSales: ChartDataItem[];
    paymentMethods: ChartDataItem[];
    weekdaySales: ChartDataItem[];
    citySales: ChartDataItem[];
    staffSales: ChartDataItem[];
    brandSales: ChartDataItem[];
    supplierSales: ChartDataItem[];
    serviceDuration: ChartDataItem[];
    hourlySales: HourlyData[];
    basketSize: BasketSizeItem[];
    productMatrix: ProductMatrixItem[];
    crossCategoryBranch: CrossDimensionData[];
    crossTimeCategory: CrossDimensionData[];
    discountEffectiveness: ProductMatrixItem[];
    crossChannelCategory: CrossDimensionData[];
    crossPaymentChannel: CrossDimensionData[];
    crossStaffCategory: CrossDimensionData[];
    channelEfficiency: ChartDataItem[];
    categoryProfitability: ChartDataItem[];
  };
  insights: InsightItem[];
  dimensions: DataDimensions;
  dataHealth: DataHealthResult;
  pareto: ParetoResult;
  businessProfile: BusinessProfile;
  growth: GrowthData;
  customerSegments: CustomerSegments;
  dateRange: { start: string; end: string } | null;
  rowStats: { filteredRows: number; totalRows: number };
}

// === Insights ===

export interface InsightItem {
  type: 'success' | 'warning' | 'info';
  text: string;
}

// === Data Dimensions ===

export interface DataDimensions {
  date: boolean;
  product: boolean;
  category: boolean;
  channel: boolean;
  branch: boolean;
  customer: boolean;
  paymentMethod: boolean;
  city: boolean;
  paymentStatus: boolean;
  staff: boolean;
  discount: boolean;
  shipping: boolean;
  cogs: boolean;
  profit: boolean;
  rating: boolean;
  duration: boolean;
  commission: boolean;
  time: boolean;
  brand: boolean;
  supplier: boolean;
  returns: boolean;
  tax: boolean;
  serviceCharge: boolean;
  platformFee: boolean;
}

// === Data Health ===

export interface DataHealthResult {
  score: number;
  label: 'Baik' | 'Perlu Dicek' | 'Bermasalah';
  issues: Array<{ level: 'critical' | 'warning' | 'info'; text: string }>;
  stats: {
    totalRows: number;
    invalidSales: number;
    invalidDates: number;
    duplicateTransactions: number;
  };
}

// === Pareto ===

export interface ParetoItem {
  name: string;
  sales: number;
  share: number;
  cumulativeShare: number;
}

export interface ParetoResult {
  products: ParetoResultSingle;
  categories: ParetoResultSingle;
  channels: ParetoResultSingle;
}

export interface ParetoResultSingle {
  total: number;
  countFor80: number;
  top20Count: number;
  top20Share: number;
  items: ParetoItem[];
}

// === Business Profile ===

export interface BusinessProfile {
  type: string;
  focus: string[];
}

// === Growth ===

export interface GrowthData {
  omzet?: number;
  transaksi?: number;
  profit?: number;
  aov?: number;
  diskon?: number;
  ongkir?: number;
  commission?: number;
  tax?: number;
  serviceCharge?: number;
  platformFee?: number;
  retur?: number;
  qty?: number;
  customers?: number;
  rating?: number;
  label: string;
}

// === Customer Segments ===

export interface CustomerSegment {
  id: string;
  name: string;
  sales: number;
  transactions: number;
  rows: number;
  recencyDays: number | null;
}

export interface CustomerSegments {
  total: number;
  repeat: number;
  repeatRate: number;
  vip: CustomerSegment[];
  atRisk: CustomerSegment[];
  topCustomers: CustomerSegment[];
}

// === Dashboard Layout ===

export type ChartSize = 4 | 6 | 12;
export type ChartViewType = 'auto' | 'bar' | 'pie' | 'radar' | 'treemap';

export interface DashboardLayout {
  chartOrder: string[];
  chartSizes: Record<string, ChartSize>;
  hiddenCharts: string[];
  chartViews: Record<string, ChartViewType>;
  chartRotations: Record<string, boolean>;
  metricView: MetricView;
  savedAt: string;
}

// === Dataset History ===

export interface DatasetHistoryItem {
  id: string;
  name: string;
  rows: number;
  businessType: string;
  savedAt: string;
}

// === Navigation ===

export type ViewType = 'home' | 'wizard' | 'dashboard' | 'data' | 'insight' | 'laporan' | 'pengaturan' | 'bantuan' | 'charts';
export type WizardStep = 1 | 2 | 2.5 | 3 | 4;

// === Chart IDs ===

export type ChartId =
  | 'pareto' | 'productMatrix' | 'topProducts' | 'categorySales'
  | 'channelSales' | 'branchSales' | 'crossCategoryBranch' | 'hourlySales'
  | 'crossTimeCategory' | 'discount' | 'staffSales' | 'serviceDuration'
  | 'weekdaySales' | 'basketSize' | 'paymentMethods' | 'citySales'
  | 'brandSales' | 'supplierSales' | 'dataTable'
  | 'crossChannelCategory' | 'crossPaymentChannel' | 'crossStaffCategory'
  | 'channelEfficiency' | 'categoryProfitability';
