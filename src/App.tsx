/* eslint-disable */
// @ts-nocheck
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter, ZAxis, ComposedChart, Treemap, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import {
  UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle,
  BarChart3, PieChart as PieChartIcon, LayoutDashboard, Settings,
  HelpCircle, ChevronRight, FileText, Download, Printer, TrendingUp,
  Users, ShoppingBag, CreditCard, ChevronLeft, ChevronUp, ChevronDown, Lightbulb, PlayCircle,
  Filter, RotateCcw, Package, MapPin, CalendarDays, Target, Activity, LayoutGrid, Radar as RadarIcon, List, X, Plus, GripHorizontal, Tag, Truck, Award, Maximize2, LogOut, Menu, Layers, Eye, EyeOff, Search
} from 'lucide-react';
import { useAuth } from './stores/useAuth';
import logoImg from './assets/logo.png';
import { clientApi, type ChartTemplate, type KpiTemplate } from './services/api';
import { TemplateChart } from './components/Charts/TemplateChart';
import { calculateKPI } from './formulas/evaluator';

const ALL_CHART_IDS = [
  'citySales',
  'topProducts',
  'productMatrix',
  'pareto',
  'categorySales',
  'categoryProfitability',
  'variantPopularity',
  'channelSales',
  'channelEfficiency',
  'promoCampaign',
  'customerSegment',
  'paymentMethods',
  'branchSales',
  'orderFulfillment',
  'hourlySales',
  'weekdaySales',
  'basketSize',
  'staffSales',
  'brandSales',
  'supplierSales',
  'serviceDuration',
  'crossCategoryBranch',
  'crossTimeCategory',
  'crossChannelCategory',
  'crossPaymentChannel',
  'crossStaffCategory',
  'discount',
  'orderTypeMix',
  'paymentProviderShare',
  'courierEfficiency',
  'tableRevenue',
  'promoRoi',
  'customerLoyaltyMix',
  'variantProfitability',
  'dataTable'
];

// Template seed berikut sudah memiliki padanan di dashboard analitik bawaan.
// Tetap tampil di Chart Library, tetapi jangan dirender ulang di dashboard.
const BUILT_IN_TEMPLATE_CODES = new Set([
  'REVENUE_TREND', 'TOP_PRODUCTS', 'CATEGORY_MIX', 'PARETO', 'PEAK_HOURS',
  'WEEKDAY_SALES', 'PAYMENT_MIX', 'BRANCH_PERF', 'STAFF_PERF', 'PRODUCT_MATRIX',
  'DATA_TABLE', 'CATEGORY_BRANCH', 'TIME_CATEGORY', 'DISCOUNT_EFFECTIVENESS',
  'SERVICE_DURATION', 'BASKET_SIZE', 'CITY_SALES', 'BRAND_SALES', 'SUPPLIER_SALES',
  'CHANNEL_CATEGORY', 'PAYMENT_CHANNEL', 'STAFF_CATEGORY', 'CHANNEL_EFFICIENCY',
  'CATEGORY_PROFITABILITY', 'CHANNEL_MIX',
  'PROMO_CAMPAIGN', 'CUSTOMER_SEGMENT', 'VARIANT_POPULARITY', 'ORDER_FULFILLMENT',
  'ORDER_TYPE_MIX', 'PAYMENT_PROVIDER_SHARE', 'COURIER_EFFICIENCY', 'TABLE_REVENUE',
  'PROMO_ROI', 'CUSTOMER_LOYALTY_MIX', 'VARIANT_PROFITABILITY'
]);

const DEFAULT_ORDER = ALL_CHART_IDS;

const DEFAULT_CHART_SIZES = {
  citySales: 4,
  topProducts: 6,
  productMatrix: 12,
  pareto: 12,
  categorySales: 6,
  categoryProfitability: 6,
  variantPopularity: 6,
  channelSales: 6,
  channelEfficiency: 6,
  promoCampaign: 6,
  customerSegment: 6,
  paymentMethods: 4,
  branchSales: 6,
  orderFulfillment: 6,
  hourlySales: 12,
  weekdaySales: 4,
  basketSize: 4,
  staffSales: 6,
  brandSales: 4,
  supplierSales: 4,
  serviceDuration: 6,
  crossCategoryBranch: 6,
  crossTimeCategory: 6,
  crossChannelCategory: 6,
  crossPaymentChannel: 6,
  crossStaffCategory: 6,
  discount: 6,
  orderTypeMix: 6,
  paymentProviderShare: 6,
  courierEfficiency: 6,
  tableRevenue: 6,
  promoRoi: 6,
  customerLoyaltyMix: 6,
  variantProfitability: 6,
  dataTable: 12,
};

const buildAnalystChartPlan = (data, isDemo = false) => {
  if (!data) return { order: DEFAULT_ORDER, sizes: DEFAULT_CHART_SIZES, hidden: [] };
  const { dimensions, charts, pareto, businessProfile } = data;
  const available = new Set();
  if (pareto?.products?.items?.length > 0) available.add('pareto');
  if (charts.productMatrix?.length > 0) available.add('productMatrix');
  if (dimensions.product && charts.topProducts?.length > 0) {
    available.add('topProducts');
    available.add('dataTable');
  }
  if (dimensions.category && charts.categorySales?.length > 0) available.add('categorySales');
  if (dimensions.channel && charts.channelSales?.length > 0) available.add('channelSales');
  if (dimensions.branch && charts.branchSales?.length > 0) available.add('branchSales');
  if (charts.crossCategoryBranch?.length > 0) available.add('crossCategoryBranch');
  if (charts.hourlySales?.length > 0) available.add('hourlySales');
  if (charts.crossTimeCategory?.length > 0) available.add('crossTimeCategory');
  if (charts.discountEffectiveness?.length > 0) available.add('discount');
  if (dimensions.staff && charts.staffSales?.length > 0) available.add('staffSales');
  if (dimensions.duration && charts.serviceDuration?.length > 0) available.add('serviceDuration');
  if (charts.weekdaySales?.length > 0) available.add('weekdaySales');
  if (charts.basketSize?.length > 0) available.add('basketSize');
  if (dimensions.paymentMethod && charts.paymentMethods?.length > 0) available.add('paymentMethods');
  if (dimensions.city && charts.citySales?.length > 0) available.add('citySales');
  if (dimensions.brand && charts.brandSales?.length > 0) available.add('brandSales');
  if (dimensions.supplier && charts.supplierSales?.length > 0) available.add('supplierSales');
  if (charts.crossChannelCategory?.length > 0) available.add('crossChannelCategory');
  if (charts.crossPaymentChannel?.length > 0) available.add('crossPaymentChannel');
  if (charts.crossStaffCategory?.length > 0) available.add('crossStaffCategory');
  if (charts.channelEfficiency?.length > 0) available.add('channelEfficiency');
  if (charts.categoryProfitability?.length > 0) available.add('categoryProfitability');
  
  // New Business Analytics Charts
  if (charts.promoCampaign?.length > 0) available.add('promoCampaign');
  if (charts.customerSegment?.length > 0) available.add('customerSegment');
  if (charts.variantPopularity?.length > 0) available.add('variantPopularity');
  if (charts.orderFulfillment?.length > 0) available.add('orderFulfillment');
  if (charts.orderTypeMix?.length > 0) available.add('orderTypeMix');
  if (charts.paymentProviderShare?.length > 0) available.add('paymentProviderShare');
  if (charts.courierEfficiency?.length > 0) available.add('courierEfficiency');
  if (charts.tableRevenue?.length > 0) available.add('tableRevenue');
  if (charts.promoRoi?.length > 0) available.add('promoRoi');
  if (charts.customerLoyaltyMix?.length > 0) available.add('customerLoyaltyMix');
  if (charts.variantProfitability?.length > 0) available.add('variantProfitability');

  const profile = businessProfile?.type || '';
  const preferred = profile.includes('Jasa')
    ? ['staffSales', 'serviceDuration', 'crossStaffCategory', 'customerLoyaltyMix', 'weekdaySales', 'hourlySales', 'paymentProviderShare', 'orderTypeMix']
    : profile.includes('Marketplace')
      ? ['channelSales', 'courierEfficiency', 'promoRoi', 'orderTypeMix', 'paymentProviderShare', 'customerLoyaltyMix', 'citySales', 'crossChannelCategory', 'variantProfitability']
      : profile.includes('F&B')
        ? ['orderTypeMix', 'tableRevenue', 'variantPopularity', 'topProducts', 'hourlySales', 'weekdaySales', 'basketSize', 'promoRoi', 'paymentProviderShare', 'customerLoyaltyMix']
        : profile.includes('Retail')
          ? ['pareto', 'categoryProfitability', 'variantProfitability', 'customerLoyaltyMix', 'promoRoi', 'categorySales', 'crossCategoryBranch', 'brandSales', 'supplierSales', 'topProducts', 'branchSales', 'orderTypeMix']
          : ['pareto', 'productMatrix', 'topProducts', 'channelSales', 'categorySales', 'crossCategoryBranch', 'branchSales', 'basketSize'];

  const essentials = ['pareto', 'productMatrix', 'topProducts', 'channelSales', 'categorySales'];
  const selected = [];
  const maxSelected = isDemo ? 4 : 7;
  
  [...preferred, ...essentials].forEach(id => {
    if (available.has(id) && !selected.includes(id) && selected.length < maxSelected) selected.push(id);
  });
  if (selected.length < (isDemo ? 3 : 5)) {
    ALL_CHART_IDS.forEach(id => {
      if (available.has(id) && !selected.includes(id) && selected.length < maxSelected) selected.push(id);
    });
  }

  const order = [...selected, ...ALL_CHART_IDS.filter(id => available.has(id) && !selected.includes(id))];
  const hidden = order.filter(id => !selected.includes(id));
  const sizes = { ...DEFAULT_CHART_SIZES };
  selected.forEach((id, index) => {
    if (index < 2 && ['pareto', 'productMatrix', 'hourlySales'].includes(id)) sizes[id] = 12;
    else if (['paymentMethods', 'weekdaySales', 'basketSize', 'citySales'].includes(id)) sizes[id] = 4;
    else sizes[id] = 6;
  });
  return { order, sizes, hidden };
};

const buildChartCopy = (data) => {
  const profile = data?.businessProfile?.type || 'UMKM';
  const productLabel = profile.includes('Jasa') ? 'Layanan' : 'Produk';
  const channelLabel = profile.includes('Marketplace') ? 'Marketplace & Channel Mix' : 'Channel Mix';
  return {
    trendSales: {
      title: 'Revenue Trend & Transaction Momentum',
      subtitle: 'Membaca arah omzet bersih dan volume transaksi. (Metrik: Omzet & Transaksi | Kolom: transaction_date, sales_amount, transaction_id)',
    },
    pareto: {
      title: `Revenue Concentration by ${productLabel}`,
      subtitle: `Analisis Pareto 80/20 untuk melihat ketergantungan omzet pada sedikit ${productLabel.toLowerCase()}. (Metrik: Omzet & % Kumulatif | Kolom: product_name, sales_amount)`,
    },
    productMatrix: {
      title: `${productLabel} Portfolio Matrix`,
      subtitle: `Memetakan ${productLabel.toLowerCase()} dalam 3D (Volume vs Margin vs Omzet) untuk cash cow & star. (Metrik: Qty, Margin, Omzet | Kolom: product_name, quantity, cogs, sales_amount, category)`,
    },
    topProducts: {
      title: `${productLabel} Revenue Drivers`,
      subtitle: `Daftar kontributor omzet terbesar. (Metrik: Omzet | Kolom: product_name, sales_amount)`,
    },
    dataTable: {
      title: `${productLabel} Performance Detail`,
      subtitle: `Tabel audit komprehensif untuk drill-down performa. (Metrik: Omzet, Qty, Profit, Margin | Kolom: product_name, sales_amount, quantity, cogs)`,
    },
    categorySales: {
      title: 'Category Revenue Mix',
      subtitle: 'Komposisi kontribusi omzet per kategori produk. (Metrik: Omzet | Kolom: category, sales_amount)',
    },
    channelSales: {
      title: channelLabel,
      subtitle: 'Porsi omzet per channel penjualan untuk mendeteksi dependensi platform. (Metrik: Omzet | Kolom: sales_channel, sales_amount)',
    },
    branchSales: {
      title: 'Branch / Outlet Performance',
      subtitle: 'Perbandingan omzet antar cabang/lokasi operasional. (Metrik: Omzet | Kolom: branch, sales_amount)',
    },
    paymentMethods: {
      title: 'Payment Method Mix',
      subtitle: 'Sebaran jumlah transaksi per metode pembayaran. (Metrik: Transaksi | Kolom: payment_method, transaction_id)',
    },
    staffSales: {
      title: 'Staff Revenue Contribution',
      subtitle: 'Kontribusi omzet per kasir/staff. (Metrik: Omzet | Kolom: staff_name, sales_amount)',
    },
    serviceDuration: {
      title: 'Service Duration Benchmark',
      subtitle: 'Rata-rata durasi pelayanan per produk layanan. (Metrik: Durasi (Menit) | Kolom: product_name, duration_mins)',
    },
    weekdaySales: {
      title: 'Revenue by Day of Week',
      subtitle: 'Pola omzet berdasarkan hari dalam seminggu. (Metrik: Omzet | Kolom: transaction_date, sales_amount)',
    },
    hourlySales: {
      title: 'Peak Hour Revenue Pattern',
      subtitle: 'Pola kepadatan jam ramai omzet dan transaksi. (Metrik: Omzet & Transaksi | Kolom: transaction_time, sales_amount, transaction_id)',
    },
    citySales: {
      title: 'Destination City Performance',
      subtitle: 'Peta/Bar sebaran wilayah pengiriman pelanggan. (Metrik: Omzet | Kolom: destination_city, sales_amount)',
    },
    basketSize: {
      title: 'Basket Size Distribution',
      subtitle: 'Sebaran nilai per transaksi untuk membaca peluang bundling. (Metrik: Transaksi | Kolom: transaction_id, sales_amount)',
    },
    brandSales: {
      title: 'Brand Revenue Contribution',
      subtitle: 'Kontribusi omzet per merek/brand produk. (Metrik: Omzet | Kolom: brand, sales_amount)',
    },
    supplierSales: {
      title: 'Supplier Revenue Contribution',
      subtitle: 'Kontribusi omzet dari pemasok untuk evaluasi portofolio supplier. (Metrik: Omzet | Kolom: supplier, sales_amount)',
    },
    crossCategoryBranch: {
      title: 'Category Performance by Branch',
      subtitle: 'Perbandingan performa kategori produk di setiap cabang. (Metrik: Omzet | Kolom: branch, category, sales_amount)',
    },
    crossTimeCategory: {
      title: 'Hourly Category Demand Pattern',
      subtitle: 'Pola permintaan kategori produk pada jam-jam ramai. (Metrik: Omzet | Kolom: transaction_time, category, sales_amount)',
    },
    discount: {
      title: 'Discount Effectiveness Analysis',
      subtitle: 'Analisis korelasi nominal diskon terhadap volume unit terjual. (Metrik: Diskon vs Qty | Kolom: product_name, discount_amount, quantity, sales_amount)',
    },
    crossChannelCategory: {
      title: 'Category Mix per Channel',
      subtitle: 'Sebaran kategori produk terlaris di setiap channel penjualan. (Metrik: Omzet | Kolom: sales_channel, category, sales_amount)',
    },
    crossPaymentChannel: {
      title: 'Payment Method per Channel',
      subtitle: 'Preferensi metode pembayaran pelanggan di setiap channel penjualan. (Metrik: Omzet | Kolom: payment_method, sales_channel, sales_amount)',
    },
    crossStaffCategory: {
      title: 'Staff Performance per Category',
      subtitle: 'Kontribusi omzet staff per kategori produk. (Metrik: Omzet | Kolom: staff_name, category, sales_amount)',
    },
    channelEfficiency: {
      title: 'Channel Efficiency: AOV & Discount Rate',
      subtitle: 'Membandingkan efisiensi biaya/diskon dan AOV antar channel. (Metrik: AOV vs Diskon % | Kolom: sales_channel, sales_amount, transaction_id, discount_amount)',
    },
    categoryProfitability: {
      title: 'Category Profitability Index',
      subtitle: 'Evaluasi margin profit vs omzet per kategori produk. (Metrik: Margin % vs Omzet | Kolom: category, sales_amount, cogs)',
    },
    variantPopularity: {
      title: 'Product Variant Popularity',
      subtitle: 'Mengukur kepopuleran varian (rasa, ukuran, warna) berdasarkan unit terjual. (Metrik: Qty | Kolom: variant, quantity)',
    },
    promoCampaign: {
      title: 'Promo Campaign Performance',
      subtitle: 'Analisis kontribusi nominal voucher promo terhadap total omzet. (Metrik: Omzet & Transaksi | Kolom: promo_code, sales_amount, transaction_id)',
    },
    customerSegment: {
      title: 'Customer Segment Mix',
      subtitle: 'Porsi kontribusi omzet dari segmen pelanggan (misal: Grosir vs Eceran, Member). (Metrik: Omzet | Kolom: customer_type, sales_amount)',
    },
    orderFulfillment: {
      title: 'Order Status Fulfillment',
      subtitle: 'Analisis efisiensi pemenuhan pesanan (Selesai, Batal, Retur). (Metrik: Transaksi | Kolom: payment_status, transaction_id)',
    },
    orderTypeMix: {
      title: 'Order Type Contribution',
      subtitle: 'Membaca porsi transaksi Dine-In, Takeaway, dan Delivery. (Metrik: Omzet | Kolom: order_type, sales_amount)',
    },
    paymentProviderShare: {
      title: 'Payment Provider Breakdown',
      subtitle: 'Metode pembayaran dipecah berdasarkan penyedia jasa/bank. (Metrik: Omzet | Kolom: payment_method, payment_provider, sales_amount)',
    },
    courierEfficiency: {
      title: 'Courier Revenue vs Fees',
      subtitle: 'Perbandingan ongkos kirim terhadap omzet pengiriman untuk tiap ekspedisi. (Metrik: Ongkir & Omzet | Kolom: shipping_courier, shipping_fee, sales_amount)',
    },
    tableRevenue: {
      title: 'Dine-In Table Productivity',
      subtitle: 'Produktivitas meja layanan terhadap omzet penjualan F&B. (Metrik: Omzet | Kolom: table_number, sales_amount)',
    },
    promoRoi: {
      title: 'Promo Cost vs Net Revenue',
      subtitle: 'Analisis efisiensi promosi: membandingkan diskon terpakai vs omzet bersih. (Metrik: Diskon & Omzet | Kolom: promo_code, discount_amount, sales_amount)',
    },
    customerLoyaltyMix: {
      title: 'Membership Category Mix',
      subtitle: 'Preferensi kategori belanja berdasarkan segmen loyalitas pelanggan. (Metrik: Omzet | Kolom: customer_type, category, sales_amount)',
    },
    variantProfitability: {
      title: 'Variant Margin vs Volume Matrix',
      subtitle: 'Pemetaan portofolio varian produk berdasarkan tingkat margin keuntungan vs volume penjualan. (Metrik: Margin %, Unit Terjual | Kolom: variant, cogs, sales_amount, quantity)',
    },
  };
};
import * as XLSX from 'xlsx';
import { getCityCoords } from './constants/cityCoords';
import { STANDARD_FIELDS, FIELD_SYNONYMS } from './constants/fields';
import {
  parseTransactionDate,
  toCleanLabel,
  groupSum,
  parseNumericValue,
  isUsefulMappedValue,
  parseCSV,
  levenshtein,
  getSimilarity,
  autoMapColumns,
  extractSheetData,
  profileSheet,
  NUMERIC_FIELDS
} from './utils/dataMappingUtils';
import { generateDemoData } from './utils/demoDataGenerator';
import { getDashboardExportTemplate } from './utils/dashboardExportTemplate';
import { IndonesiaMapChart } from './components/Charts/IndonesiaMapChart';
import { computeDashboardAnalytics } from './analytics/dashboardAnalytics';
import { prepareRows } from './analytics/dataPreparation';
import { buildDatasetKey, DASHBOARD_LAYOUT_PREFIX } from './storage/dashboardStorage';
import { formatNumber, formatRupiah, shortCurrency } from './utils/formatting';
import { TEMPLATE_DATA_URL, TEMPLATE_WORKBOOK_URL } from './lib/templateAssets';

// --- CONSTANTS & CONFIG ---
const COLORS = {
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
};

const ANALYST_COLORS = {
  primary: '#276749',
  secondary: '#A7B8AE',
  grid: '#E5E7EB',
  axis: '#6B7280',
  muted: '#F1FAF5',
  pastel: '#DCF4E7',
};

const CHART_COLORS = [ANALYST_COLORS.primary, ANALYST_COLORS.secondary];

// --- COMPONENTS ---

export default function UMKMInsight({
  initialView,
  isDemo = false,
  demoData = [],
  demoBusinessType = 'Retail'
}: {
  initialView?: string;
  isDemo?: boolean;
  demoData?: any[];
  demoBusinessType?: string;
} = {}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const authContext = useAuth();
  const token = isDemo ? 'demo-token' : authContext.token;
  
  const user = isDemo ? {
    name: 'Demo Visitor',
    role: 'client',
    email: 'visitor@dashinsight.id'
  } : authContext.user;

  const client = isDemo ? {
    business_name: `Dashboard Demo (${demoBusinessType})`,
    business_type: demoBusinessType,
    owner_name: 'Demo Visitor',
    status: 'active',
    phone: '081234567890',
    address: 'Jl. Demo Utama No. 123, Jakarta',
    active_until: '2026-12-31',
    created_at: '2026-01-01'
  } : authContext.client;

  const logout = isDemo ? () => { console.log('Demo logout'); } : authContext.logout;
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState(() => { 
    if (isDemo) return 'dashboard';
    if (window.__EXPORTED_DATA__) return 'home'; 
    if (initialView === 'upload') return 'wizard'; 
    if (initialView === 'insights') return 'insight'; 
    if (initialView === 'reports') return 'laporan'; 
    if (initialView === 'pengaturan' || initialView === 'settings') return 'pengaturan'; 
    if (initialView === 'profile') return 'profil'; 
    return 'home'; 
  });
  const [wizardStep, setWizardStep] = useState(1);
  const [businessType, setBusinessType] = useState(() => {
    if (isDemo) return demoBusinessType;
    return window.__EXPORTED_DATA__?.businessType || '';
  });

  const DEFAULT_SETTINGS = {
    netRevenueFormula: 'gross', // gross, net_of_returns, net_of_discounts_returns, revenue_per_unit
    profitFormula: 'auto', // auto, gross_profit, operating_profit, margin_percentage
    aovFormula: 'net', // net, gross, per_unique_customer
    inventoryTurnover: 'revenue_over_stock', // revenue_over_stock, units_sold_over_active
    customerMetrics: 'retention_rate', // retention_rate, purchase_frequency
  };

  const [dashboardSettings, setDashboardSettings] = useState(() => {
    if (window.__EXPORTED_DATA__?.settings) {
      return window.__EXPORTED_DATA__.settings;
    }
    try {
      const saved = localStorage.getItem('dashboardSettings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  React.useEffect(() => {
    if (window.__EXPORTED_DATA__) return;
    localStorage.setItem('dashboardSettings', JSON.stringify(dashboardSettings));
  }, [dashboardSettings]);

  // Data States
  const [rawFile, setRawFile] = useState(null);
  const [rawHeaders, setRawHeaders] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [columnMapping, setColumnMapping] = useState([]);
  const [availableSheets, setAvailableSheets] = useState([]);
  const [selectedSheetName, setSelectedSheetName] = useState('');
  const [processedData, setProcessedData] = useState(() => {
    if (isDemo) return prepareRows(demoData);
    if (window.__EXPORTED_DATA__?.processedData) return window.__EXPORTED_DATA__.processedData;
    return [];
  });

  React.useEffect(() => {
    if (isDemo) {
      setProcessedData(prepareRows(demoData));
      setBusinessType(demoBusinessType);
    }
  }, [isDemo, demoData, demoBusinessType]);
  const [metricView, setMetricView] = useState(() => {
    if (window.__EXPORTED_DATA__?.metricView) return window.__EXPORTED_DATA__.metricView;
    return 'revenue';
  });
  const [dateFilter, setDateFilter] = useState(() => {
    if (window.__EXPORTED_DATA__?.activeFilters?.dateFilter) return window.__EXPORTED_DATA__.activeFilters.dateFilter;
    return 'all';
  });
  const [trendGranularity, setTrendGranularity] = useState(() => {
    if (window.__EXPORTED_DATA__?.trendGranularity) return window.__EXPORTED_DATA__.trendGranularity;
    return 'daily';
  });
  const [categoryFilter, setCategoryFilter] = useState(() => {
    if (window.__EXPORTED_DATA__?.activeFilters?.categoryFilter) return window.__EXPORTED_DATA__.activeFilters.categoryFilter;
    return 'all';
  });
  const [channelFilter, setChannelFilter] = useState(() => {
    if (window.__EXPORTED_DATA__?.activeFilters?.channelFilter) return window.__EXPORTED_DATA__.activeFilters.channelFilter;
    return 'all';
  });
  const [branchFilter, setBranchFilter] = useState(() => {
    if (window.__EXPORTED_DATA__?.activeFilters?.branchFilter) return window.__EXPORTED_DATA__.activeFilters.branchFilter;
    return 'all';
  });
  const [paymentFilter, setPaymentFilter] = useState(() => {
    if (window.__EXPORTED_DATA__?.activeFilters?.paymentFilter) return window.__EXPORTED_DATA__.activeFilters.paymentFilter;
    return 'all';
  });
  const [hiddenCharts, setHiddenCharts] = useState(() => {
    if (window.__EXPORTED_DATA__?.hiddenCharts) return window.__EXPORTED_DATA__.hiddenCharts;
    return [];
  });
  const [chartOrder, setChartOrder] = useState(() => {
    if (window.__EXPORTED_DATA__?.chartOrder) return window.__EXPORTED_DATA__.chartOrder;
    return DEFAULT_ORDER;
  });
  const [draggedChart, setDraggedChart] = useState(null);
  const [chartSizes, setChartSizes] = useState(() => {
    if (window.__EXPORTED_DATA__?.chartSizes) return window.__EXPORTED_DATA__.chartSizes;
    return {};
  });
  const [chartViews, setChartViews] = useState(() => {
    if (window.__EXPORTED_DATA__?.chartViews) return window.__EXPORTED_DATA__.chartViews;
    return {};
  });
  const [chartRotations, setChartRotations] = useState(() => {
    if (window.__EXPORTED_DATA__?.chartRotations) return window.__EXPORTED_DATA__.chartRotations;
    return {};
  });
  const [activeDatasetKey, setActiveDatasetKey] = useState(() => {
    if (window.__EXPORTED_DATA__) return 'exported';
    return '';
  });
  const [chartTemplates, setChartTemplates] = useState<ChartTemplate[]>(() => {
    if (window.__EXPORTED_DATA__?.chartTemplates) return window.__EXPORTED_DATA__.chartTemplates;
    return [];
  });
  const [chartTemplatesLoading, setChartTemplatesLoading] = useState(false);
  const [chartTemplatesError, setChartTemplatesError] = useState('');
  const [kpiTemplates, setKpiTemplates] = useState<KpiTemplate[]>(() => {
    if (window.__EXPORTED_DATA__?.kpiTemplates) return window.__EXPORTED_DATA__.kpiTemplates;
    return [];
  });
  const [showKpiManager, setShowKpiManager] = useState(false);
  const [showAnalysisSummary, setShowAnalysisSummary] = useState(() => {
    if (window.__EXPORTED_DATA__) return false;
    return localStorage.getItem('dashinsight_show_analysis_summary') !== 'false';
  });
  const [hiddenKpis, setHiddenKpis] = useState<string[]>(() => {
    if (window.__EXPORTED_DATA__?.hiddenKpis) return window.__EXPORTED_DATA__.hiddenKpis;
    try { return JSON.parse(localStorage.getItem('dashinsight_hidden_kpis') || '[]'); } catch { return []; }
  });
  const [mappingTemplate, setMappingTemplate] = useState<ChartTemplate | null>(null);
  const [chartSearchQuery, setChartSearchQuery] = useState('');
  const [chartLibraryMappings, setChartLibraryMappings] = useState<Record<string, Record<string, string>>>(() => {
    if (window.__EXPORTED_DATA__?.chartLibraryMappings) return window.__EXPORTED_DATA__.chartLibraryMappings;
    try { return JSON.parse(localStorage.getItem('dashinsight_chart_mappings') || '{}'); } catch { return {}; }
  });
  const availableDataColumns = useMemo(
    () => [...new Set(processedData.slice(0, 100).flatMap(row => Object.keys(row)))].filter(column => !column.startsWith('__')).sort(),
    [processedData],
  );
  const customChartTemplates = useMemo(
    () => chartTemplates.filter(template => !BUILT_IN_TEMPLATE_CODES.has(template.chart_code.trim().toUpperCase())),
    [chartTemplates],
  );
  const autoLayoutDatasetRef = useRef(null);
  const mainScrollRef = useRef(null);
  const pendingScrollRestoreRef = useRef(null);
  const layoutHydratedRef = useRef(false);
  const [datasetHistory, setDatasetHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('umkm_dataset_history') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (window.__EXPORTED_DATA__) {
      layoutHydratedRef.current = true;
      return;
    }
    setDateFilter('all');
    setCategoryFilter('all');
    setChannelFilter('all');
    setBranchFilter('all');
    setPaymentFilter('all');
    setTrendGranularity('daily');
    layoutHydratedRef.current = false;
    if (!processedData.length || !activeDatasetKey) {
      setChartViews({});
      setChartRotations({});
      return;
    }

    try {
      const saved = JSON.parse(localStorage.getItem(`${DASHBOARD_LAYOUT_PREFIX}${activeDatasetKey}`) || 'null');
      if (saved) {
        setChartOrder(saved.chartOrder || DEFAULT_ORDER);
        setChartSizes(saved.chartSizes || {});
        setHiddenCharts(saved.hiddenCharts || []);
        setChartViews(saved.chartViews || {});
        setChartRotations(saved.chartRotations || {});
        setMetricView(saved.metricView || 'revenue');
        autoLayoutDatasetRef.current = processedData;
        layoutHydratedRef.current = true;
        return;
      }
    } catch {
      // Fall back to analyst auto-layout.
    }

    setChartViews({});
    setChartRotations({});
    autoLayoutDatasetRef.current = null;
  }, [processedData, activeDatasetKey]);

  useEffect(() => {
    if (window.__EXPORTED_DATA__) return;
    if (!processedData.length || !activeDatasetKey || !layoutHydratedRef.current) return;
    const layout = {
      chartOrder,
      chartSizes,
      hiddenCharts,
      chartViews,
      chartRotations,
      metricView,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(`${DASHBOARD_LAYOUT_PREFIX}${activeDatasetKey}`, JSON.stringify(layout));
  }, [processedData.length, activeDatasetKey, chartOrder, chartSizes, hiddenCharts, chartViews, chartRotations, metricView]);

  const saveDatasetHistory = (rows, sourceName = 'Dataset') => {
    const datasetKey = buildDatasetKey(rows, sourceName);
    const item = {
      id: datasetKey,
      name: sourceName,
      rows: rows.length,
      businessType: businessType || 'Tidak diisi',
      savedAt: new Date().toLocaleString('id-ID'),
    };
    setActiveDatasetKey(datasetKey);
    const next = [item, ...datasetHistory.filter(existing => existing.id !== datasetKey)].slice(0, 8);
    setDatasetHistory(next);
    localStorage.setItem('umkm_dataset_history', JSON.stringify(next));
  };

  const applySelectedSheet = (sheet) => {
    if (!sheet || sheet.rowCount === 0) {
      alert("Sheet ini tidak memiliki data yang bisa diproses.");
      return;
    }
    setRawHeaders(sheet.headers);
    setRawData(sheet.data);
    setColumnMapping(autoMapColumns(sheet.headers, sheet.data));
    setWizardStep(3);
  };

  // File Upload Handler
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setRawFile(file);
    setAvailableSheets([]);
    setSelectedSheetName('');

    const fileExt = file.name.split('.').pop().toLowerCase();

    if (fileExt === 'csv') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target.result;
        try {
          const { headers, data } = parseCSV(text);
          setRawHeaders(headers);
          setRawData(data);
          setColumnMapping(autoMapColumns(headers, data));
          setWizardStep(3); // Go to Data Check
        } catch (err) {
          alert("Gagal membaca file CSV. Pastikan format valid.");
        }
      };
      reader.readAsText(file);
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetProfiles = workbook.SheetNames.map(name => profileSheet(name, workbook.Sheets[name]))
            .sort((a, b) => b.score - a.score);

          if (sheetProfiles.length === 0 || sheetProfiles.every(sheet => sheet.rowCount === 0)) {
            alert("File Excel kosong atau tidak memiliki sheet berisi data.");
            return;
          }

          const bestSheet = sheetProfiles[0];
          sheetProfiles.forEach(sheet => {
            sheet.recommended = sheet.name === bestSheet.name;
          });

          setAvailableSheets(sheetProfiles);
          setSelectedSheetName(bestSheet.name);

          if (sheetProfiles.length === 1) {
            applySelectedSheet(sheetProfiles[0]);
          } else {
            setWizardStep(25);
          }
        } catch (err) {
          alert("Gagal membaca file Excel. Pastikan file tidak rusak.");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Format file tidak didukung. Harap upload .csv, .xlsx, or .xls");
    }
  };

  const handleUseDemoData = () => {
    const demo = prepareRows(generateDemoData());
    setProcessedData(demo);
    saveDatasetHistory(demo, 'Data Contoh');
    setCurrentView('dashboard');
  };

  const handleProcessMapping = () => {
    const activeMappings = [];
    const usedTargets = new Set();
    const savedMappings = JSON.parse(localStorage.getItem('userColumnMappings') || '{}');

    columnMapping.forEach(mapItem => {
      if (mapItem.targetField && mapItem.targetField !== 'none') {
        activeMappings.push(mapItem);
        // Save user's explicit choices to memory
        savedMappings[mapItem.sourceColumn] = mapItem.targetField;
      }
    });

    localStorage.setItem('userColumnMappings', JSON.stringify(savedMappings));

    const normalized = rawData.map(row => {
      const newRow = {};
      activeMappings.forEach(mapItem => {
        if (mapItem.targetField) {
          let val = row[mapItem.sourceColumn];
          if (NUMERIC_FIELDS.has(mapItem.targetField)) {
            val = parseNumericValue(val);
          }
          if (newRow[mapItem.targetField] !== undefined && isUsefulMappedValue(mapItem.targetField, newRow[mapItem.targetField])) {
            return;
          }
          newRow[mapItem.targetField] = val;
        }
      });
      return newRow;
    });
    const prepared = prepareRows(normalized);
    setProcessedData(prepared);
    saveDatasetHistory(prepared, rawFile?.name || 'Upload Data');
    setWizardStep(4);
  };

  const preserveDashboardScroll = useCallback((updateFn) => {
    const scrollNode = mainScrollRef.current;
    pendingScrollRestoreRef.current = scrollNode
      ? { top: scrollNode.scrollTop, left: scrollNode.scrollLeft }
      : null;
    updateFn();
  }, []);

  React.useLayoutEffect(() => {
    const restore = pendingScrollRestoreRef.current;
    if (!restore) return;

    const scrollNode = mainScrollRef.current;
    if (!scrollNode) {
      pendingScrollRestoreRef.current = null;
      return;
    }

    scrollNode.scrollTop = restore.top;
    scrollNode.scrollLeft = restore.left;
    requestAnimationFrame(() => {
      scrollNode.scrollTop = restore.top;
      scrollNode.scrollLeft = restore.left;
      pendingScrollRestoreRef.current = null;
    });
  });

  const handleResizeChart = (id, newSize) => {
    preserveDashboardScroll(() => {
      setChartSizes(prev => ({ ...prev, [id]: newSize }));
    });
  };

  const handleRotateChart = (id) => {
    preserveDashboardScroll(() => {
      setChartRotations(prev => ({ ...prev, [id]: !prev[id] }));
    });
  };

  const isChartRotated = (id) => Boolean(chartRotations[id]);

  const handleCrossFilter = useCallback((dimension, value) => {
    const cleanVal = String(value || '').trim();
    if (dimension === 'kategori') setCategoryFilter(prev => prev === cleanVal ? 'all' : cleanVal);
    if (dimension === 'channel') setChannelFilter(prev => prev === cleanVal ? 'all' : cleanVal);
    if (dimension === 'cabang') setBranchFilter(prev => prev === cleanVal ? 'all' : cleanVal);
    if (dimension === 'metode') setPaymentFilter(prev => prev === cleanVal ? 'all' : cleanVal);
  }, []);

  const dashboardData = useMemo(() => {
    return computeDashboardAnalytics(processedData, {
      dateFilter,
      trendGranularity,
      categoryFilter,
      channelFilter,
      branchFilter,
      paymentFilter,
    }, { ...dashboardSettings, businessType, metricView });
  }, [processedData, dateFilter, trendGranularity, categoryFilter, channelFilter, branchFilter, paymentFilter, dashboardSettings, businessType, metricView]);

  useEffect(() => {
    if (!dashboardData || processedData.length === 0 || autoLayoutDatasetRef.current === processedData) return;
    const plan = buildAnalystChartPlan(dashboardData, isDemo);
    setChartOrder(plan.order);
    setChartSizes(plan.sizes);
    setHiddenCharts(plan.hidden);
    autoLayoutDatasetRef.current = processedData;
    layoutHydratedRef.current = true;
  }, [dashboardData, processedData, isDemo]);


  // --- VIEWS ---


  // === BACKUP & RESTORE WORKSPACE ===
  const fetchChartTemplates = useCallback(async () => {
    if (isDemo) {
      setChartTemplates([]);
      return;
    }
    if (window.__EXPORTED_DATA__) {
      if (window.__EXPORTED_DATA__.chartTemplates) {
        setChartTemplates(window.__EXPORTED_DATA__.chartTemplates);
      }
      return;
    }
    if (!token) {
      setChartTemplates([]);
      setChartTemplatesError('Sesi login tidak tersedia. Silakan login ulang.');
      return;
    }

    setChartTemplatesLoading(true);
    setChartTemplatesError('');
    try {
      const res = await clientApi.charts(token);
      setChartTemplates((res.charts || []).filter(template => template.status === 'active'));
    } catch (error) {
      setChartTemplates([]);
      setChartTemplatesError(error instanceof Error ? error.message : 'Gagal memuat template visualisasi.');
    } finally {
      setChartTemplatesLoading(false);
    }
  }, [token, isDemo]);

  useEffect(() => {
    fetchChartTemplates();
  }, [fetchChartTemplates]);

  useEffect(() => {
    if (isDemo) {
      setKpiTemplates([]);
      return;
    }
    if (window.__EXPORTED_DATA__) {
      if (window.__EXPORTED_DATA__.kpiTemplates) {
        setKpiTemplates(window.__EXPORTED_DATA__.kpiTemplates);
      }
      return;
    }
    if (!token) return;
    clientApi.getKpiTemplates(token).then(response => setKpiTemplates(response.kpis || [])).catch(() => setKpiTemplates([]));
  }, [token, isDemo]);

  useEffect(() => {
    if (window.__EXPORTED_DATA__) return;
    try { localStorage.setItem('dashinsight_hidden_kpis', JSON.stringify(hiddenKpis)); } catch { }
  }, [hiddenKpis]);

  useEffect(() => {
    localStorage.setItem('dashinsight_show_analysis_summary', String(showAnalysisSummary));
  }, [showAnalysisSummary]);

  useEffect(() => {
    try { localStorage.setItem('dashinsight_chart_mappings', JSON.stringify(chartLibraryMappings)); } catch { }
  }, [chartLibraryMappings]);

  const getMappedColumn = useCallback((template: ChartTemplate, field) => {
    const localMapping = chartLibraryMappings[template.id]?.[field.id];
    if (localMapping && availableDataColumns.includes(localMapping)) return localMapping;
    return availableDataColumns.includes(field.field_label) ? field.field_label : '';
  }, [availableDataColumns, chartLibraryMappings]);

  const updateLocalChartMapping = useCallback((templateId: string, fieldId: string, column: string) => {
    setChartLibraryMappings(current => ({
      ...current,
      [templateId]: { ...current[templateId], [fieldId]: column },
    }));
  }, []);

  // Load workspace on mount to restore data
  useEffect(() => {
    if (processedData.length > 0) return; // already loaded
    const saved = localStorage.getItem('dashinsight_workspace');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.processedData && data.processedData.length > 0) {
          setProcessedData(data.processedData);
          if (data.columnMapping) setColumnMapping(data.columnMapping);
          if (data.dashboardSettings) setDashboardSettings(data.dashboardSettings);
          if (data.businessType) setBusinessType(data.businessType);
          if (data.chartOrder) setChartOrder(data.chartOrder);
          if (data.chartSizes) setChartSizes(data.chartSizes);
          if (data.chartViews) setChartViews(data.chartViews);
          if (data.chartRotations) setChartRotations(data.chartRotations);
          if (data.hiddenCharts) setHiddenCharts(data.hiddenCharts);
          if (data.metricView) setMetricView(data.metricView);
          if (data.dateFilter) setDateFilter(data.dateFilter);
          if (data.trendGranularity) setTrendGranularity(data.trendGranularity);
          if (data.categoryFilter) setCategoryFilter(data.categoryFilter);
          if (data.channelFilter) setChannelFilter(data.channelFilter);
          if (data.branchFilter) setBranchFilter(data.branchFilter);
          if (data.paymentFilter) setPaymentFilter(data.paymentFilter);
          if (data.activeDatasetKey) setActiveDatasetKey(data.activeDatasetKey);
          if (data.datasetHistory) setDatasetHistory(data.datasetHistory);
          setCurrentView('dashboard');
        }
      } catch { }
    }
  }, []);

  // Export workspace with full data payload
  const exportWorkspace = () => {
    if (!processedData.length) return alert('Tidak ada data untuk di-export.');
    const payload = {
      format: 'dashinsight',
      version: 2,
      exportedAt: new Date().toISOString(),
      datasetName: activeDatasetKey || 'workspace',
      data: {
        processedData,
        columnMapping,
        dashboardSettings,
        businessType,
        chartOrder,
        chartSizes,
        chartViews,
        chartRotations,
        hiddenCharts,
        metricView,
        dateFilter,
        trendGranularity,
        categoryFilter,
        channelFilter,
        branchFilter,
        paymentFilter,
        activeDatasetKey,
        datasetHistory,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDatasetKey || 'workspace'}.dashinsight`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Save workspace to localStorage when processedData changes
  useEffect(() => {
    if (processedData.length === 0) return;
    const payload = {
      processedData, columnMapping, dashboardSettings, businessType,
      chartOrder, chartSizes, chartViews, chartRotations, hiddenCharts,
      metricView, activeDatasetKey,
    };
    try { localStorage.setItem('dashinsight_workspace', JSON.stringify(payload)); } catch { }
  }, [processedData, columnMapping, dashboardSettings, businessType, chartOrder, chartSizes, chartViews, chartRotations, hiddenCharts, metricView, activeDatasetKey]);

  const importWorkspace = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.format !== 'dashinsight') return alert('Format file tidak valid.');
        if (data.data?.processedData) {
          const d = data.data;
          setProcessedData(d.processedData);
          if (d.columnMapping) setColumnMapping(d.columnMapping);
          if (d.dashboardSettings) setDashboardSettings(d.dashboardSettings);
          if (d.businessType) setBusinessType(d.businessType);
          if (d.chartOrder) setChartOrder(d.chartOrder);
          if (d.chartSizes) setChartSizes(d.chartSizes);
          if (d.chartViews) setChartViews(d.chartViews);
          if (d.chartRotations) setChartRotations(d.chartRotations);
          if (d.hiddenCharts) setHiddenCharts(d.hiddenCharts);
          if (d.metricView) setMetricView(d.metricView);
          if (d.dateFilter) setDateFilter(d.dateFilter);
          if (d.trendGranularity) setTrendGranularity(d.trendGranularity);
          if (d.categoryFilter) setCategoryFilter(d.categoryFilter);
          if (d.channelFilter) setChannelFilter(d.channelFilter);
          if (d.branchFilter) setBranchFilter(d.branchFilter);
          if (d.paymentFilter) setPaymentFilter(d.paymentFilter);
          if (d.activeDatasetKey) setActiveDatasetKey(d.activeDatasetKey);
          if (d.datasetHistory) setDatasetHistory(d.datasetHistory);
          setCurrentView('dashboard');
          alert('Berhasil import workspace! Semua pengaturan dan filter dipulihkan.');
        } else {
          alert('File workspace tidak memiliki data yang valid.');
        }
      } catch {
        alert('Gagal membaca file. Pastikan file .dashinsight valid.');
      }
    };
    reader.readAsText(file);
  };

  const renderProfil = () => {
    const bizName = client?.business_name || '-';
    const ownerName = client?.owner_name || user?.name || '-';
    const email = user?.email || '-';
    const phone = client?.phone || '-';
    const address = client?.address || '-';
    const bizType = client?.business_type || '-';
    const activeUntil = client?.active_until || '-';
    const createdAt = client?.created_at || '-';
    const initials = bizName !== '-' ? bizName.charAt(0).toUpperCase() : (ownerName !== '-' ? ownerName.charAt(0).toUpperCase() : 'U');

    return (
      <div className="max-w-2xl mx-auto py-8 md:py-12 px-4 md:px-6">
        <div className="text-center space-y-4 mb-10">
          <div className="inline-block bg-[#DCF4E7] text-[#276749] px-3 py-1 rounded-full text-sm font-medium mb-2">
            Profil Saya
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Informasi Akun</h1>
          <p className="text-gray-500 max-w-md mx-auto">Kelola informasi profil dan bisnis Anda.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#276749] to-[#1f533a] p-8 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 ring-4 ring-white/30">
              {initials}
            </div>
            <h2 className="text-xl font-bold text-white">{bizName}</h2>
            <p className="text-white/70 text-sm mt-1">{bizType}</p>
          </div>

          {/* Info Grid */}
          <div className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem label="Nama Pemilik" value={ownerName} />
              <InfoItem label="Email" value={email} />
              <InfoItem label="Telepon" value={phone} />
              <InfoItem label="Jenis Bisnis" value={bizType} />
              <InfoItem label="Alamat" value={address} className="md:col-span-2" />
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Status Langganan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoItem label="Status" value={client?.status === 'active' ? '✅ Aktif' : (client?.status || '-')} />
                <InfoItem label="Aktif Sampai" value={activeUntil !== '-' ? new Date(activeUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'} />
                <InfoItem label="Terdaftar Sejak" value={createdAt !== '-' ? new Date(createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'} />
                <InfoItem label="Role" value={user?.role === 'admin' ? 'Administrator' : 'Klien'} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const InfoItem = ({ label, value, className = '' }: { label: string; value: string; className?: string }) => (
    <div className={className}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-900 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">{value}</p>
    </div>
  );

  const renderSidebar = () => {
    if (isDemo) return null;
    return (
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out flex flex-col print:hidden`}>
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <img src={logoImg} alt="DashInsight Logo" className="h-14 w-auto object-contain" />
            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">Client Panel</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <NavItem icon={<LayoutDashboard />} label="Dashboard" active={currentView === 'dashboard'} onClick={() => { setCurrentView('dashboard'); setSidebarOpen(false); }} />
        <NavItem icon={<Layers />} label="Visualisasi Data" active={currentView === 'chartlib'} onClick={() => { setCurrentView('chartlib'); setSidebarOpen(false); }} />
        <NavItem icon={<FileSpreadsheet />} label="Data Saya" active={currentView === 'data'} onClick={() => { setCurrentView('data'); setSidebarOpen(false); }} />
        <NavItem icon={<Lightbulb />} label="Insight Bisnis" active={currentView === 'insight'} onClick={() => { setCurrentView('insight'); setSidebarOpen(false); }} />
        <NavItem icon={<FileText />} label="Laporan" active={currentView === 'laporan'} onClick={() => { setCurrentView('laporan'); setSidebarOpen(false); }} />
        <NavItem icon={<Settings />} label="Pengaturan" active={currentView === 'pengaturan'} onClick={() => { setCurrentView('pengaturan'); setSidebarOpen(false); }} />
      </nav>
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-2 cursor-pointer hover:bg-gray-50 rounded-lg transition" onClick={() => { setCurrentView('profil'); setSidebarOpen(false); }}>
          <div className="w-8 h-8 bg-[#276749] rounded-full flex items-center justify-center text-white text-xs font-bold">
            {client?.business_name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{client?.business_name || user?.name || 'User'}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email || 'user@dashinsight.id'}</p>
          </div>
        </div>
        {!isDemo && (
          <button onClick={() => { logout(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition">
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        )}
      </div>
    </aside>
    );
  };


  const renderHome = () => (
    <div className="max-w-4xl mx-auto py-8 md:py-12 px-4 md:px-6">
      <div className="text-center space-y-4 mb-12">
        <div className="inline-block bg-[#DCF4E7] text-[#276749] px-3 py-1 rounded-full text-sm font-medium mb-4">
          Selamat datang 
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
          Ubah data penjualanmu menjadi <span className="text-[#276749]">dashboard bisnis</span> dalam beberapa menit.
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Upload file Excel atau CSV, periksa datamu, lalu dapatkan ringkasan penjualan dan insight bisnis otomatis tanpa perlu memahami istilah teknis data analytics.
        </p>
        <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center gap-3 md:gap-4 pt-6">
          <button
            onClick={() => { setWizardStep(1); setCurrentView('wizard'); }}
            className="bg-[#276749] hover:bg-[#1F513A] text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <UploadCloud className="w-5 h-5" />
            Buat Dashboard Baru
          </button>
          <button
            onClick={handleUseDemoData}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <PlayCircle className="w-5 h-5" />
            Lihat Contoh Dashboard
          </button>
          <a
            href={TEMPLATE_WORKBOOK_URL}
            download
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-5 h-5" />
            Download Template Excel
          </a>
          <label className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer">
            <UploadCloud className="w-5 h-5" />
            Import Backup
            <input type="file" accept=".dashinsight,.dsi" onChange={(e) => { const f = e.target.files?.[0]; if (f) importWorkspace(f); e.target.value = ''; }} className="hidden" />
          </label>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-16">
        {[
          { step: '1', title: 'Upload Data', desc: 'Mendukung format CSV dan Excel dari berbagai sistem kasir/POS.' },
          { step: '2', title: 'Periksa & Cocokkan', desc: 'Sistem otomatis mendeteksi kolom. Anda hanya perlu konfirmasi.' },
          { step: '3', title: 'Dapatkan Insight', desc: 'Dashboard interaktif dan rekomendasi bisnis langsung tersedia.' }
        ].map(item => (
          <div key={item.step} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-[#F1FAF5] text-[#276749] rounded-full flex items-center justify-center font-bold text-lg mb-4">
              {item.step}
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
            <p className="text-gray-600 text-sm">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderWizard = () => {
    const visualStep = wizardStep === 25 ? 2.5 : wizardStep;
    return (
      <div className="max-w-3xl mx-auto py-6 md:py-10 px-4 md:px-6">
        {/* Stepper Header */}
        <div className="flex items-center justify-between mb-10 relative">
          <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -z-10 transform -translate-y-1/2 rounded"></div>
          <div className="absolute left-0 top-1/2 h-1 bg-[#276749] -z-10 transform -translate-y-1/2 rounded transition-all" style={{ width: `${((visualStep - 1) / 3) * 100}%` }}></div>

          {['Jenis Bisnis', 'Upload Data', 'Periksa Data', 'Dashboard Siap'].map((label, idx) => (
            <div key={idx} className="flex flex-col items-center bg-[#F8FAF9] px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${visualStep > idx + 1 ? 'bg-[#276749] border-[#276749] text-white' : Math.floor(visualStep) === idx + 1 ? 'bg-white border-[#276749] text-[#276749]' : 'bg-white border-gray-300 text-gray-400'}`}>
                {visualStep > idx + 1 ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
              </div>
              <span className={`text-xs mt-2 font-medium ${visualStep >= idx + 1 ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-8">
          {/* Step 1: Business Type */}
          {wizardStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Apa jenis bisnis Anda?</h2>
                <p className="text-gray-600 mt-2">Ini membantu kami menyiapkan rekomendasi KPI yang tepat.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Retail', 'Kuliner', 'Fashion', 'Online Shop', 'Jasa', 'Lainnya'].map(type => (
                  <button
                    key={type}
                    onClick={() => setBusinessType(type)}
                    className={`p-4 rounded-lg border text-center transition-all ${businessType === type ? 'border-[#276749] bg-[#F1FAF5] text-[#276749] ring-1 ring-[#276749]' : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}
                  >
                    <span className="font-medium block">{type}</span>
                  </button>
                ))}
              </div>
              <div className="pt-6 flex justify-end">
                <button
                  disabled={!businessType}
                  onClick={() => setWizardStep(2)}
                  className="bg-[#276749] disabled:bg-gray-300 text-white px-6 py-2 rounded-md font-medium flex items-center gap-2"
                >
                  Lanjutkan <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Upload Data */}
          {wizardStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Upload Data Penjualan</h2>
                <p className="text-gray-600 mt-2">Format yang didukung: .csv, .xlsx, .xls (Maks 20MB).</p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:bg-gray-50 transition-colors relative">
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-12 h-12 text-[#276749] mx-auto mb-4" />
                <p className="text-gray-900 font-medium text-lg">Tarik file ke sini atau klik untuk memilih file</p>
                <p className="text-gray-500 text-sm mt-1">Mendukung file CSV dan Excel</p>

                <button className="mt-6 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium">
                  Pilih File dari Perangkat
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 pt-4">
                <span className="text-gray-400 text-sm">Atau</span>
                <button onClick={handleUseDemoData} className="text-[#276749] text-sm font-medium hover:underline">
                  Gunakan Data Contoh Saja
                </button>
                <span className="text-gray-300 text-sm">|</span>
                <a href={TEMPLATE_WORKBOOK_URL} download className="text-[#276749] text-sm font-medium hover:underline">
                  Download Template Excel
                </a>
                <span className="text-gray-300 text-sm">|</span>
                <a href={TEMPLATE_DATA_URL} download className="text-[#276749] text-sm font-medium hover:underline">
                  Download Template CSV
                </a>
              </div>
            </div>
          )}

          {/* Step 2.5: Pick Excel Sheet */}
          {wizardStep === 25 && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Pilih Sheet Data</h2>
                <p className="text-gray-600 mt-1">File Excel ini punya beberapa sheet. Pilih sheet transaksi utama yang ingin dianalisis.</p>
              </div>

              <div className="grid gap-3 max-h-[420px] overflow-auto pr-1">
                {availableSheets.map(sheet => (
                  <button
                    key={sheet.name}
                    onClick={() => setSelectedSheetName(sheet.name)}
                    className={`text-left rounded-lg border p-4 transition-all ${selectedSheetName === sheet.name ? 'border-[#276749] bg-[#F1FAF5] ring-1 ring-[#276749]' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">{sheet.name}</h3>
                          {sheet.recommended && <span className="text-xs bg-[#276749] text-white px-2 py-0.5 rounded-full">Direkomendasikan</span>}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {sheet.type} • {sheet.rowCount} baris • {sheet.columnCount} kolom • header baris {sheet.headerRowIndex + 1}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Skor</p>
                        <p className="font-bold text-[#276749]">{sheet.score}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-500">
                      {sheet.headers.slice(0, 6).map(header => (
                        <span key={header} className="bg-white border border-gray-100 rounded px-2 py-1 truncate">{header}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-4 flex justify-between">
                <button onClick={() => setWizardStep(2)} className="text-gray-600 font-medium px-4 py-2 hover:bg-gray-100 rounded-md">
                  Kembali
                </button>
                <button
                  onClick={() => applySelectedSheet(availableSheets.find(sheet => sheet.name === selectedSheetName))}
                  className="bg-[#276749] text-white px-6 py-2 rounded-md font-medium"
                >
                  Gunakan Sheet Ini
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Map Columns */}
          {wizardStep === 3 && (
            <div className="space-y-6">
              <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Periksa & Cocokkan Kolom</h2>
                  <p className="text-gray-600 mt-1">Kami mencoba mencocokkan otomatis. Silakan periksa hasilnya.</p>
                </div>
                <div className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-md">
                  Ditemukan: {rawData.length} baris data
                </div>
              </div>

              <div className="border rounded-lg overflow-x-auto">
                <table className="min-w-[720px] w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-3 font-medium text-gray-600">Nama Kolom di File Anda</th>
                      <th className="p-3 font-medium text-gray-600">Contoh Isi</th>
                      <th className="p-3 font-medium text-gray-600">Dibaca Sebagai (Sistem)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {columnMapping.map((col, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-900">{col.sourceColumn}</td>
                        <td className="p-3 text-gray-500 truncate max-w-[150px]">{col.sampleValues[0] || '-'}</td>
                        <td className="p-3">
                          <select
                            className={`w-full p-2 border rounded-md outline-none focus:ring-2 focus:ring-[#276749] ${col.confidence >= 80 ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
                            value={col.targetField || ''}
                            onChange={(e) => {
                              const selectedField = e.target.value;
                              const newMapping = [...columnMapping];
                              if (selectedField) {
                                newMapping.forEach((item, itemIdx) => {
                                  if (itemIdx !== idx && item.targetField === selectedField) {
                                    item.targetField = null;
                                    item.confidence = 0;
                                  }
                                });
                              }
                              newMapping[idx].targetField = selectedField;
                              setColumnMapping(newMapping);
                            }}
                          >
                            <option value="">-- Jangan Gunakan --</option>
                            {Object.entries(STANDARD_FIELDS).map(([key, label]) => (
                              <option key={key} value={key}>{label}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-6 flex flex-col sm:flex-row gap-3 sm:justify-between">
                <button onClick={() => setWizardStep(2)} className="text-gray-600 font-medium px-4 py-2 hover:bg-gray-100 rounded-md">
                  Kembali
                </button>
                <button onClick={handleProcessMapping} className="bg-[#276749] text-white px-6 py-2 rounded-md font-medium">
                  Konfirmasi & Proses
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Loading / Dashboard Ready */}
          {wizardStep === 4 && (
            <div className="text-center py-10 space-y-6">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Data Berhasil Diproses!</h2>
                <p className="text-gray-600 mt-2">Dashboard {businessType} Anda sudah siap dianalisis.</p>
              </div>
              <div className="pt-4">
                <button onClick={() => setCurrentView('dashboard')} className="bg-[#276749] text-white px-8 py-3 rounded-lg font-bold text-lg shadow-md hover:bg-[#1F513A]">
                  Lihat Dashboard Saya
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const activeEntries = payload.filter(entry => entry.value !== null && entry.value !== undefined);
      if (activeEntries.length === 0) return null;
      return (
        <div className="bg-white p-3 rounded-lg shadow-xl border border-gray-100 min-w-[150px]">
          <p className="text-xs text-gray-500 font-bold mb-2 border-b border-gray-50 pb-2">{label}</p>
          {activeEntries.map((entry, index) => {
            const nameStr = String(entry.name || '').toLowerCase();
            const isCurrency = nameStr === 'omzet' || nameStr.includes('rupiah') || nameStr.includes('sales') || nameStr.includes('omzet');
            const isPercentage = nameStr.includes('%') || nameStr.includes('akumulasi');
            const displayValue = isCurrency ? formatRupiah(entry.value) : isPercentage ? `${Number(entry.value).toFixed(1)}%` : formatNumber(entry.value);
            return (
              <div key={index} className="flex justify-between items-center gap-4 mt-1">
                <span className="text-xs font-medium" style={{ color: entry.color }}>{entry.name}</span>
                <span className="text-sm font-bold text-gray-900">{displayValue}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };


  const exportInteractiveHTML = () => {
    if (!dashboardData) return;
    const { kpis, charts, insights, dimensions, rowStats, dateRange, pareto } = dashboardData;
    const safePayload = JSON.stringify({
      kpis,
      charts,
      insights,
      dimensions,
      rowStats,
      dateRange,
      businessType: businessType || 'Dashboard UMKM',
      rows: processedData,
      settings: { ...dashboardSettings, metricView },
      trendGranularity,
      activeFilters: {
        dateFilter,
        categoryFilter,
        channelFilter,
        branchFilter,
        paymentFilter
      },
      chartOrder,
      chartSizes,
      chartViews,
      hiddenCharts,
      pareto,
      chartTemplates: chartTemplates || [],
      chartLibraryMappings: chartLibraryMappings || {}
    }).replace(/</g, '\\u003c');

    const htmlTemplate = getDashboardExportTemplate(safePayload);

    const blob = new Blob([htmlTemplate], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dashboard_UMKM_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    window.lastGeneratedHTML = htmlTemplate;
  };
  window.exportInteractiveHTML = exportInteractiveHTML;


  const resetDashboardFilters = () => {
    if (!window.confirm('Semua data yang tersimpan akan dihapus. Lanjutkan?')) return;
    // Clear all localStorage data
    localStorage.removeItem('dashinsight_workspace');
    localStorage.removeItem('dashboardSettings');
    localStorage.removeItem('dashinsight_chart_mappings');
    localStorage.removeItem('dashinsight_client_workspace_v1');
    localStorage.removeItem('dashinsight_client_preferences_v1');
    localStorage.removeItem('userColumnMappings');
    localStorage.removeItem('umkm_dataset_history');
    localStorage.removeItem('dashinsight_hidden_kpis');
    localStorage.removeItem('dashinsight_show_analysis_summary');
    // Remove all layout keys
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('dashinsight_layout_') || key.startsWith('umkm_layout_'))) {
        localStorage.removeItem(key);
      }
    }
    window.dispatchEvent(new Event('dashinsight-workspace-change'));
    // Reset all state
    setProcessedData([]);
    setColumnMapping({});
    setActiveDatasetKey('');
    setDashboardSettings(DEFAULT_SETTINGS);
    setChartOrder(DEFAULT_ORDER);
    setChartSizes({});
    setChartViews({});
    setChartRotations({});
    setHiddenCharts([]);
    setDateFilter('all');
    setCategoryFilter('all');
    setChannelFilter('all');
    setBranchFilter('all');
    setPaymentFilter('all');
    // Redirect to home
    setCurrentView('home');
  };

  const FilterSelect = ({ label, value, onChange, options, disabled = false }) => (
    <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-500">
      {label}
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-800 outline-none transition focus:border-[#276749] focus:ring-2 focus:ring-[#DCF4E7] disabled:bg-gray-50 disabled:text-gray-400"
      >
        <option value="all">Semua</option>
        {options.map(option => {
          const labels = {
            '7days': '7 hari terakhir',
            '30days': '30 hari terakhir',
            'mtd': 'Bulan berjalan (MTD)',
            'mom': 'Bulan ke Bulan (MoM)',
            'yoy': 'Tahun ke Tahun (YoY)',
            'ytd': 'Tahun berjalan (YTD)'
          };
          return <option key={option} value={option}>{labels[option] || option}</option>;
        })}
      </select>
    </label>
  );

  const scrollChartHeight = (items, base = 190, perItem = 28) => Math.max(base, (items?.length || 0) * perItem + 52);

  const ScrollChart = ({ items, children, visibleHeight = 220, contentHeight, threshold = 8 }) => {
    const shouldScroll = (items?.length || 0) > threshold;
    return (
      <div className={`w-full overflow-x-hidden pr-1 ${shouldScroll ? 'overflow-y-auto' : 'overflow-y-hidden'}`} style={{ maxHeight: visibleHeight }}>
        <div style={{ height: contentHeight || scrollChartHeight(items) }}>
          {children}
        </div>
      </div>
    );
  };

  const ChartSummary = ({ items, valueKey = 'sales', label = 'item' }) => {
    if (!items || items.length === 0) return null;
    const total = items.reduce((sum, row) => sum + (Number(row[valueKey]) || Number(row.sales) || 0), 0);
    const top = items[0];
    const topValue = Number(top[valueKey]) || Number(top.sales) || 0;
    const topShare = total > 0 ? ((topValue / total) * 100).toFixed(1) : '0.0';
    const topFive = items.slice(0, 5).reduce((sum, row) => sum + (Number(row[valueKey]) || Number(row.sales) || 0), 0);
    const topFiveShare = total > 0 ? ((topFive / total) * 100).toFixed(1) : '0.0';
    return (
      <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
        <div className="rounded-md bg-gray-50 px-2 py-1.5">
          <p className="text-gray-400">Total {label}</p>
          <p className="font-bold text-gray-900">{formatNumber(items.length)}</p>
        </div>
        <div className="rounded-md bg-gray-50 px-2 py-1.5">
          <p className="text-gray-400">Top item</p>
          <p className="font-bold text-gray-900">{topShare}%</p>
        </div>
        <div className="rounded-md bg-gray-50 px-2 py-1.5">
          <p className="text-gray-400">Top 5</p>
          <p className="font-bold text-gray-900">{topFiveShare}%</p>
        </div>
      </div>
    );
  };

  const DataList = ({ items, valueKey = 'sales' }) => {
    if (!items || items.length === 0) return null;
    const isQty = valueKey === 'qty' || valueKey === 'value' && metricView === 'quantity';
    return (
      <details className="mt-2 border-t border-gray-100 pt-2 group">
        <summary className="cursor-pointer list-none flex items-center justify-between text-xs font-bold text-gray-600 hover:text-gray-900">
          <span>Detail lengkap ({formatNumber(items.length)} item)</span>
          <span className="text-gray-400 group-open:rotate-180 transition-transform"></span>
        </summary>
        <div className="mt-2 max-h-44 overflow-auto">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 text-[11px] font-bold text-gray-400 uppercase px-1 pb-1">
            <span>Item</span>
            <span>{isQty ? 'Kuantitas' : 'Omzet'}</span>
            <span>%</span>
          </div>
          {items.map((item, index) => {
            const total = items.reduce((sum, row) => sum + (Number(row[valueKey]) || Number(row.sales) || 0), 0);
            const value = Number(item[valueKey]) || Number(item.sales) || 0;
            const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return (
              <div key={`${item.name}-${index}`} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center text-xs py-1 px-1 border-t border-gray-50 first:border-t-0">
                <span className="truncate text-gray-700" title={item.name}>{index + 1}. {item.name}</span>
                <span className="font-semibold text-gray-900">{isQty ? formatNumber(value) : formatRupiah(value)}</span>
                <span className="text-gray-500">{pct}%</span>
              </div>
            );
          })}
        </div>
      </details>
    );
  };

  const getChartSize = (id, preferred = 4) => {
    let size = chartSizes[id] || preferred;
    if (size === 'standard') size = 4;
    if (size === 'wide' || size === 'half') size = 6;
    if (size === 'full') size = 12;
    return parseInt(size, 10) || 4;
  };

  const getAdaptiveCardStyle = (id, preferred = 4) => {
    const size = getChartSize(id, preferred);
    return {
      '--chart-span': Math.min(size, 12),
    };
  };

  const DataTableCard = ({ id, onHide, title, items, draggable, onDragStart, onDragOver, onDrop }) => {
    if (!items || items.length === 0) return null;
    return (
      <ChartCard id={id} onHide={onHide} onResize={handleResizeChart} preferredSize={12} title={title} subtitle="Detail performa produk secara menyeluruh." style={getAdaptiveCardStyle(id, 12)} draggable={draggable} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}>
        <div className="flex-grow min-h-[240px] max-h-[420px] overflow-x-auto overflow-y-auto w-full mt-2 border border-gray-100 rounded-lg shadow-sm">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="text-[10px] text-gray-500 uppercase tracking-wider sticky top-0 z-10 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2.5 font-bold bg-gray-50 text-gray-600">Item</th>
                <th className="px-4 py-2.5 font-bold text-right bg-gray-50 text-gray-600">Omzet</th>
                <th className="px-4 py-2.5 font-bold text-right bg-gray-50 text-gray-600">Transaksi</th>
                <th className="px-4 py-2.5 font-bold text-right bg-gray-50 text-gray-600">Qty Terjual</th>
                <th className="px-4 py-2.5 font-bold text-right bg-gray-50 text-gray-600">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors odd:bg-white even:bg-gray-50/30">
                  <td className="px-4 py-2.5 text-gray-900 font-semibold truncate max-w-[220px]" title={item.name}>{item.name}</td>
                  <td className="px-4 py-2.5 text-right text-gray-800 font-bold">{formatRupiah(item.sales)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-600 font-medium">{formatNumber(item.transactions)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-600 font-medium">{formatNumber(item.qty)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-900 font-bold">{formatRupiah(item.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    );
  };

  const getRecommendedChartView = ({ id, items, composition = false }) => {
    const count = items?.length || 0;
    if (count <= 1) return 'bar';

    if (['channelSales', 'paymentMethods'].includes(id)) {
      return count <= 7 ? 'pie' : 'treemap';
    }

    if (['categorySales', 'brandSales', 'supplierSales', 'citySales'].includes(id)) {
      if (count <= 6) return 'pie';
      return 'treemap';
    }

    if (['staffSales', 'branchSales', 'serviceDuration'].includes(id)) {
      return count >= 3 && count <= 8 ? 'radar' : 'bar';
    }

    if (id === 'topProducts') {
      return count > 14 ? 'treemap' : 'bar';
    }

    if (composition) {
      return count <= 6 ? 'pie' : 'treemap';
    }

    return 'bar';
  };

  const DynamicBreakdownCard = ({
    id,
    title,
    subtitle,
    items,
    color,
    label,
    valueKey = 'sales',
    preferred = 'standard',
    composition = false,
    viewType = 'auto',
    onViewTypeChange,
    onHide,
    draggable,
    onDragStart,
    onDragOver,
    onDrop,
    extraAction = null,
  }) => {
    if (!items || items.length === 0) return null;

    let currentView = viewType;
    if (viewType === 'auto') {
      currentView = getRecommendedChartView({ id, items, composition });
    }
    const setCardViewType = (nextView) => {
      if (onViewTypeChange) onViewTypeChange(id, nextView);
    };

    const treemapData = [{ name: title, children: items.map(item => ({ name: item.name, size: Number(item[valueKey]) || 0 })) }];
    const radarData = items.slice(0, 8);
    const rotated = isChartRotated(id);
    const canRotate = currentView === 'bar';

    return (
      <ChartCard
        id={id}
        onHide={onHide}
        onResize={handleResizeChart}
        preferredSize={preferred}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        draggable={draggable}
        title={title}
        subtitle={subtitle}
        style={getAdaptiveCardStyle(id, preferred)}
        action={
          <div className="flex bg-gray-100 p-0.5 rounded-md border border-gray-200">
            <button type="button" onClick={() => setCardViewType('auto')} className={`px-1.5 py-1 rounded-sm text-[10px] font-bold ${viewType === 'auto' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`} title="Auto pilih chart">Auto</button>
            <button type="button" onClick={() => setCardViewType('bar')} className={`p-1 rounded-sm ${currentView === 'bar' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`} title="Bar Chart"><BarChart3 className="w-4 h-4" /></button>
            <button type="button" onClick={() => setCardViewType('pie')} className={`p-1 rounded-sm ${currentView === 'pie' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`} title="Donut Chart"><PieChartIcon className="w-4 h-4" /></button>
            <button type="button" onClick={() => setCardViewType('treemap')} className={`p-1 rounded-sm ${currentView === 'treemap' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`} title="Treemap Chart"><LayoutGrid className="w-4 h-4" /></button>
            <button type="button" onClick={() => setCardViewType('radar')} className={`p-1 rounded-sm ${currentView === 'radar' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`} title="Radar Chart"><RadarIcon className="w-4 h-4" /></button>
            {canRotate && (
              <button
                type="button"
                onClick={() => handleRotateChart(id)}
                className={`p-1 rounded-sm ${rotated ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                title={rotated ? 'Putar ke horizontal' : 'Putar ke vertikal'}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            {extraAction}
          </div>
        }
      >
        <ChartSummary items={items} valueKey={valueKey} label={label} />

        {currentView === 'pie' && (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={items}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={86}
                paddingAngle={4}
                dataKey={valueKey}
                onClick={(data) => {
                  if (data && data.name && ['kategori', 'channel', 'cabang', 'metode'].includes(label)) {
                    handleCrossFilter(label, data.name);
                  }
                }}
                style={{ cursor: ['kategori', 'channel', 'cabang', 'metode'].includes(label) ? 'pointer' : 'default' }}
              >
                {items.map((entry, index) => (
                  <Cell
                    key={`${title}-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    style={{ cursor: ['kategori', 'channel', 'cabang', 'metode'].includes(label) ? 'pointer' : 'default' }}
                  />
                ))}
              </Pie>
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <RechartsTooltip formatter={(val) => valueKey === 'qty' || valueKey === 'value' && metricView === 'quantity' ? formatNumber(val) : formatRupiah(val)} />
            </PieChart>
          </ResponsiveContainer>
        )}

        {currentView === 'treemap' && (
          <ResponsiveContainer width="100%" height={220}>
            <Treemap
              data={treemapData}
              dataKey="size"
              stroke="#fff"
              fill={color}
              onClick={(data) => {
                if (data && data.name && ['kategori', 'channel', 'cabang', 'metode'].includes(label)) {
                  handleCrossFilter(label, data.name);
                }
              }}
              style={{ cursor: ['kategori', 'channel', 'cabang', 'metode'].includes(label) ? 'pointer' : 'default' }}
            >
              <RechartsTooltip formatter={(val) => valueKey === 'qty' || valueKey === 'value' && metricView === 'quantity' ? formatNumber(val) : formatRupiah(val)} />
            </Treemap>
          </ResponsiveContainer>
        )}

        {currentView === 'radar' && (
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart
              cx="50%"
              cy="50%"
              outerRadius={80}
              data={radarData}
              onClick={(data) => {
                if (data && data.activeLabel && ['kategori', 'channel', 'cabang', 'metode'].includes(label)) {
                  handleCrossFilter(label, data.activeLabel);
                }
              }}
              style={{ cursor: ['kategori', 'channel', 'cabang', 'metode'].includes(label) ? 'pointer' : 'default' }}
            >
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: '#667085' }} />
              <PolarRadiusAxis tick={false} axisLine={false} />
              <Radar name={metricView === 'quantity' ? 'Kuantitas' : 'Omzet'} dataKey={valueKey} stroke={color} fill={color} fillOpacity={0.5} />
              <RechartsTooltip formatter={(val) => valueKey === 'qty' || valueKey === 'value' && metricView === 'quantity' ? formatNumber(val) : formatRupiah(val)} />
            </RadarChart>
          </ResponsiveContainer>
        )}

        {currentView === 'bar' && (
          rotated ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={items.slice(0, 16)}
                margin={{ top: 10, right: 10, left: 0, bottom: 64 }}
                onClick={(data) => {
                  if (data && data.activeLabel && ['kategori', 'channel', 'cabang', 'metode'].includes(label)) {
                    handleCrossFilter(label, data.activeLabel);
                  }
                }}
                style={{ cursor: ['kategori', 'channel', 'cabang', 'metode'].includes(label) ? 'pointer' : 'default' }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECEF" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} angle={-35} textAnchor="end" height={64} interval={0} />
                <YAxis tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} width={58} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#F4F7F6' }} />
                <Bar dataKey={valueKey} name={metricView === 'quantity' ? 'Kuantitas' : 'Omzet'} fill={color} radius={[6, 6, 0, 0]} barSize={18}>
                  {items.slice(0, 16).map((entry, index) => (
                    <Cell
                      key={`bar-rotated-${index}`}
                      style={{ cursor: ['kategori', 'channel', 'cabang', 'metode'].includes(label) ? 'pointer' : 'default' }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ScrollChart items={items} visibleHeight={210} contentHeight={scrollChartHeight(items, 170, 26)}>
              <ResponsiveContainer width="100%" height={scrollChartHeight(items, 170, 26)}>
                <BarChart
                  data={items}
                  layout="vertical"
                  margin={{ left: 10, right: 20 }}
                  onClick={(data) => {
                    if (data && data.activeLabel && ['kategori', 'channel', 'cabang', 'metode'].includes(label)) {
                      handleCrossFilter(label, data.activeLabel);
                    }
                  }}
                  style={{ cursor: ['kategori', 'channel', 'cabang', 'metode'].includes(label) ? 'pointer' : 'default' }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8ECEF" />
                  <XAxis type="number" tickFormatter={shortCurrency} tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={122} tick={{ fontSize: 12, fill: '#344054' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#F4F7F6' }} />
                  <Bar dataKey={valueKey} name={metricView === 'quantity' ? 'Kuantitas' : 'Omzet'} fill={color} radius={[0, 6, 6, 0]} barSize={18}>
                    {items.map((entry, index) => (
                      <Cell
                        key={`bar-${index}`}
                        style={{ cursor: ['kategori', 'channel', 'cabang', 'metode'].includes(label) ? 'pointer' : 'default' }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ScrollChart>
          )
        )}
        <DataList items={items} valueKey={valueKey} />
      </ChartCard>
    );
  };

  // - - €- - €- - € DynamicCrossCard - - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €
  // Komponen untuk grafik multi-dimensi (data pivot dengan beberapa series).
  // Mendukung 5 varian tampilan: stackedBar, groupedBar, multiLine, multiArea, multiRadar.
  const DynamicCrossCard = ({
    id,
    title,
    subtitle,
    data,           // array of pivot rows, e.g. [{name, Cat1, Cat2, ...}]
    categories,     // string[]  -  series keys (e.g. ['Makanan', 'Minuman'])
    preferred = 6,
    defaultView = 'stackedBar',
    viewType = 'auto',
    onViewTypeChange,
    onHide,
    draggable,
    onDragStart,
    onDragOver,
    onDrop,
  }) => {
    if (!data || data.length === 0 || !categories || categories.length === 0) return null;

    // resolve 'auto' -† sensible default based on data characteristics
    const resolvedView = viewType === 'auto' ? defaultView : viewType;
    const rotated = isChartRotated(id);
    const canRotate = resolvedView === 'stackedBar' || resolvedView === 'groupedBar';

    const setView = (next) => { if (onViewTypeChange) onViewTypeChange(id, next); };
    const categoryTotals = categories.map(cat => ({
      name: cat,
      total: data.reduce((sum, row) => sum + (Number(row[cat]) || 0), 0),
    })).sort((a, b) => b.total - a.total);
    const primaryCategories = categoryTotals.slice(0, 8).map(item => item.name);
    const omittedCategories = categoryTotals.slice(8).map(item => item.name);
    const chartCategories = omittedCategories.length ? [...primaryCategories, 'Lainnya'] : primaryCategories;
    const chartData = omittedCategories.length
      ? data.map(row => ({
        ...row,
        Lainnya: omittedCategories.reduce((sum, cat) => sum + (Number(row[cat]) || 0), 0),
      }))
      : data;

    const CROSS_VIEWS = [
      { key: 'stackedBar', label: 'Stacked', Icon: BarChart3, title: 'Stacked Bar  -  total + proporsi' },
      { key: 'groupedBar', label: 'Grouped', Icon: LayoutGrid, title: 'Grouped Bar  -  perbandingan head-to-head' },
      { key: 'multiLine', label: 'Line', Icon: Activity, title: 'Multi-Line  -  tren tiap kategori' },
      { key: 'multiArea', label: 'Area', Icon: TrendingUp, title: 'Multi-Area  -  volume berlapis' },
      { key: 'multiRadar', label: 'Radar', Icon: RadarIcon, title: 'Multi-Radar  -  keseimbangan antar dimensi' },
    ];

    const H = 300;

    return (
      <ChartCard
        id={id}
        onHide={onHide}
        onResize={handleResizeChart}
        preferredSize={preferred}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        draggable={draggable}
        title={title}
        subtitle={subtitle}
        style={getAdaptiveCardStyle(id, preferred)}
        action={
          <div className="flex bg-gray-100 p-0.5 rounded-md border border-gray-200 gap-0.5">
            {CROSS_VIEWS.map(({ key, label, Icon, title: tip }) => (
              <button
                type="button"
                key={key}
                onClick={() => setView(key)}
                title={tip}
                className={`flex items-center gap-1 px-1.5 py-1 rounded-sm text-[10px] font-semibold transition-all
                  ${resolvedView === key
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
            {canRotate && (
              <button
                type="button"
                onClick={() => handleRotateChart(id)}
                className={`flex items-center gap-1 px-1.5 py-1 rounded-sm text-[10px] font-semibold transition-all ${rotated ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                title={rotated ? 'Putar ke horizontal' : 'Putar ke vertikal'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Putar</span>
              </button>
            )}
          </div>
        }
      >
        {omittedCategories.length > 0 && (
          <p className="mb-2 text-[11px] font-medium text-gray-500">
            Menampilkan {primaryCategories.length} series terbesar; {omittedCategories.length} lainnya digabung sebagai "Lainnya".
          </p>
        )}
        {/* - - €- - € Stacked Bar (horizontal) - - €- - € */}
        {resolvedView === 'stackedBar' && (
          <ResponsiveContainer width="100%" height={H} minWidth={1} minHeight={1}>
            <BarChart data={chartData} layout={rotated ? undefined : 'vertical'} margin={rotated ? { left: 0, right: 20, top: 4, bottom: 62 } : { left: 10, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={!rotated} vertical={rotated} stroke="#E8ECEF" />
              {rotated ? (
                <>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} angle={-35} textAnchor="end" height={62} interval={0} />
                  <YAxis tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} width={62} axisLine={false} tickLine={false} />
                </>
              ) : (
                <>
                  <XAxis type="number" tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#344054' }} axisLine={false} tickLine={false} />
                </>
              )}
              <RechartsTooltip formatter={(val) => formatRupiah(val)} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              {chartCategories.map((cat, idx) => (
                <Bar key={cat} dataKey={cat} stackId="s" fill={CHART_COLORS[idx % CHART_COLORS.length]} radius={idx === chartCategories.length - 1 ? (rotated ? [4, 4, 0, 0] : [0, 4, 4, 0]) : undefined} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* - - €- - € Grouped Bar (horizontal) - - €- - € */}
        {resolvedView === 'groupedBar' && (
          <ResponsiveContainer width="100%" height={H} minWidth={1} minHeight={1}>
            <BarChart data={chartData} layout={rotated ? undefined : 'vertical'} margin={rotated ? { left: 0, right: 20, top: 4, bottom: 62 } : { left: 10, right: 20, top: 4, bottom: 4 }} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" horizontal={!rotated} vertical={rotated} stroke="#E8ECEF" />
              {rotated ? (
                <>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} angle={-35} textAnchor="end" height={62} interval={0} />
                  <YAxis tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} width={62} axisLine={false} tickLine={false} />
                </>
              ) : (
                <>
                  <XAxis type="number" tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#344054' }} axisLine={false} tickLine={false} />
                </>
              )}
              <RechartsTooltip formatter={(val) => formatRupiah(val)} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              {chartCategories.map((cat, idx) => (
                <Bar key={cat} dataKey={cat} fill={CHART_COLORS[idx % CHART_COLORS.length]} radius={rotated ? [4, 4, 0, 0] : [0, 4, 4, 0]} barSize={12} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* - - €- - € Multi-Line - - €- - € */}
        {resolvedView === 'multiLine' && (
          <ResponsiveContainer width="100%" height={H} minWidth={1} minHeight={1}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECEF" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} minTickGap={20} />
              <YAxis tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} width={62} axisLine={false} tickLine={false} />
              <RechartsTooltip formatter={(val) => formatRupiah(val)} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              {chartCategories.map((cat, idx) => (
                <Line key={cat} type="monotone" dataKey={cat} stroke={CHART_COLORS[idx % CHART_COLORS.length]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* - - €- - € Multi-Area (stacked) - - €- - € */}
        {resolvedView === 'multiArea' && (
          <ResponsiveContainer width="100%" height={H} minWidth={1} minHeight={1}>
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 4 }}>
              <defs>
                {chartCategories.map((cat, idx) => (
                  <linearGradient key={cat} id={`grad-${id}-${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity={0.55} />
                    <stop offset="95%" stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity={0.05} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECEF" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} minTickGap={20} />
              <YAxis tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} width={62} axisLine={false} tickLine={false} />
              <RechartsTooltip formatter={(val) => formatRupiah(val)} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              {chartCategories.map((cat, idx) => (
                <Area
                  key={cat}
                  type="monotone"
                  dataKey={cat}
                  stackId="a"
                  stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                  fill={`url(#grad-${id}-${idx})`}
                  strokeWidth={1.5}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* - - €- - € Multi-Radar - - €- - € */}
        {resolvedView === 'multiRadar' && (
          <ResponsiveContainer width="100%" height={H} minWidth={1} minHeight={1}>
            <RadarChart cx="50%" cy="50%" outerRadius="38%" data={chartData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: '#667085' }} />
              <PolarRadiusAxis tick={false} axisLine={false} tickFormatter={shortCurrency} />
              {chartCategories.map((cat, idx) => (
                <Radar
                  key={cat}
                  name={cat}
                  dataKey={cat}
                  stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                  fill={CHART_COLORS[idx % CHART_COLORS.length]}
                  fillOpacity={0.22}
                  strokeWidth={1.5}
                />
              ))}
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
              <RechartsTooltip formatter={(val) => formatRupiah(val)} />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    );
  };
  // - - €- - €- - € end DynamicCrossCard - - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €

  // - - €- - €- - € ViewToggle helper - - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €
  // Tombol toggle kecil yang reusable. Menerima onSelect callback agar bisa dipakai
  // baik di dalam maupun di luar renderDashboard.
  const ViewToggle = ({ id, views, current, onSelect }) => (
    <div className="flex bg-gray-100 p-0.5 rounded-md border border-gray-200 gap-0.5">
      {views.map(({ key, Icon, label, tip }) => (
        <button
          type="button"
          key={key}
          onClick={(e) => {
            e.preventDefault();
            onSelect(id, key);
          }}
          title={tip || label}
          className={`flex items-center gap-1 px-1.5 py-1 rounded-sm text-[10px] font-semibold transition-all
            ${current === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
  // - - €- - €- - € end ViewToggle - - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €

  // - - €- - €- - € IndonesiaMapChart is now defined globally at module level - - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €

  const renderDashboard = () => {
    if (!processedData.length) return renderHome();
    if (!dashboardData) return <div>Memuat data...</div>;
    const { kpis, charts, insights, filters, dimensions, rowStats, dateRange, activeFilterCount, dataHealth, pareto, businessProfile, executiveSummary, customerSegments, productQuadrants } = dashboardData;
    const chartCopy = buildChartCopy(dashboardData);

    const hasVisibleEksplorasi = chartOrder.some(id => {
      if (hiddenCharts.includes(id)) return false;
      if (id === 'pareto' && pareto.products.items.length === 0) return false;
      if (id === 'topProducts' && !dimensions.product) return false;
      if (id === 'dataTable' && !dimensions.product) return false;
      if (id === 'staffSales' && !dimensions.staff) return false;
      if (id === 'brandSales' && !dimensions.brand) return false;
      if (id === 'supplierSales' && !dimensions.supplier) return false;
      if (id === 'categorySales' && !dimensions.category) return false;
      if (id === 'channelSales' && !dimensions.channel) return false;
      if (id === 'branchSales' && !dimensions.branch) return false;
      if (id === 'paymentMethods' && !dimensions.paymentMethod) return false;
      if (id === 'serviceDuration' && !dimensions.duration) return false;
      if (id === 'weekdaySales' && (!dimensions.date || charts.weekdaySales.length === 0)) return false;
      if (id === 'citySales' && !dimensions.city) return false;
      if (id === 'hourlySales' && (!dimensions.time || charts.hourlySales.length === 0)) return false;
      if (id === 'basketSize' && charts.basketSize.length === 0) return false;
      if (id === 'productMatrix' && charts.productMatrix.length === 0) return false;
      if (id === 'crossCategoryBranch' && charts.crossCategoryBranch.length === 0) return false;
      if (id === 'crossTimeCategory' && charts.crossTimeCategory.length === 0) return false;
      if (id === 'discount' && charts.discountEffectiveness.length === 0) return false;
      if (id === 'crossChannelCategory' && charts.crossChannelCategory?.length === 0) return false;
      if (id === 'crossPaymentChannel' && charts.crossPaymentChannel?.length === 0) return false;
      if (id === 'crossStaffCategory' && charts.crossStaffCategory?.length === 0) return false;
      if (id === 'channelEfficiency' && charts.channelEfficiency?.length === 0) return false;
      if (id === 'categoryProfitability' && charts.categoryProfitability?.length === 0) return false;
      return true;
    });

    const handleHideChart = (id) => {
      preserveDashboardScroll(() => {
        setHiddenCharts(prev => prev.includes(id) ? prev : [...prev, id]);
      });
    };
    const handleRestoreChart = (id) => {
      preserveDashboardScroll(() => {
        setHiddenCharts(prev => prev.filter(c => c !== id));
      });
    };
    const handleChartViewChange = (id, nextView) => {
      preserveDashboardScroll(() => {
        setChartViews(prev => ({ ...prev, [id]: nextView }));
      });
    };

    const handleDragStart = (e, id) => {
      setDraggedChart(id);
      e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, targetId) => {
      e.preventDefault();
      if (!draggedChart || draggedChart === targetId) return;

      // Build full order including custom chart IDs with library: prefix
      const customIds = customChartTemplates.map(t => `library:${t.id}`).filter(id => !chartOrder.includes(id));
      const fullOrder = [...chartOrder, ...customIds];
      const newOrder = [...fullOrder];
      const draggedIdx = newOrder.indexOf(draggedChart);
      const targetIdx = newOrder.indexOf(targetId);

      if (draggedIdx === -1 || targetIdx === -1) return;

      newOrder.splice(draggedIdx, 1);
      newOrder.splice(targetIdx, 0, draggedChart);

      preserveDashboardScroll(() => {
        setChartOrder(newOrder);
      });
      setDraggedChart(null);
    };

    const kpiIconMap = { TrendingUp, ShoppingBag, Target, Activity, Package, Users, Tag, Truck, Award, FileText };
    const canonicalMappings = Object.fromEntries(availableDataColumns.map(column => [column, column]));
    const resolveKpiValue = (template: KpiTemplate) => {
      const knownValues = {
        TOTAL_REVENUE: kpis.totalOmzet,
        NET_REVENUE: kpis.netRevenue,
        TOTAL_TRANSACTIONS: kpis.totalTransaksi,
        AOV: kpis.avgTransaksi,
        PROFIT_MARGIN: kpis.profitMargin,
        GROSS_PROFIT: kpis.totalProfit,
        TOTAL_DISCOUNT: kpis.totalDiskon,
        TOTAL_SHIPPING: kpis.totalOngkir,
        TOTAL_COMMISSION: kpis.totalCommission,
        TOTAL_TAX: kpis.totalTax,
        TOTAL_SERVICE_CHARGE: kpis.totalServiceCharge,
        TOTAL_PLATFORM_FEE: kpis.totalPlatformFee,
        AVERAGE_RATING: kpis.avgRating,
        TOTAL_UNITS: kpis.produkTerjual,
        TOTAL_CUSTOMERS: kpis.jumlahPelanggan,
        DATA_ROWS: rowStats.filteredRows,
      };
      if (knownValues[template.kpi_code] !== undefined) return knownValues[template.kpi_code];
      return calculateKPI(template.formula_template, processedData, canonicalMappings).value;
    };
    const formatKpiValue = (template: KpiTemplate, value: number) => {
      if (template.display_format === 'currency') return formatRupiah(value);
      if (template.display_format === 'percent') return `${value.toFixed(1)}%`;
      return formatNumber(value);
    };
    const collectKpiFields = (value, result = new Set()) => {
      if (!value || typeof value !== 'object') return result;
      if (Array.isArray(value)) { value.forEach(item => collectKpiFields(item, result)); return result; }
      if (typeof value.field === 'string') result.add(value.field);
      Object.values(value).forEach(item => collectKpiFields(item, result));
      return result;
    };
    const availableKpiTemplates = kpiTemplates.filter(template => {
      const fields = [...collectKpiFields(template.formula_template?.formula_json)];
      return fields.length === 0 || fields.every(field => availableDataColumns.includes(field));
    });

    return (
      <div className="min-h-screen p-3 md:p-4 xl:p-5 print:p-0" style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 40%, #ecfdf5 100%)' }}>
        <div className="max-w-[1440px] mx-auto space-y-3">
          {/* Header Hijau */}
          <div className="bg-gradient-to-r from-[#276749] to-[#1f533a] rounded-xl p-4 shadow-lg">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between print:mb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-white/20 text-white px-3 py-1">{businessType || 'Dashboard Demo'}</span>
                  <span className="rounded-full bg-white/20 text-white px-3 py-1">
                    {dateRange ? `${dateRange.start} - ${dateRange.end}` : 'Periode tidak tersedia'}
                  </span>
                </div>
                <h1 className="mt-2 text-2xl md:text-3xl font-bold text-white tracking-tight">Dashboard Analitik Penjualan</h1>
                <p className="mt-1 text-sm text-white/80">
                  Menganalisis {formatNumber(rowStats.filteredRows)} dari {formatNumber(rowStats.totalRows)} baris data.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <div className="flex bg-white/10 p-0.5 rounded-md border border-white/20 items-center">
                  <button
                    onClick={() => setMetricView('revenue')}
                    className={`h-7 px-2.5 rounded text-[11px] font-bold transition-all flex items-center ${metricView === 'revenue' ? 'bg-white text-[#276749] shadow-sm' : 'text-white/70 hover:text-white'
                      }`}
                  >
                    Omzet (Rp)
                  </button>
                  <button
                    onClick={() => setMetricView('quantity')}
                    className={`h-7 px-2.5 rounded text-[11px] font-bold transition-all flex items-center ${metricView === 'quantity' ? 'bg-white text-[#276749] shadow-sm' : 'text-white/70 hover:text-white'
                      }`}
                  >
                    Kuantitas (Qty)
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAnalysisSummary(value => !value)}
                  aria-pressed={showAnalysisSummary}
                  className={`h-8 rounded-md border px-2.5 text-xs font-semibold flex items-center gap-1.5 transition ${showAnalysisSummary ? 'border-white bg-white text-[#276749]' : 'border-white/20 bg-white/10 text-white hover:bg-white/20'}`}
                  title={showAnalysisSummary ? 'Sembunyikan ringkasan analisis' : 'Tampilkan ringkasan analisis'}
                >
                  <Lightbulb className="h-3.5 w-3.5" /> Ringkasan
                </button>
                {!isDemo && (
                  <>
                    <button
                      onClick={resetDashboardFilters}
                      className="h-8 rounded-md bg-white/10 border border-white/20 px-2.5 text-xs font-semibold text-white flex items-center gap-1.5 hover:bg-white/20"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </button>
                    <button className="h-8 bg-white text-[#276749] px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 hover:bg-gray-50 shadow-sm" onClick={exportInteractiveHTML}>
                      <Download className="w-3.5 h-3.5" /> Export
                    </button>
                    <label className="h-8 cursor-pointer rounded-md border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white flex items-center gap-1.5 hover:bg-white/20 transition">
                      <UploadCloud className="w-3.5 h-3.5" /> Import
                      <input type="file" accept=".dashinsight,.dsi" onChange={(e) => { const file = e.target.files?.[0]; if (file) importWorkspace(file); e.target.value = ''; }} className="hidden" />
                    </label>
                    <button className="h-8 bg-white/10 border border-white/20 text-white px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 hover:bg-white/20 transition" onClick={exportWorkspace}>
                      Backup
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <section className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 print:hidden">
            <div className="grid gap-4 xl:grid-cols-[220px_1fr] xl:items-end">
              <div className="pb-0.5">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <Filter className="w-4 h-4 text-[#276749]" />
                  Filter Analisis
                  {activeFilterCount > 0 && <span className="rounded-full bg-[#F1FAF5] px-2 py-0.5 text-xs text-[#276749]">{activeFilterCount} aktif</span>}
                </div>
                <p className="mt-1 text-xs text-gray-500">Filter muncul sesuai kolom yang tersedia dari file upload.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {dimensions.date && <div className="flex-1 min-w-[140px]"><FilterSelect label="Periode" value={dateFilter} onChange={setDateFilter} options={['7days', '30days', 'mtd', 'mom', 'yoy', 'ytd']} /></div>}
                {filters.categories?.length > 0 && <div className="flex-1 min-w-[140px]"><FilterSelect label="Kategori" value={categoryFilter} onChange={setCategoryFilter} options={filters.categories} /></div>}
                {filters.channels?.length > 0 && <div className="flex-1 min-w-[140px]"><FilterSelect label="Channel" value={channelFilter} onChange={setChannelFilter} options={filters.channels} /></div>}
                {filters.branches?.length > 0 && <div className="flex-1 min-w-[140px]"><FilterSelect label="Cabang" value={branchFilter} onChange={setBranchFilter} options={filters.branches} /></div>}
                {filters.payments?.length > 0 && <div className="flex-1 min-w-[140px]"><FilterSelect label="Pembayaran" value={paymentFilter} onChange={setPaymentFilter} options={filters.payments} /></div>}
              </div>
            </div>
          </section>

          {showAnalysisSummary && <section>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-950">Ringkasan Analisis</h2>
                  <p className="mt-1 text-sm text-gray-600">Temuan utama yang dihitung dari dataset dan filter aktif.</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {businessProfile.focus.map(item => (
                      <span key={item} className="rounded-md border border-[#DCF4E7] bg-[#F8FCFA] px-2.5 py-1 text-xs font-semibold text-[#276749]">{item}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span style={{ borderRadius: 99, padding: '4px 14px', fontSize: 12, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg, #059669, #047857)', boxShadow: '0 2px 4px rgba(5,150,105,0.3)' }}>{businessProfile.type}</span>
                  <span style={{ borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 700, background: dataHealth.score >= 80 ? '#d1fae5' : dataHealth.score >= 50 ? '#fef3c7' : '#ffe4e6', color: dataHealth.score >= 80 ? '#15803d' : dataHealth.score >= 50 ? '#92400e' : '#be123c' }}>Data Health {dataHealth.score}/100</span>
                </div>
              </div>
              <div className="mt-4 border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-bold text-gray-900">Temuan Utama</h3>
                  </div>
                  <span className="text-xs font-semibold text-gray-400">{formatNumber(insights.length)} findings</span>
                </div>
                <div className="mt-2 grid gap-2 lg:grid-cols-3">
                  {insights.filter(item => item.finding || item.text).slice(0, 4).map((item, idx) => (
                    <div key={idx} className="p-3" style={{ borderRadius: '10px', border: '1px solid #d1fae5', background: 'linear-gradient(135deg, #ffffff, #ecfdf5)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-gray-400">Temuan {idx + 1}</p>
                          <p className="truncate text-sm font-bold text-gray-950" title={item.title}>{item.title}</p>
                        </div>
                        <span className="rounded-full bg-[#DCF4E7] px-2 py-0.5 text-[10px] font-bold uppercase text-[#276749]">
                          {item.type === 'warning' ? 'Watch' : 'OK'}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-600">{item.finding || item.text}</p>
                      <p className="mt-2 border-t border-[#DCF4E7] pt-2 text-xs font-semibold text-[#276749]">{item.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>}


          <section className="bg-[#276749] rounded-xl p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between gap-3 text-white print:hidden">
              <div>
                <h2 className="text-sm font-bold">KPI Dashboard</h2>
                <p className="text-xs text-white/70">
                  {isDemo ? 'Indikator kinerja utama bisnis UMKM.' : 'Dikelola admin, pilihan tampilan tersimpan lokal.'}
                </p>
              </div>
              {!isDemo && (
                <button type="button" onClick={() => setShowKpiManager(value => !value)} className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/20"><Settings className="h-4 w-4" /> Kelola KPI</button>
              )}
            </div>
            {showKpiManager && <div className="mb-3 flex flex-wrap gap-2 rounded-lg bg-white/10 p-3 print:hidden">{availableKpiTemplates.map(template => { const hidden = hiddenKpis.includes(template.id); return <button key={template.id} type="button" onClick={() => setHiddenKpis(current => hidden ? current.filter(id => id !== template.id) : [...current, template.id])} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${hidden ? 'bg-white/10 text-white/50 hover:bg-white/20' : 'bg-white text-[#276749]'}`}>{hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}{template.kpi_name}</button>; })}</div>}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-2.5 auto-rows-fr">
              {availableKpiTemplates.filter(template => !hiddenKpis.includes(template.id)).map(template => {
                const Icon = kpiIconMap[template.icon] || Activity;
                const value = resolveKpiValue(template);
                const growthMap = {
                  TOTAL_REVENUE: kpis.growth?.omzet,
                  NET_REVENUE: kpis.growth?.retur,
                  TOTAL_TRANSACTIONS: kpis.growth?.transaksi,
                  AOV: kpis.growth?.aov,
                  PROFIT_MARGIN: kpis.growth?.profit,
                  GROSS_PROFIT: kpis.growth?.profit,
                  TOTAL_DISCOUNT: kpis.growth?.diskon,
                  TOTAL_SHIPPING: kpis.growth?.ongkir,
                  TOTAL_COMMISSION: kpis.growth?.commission,
                  TOTAL_TAX: kpis.growth?.tax,
                  TOTAL_SERVICE_CHARGE: kpis.growth?.serviceCharge,
                  TOTAL_PLATFORM_FEE: kpis.growth?.platformFee,
                  AVERAGE_RATING: kpis.growth?.rating,
                  TOTAL_UNITS: kpis.growth?.qty,
                  TOTAL_CUSTOMERS: kpis.growth?.customers,
                  DATA_ROWS: null,
                };
                const growthVal = growthMap[template.kpi_code] ?? null;
                const growthLabel = kpis.growth?.label || '';
                return <KPICard key={template.id} title={template.kpi_name} value={formatKpiValue(template, value)} helper={template.description || template.formula_template?.formula_name} icon={<Icon />} tone={template.tone || 'emerald'} growth={growthVal} growthLabel={growthLabel} />;
              })}
            </div>
          </section>

          <section className="mb-3">
            <ChartCard
              title={chartCopy.trendSales.title}
              subtitle={chartCopy.trendSales.subtitle}
              action={
                <select value={trendGranularity} onChange={e => setTrendGranularity(e.target.value)} className="h-9 rounded-md border border-gray-200 bg-white px-2 text-sm text-gray-700">
                  <option value="daily">Harian</option>
                  <option value="weekly">Mingguan</option>
                  <option value="monthly">Bulanan</option>
                </select>
              }
            >
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={charts.trendSales} margin={{ top: 20, right: 16, left: 2, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#276749" stopOpacity={0.24} />
                      <stop offset="95%" stopColor="#276749" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECEF" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#667085' }} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis yAxisId="left" tickFormatter={shortCurrency} tick={{ fontSize: 12, fill: '#667085' }} width={60} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#667085' }} width={40} tickLine={false} axisLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                  <Area yAxisId="left" type="monotone" dataKey="sales" name={metricView === 'quantity' ? "Kuantitas" : "Omzet"} stroke={ANALYST_COLORS.primary} strokeWidth={3} fill="url(#salesArea)" activeDot={{ r: 5, fill: ANALYST_COLORS.primary }} />
                  <Line yAxisId="right" type="monotone" dataKey="transactions" name="Transaksi" stroke={ANALYST_COLORS.secondary} strokeWidth={2} dot={false} />
                  <Line yAxisId="left" type="monotone" dataKey="forecastSales" name={metricView === 'quantity' ? "Prediksi Kuantitas" : "Prediksi Omzet"} stroke={ANALYST_COLORS.primary} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} connectNulls />
                  <Line yAxisId="right" type="monotone" dataKey="forecastTransactions" name="Prediksi Transaksi" stroke={ANALYST_COLORS.secondary} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>

          {(productQuadrants.length > 0 || customerSegments.total > 0) && (
            <section className={`grid gap-3 mb-3 ${productQuadrants.length > 0 && customerSegments.total > 0 ? 'xl:grid-cols-2' : 'grid-cols-1'}`}>
              {productQuadrants.length > 0 && (
                <ChartCard title="Portfolio Produk: Volume vs Margin" subtitle="Klasifikasi produk agar keputusan stok dan promo tidak hanya mengejar omzet." style={{ '--chart-span': 1 }}>
                  <div className={`grid gap-2 ${customerSegments.total > 0 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
                    {productQuadrants.map(group => (
                      <div key={group.name} className="rounded-md border border-gray-100 bg-gray-50 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-gray-900">{group.name}</p>
                            <p className="text-xs text-gray-500">{formatNumber(group.count)} produk</p>
                          </div>
                          <span className="text-xs font-bold text-[#276749]">{formatRupiah(group.sales)}</span>
                        </div>
                        <p className="mt-2 text-xs text-gray-600 truncate" title={group.items?.[0]?.recommendation}>
                          {group.items?.[0]?.recommendation || 'Belum ada rekomendasi.'}
                        </p>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              )}

              {customerSegments.total > 0 && (
                <ChartCard title="Segmentasi Pelanggan" subtitle="Membaca nilai dan retensi pelanggan dari transaksi." style={{ '--chart-span': 1 }}>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="rounded-md bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Pelanggan</p>
                      <p className="text-lg font-extrabold text-gray-950">{formatNumber(customerSegments.total)}</p>
                    </div>
                    <div className="rounded-md bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Repeat</p>
                      <p className="text-lg font-extrabold text-gray-950">{customerSegments.repeatRate.toFixed(1)}%</p>
                    </div>
                    <div className="rounded-md bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">At Risk</p>
                      <p className="text-lg font-extrabold text-gray-950">{formatNumber(customerSegments.atRisk.length)}</p>
                    </div>
                  </div>
                  <div className="max-h-[150px] overflow-auto">
                    {customerSegments.topCustomers.slice(0, 5).map((customer, idx) => (
                      <div key={customer.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-2 border-t border-gray-100 py-2 first:border-t-0">
                        <span className="text-xs font-bold text-gray-400">{idx + 1}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-800">{customer.name}</p>
                          <p className="text-xs text-gray-500">{formatNumber(customer.transactions)} transaksi</p>
                        </div>
                        <span className="text-xs font-bold text-gray-900">{formatRupiah(customer.sales)}</span>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              )}
            </section>
          )}

          {hasVisibleEksplorasi && <h2 className="text-xl font-bold text-gray-900 mb-2 mt-4 px-1 tracking-tight">Analisis Lanjutan</h2>}
          {hasVisibleEksplorasi && (
            <section className="dashboard-chart-grid mb-3">
              {(() => {
                const chartElements = {
                  pareto: pareto.products.items.length > 0 ? (() => {
                    const cv = chartViews['pareto'] || 'barline';
                    const VIEWS = [
                      { key: 'barline', Icon: BarChart3, label: 'Bar+Line', tip: 'Pareto klasik  -  bar omzet + kurva akumulasi' },
                      { key: 'bar', Icon: LayoutGrid, label: 'Bar', tip: 'Hanya batang omzet per produk' },
                      { key: 'area', Icon: TrendingUp, label: 'Area', tip: 'Area akumulasi omzet' },
                    ];
                    const data = pareto.products.items.slice(0, 30);
                    return (
                      <ChartCard id="pareto" onHide={handleHideChart} onResize={handleResizeChart} preferredSize={12}
                        title={chartCopy.pareto.title}
                        subtitle={`${chartCopy.pareto.subtitle} Top 20% menyumbang ${pareto.products.top20Share.toFixed(1)}% omzet.`}
                        style={getAdaptiveCardStyle('pareto', 12)}
                        action={<ViewToggle id="pareto" views={VIEWS} current={cv} onSelect={handleChartViewChange} />}
                      >
                        <ResponsiveContainer width="100%" height={300}>
                          {cv === 'barline' ? (
                            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 2, bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECEF" />
                              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} angle={-45} textAnchor="end" height={60} interval={0} />
                              <YAxis yAxisId="left" tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} width={60} axisLine={false} tickLine={false} />
                              <YAxis yAxisId="right" orientation="right" tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: '#667085' }} width={40} axisLine={false} tickLine={false} />
                              <RechartsTooltip content={<CustomTooltip />} />
                              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                              <Bar yAxisId="left" dataKey="sales" name="Omzet" fill={ANALYST_COLORS.primary} radius={[4, 4, 0, 0]} />
                              <Line yAxisId="right" type="monotone" dataKey="cumulativeShare" name="Akumulasi %" stroke={ANALYST_COLORS.secondary} strokeWidth={2} dot={{ r: 2, fill: ANALYST_COLORS.secondary }} />
                            </ComposedChart>
                          ) : cv === 'area' ? (
                            <AreaChart data={data} margin={{ top: 20, right: 30, left: 2, bottom: 20 }}>
                              <defs>
                                <linearGradient id="paretoGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={ANALYST_COLORS.primary} stopOpacity={0.35} />
                                  <stop offset="95%" stopColor={ANALYST_COLORS.primary} stopOpacity={0.03} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECEF" />
                              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} angle={-45} textAnchor="end" height={60} interval={0} />
                              <YAxis tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} width={60} axisLine={false} tickLine={false} />
                              <RechartsTooltip content={<CustomTooltip />} />
                              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                              <Area type="monotone" dataKey="sales" name="Omzet" stroke={ANALYST_COLORS.primary} fill="url(#paretoGrad)" strokeWidth={2} />
                            </AreaChart>
                          ) : (
                            <BarChart data={data} margin={{ top: 20, right: 30, left: 2, bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECEF" />
                              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} angle={-45} textAnchor="end" height={60} interval={0} />
                              <YAxis tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} width={60} axisLine={false} tickLine={false} />
                              <RechartsTooltip content={<CustomTooltip />} />
                              <Bar dataKey="sales" name="Omzet" fill={ANALYST_COLORS.primary} radius={[4, 4, 0, 0]} />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      </ChartCard>
                    );
                  })() : null,
                  topProducts: <DynamicBreakdownCard id="topProducts" onHide={handleHideChart} viewType={chartViews.topProducts || 'auto'} onViewTypeChange={handleChartViewChange} title={chartCopy.topProducts.title} subtitle={chartCopy.topProducts.subtitle} items={dimensions.product ? charts.topProducts : []} color={ANALYST_COLORS.primary} label="produk" valueKey={metricView === 'quantity' ? 'qty' : 'sales'} />,
                  dataTable: dimensions.product ? <DataTableCard id="dataTable" onHide={handleHideChart} title={chartCopy.dataTable.title} items={charts.topProducts} draggable={true} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} /> : null,
                  staffSales: dimensions.staff ? <DynamicBreakdownCard id="staffSales" onHide={handleHideChart} viewType={chartViews.staffSales || 'auto'} onViewTypeChange={handleChartViewChange} title={chartCopy.staffSales.title} subtitle={chartCopy.staffSales.subtitle} items={charts.staffSales} color={ANALYST_COLORS.primary} label="staff" valueKey={metricView === 'quantity' ? 'qty' : 'sales'} /> : null,
                  brandSales: dimensions.brand ? <DynamicBreakdownCard id="brandSales" onHide={handleHideChart} viewType={chartViews.brandSales || 'auto'} onViewTypeChange={handleChartViewChange} title={chartCopy.brandSales.title} subtitle={chartCopy.brandSales.subtitle} items={charts.brandSales} color={ANALYST_COLORS.primary} label="brand" valueKey={metricView === 'quantity' ? 'qty' : 'sales'} /> : null,
                  supplierSales: dimensions.supplier ? <DynamicBreakdownCard id="supplierSales" onHide={handleHideChart} viewType={chartViews.supplierSales || 'auto'} onViewTypeChange={handleChartViewChange} title={chartCopy.supplierSales.title} subtitle={chartCopy.supplierSales.subtitle} items={charts.supplierSales} color={ANALYST_COLORS.primary} label="supplier" valueKey={metricView === 'quantity' ? 'qty' : 'sales'} /> : null,

                  channelSales: <DynamicBreakdownCard id="channelSales" onHide={handleHideChart} viewType={chartViews.channelSales || 'auto'} onViewTypeChange={handleChartViewChange} title={chartCopy.channelSales.title} subtitle={chartCopy.channelSales.subtitle} items={dimensions.channel ? charts.channelSales : []} color={ANALYST_COLORS.primary} label="channel" valueKey="value" composition />,
                  branchSales: <DynamicBreakdownCard id="branchSales" onHide={handleHideChart} viewType={chartViews.branchSales || 'auto'} onViewTypeChange={handleChartViewChange} title={chartCopy.branchSales.title} subtitle={chartCopy.branchSales.subtitle} items={dimensions.branch ? charts.branchSales : []} color={ANALYST_COLORS.primary} label="cabang" valueKey={metricView === 'quantity' ? 'qty' : 'sales'} />,
                  paymentMethods: <DynamicBreakdownCard id="paymentMethods" onHide={handleHideChart} viewType={chartViews.paymentMethods || 'auto'} onViewTypeChange={handleChartViewChange} title={chartCopy.paymentMethods.title} subtitle={chartCopy.paymentMethods.subtitle} items={dimensions.paymentMethod ? charts.paymentMethods : []} color={ANALYST_COLORS.primary} label="metode" valueKey="value" composition />,
                  serviceDuration: dimensions.duration ? <DynamicBreakdownCard id="serviceDuration" onHide={handleHideChart} viewType={chartViews.serviceDuration || 'auto'} onViewTypeChange={handleChartViewChange} title={chartCopy.serviceDuration.title} subtitle={chartCopy.serviceDuration.subtitle} items={charts.serviceDuration} color={ANALYST_COLORS.primary} label="layanan" preferred="standard" /> : null,

                  citySales: (dimensions.city && charts.citySales?.length > 0) ? (() => {
                    const cv = chartViews['citySales'] || 'auto';
                    const hasMappedCities = charts.citySales.some(item => getCityCoords(item.name));
                    const preferredSize = cv === 'map' ? 12 : 6;
                    if (cv === 'map') {
                      return (
                        <ChartCard
                          id="citySales"
                          onHide={handleHideChart}
                          onResize={handleResizeChart}
                          preferredSize={12}
                          title={chartCopy.citySales.title}
                          subtitle={chartCopy.citySales.subtitle}
                          style={getAdaptiveCardStyle('citySales', 12)}
                          action={
                            <div className="flex bg-gray-100 p-0.5 rounded-md border border-gray-200 gap-0.5">
                              <button onClick={() => handleChartViewChange('citySales', 'auto')} title="Auto" className={`px-1.5 py-1 rounded-sm text-[10px] font-bold text-gray-400 hover:text-gray-600`}>Auto</button>
                              <button onClick={() => handleChartViewChange('citySales', 'bar')} title="Bar" className="p-1 rounded-sm text-gray-400 hover:text-gray-600"><BarChart3 className="w-4 h-4" /></button>
                              <button onClick={() => handleChartViewChange('citySales', 'pie')} title="Pie" className="p-1 rounded-sm text-gray-400 hover:text-gray-600"><PieChartIcon className="w-4 h-4" /></button>
                              <button onClick={() => handleChartViewChange('citySales', 'treemap')} title="Treemap" className="p-1 rounded-sm text-gray-400 hover:text-gray-600"><LayoutGrid className="w-4 h-4" /></button>
                              <button onClick={() => handleChartViewChange('citySales', 'map')} title="Peta Indonesia" className="p-1 rounded-sm bg-white shadow-sm text-gray-900 flex items-center gap-1 text-[10px] font-semibold">
                                <MapPin className="w-3.5 h-3.5" /><span className="hidden sm:inline">Peta</span>
                              </button>
                            </div>
                          }
                        >
                          <IndonesiaMapChart items={charts.citySales} valueKey={metricView === 'quantity' ? 'qty' : 'sales'} />
                        </ChartCard>
                      );
                    }
                    // non-map: pakai DynamicBreakdownCard dengan tombol Peta ditambahkan via action override
                    return (
                      <DynamicBreakdownCard
                        id="citySales"
                        onHide={handleHideChart}
                        viewType={cv}
                        onViewTypeChange={handleChartViewChange}
                        title={chartCopy.citySales.title}
                        subtitle={chartCopy.citySales.subtitle}
                        items={charts.citySales}
                        color={ANALYST_COLORS.primary}
                        label="kota"
                        valueKey={metricView === 'quantity' ? 'qty' : 'sales'}
                        extraAction={hasMappedCities ? (
                          <button
                            onClick={() => handleChartViewChange('citySales', 'map')}
                            title="Peta Indonesia"
                            className="p-1 rounded-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 text-[10px] font-semibold"
                          >
                            <MapPin className="w-3.5 h-3.5" /><span className="hidden sm:inline">Peta</span>
                          </button>
                        ) : null}
                      />
                    );
                  })() : <DynamicBreakdownCard id="citySales" onHide={handleHideChart} viewType={chartViews.citySales || 'auto'} onViewTypeChange={handleChartViewChange} title={chartCopy.citySales.title} subtitle={chartCopy.citySales.subtitle} items={[]} color={ANALYST_COLORS.primary} label="kota" valueKey={metricView === 'quantity' ? 'qty' : 'sales'} />,

                  basketSize: (charts.basketSize.length > 0) ? (() => {
                    const cv = chartViews['basketSize'] || 'bar';
                    const VIEWS = [
                      { key: 'bar', Icon: BarChart3, label: 'Bar', tip: 'Bar  -  distribusi ukuran transaksi' },
                      { key: 'line', Icon: Activity, label: 'Line', tip: 'Line  -  kurva distribusi' },
                      { key: 'pie', Icon: PieChartIcon, label: 'Pie', tip: 'Pie  -  proporsi tiap segmen basket' },
                    ];
                    return (
                      <ChartCard id="basketSize" onHide={handleHideChart} onResize={handleResizeChart} preferredSize={4}
                        title={chartCopy.basketSize.title} subtitle={chartCopy.basketSize.subtitle}
                        style={getAdaptiveCardStyle('basketSize', 4)}
                        action={<ViewToggle id="basketSize" views={VIEWS} current={cv} onSelect={handleChartViewChange} />}
                      >
                        <ResponsiveContainer width="100%" height={250}>
                          {cv === 'line' ? (
                            <LineChart data={charts.basketSize} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECEF" />
                              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fontSize: 11, fill: '#667085' }} width={30} axisLine={false} tickLine={false} />
                              <RechartsTooltip cursor={{ fill: '#F4F7F6' }} />
                              <Line type="monotone" dataKey="count" name="Jumlah Transaksi" stroke={ANALYST_COLORS.primary} strokeWidth={2} dot={{ r: 4, fill: ANALYST_COLORS.primary }} />
                            </LineChart>
                          ) : cv === 'pie' ? (
                            <PieChart>
                              <Pie data={charts.basketSize} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="count" nameKey="name">
                                {charts.basketSize.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                              </Pie>
                              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                              <RechartsTooltip formatter={(val) => `${val} transaksi`} />
                            </PieChart>
                          ) : (
                            <BarChart data={charts.basketSize} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECEF" />
                              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fontSize: 11, fill: '#667085' }} width={30} axisLine={false} tickLine={false} />
                              <RechartsTooltip cursor={{ fill: '#F4F7F6' }} />
                              <Bar dataKey="count" name="Jumlah Transaksi" fill={ANALYST_COLORS.primary} radius={[4, 4, 0, 0]} />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      </ChartCard>
                    );
                  })() : null,
                  productMatrix: (charts.productMatrix.length > 0) ? (() => {
                    const cv = chartViews['productMatrix'] || 'scatter';
                    const VIEWS = [
                      { key: 'scatter', Icon: Target, label: 'Matrix', tip: 'Scatter matrix  -  Volume vs Margin (default)' },
                      { key: 'bar', Icon: BarChart3, label: 'Bar', tip: 'Bar  -  ranking omzet per produk' },
                      { key: 'radar', Icon: RadarIcon, label: 'Radar', tip: 'Radar  -  keseimbangan portfolio produk' },
                    ];
                    const matrixTooltip = ({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white border border-gray-200 p-2 shadow-sm rounded-md text-sm">
                            <p className="font-bold text-gray-800">{d.name}</p>
                            <p className="text-gray-600">Terjual: {d.x} qty</p>
                            <p className="text-gray-600">Margin: {d.y.toFixed(1)}%</p>
                            <p className="text-gray-600">Omzet: {formatRupiah(d.z)}</p>
                            <p className="text-gray-700 font-semibold mt-1">{d.quadrant}</p>
                            <p className="text-gray-500 max-w-[220px]">{d.recommendation}</p>
                          </div>
                        );
                      }
                      return null;
                    };
                    // Convert productMatrix to bar-friendly format
                    const barData = [...charts.productMatrix].sort((a, b) => b.z - a.z).slice(0, 20).map(d => ({ name: d.name, sales: d.z, margin: d.y }));
                    const radarData = barData.slice(0, 8).map(d => ({ name: d.name, omzet: d.sales, margin: Math.max(0, d.margin) }));
                    return (
                      <ChartCard id="productMatrix" onHide={handleHideChart} onResize={handleResizeChart} preferredSize={12}
                        title={chartCopy.productMatrix.title} subtitle={chartCopy.productMatrix.subtitle}
                        style={getAdaptiveCardStyle('productMatrix', 12)}
                        action={<ViewToggle id="productMatrix" views={VIEWS} current={cv} onSelect={handleChartViewChange} />}
                      >
                        <ResponsiveContainer width="100%" height={300}>
                          {cv === 'scatter' ? (
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#E8ECEF" />
                              <XAxis type="number" dataKey="x" name="Terjual" tick={{ fontSize: 12, fill: '#667085' }} label={{ value: 'Jumlah Terjual (Qty)', position: 'insideBottom', offset: -10, fontSize: 12, fill: '#667085' }} />
                              <YAxis type="number" dataKey="y" name="Margin %" tick={{ fontSize: 12, fill: '#667085' }} tickFormatter={v => `${v}%`} label={{ value: 'Profit Margin (%)', angle: -90, position: 'insideLeft', offset: -10, fontSize: 12, fill: '#667085' }} />
                              <ZAxis type="number" dataKey="z" range={[50, 400]} name="Omzet" />
                              <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={matrixTooltip} />
                              <Scatter data={charts.productMatrix} fill={ANALYST_COLORS.primary} fillOpacity={0.72} />
                            </ScatterChart>
                          ) : cv === 'radar' ? (
                            <RadarChart cx="50%" cy="50%" outerRadius="38%" data={radarData}>
                              <PolarGrid stroke="#e5e7eb" />
                              <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: '#667085' }} />
                              <PolarRadiusAxis tick={false} axisLine={false} />
                              <Radar name="Omzet" dataKey="omzet" stroke={ANALYST_COLORS.primary} fill={ANALYST_COLORS.primary} fillOpacity={0.25} strokeWidth={1.5} />
                              <Radar name="Margin %" dataKey="margin" stroke={ANALYST_COLORS.secondary} fill={ANALYST_COLORS.secondary} fillOpacity={0.2} strokeWidth={1.5} />
                              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                              <RechartsTooltip formatter={(val, name) => name === 'Omzet' ? formatRupiah(val) : `${val.toFixed(1)}%`} />
                            </RadarChart>
                          ) : (
                            <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20, top: 4, bottom: 4 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8ECEF" />
                              <XAxis type="number" tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} />
                              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: '#344054' }} axisLine={false} tickLine={false} />
                              <RechartsTooltip formatter={(val, name) => name === 'Omzet' ? formatRupiah(val) : `${val.toFixed(1)}%`} />
                              <Bar dataKey="sales" name="Omzet" fill={ANALYST_COLORS.primary} radius={[0, 4, 4, 0]} barSize={14} />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      </ChartCard>
                    );
                  })() : null,

                  // - - €- - € Cross-Dimensional & Metric Charts - - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €- - €
                  crossCategoryBranch: charts.crossCategoryBranch?.length > 0 ? (
                    <DynamicCrossCard
                      id="crossCategoryBranch"
                      title={chartCopy.crossCategoryBranch.title}
                      subtitle={chartCopy.crossCategoryBranch.subtitle}
                      data={charts.crossCategoryBranch}
                      categories={charts.crossCategoryBranch.categories || []}
                      preferred={6}
                      defaultView="stackedBar"
                      viewType={chartViews['crossCategoryBranch'] || 'auto'}
                      onViewTypeChange={handleChartViewChange}
                      onHide={handleHideChart}
                    />
                  ) : null,

                  crossTimeCategory: charts.crossTimeCategory?.length > 0 ? (
                    <DynamicCrossCard
                      id="crossTimeCategory"
                      title={chartCopy.crossTimeCategory.title}
                      subtitle={chartCopy.crossTimeCategory.subtitle}
                      data={charts.crossTimeCategory}
                      categories={charts.crossTimeCategory.categories || []}
                      preferred={6}
                      defaultView="multiArea"
                      viewType={chartViews['crossTimeCategory'] || 'auto'}
                      onViewTypeChange={handleChartViewChange}
                      onHide={handleHideChart}
                    />
                  ) : null,

                  crossChannelCategory: charts.crossChannelCategory?.length > 0 ? (
                    <DynamicCrossCard
                      id="crossChannelCategory"
                      title={chartCopy.crossChannelCategory.title}
                      subtitle={chartCopy.crossChannelCategory.subtitle}
                      data={charts.crossChannelCategory}
                      categories={charts.crossChannelCategory.categories || []}
                      preferred={6}
                      defaultView="groupedBar"
                      viewType={chartViews['crossChannelCategory'] || 'auto'}
                      onViewTypeChange={handleChartViewChange}
                      onHide={handleHideChart}
                    />
                  ) : null,

                  crossPaymentChannel: charts.crossPaymentChannel?.length > 0 ? (
                    <DynamicCrossCard
                      id="crossPaymentChannel"
                      title={chartCopy.crossPaymentChannel.title}
                      subtitle={chartCopy.crossPaymentChannel.subtitle}
                      data={charts.crossPaymentChannel}
                      categories={charts.crossPaymentChannel.categories || []}
                      preferred={6}
                      defaultView="stackedBar"
                      viewType={chartViews['crossPaymentChannel'] || 'auto'}
                      onViewTypeChange={handleChartViewChange}
                      onHide={handleHideChart}
                    />
                  ) : null,

                  crossStaffCategory: charts.crossStaffCategory?.length > 0 ? (
                    <DynamicCrossCard
                      id="crossStaffCategory"
                      title={chartCopy.crossStaffCategory.title}
                      subtitle={chartCopy.crossStaffCategory.subtitle}
                      data={charts.crossStaffCategory}
                      categories={charts.crossStaffCategory.categories || []}
                      preferred={6}
                      defaultView="groupedBar"
                      viewType={chartViews['crossStaffCategory'] || 'auto'}
                      onViewTypeChange={handleChartViewChange}
                      onHide={handleHideChart}
                    />
                  ) : null,

                  discount: charts.discountEffectiveness?.length > 0 ? (() => {
                    const cv = chartViews['discount'] || 'scatter';
                    const VIEWS = [
                      { key: 'scatter', Icon: Target, label: 'Scatter', tip: 'Scatter  -  diskon vs volume (bubble = omzet)' },
                      { key: 'bar', Icon: BarChart3, label: 'Bar', tip: 'Bar  -  produk dengan diskon terbesar' },
                      { key: 'line', Icon: Activity, label: 'Line', tip: 'Line  -  tren diskon vs omzet' },
                    ];
                    const sortedDisc = [...charts.discountEffectiveness].sort((a, b) => b.x - a.x).slice(0, 15);
                    return (
                      <ChartCard id="discount" onHide={handleHideChart} onResize={handleResizeChart} preferredSize={6}
                        title={chartCopy.discount.title} subtitle={chartCopy.discount.subtitle}
                        style={getAdaptiveCardStyle('discount', 6)}
                        action={<ViewToggle id="discount" views={VIEWS} current={cv} onSelect={handleChartViewChange} />}
                      >
                        <ResponsiveContainer width="100%" height={280} minWidth={1} minHeight={1}>
                          {cv === 'scatter' ? (
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#E8ECEF" />
                              <XAxis type="number" dataKey="x" name="Diskon" unit=" Rp" tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} />
                              <YAxis type="number" dataKey="y" name="Volume (Qty)" tick={{ fontSize: 11, fill: '#667085' }} />
                              <ZAxis type="number" dataKey="z" range={[50, 400]} name="Omzet" />
                              <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} formatter={(val, name) => name === 'Diskon' || name === 'Omzet' ? formatRupiah(val) : val} />
                              <Scatter name="Produk" data={charts.discountEffectiveness} fill={ANALYST_COLORS.primary} fillOpacity={0.72} />
                            </ScatterChart>
                          ) : cv === 'line' ? (
                            <LineChart data={sortedDisc} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECEF" />
                              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#667085' }} angle={-30} textAnchor="end" height={50} interval={0} />
                              <YAxis yAxisId="left" tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} width={60} axisLine={false} tickLine={false} />
                              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#667085' }} width={40} axisLine={false} tickLine={false} />
                              <RechartsTooltip formatter={(val, name) => name === 'Diskon' || name === 'Omzet' ? formatRupiah(val) : val} />
                              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                              <Line yAxisId="left" type="monotone" dataKey="x" name="Diskon" stroke={ANALYST_COLORS.secondary} strokeWidth={2} dot={{ r: 3 }} />
                              <Line yAxisId="right" type="monotone" dataKey="z" name="Omzet" stroke={ANALYST_COLORS.primary} strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                          ) : (
                            <BarChart data={sortedDisc} layout="vertical" margin={{ left: 10, right: 20, top: 4, bottom: 4 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8ECEF" />
                              <XAxis type="number" tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} />
                              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#344054' }} axisLine={false} tickLine={false} />
                              <RechartsTooltip formatter={(val) => formatRupiah(val)} />
                              <Bar dataKey="x" name="Total Diskon" fill={ANALYST_COLORS.secondary} radius={[0, 4, 4, 0]} barSize={14} />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      </ChartCard>
                    );
                  })() : null,

                  channelEfficiency: charts.channelEfficiency?.length > 0 ? (() => {
                    const cv = chartViews['channelEfficiency'] || 'barline';
                    const VIEWS = [
                      { key: 'barline', Icon: BarChart3, label: 'Bar+Line', tip: 'AOV (bar) + Discount Rate (line)' },
                      { key: 'bar', Icon: LayoutGrid, label: 'Grouped', tip: 'Grouped  -  bandingkan AOV vs Omzet' },
                      { key: 'radar', Icon: RadarIcon, label: 'Radar', tip: 'Radar  -  keseimbangan efisiensi channel' },
                    ];
                    return (
                      <ChartCard id="channelEfficiency" onHide={handleHideChart} onResize={handleResizeChart} preferredSize={6}
                        title={chartCopy.channelEfficiency.title} subtitle={chartCopy.channelEfficiency.subtitle}
                        style={getAdaptiveCardStyle('channelEfficiency', 6)}
                        action={<ViewToggle id="channelEfficiency" views={VIEWS} current={cv} onSelect={handleChartViewChange} />}
                      >
                        <ResponsiveContainer width="100%" height={280} minWidth={1} minHeight={1}>
                          {cv === 'barline' ? (
                            <ComposedChart data={charts.channelEfficiency} layout="vertical" margin={{ left: 10, right: 30, top: 4, bottom: 4 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8ECEF" />
                              <XAxis type="number" tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} />
                              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#344054' }} axisLine={false} tickLine={false} />
                              <RechartsTooltip formatter={(val, name) => {
                                if (name === 'AOV') return formatRupiah(val);
                                if (name === 'Discount Rate') return `${val.toFixed(1)}%`;
                                return val;
                              }} />
                              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                              <Bar dataKey="aov" name="AOV" fill={ANALYST_COLORS.primary} radius={[0, 4, 4, 0]} barSize={14} />
                              <Line dataKey="discountRate" name="Discount Rate" stroke={ANALYST_COLORS.secondary} strokeWidth={2} dot={{ r: 4 }} />
                            </ComposedChart>
                          ) : cv === 'radar' ? (
                            <RadarChart cx="50%" cy="50%" outerRadius="38%" data={charts.channelEfficiency.slice(0, 8)}>
                              <PolarGrid stroke="#e5e7eb" />
                              <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: '#667085' }} />
                              <PolarRadiusAxis tick={false} axisLine={false} />
                              <Radar name="AOV" dataKey="aov" stroke={ANALYST_COLORS.primary} fill={ANALYST_COLORS.primary} fillOpacity={0.25} strokeWidth={1.5} />
                              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                              <RechartsTooltip formatter={(val) => formatRupiah(val)} />
                            </RadarChart>
                          ) : (
                            <BarChart data={charts.channelEfficiency} layout="vertical" margin={{ left: 10, right: 20, top: 4, bottom: 4 }} barCategoryGap="20%">
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8ECEF" />
                              <XAxis type="number" tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} />
                              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#344054' }} axisLine={false} tickLine={false} />
                              <RechartsTooltip formatter={(val) => formatRupiah(val)} />
                              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                              <Bar dataKey="sales" name="Omzet" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} barSize={10} />
                              <Bar dataKey="aov" name="AOV" fill={CHART_COLORS[1]} radius={[0, 4, 4, 0]} barSize={10} />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                        <div className="mt-2 border-t border-gray-100 pt-2">
                          <div className="grid grid-cols-4 gap-1 text-[10px] font-bold text-gray-400 mb-1 px-1">
                            <span>Channel</span><span className="text-right">Omzet</span><span className="text-right">AOV</span><span className="text-right">Disc%</span>
                          </div>
                          {charts.channelEfficiency.slice(0, 5).map(ch => (
                            <div key={ch.name} className="grid grid-cols-4 gap-1 text-[11px] px-1 py-0.5 odd:bg-gray-50 rounded">
                              <span className="truncate font-medium text-gray-800">{ch.name}</span>
                              <span className="text-right text-gray-600">{shortCurrency(ch.sales)}</span>
                              <span className="text-right font-semibold text-gray-900">{shortCurrency(ch.aov)}</span>
                              <span className="text-right text-gray-600">{ch.discountRate.toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </ChartCard>
                    );
                  })() : null,

                  categoryProfitability: charts.categoryProfitability?.length > 0 ? (() => {
                    const cv = chartViews['categoryProfitability'] || 'barline';
                    const VIEWS = [
                      { key: 'barline', Icon: BarChart3, label: 'Bar+Line', tip: 'Margin (bar) + AOV (line)' },
                      { key: 'bar', Icon: LayoutGrid, label: 'Grouped', tip: 'Grouped  -  bandingkan omzet vs margin' },
                      { key: 'radar', Icon: RadarIcon, label: 'Radar', tip: 'Radar  -  profil profitabilitas per kategori' },
                    ];
                    const radarDataProfit = charts.categoryProfitability.slice(0, 8).map(c => ({
                      name: c.name, margin: Math.max(0, c.margin), aov: c.aov,
                    }));
                    return (
                      <ChartCard id="categoryProfitability" onHide={handleHideChart} onResize={handleResizeChart} preferredSize={6}
                        title={chartCopy.categoryProfitability.title} subtitle={chartCopy.categoryProfitability.subtitle}
                        style={getAdaptiveCardStyle('categoryProfitability', 6)}
                        action={<ViewToggle id="categoryProfitability" views={VIEWS} current={cv} onSelect={handleChartViewChange} />}
                      >
                        <ResponsiveContainer width="100%" height={240} minWidth={1} minHeight={1}>
                          {cv === 'barline' ? (
                            <ComposedChart data={charts.categoryProfitability} layout="vertical" margin={{ left: 10, right: 30, top: 4, bottom: 4 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8ECEF" />
                              <XAxis type="number" tickFormatter={v => `${v.toFixed(0)}%`} tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} />
                              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#344054' }} axisLine={false} tickLine={false} />
                              <RechartsTooltip formatter={(val, name) => {
                                if (name === 'Margin %') return `${val.toFixed(1)}%`;
                                if (name === 'AOV') return formatRupiah(val);
                                return val;
                              }} />
                              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                              <Bar dataKey="margin" name="Margin %" fill={ANALYST_COLORS.primary} radius={[0, 4, 4, 0]} barSize={14} />
                              <Line dataKey="aov" name="AOV" stroke={ANALYST_COLORS.secondary} strokeWidth={2} dot={{ r: 3 }} yAxisId={0} />
                            </ComposedChart>
                          ) : cv === 'radar' ? (
                            <RadarChart cx="50%" cy="50%" outerRadius="38%" data={radarDataProfit}>
                              <PolarGrid stroke="#e5e7eb" />
                              <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: '#667085' }} />
                              <PolarRadiusAxis tick={false} axisLine={false} />
                              <Radar name="Margin %" dataKey="margin" stroke={ANALYST_COLORS.primary} fill={ANALYST_COLORS.primary} fillOpacity={0.25} strokeWidth={1.5} />
                              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                              <RechartsTooltip formatter={(val) => `${val.toFixed(1)}%`} />
                            </RadarChart>
                          ) : (
                            <BarChart data={charts.categoryProfitability} layout="vertical" margin={{ left: 10, right: 20, top: 4, bottom: 4 }} barCategoryGap="20%">
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8ECEF" />
                              <XAxis type="number" tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} />
                              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#344054' }} axisLine={false} tickLine={false} />
                              <RechartsTooltip formatter={(val, name) => name === 'Margin %' ? `${val.toFixed(1)}%` : formatRupiah(val)} />
                              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                              <Bar dataKey="sales" name="Omzet" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} barSize={10} />
                              <Bar dataKey="profit" name="Profit" fill={CHART_COLORS[1]} radius={[0, 4, 4, 0]} barSize={10} />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                        <div className="mt-2 border-t border-gray-100 pt-2">
                          <div className="grid grid-cols-4 gap-1 text-[10px] font-bold text-gray-400 mb-1 px-1">
                            <span>Kategori</span><span className="text-right">Omzet</span><span className="text-right">Margin</span><span className="text-right">Transaksi</span>
                          </div>
                          {charts.categoryProfitability.slice(0, 5).map(cat => (
                            <div key={cat.name} className="grid grid-cols-4 gap-1 text-[11px] px-1 py-0.5 odd:bg-gray-50 rounded">
                              <span className="truncate font-medium text-gray-800">{cat.name}</span>
                              <span className="text-right text-gray-600">{shortCurrency(cat.sales)}</span>
                              <span className={`text-right font-semibold ${cat.margin >= 20 ? 'text-[#276749]' : cat.margin < 0 ? 'text-red-500' : 'text-amber-600'}`}>{cat.margin.toFixed(1)}%</span>
                              <span className="text-right text-gray-600">{cat.transactions}</span>
                            </div>
                          ))}
                        </div>
                      </ChartCard>
                    );
                  })() : null,

                  variantPopularity: charts.variantPopularity?.length > 0 ? (() => {
                    const sortedVar = [...charts.variantPopularity].sort((a, b) => b.qty - a.qty).slice(0, 15);
                    return (
                      <ChartCard id="variantPopularity" onHide={handleHideChart} onResize={handleResizeChart} preferredSize={6}
                        title={chartCopy.variantPopularity.title} subtitle={chartCopy.variantPopularity.subtitle}
                        style={getAdaptiveCardStyle('variantPopularity', 6)}
                      >
                        <ResponsiveContainer width="100%" height={240} minWidth={1} minHeight={1}>
                          <BarChart data={sortedVar} layout="vertical" margin={{ left: 10, right: 20, top: 4, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8ECEF" />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#344054' }} axisLine={false} tickLine={false} />
                            <RechartsTooltip formatter={(val) => [`${val} Pcs`, 'Kuantitas']} />
                            <Bar dataKey="qty" name="Kuantitas" fill={ANALYST_COLORS.primary} radius={[0, 4, 4, 0]} barSize={14} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartCard>
                    );
                  })() : null,









                  







                  


                };

                // Add custom library templates dynamically into chartElements
                customChartTemplates.forEach(template => {
                  const id = `library:${template.id}`;
                  const current = chartViews[id] || 'auto';
                  const views = [
                    { key: 'auto', Icon: LayoutGrid, label: 'Auto', tip: `Gunakan tipe ${template.chart_type} dari template` },
                    { key: 'bar', Icon: BarChart3, label: 'Bar', tip: 'Tampilan batang' },
                    { key: 'line', Icon: Activity, label: 'Line', tip: 'Tampilan garis' },
                    { key: 'pie', Icon: PieChartIcon, label: 'Pie', tip: 'Tampilan lingkaran' },
                    { key: 'table', Icon: List, label: 'Table', tip: 'Tampilan tabel' },
                  ];
                  
                  let chartDataToPass = processedData;
                  const mapValue = (arr) => (arr || []).map(d => ({ ...d, value: d[metricView === 'quantity' ? 'qty' : 'sales'] || d.sales || d.transactions || 0 }));
                  if (template.chart_code === 'WEEKDAY_SALES') chartDataToPass = mapValue(charts.weekdaySales);
                  else if (template.chart_code === 'CATEGORY_SALES') chartDataToPass = mapValue(charts.categorySales);
                  else if (template.chart_code === 'PROMO_CAMPAIGN') chartDataToPass = (charts.promoCampaign || []).map(d => ({ ...d, value: d.sales || 0, transactions: d.qty || 0 }));
                  else if (template.chart_code === 'CUSTOMER_SEGMENT') chartDataToPass = mapValue(charts.customerSegment);
                  else if (template.chart_code === 'ORDER_FULFILLMENT') chartDataToPass = mapValue(charts.orderFulfillment);
                  else if (template.chart_code === 'COURIER_EFFICIENCY') chartDataToPass = (charts.courierEfficiency || []).map(d => ({ ...d, value: d.sales || 0, avgTime: d.fee || 0, orders: d.sales || 0 }));
                  else if (template.chart_code === 'TABLE_REVENUE') chartDataToPass = mapValue(charts.tableRevenue);
                  else if (template.chart_code === 'PROMO_ROI') chartDataToPass = (charts.promoRoi || []).map(d => ({ ...d, value: d.sales || 0, roi: d.sales || 0, margin: d.discount || 0 }));
                  else if (template.chart_code === 'VARIANT_PROFITABILITY') chartDataToPass = (charts.variantProfitability || []).map(d => ({ ...d, value: d.sales || 0, revenue: d.sales || 0 }));

                  if (template.chart_type === 'crosstab') {
                    const crossData = template.chart_code === 'PAYMENT_PROVIDER' ? (charts.paymentProviderShare || []) : (template.chart_code === 'CUSTOMER_LOYALTY' ? (charts.customerLoyaltyMix || []) : []);
                    const crossCategories = template.chart_code === 'PAYMENT_PROVIDER' ? (charts.paymentProviderShare?.categories || []) : (template.chart_code === 'CUSTOMER_LOYALTY' ? (charts.customerLoyaltyMix?.categories || []) : []);

                    chartElements[id] = (
                      <DynamicCrossCard
                        id={id}
                        title={template.chart_name}
                        subtitle={template.description}
                        data={crossData}
                        categories={crossCategories}
                        preferred={template.default_size || 6}
                        defaultView="stackedBar"
                        viewType={current}
                        onViewTypeChange={handleChartViewChange}
                        onHide={handleHideChart}
                        draggable={true}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                      />
                    );
                  } else {
                    chartElements[id] = (
                      <ChartCard
                        id={id}
                        title={template.chart_name}
                        subtitle={template.description}
                        action={<ViewToggle id={id} views={views} current={current} onSelect={handleChartViewChange} />}
                        onSettings={() => setMappingTemplate(template)}
                        onHide={handleHideChart}
                        onResize={handleResizeChart}
                        preferredSize={template.default_size || 6}
                        draggable={true}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        style={getAdaptiveCardStyle(id, template.default_size || 6)}
                      >
                        <TemplateChart template={template} rows={chartDataToPass} metricView={metricView} viewType={current} fieldMapping={chartLibraryMappings[template.id]} />
                      </ChartCard>
                    );
                  }
                  
                  return; // Skip original chartElements[id]
          
chartElements[id] = (
                    <ChartCard
                      id={id}
                      title={template.chart_name}
                      subtitle={template.description}
                      action={<ViewToggle id={id} views={views} current={current} onSelect={handleChartViewChange} />}
                      onSettings={() => setMappingTemplate(template)}
                      onHide={handleHideChart}
                      onResize={handleResizeChart}
                      preferredSize={template.default_size || 6}
                      style={getAdaptiveCardStyle(id, template.default_size || 6)}
                      className="min-h-[340px]"
                    >
                      <TemplateChart template={template} rows={processedData} metricView={metricView} viewType={current} fieldMapping={chartLibraryMappings[template.id]} />
                    </ChartCard>
                  );
                });

                // Ensure custom chart IDs are included in chartOrder for drag support, filtering out deleted ones
                const cleanChartOrder = chartOrder.filter(id => {
                  if (id.startsWith('library:')) {
                    const rawId = id.replace('library:', '');
                    return customChartTemplates.some(t => t.id === rawId);
                  }
                  return true;
                });
                const customIds = customChartTemplates.map(t => `library:${t.id}`).filter(id => !cleanChartOrder.includes(id));
                const allVisibleIds = [...cleanChartOrder, ...customIds];

                return allVisibleIds.map(id => {
                  if (hiddenCharts.includes(id)) return null;
                  const element = chartElements[id];
                  if (!element) return null;
                  return React.cloneElement(element, {
                    key: id,
                    draggable: true,
                    onDragStart: handleDragStart,
                    onDragOver: handleDragOver,
                    onDrop: handleDrop
                  });
                });
              })()}

            </section>
          )}

          {(chartTemplatesLoading || chartTemplatesError) && (
            <div className="mt-3 print:break-before-page">
              {chartTemplatesLoading ? (
                <div className="dashboard-chart-grid">
                  {[0, 1].map(item => (
                    <div key={item} className="dashboard-chart-card h-[340px] animate-pulse rounded-xl bg-gray-100" />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <span>Template visualisasi belum dapat dimuat: {chartTemplatesError}</span>
                  <button type="button" onClick={fetchChartTemplates} className="shrink-0 rounded-md border border-amber-300 bg-white px-3 py-1.5 font-semibold hover:bg-amber-100">Coba Lagi</button>
                </div>
              )}
            </div>
          )}

          {!isDemo && hiddenCharts.length > 0 && (
            <section className="mt-8 border-t border-gray-200 pt-6 print:hidden">
              <div className="flex items-center gap-2 mb-4">
                <LayoutGrid className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-bold text-gray-900">Galeri Bagan (Disembunyikan)</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">Klik bagan di bawah ini untuk mengembalikannya ke dashboard utama.</p>
              <div className="flex flex-wrap gap-2">
                {hiddenCharts.map(id => {
                  return (
                    <button
                      type="button"
                      key={id}
                      onClick={() => handleRestoreChart(id)}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-[#F1FAF5] hover:border-[#276749] hover:text-[#276749] transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> {chartCopy[id]?.title || customChartTemplates.find(template => `library:${template.id}` === id)?.chart_name || id}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

        </div>
      </div>
    );
  };


  // --- SUB-COMPONENTS ---
  const NavItem = ({ icon, label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${active ? 'bg-[#F1FAF5] text-[#276749]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
    >
      {React.cloneElement(icon, { className: `w-5 h-5 ${active ? 'text-[#276749]' : 'text-gray-400'}` })}
      {label}
    </button>
  );

  const KPI_TONES = {
    emerald: 'border-[#BFEAD1] bg-[#F1FAF5] text-[#276749]',
    blue: 'border-[#BFEAD1] bg-[#F1FAF5] text-[#276749]',
    amber: 'border-[#BFEAD1] bg-[#F1FAF5] text-[#276749]',
    violet: 'border-[#BFEAD1] bg-[#F1FAF5] text-[#276749]',
    cyan: 'border-[#BFEAD1] bg-[#F1FAF5] text-[#276749]',
    rose: 'border-[#BFEAD1] bg-[#F1FAF5] text-[#276749]',
    orange: 'border-[#BFEAD1] bg-[#F1FAF5] text-[#276749]',
    slate: 'border-[#D8E8DF] bg-[#F8FCFA] text-[#3F5F4F]',
  };

  const KPICard = ({ title, value, helper, icon, tone = 'slate', growth = null, growthLabel = '' }) => (
    <div className="bg-white p-3 min-h-[92px] flex flex-col justify-between" style={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: (() => { const t = KPI_TONES[tone] || KPI_TONES.slate; return t.color; })(), background: (() => { const t = KPI_TONES[tone] || KPI_TONES.slate; return t.background; })(), padding: '2px 8px', borderRadius: 4, display: 'inline-block', marginBottom: 2 }}>{title}</p>
          <p className="mt-0.5 text-[11px] text-gray-400">{helper}</p>
        </div>
        <div style={(() => { const t = KPI_TONES[tone] || KPI_TONES.slate; return { width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: t.background, color: t.color, borderLeft: t.borderLeft }; })()}>
          {React.cloneElement(icon, { className: 'w-4 h-4' })}
        </div>
      </div>
      <div className="mt-1 flex flex-col items-start gap-1 w-full">
        <p className="text-lg font-extrabold text-gray-950 tracking-tight break-words leading-none">{value}</p>
        {growth !== null && growth !== undefined && (
          <div className="flex items-center justify-between w-full mt-0.5">
            <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ${growth > 0 ? 'bg-emerald-50 text-emerald-700' : growth < 0 ? 'bg-rose-50 text-rose-700' : 'bg-gray-100 text-gray-500'
              }`}>
              <span>{growth > 0 ? '↑' : growth < 0 ? '↓' : '->'}</span>
              <span>{Math.abs(growth).toFixed(1)}%</span>
            </div>
            {growthLabel && (
              <span className="text-[10px] font-semibold text-gray-400 whitespace-nowrap ml-2">
                {growthLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const ChartCard = ({ id, title, subtitle, action, children, className = '', style = {}, compact = false, onHide, onResize, preferredSize = 'standard', draggable, onDragStart, onDragOver, onDrop, onSettings }: any) => (
    <div
      draggable={draggable}
      onDragStart={draggable ? (e) => onDragStart(e, id) : undefined}
      onDragOver={draggable ? onDragOver : undefined}
      onDrop={draggable ? (e) => onDrop(e, id) : undefined}
      className={`dashboard-chart-card bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-col min-w-0 hover:shadow-md transition-shadow ${compact ? 'self-start' : 'h-full'} ${className} ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
      style={style}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          {draggable && <GripHorizontal className="w-4 h-4 text-gray-300 shrink-0 cursor-grab active:cursor-grabbing hover:text-gray-500" />}
          <div>
            <h3 className="font-bold text-gray-950 text-sm">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {action}
          {id && onResize && (
            <div className="flex items-center gap-2 mr-2">
              <span className="text-[10px] text-gray-400 font-medium">Lebar</span>
              <input
                type="range" min="3" max="12" step="1"
                value={getChartSize(id, preferredSize)}
                onChange={(e) => onResize(id, parseInt(e.target.value))}
                className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#276749]"
                title="Geser untuk mengatur lebar grafik"
              />
            </div>
          )}
          {id && onSettings && (
            <button
              type="button"
              onClick={() => onSettings()}
              className="p-1 text-gray-400 hover:text-[#276749] hover:bg-[#276749]/10 rounded-md transition-colors"
              title="Atur kolom chart"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          {id && onHide && (
            <button
              type="button"
              onClick={() => onHide(id)}
              className="p-1 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              title="Sembunyikan bagan ini"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className={`${compact ? 'w-full' : 'flex-1 flex flex-col w-full min-h-[168px]'}`}>
        {children}
      </div>
    </div>
  );

  const renderInsight = () => {
    if (!dashboardData || processedData.length === 0) {
      return (
        <div className="p-8 flex flex-col items-center justify-center h-full text-center mt-20">
          <div className="w-20 h-20 bg-[#DCF4E7] text-[#276749] rounded-full flex items-center justify-center mb-6">
            <Lightbulb className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold mb-3 text-gray-900">Belum Ada Insight</h1>
          <p className="text-gray-500 max-w-md text-base leading-relaxed mb-6">
            Upload data penjualan atau gunakan data contoh agar rekomendasi bisnis bisa dibuat.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => { setWizardStep(1); setCurrentView('wizard'); }} className="bg-[#276749] text-white px-5 py-2.5 rounded-lg font-bold">
              Upload Data
            </button>
            <button onClick={handleUseDemoData} className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-bold">
              Pakai Data Contoh
            </button>
          </div>
        </div>
      );
    }

    const { kpis, insights, executiveSummary, dataHealth, businessProfile, analystQuestions, customerSegments, productQuadrants, pareto, rowStats, dateRange, insightConfidence, weeklyActionPlan } = dashboardData;
    const priorityFindings = insights.slice(0, 6);
    const quickWins = [
      kpis.profitMargin < 10 && 'Audit HPP, diskon, retur, dan biaya platform karena margin masih tipis.',
      pareto?.products?.top20Share > 80 && 'Amankan stok produk kontributor utama dan siapkan produk pengganti.',
      customerSegments?.repeatRate < 25 && 'Buat promo balik sederhana untuk menaikkan repeat customer.',
      dataHealth?.score < 85 && 'Rapikan kolom wajib sebelum mengambil keputusan besar dari dashboard.',
      productQuadrants?.find(item => item.name === 'Hidden Gem') && 'Dorong produk hidden gem lewat bundling atau penempatan promo.',
    ].filter(Boolean);

    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-sm font-bold text-[#276749] uppercase">Insight Bisnis</p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-950 mt-1">Rekomendasi Aksi</h1>
            <p className="text-gray-500 mt-2">
              {dateRange ? `Periode ${dateRange.start} sampai ${dateRange.end}` : 'Membaca dataset aktif'} dari {formatNumber(rowStats.filteredRows)} baris terfilter.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCurrentView('dashboard')} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold">
              Lihat Dashboard
            </button>
            <button onClick={() => setCurrentView('pengaturan')} className="bg-[#276749] text-white px-4 py-2 rounded-lg text-sm font-bold">
              Atur Rumus
            </button>
          </div>
        </div>

        <section className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-bold text-gray-500 uppercase">Omzet</p>
            <p className="mt-2 text-xl font-extrabold text-gray-950">{formatRupiah(kpis.totalOmzet)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-bold text-gray-500 uppercase">Margin</p>
            <p className="mt-2 text-xl font-extrabold text-gray-950">{kpis.profitMargin.toFixed(1)}%</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-bold text-gray-500 uppercase">Repeat Customer</p>
            <p className="mt-2 text-xl font-extrabold text-gray-950">{customerSegments?.repeatRate?.toFixed(1) || '0.0'}%</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-bold text-gray-500 uppercase">Kualitas Data</p>
            <p className="mt-2 text-xl font-extrabold text-gray-950">{dataHealth.score}/100</p>
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#276749]" />
                  <h2 className="font-extrabold text-gray-950">Aksi Minggu Ini</h2>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-[#F1FAF5] text-[#276749] border border-[#DCF4E7]">
                  Confidence {insightConfidence?.label || 'Sedang'} ({insightConfidence?.score ?? dataHealth.score}/100)
                </span>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {(weeklyActionPlan?.length ? weeklyActionPlan : [{ priority: 'Dasar', area: 'Analisis', action: 'Gunakan filter periode, produk, dan channel untuk mencari peluang yang paling relevan.', evidence: 'Belum ada sinyal prioritas khusus dari data terfilter.' }]).map((item, idx) => (
                  <div key={`${item.area}-${idx}`} className="border border-gray-200 rounded-lg p-4 bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-gray-950 text-sm">{item.area}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">{item.priority}</span>
                    </div>
                    <p className="text-sm text-gray-800 mt-2 leading-relaxed">{item.action}</p>
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">{item.evidence}</p>
                  </div>
                ))}
              </div>
              {insightConfidence?.missingSignals?.length > 0 && (
                <p className="mt-3 text-xs text-gray-500">
                  Agar rekomendasi makin kuat: {insightConfidence.missingSignals.slice(0, 3).join(', ')}.
                </p>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-[#276749]" />
                <h2 className="font-extrabold text-gray-950">Ringkasan Eksekutif</h2>
              </div>
              <div className="space-y-3">
                {executiveSummary.map((line, idx) => (
                  <div key={idx} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#F1FAF5] text-[#276749] text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                    <p className="text-sm text-gray-700 leading-relaxed">{line}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-[#276749]" />
                <h2 className="font-extrabold text-gray-950">Prioritas Aksi</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {priorityFindings.map((item, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-slate-50">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${item.type === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-[#F1FAF5] text-[#276749]'}`}>
                        {item.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-950 text-sm">{item.title || 'Temuan Bisnis'}</h3>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.finding || item.text}</p>
                      </div>
                    </div>
                    <div className="mt-3 border-t border-gray-200 pt-3 space-y-2">
                      <p className="text-xs text-gray-500"><span className="font-bold text-gray-700">Dampak:</span> {item.impact}</p>
                      <p className="text-xs text-gray-500"><span className="font-bold text-gray-700">Aksi:</span> {item.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-[#276749]" />
                <h2 className="font-extrabold text-gray-950">Quick Wins</h2>
              </div>
              <div className="space-y-3">
                {(quickWins.length ? quickWins : ['Pertahankan produk dan channel utama, lalu gunakan filter dashboard untuk mencari peluang margin yang lebih tinggi.']).map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#276749] shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="font-extrabold text-gray-950 mb-3">Profil Bisnis Terdeteksi</h2>
              <p className="text-lg font-bold text-[#276749]">{businessProfile.type}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {businessProfile.focus.map(item => (
                  <span key={item} className="text-xs font-bold px-2 py-1 rounded-full bg-[#F1FAF5] text-[#276749] border border-[#DCF4E7]">{item}</span>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="font-extrabold text-gray-950 mb-3">Kesehatan Data</h2>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-700">{dataHealth.label}</span>
                <span className="text-sm font-extrabold text-[#276749]">{dataHealth.score}/100</span>
              </div>
              <div className="space-y-2">
                {(dataHealth.issues.length ? dataHealth.issues : [{ text: 'Tidak ada isu besar yang terdeteksi.' }]).slice(0, 4).map((item, idx) => (
                  <p key={idx} className="text-xs text-gray-600 leading-relaxed border-t border-gray-100 pt-2">{item.text}</p>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="font-extrabold text-gray-950 mb-3">Pertanyaan Lanjutan</h2>
              <div className="space-y-2">
                {analystQuestions.slice(0, 5).map(question => (
                  <p key={question} className="text-sm text-gray-700 border-b border-gray-100 pb-2 last:border-b-0">{question}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  };

  const renderReport = () => {
    if (!dashboardData || processedData.length === 0) {
      return (
        <div className="p-8 flex flex-col items-center justify-center h-full text-center mt-20">
          <div className="w-20 h-20 bg-[#DCF4E7] text-[#276749] rounded-full flex items-center justify-center mb-6">
            <FileText className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold mb-3 text-gray-900">Belum Ada Laporan</h1>
          <p className="text-gray-500 max-w-md text-base leading-relaxed mb-6">
            Laporan otomatis akan tersedia setelah data penjualan diproses.
          </p>
          <button onClick={() => { setWizardStep(1); setCurrentView('wizard'); }} className="bg-[#276749] text-white px-5 py-2.5 rounded-lg font-bold">
            Upload Data
          </button>
        </div>
      );
    }

    const { kpis, insights, executiveSummary, dataHealth, businessProfile, customerSegments, pareto, rowStats, dateRange, insightConfidence, weeklyActionPlan } = dashboardData;
    const reportDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const topInsights = insights.slice(0, 5);

    return (
      <div className="bg-slate-100 min-h-screen p-4 md:p-8 print:bg-white print:p-0">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5 print:hidden">
            <div>
              <p className="text-sm font-bold text-[#276749] uppercase">Laporan</p>
              <h1 className="text-2xl font-extrabold text-gray-950">Laporan Analitik UMKM</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setCurrentView('insight')} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold">
                Lihat Insight
              </button>
              <button onClick={() => window.print()} className="bg-[#276749] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                <Printer className="w-4 h-4" /> Export PDF
              </button>
            </div>
          </div>

          <article className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 md:p-10 print:shadow-none print:border-0 print:rounded-none">
            <header className="border-b border-gray-200 pb-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-950">Laporan Analitik UMKM</h1>
                  <p className="text-gray-500 mt-2">
                    {businessType || businessProfile.type} - dibuat pada {reportDate}
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-sm text-gray-500">Periode data</p>
                  <p className="font-bold text-gray-900">{dateRange ? `${dateRange.start} - ${dateRange.end}` : 'Semua data'}</p>
                  <p className="text-sm text-gray-500 mt-1">{formatNumber(rowStats.filteredRows)} dari {formatNumber(rowStats.totalRows)} baris</p>
                </div>
              </div>
            </header>

            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 print:grid-cols-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-bold text-gray-500 uppercase">Omzet</p>
                <p className="mt-2 text-lg font-extrabold text-gray-950">{formatRupiah(kpis.totalOmzet)}</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-bold text-gray-500 uppercase">Transaksi</p>
                <p className="mt-2 text-lg font-extrabold text-gray-950">{formatNumber(kpis.totalTransaksi)}</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-bold text-gray-500 uppercase">AOV</p>
                <p className="mt-2 text-lg font-extrabold text-gray-950">{formatRupiah(kpis.avgTransaksi)}</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-bold text-gray-500 uppercase">Margin</p>
                <p className="mt-2 text-lg font-extrabold text-gray-950">{kpis.profitMargin.toFixed(1)}%</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-extrabold text-gray-950 mb-4">Ringkasan Eksekutif</h2>
              <div className="space-y-3">
                {executiveSummary.map((line, idx) => (
                  <div key={idx} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#F1FAF5] text-[#276749] text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                    <p className="text-sm text-gray-700 leading-relaxed">{line}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-extrabold text-gray-950 mb-4">Prioritas Minggu Ini</h2>
              <div className="space-y-3">
                {(weeklyActionPlan?.length ? weeklyActionPlan : []).slice(0, 4).map((item, idx) => (
                  <div key={`${item.area}-${idx}`} className="border border-gray-200 rounded-lg p-4 break-inside-avoid">
                    <div className="flex justify-between gap-3">
                      <h3 className="font-bold text-gray-950">{item.area}</h3>
                      <span className="text-xs font-bold text-gray-500">{item.priority}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{item.action}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.evidence}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Tingkat kepercayaan insight: {insightConfidence?.label || 'Sedang'} ({insightConfidence?.score ?? dataHealth.score}/100). {insightConfidence?.note || ''}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-extrabold text-gray-950 mb-4">Temuan Dan Rekomendasi</h2>
              <div className="space-y-4">
                {topInsights.map((item, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 break-inside-avoid">
                    <h3 className="font-bold text-gray-950">{item.title || 'Temuan Bisnis'}</h3>
                    <p className="text-sm text-gray-700 mt-1">{item.finding || item.text}</p>
                    <div className="grid md:grid-cols-2 gap-3 mt-3">
                      <p className="text-sm text-gray-600"><span className="font-bold text-gray-800">Dampak:</span> {item.impact}</p>
                      <p className="text-sm text-gray-600"><span className="font-bold text-gray-800">Aksi:</span> {item.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid md:grid-cols-3 gap-4 mb-8 print:grid-cols-3">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-950 mb-2">Konsentrasi Produk</h3>
                <p className="text-sm text-gray-600">Top 20% produk menyumbang {pareto.products.top20Share.toFixed(1)}% omzet.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-950 mb-2">Retensi Pelanggan</h3>
                <p className="text-sm text-gray-600">Repeat customer rate {customerSegments.repeatRate.toFixed(1)}% dari {formatNumber(customerSegments.total)} pelanggan.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-950 mb-2">Kualitas Data</h3>
                <p className="text-sm text-gray-600">{dataHealth.label} dengan skor {dataHealth.score}/100.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-gray-950 mb-4">Catatan Kualitas Data</h2>
              <div className="space-y-2">
                {(dataHealth.issues.length ? dataHealth.issues : [{ text: 'Tidak ada isu kualitas data besar yang terdeteksi.' }]).map((item, idx) => (
                  <p key={idx} className="text-sm text-gray-700 border-b border-gray-100 pb-2 last:border-b-0">{item.text}</p>
                ))}
              </div>
            </section>
          </article>
        </div>
      </div>
    );
  };



  // --- MAIN RENDER ---
  return (
    <div className="flex h-screen bg-[#F8FAF9] font-sans text-gray-900">
      {/* Sidebar (Hidden on Home) */}
      {renderSidebar()}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Demo Header or Mobile Header */}
        {isDemo ? (
          <header className="bg-white h-16 border-b border-gray-200 flex items-center px-6 justify-between print:hidden shadow-sm shrink-0">
            <div className="flex items-center gap-2.5">
              <img src={logoImg} alt="DashInsight Logo" className="h-12 w-auto object-contain" />
              <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Demo Mode
              </span>
            </div>
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all ${currentView === 'dashboard' ? 'bg-[#276749] text-white shadow-sm' : 'text-gray-600 hover:text-gray-950'}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('insight')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all ${currentView === 'insight' ? 'bg-[#276749] text-white shadow-sm' : 'text-gray-600 hover:text-gray-950'}`}
              >
                Insight Bisnis
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block bg-[#F1FAF5] text-[#276749] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#d1fae5]">
                Fitur Terbatas
              </span>
            </div>
          </header>
        ) : (
          <header className="md:hidden bg-white h-14 border-b border-gray-200 flex items-center px-4 justify-between print:hidden">
            <div className="flex items-center gap-2 text-[#276749]">
              <BarChart3 className="w-5 h-5" />
              <span className="font-bold">UMKM Dashboard Insight</span>
            </div>
            {currentView !== 'home' && (
              <button onClick={() => setCurrentView('home')} className="text-sm text-gray-600">Beranda</button>
            )}
          </header>
        )}

        {/* Content Area */}
        <main ref={mainScrollRef} className="flex-1 overflow-auto">
          {currentView === 'home' && renderHome()}
          {currentView === 'wizard' && renderWizard()}
          {currentView === 'dashboard' && renderDashboard()}
          {currentView === 'insight' && renderInsight()}
          {currentView === 'laporan' && renderReport()}
          {currentView === 'chartlib' && (
            <div className="p-4 md:p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Visualisasi Data</h1>
              <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <p className="text-sm text-gray-500">Sesuaikan chart dengan kolom dataset aktif. Pengaturan hanya disimpan di perangkat ini.</p>
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" placeholder="Cari nama chart..." value={chartSearchQuery} onChange={e => setChartSearchQuery(e.target.value)} className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]" />
                </div>
              </div>
              {processedData.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                  <FileSpreadsheet className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <h3 className="text-lg font-bold text-gray-900">Upload data terlebih dahulu</h3>
                  <p className="mt-2 text-sm text-gray-500">Pilihan chart akan mengikuti kolom pada dataset aktif.</p>
                </div>
              ) : chartTemplates.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {chartTemplates.filter(template => !chartSearchQuery || template.chart_name.toLowerCase().includes(chartSearchQuery.toLowerCase())).map((tpl) => (
                    <div key={tpl.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: tpl.chart_type === 'pie' || tpl.chart_type === 'doughnut' ? '#eff6ff' : tpl.chart_type === 'line' ? '#ecfdf5' : '#f5f3ff' }}>
                          <BarChart3 className="w-5 h-5" style={{ color: tpl.chart_type === 'pie' || tpl.chart_type === 'doughnut' ? '#2563eb' : tpl.chart_type === 'line' ? '#059669' : '#7c3aed' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-gray-900 truncate">{tpl.chart_name}</h3>
                          <p className="text-xs text-gray-500">{tpl.chart_type} · {tpl.chart_category || 'general'}</p>
                        </div>
                        <button type="button" onClick={() => setMappingTemplate(tpl)} className="inline-flex shrink-0 items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"><Settings className="h-3.5 w-3.5" /> Atur</button>
                      </div>
                      {tpl.description && <p className="text-xs text-gray-500 mb-3">{tpl.description}</p>}
                      <div className="flex flex-wrap gap-1">
                        {tpl.chart_fields?.map(field => {
                          const mapped = getMappedColumn(tpl, field);
                          return mapped ? <span key={field.id} className="rounded bg-emerald-50 px-2 py-1 text-[10px] text-emerald-700">{field.field_role}: {mapped}</span> : null;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <BarChart3 className="mx-auto w-12 h-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Belum ada chart template</h3>
                  <p className="text-sm text-gray-500">Hubungi admin untuk membuat chart template baru.</p>
                </div>
              )}

              {mappingTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="client-chart-mapping-title">
                  <button className="fixed inset-0 bg-black/50" onClick={() => setMappingTemplate(null)} aria-label="Tutup" />
                  <div className="relative w-full max-w-xl rounded-xl bg-white shadow-xl">
                    <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
                      <div><h2 id="client-chart-mapping-title" className="font-bold text-gray-900">Atur Kolom Chart</h2><p className="mt-1 text-sm text-gray-600">{mappingTemplate.chart_name}</p></div>
                      <button onClick={() => setMappingTemplate(null)} className="rounded-md p-1 text-gray-500 hover:bg-gray-100" aria-label="Tutup"><X className="h-5 w-5" /></button>
                    </div>
                    <div className="max-h-[60vh] space-y-4 overflow-y-auto p-5">
                      {(mappingTemplate.chart_fields || []).map(field => (
                        <label key={field.id} className="block text-sm font-medium text-gray-700">
                          {field.field_label} <span className="text-xs font-normal text-gray-500">({field.field_role === 'target' ? 'angka target' : field.field_role}{field.is_required ? ', wajib' : ''})</span>
                          {field.field_role === 'target' ? (
                            <input type="text" placeholder="Contoh: 150000000" value={getMappedColumn(mappingTemplate, field)} onChange={event => updateLocalChartMapping(mappingTemplate.id, field.id, event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]" />
                          ) : (
                            <select value={getMappedColumn(mappingTemplate, field)} onChange={event => updateLocalChartMapping(mappingTemplate.id, field.id, event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#276749]">
                              <option value="">Tidak digunakan</option>
                              {availableDataColumns.map(column => <option key={column} value={column}>{column}</option>)}
                            </select>
                          )}
                        </label>
                      ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4"><p className="text-xs text-gray-500">Tersimpan lokal, tidak dikirim ke database.</p><button onClick={() => setMappingTemplate(null)} className="rounded-md bg-[#276749] px-4 py-2 text-sm font-semibold text-white">Selesai</button></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentView === 'data' && (
            <div className="p-4 md:p-8">
              <h1 className="text-2xl font-bold mb-4">Data Saya</h1>
              <div className="bg-white p-6 rounded-xl border">
                <p className="text-gray-600 mb-4">Anda memiliki {processedData.length} baris data transaksi yang tersimpan di sesi ini.</p>
                <button onClick={() => { setWizardStep(2); setCurrentView('wizard'); }} className="bg-white border border-gray-300 px-4 py-2 rounded-md font-medium text-sm hover:bg-gray-50">
                  Upload Data Baru
                </button>
              </div>
              <div className="mt-4 bg-white p-6 rounded-xl border">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Riwayat Dataset</h2>
                <div className="divide-y divide-gray-100">
                  {datasetHistory.length ? datasetHistory.map(item => (
                    <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="mt-1 text-sm text-gray-500">{formatNumber(item.rows)} baris - {item.businessType} - {item.savedAt}</p>
                    </div>
                  )) : <p className="text-sm text-gray-500">Belum ada riwayat dataset.</p>}
                </div>
              </div>
            </div>
          )}
          {currentView === 'pengaturan' && (
            <div className="p-4 md:p-8 max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold mb-2 text-gray-900">Rumus KPI Dashboard</h1>
              <p className="text-gray-600 mb-8">Sesuaikan cara dashboard menghitung indikator keuangan utama berdasarkan data Anda.</p>

              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">1. Rumus Pendapatan Bersih (Net Revenue)</h2>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="radio" name="netRevenue" value="gross" checked={dashboardSettings.netRevenueFormula === 'gross'} onChange={(e) => setDashboardSettings({ ...dashboardSettings, netRevenueFormula: e.target.value })} className="mt-1 w-4 h-4 text-[#276749] border-gray-300 focus:ring-[#276749]" />
                      <div>
                        <p className="font-semibold text-gray-900">Total Penjualan Kotor (Hanya Omzet)</p>
                        <p className="text-sm text-gray-500">Omzet mentah tanpa potongan apapun.</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="radio" name="netRevenue" value="net_of_returns" checked={dashboardSettings.netRevenueFormula === 'net_of_returns'} onChange={(e) => setDashboardSettings({ ...dashboardSettings, netRevenueFormula: e.target.value })} className="mt-1 w-4 h-4 text-[#276749] border-gray-300 focus:ring-[#276749]" />
                      <div>
                        <p className="font-semibold text-gray-900">Omzet Dikurangi Retur</p>
                        <p className="text-sm text-gray-500">Total omzet dikurangi pengembalian dana (refund/retur).</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="radio" name="netRevenue" value="net_of_discounts_returns" checked={dashboardSettings.netRevenueFormula === 'net_of_discounts_returns'} onChange={(e) => setDashboardSettings({ ...dashboardSettings, netRevenueFormula: e.target.value })} className="mt-1 w-4 h-4 text-[#276749] border-gray-300 focus:ring-[#276749]" />
                      <div>
                        <p className="font-semibold text-gray-900">Omzet Bersih Total</p>
                        <p className="text-sm text-gray-500">Omzet dikurangi retur dan juga dikurangi semua diskon.</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="radio" name="netRevenue" value="revenue_per_unit" checked={dashboardSettings.netRevenueFormula === 'revenue_per_unit'} onChange={(e) => setDashboardSettings({ ...dashboardSettings, netRevenueFormula: e.target.value })} className="mt-1 w-4 h-4 text-[#276749] border-gray-300 focus:ring-[#276749]" />
                      <div>
                        <p className="font-semibold text-gray-900">Pendapatan Bersih per Unit</p>
                        <p className="text-sm text-gray-500">Total omzet dibagi jumlah unit yang terjual  -  berguna untuk analisis pricing.</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">2. Rumus Laba Bersih (Net Profit)</h2>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="radio" name="profit" value="auto" checked={dashboardSettings.profitFormula === 'auto'} onChange={(e) => setDashboardSettings({ ...dashboardSettings, profitFormula: e.target.value })} className="mt-1 w-4 h-4 text-[#276749] border-gray-300 focus:ring-[#276749]" />
                      <div>
                        <p className="font-semibold text-gray-900">Otomatis (Bawaan File)</p>
                        <p className="text-sm text-gray-500">Menggunakan kolom Profit yang ada di file, jika tidak ada, gunakan Omzet dikurangi HPP.</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="radio" name="profit" value="gross_profit" checked={dashboardSettings.profitFormula === 'gross_profit'} onChange={(e) => setDashboardSettings({ ...dashboardSettings, profitFormula: e.target.value })} className="mt-1 w-4 h-4 text-[#276749] border-gray-300 focus:ring-[#276749]" />
                      <div>
                        <p className="font-semibold text-gray-900">Laba Kotor Standar</p>
                        <p className="text-sm text-gray-500">Hanya Pendapatan Bersih dikurangi Harga Pokok Penjualan (HPP).</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="radio" name="profit" value="operating_profit" checked={dashboardSettings.profitFormula === 'operating_profit'} onChange={(e) => setDashboardSettings({ ...dashboardSettings, profitFormula: e.target.value })} className="mt-1 w-4 h-4 text-[#276749] border-gray-300 focus:ring-[#276749]" />
                      <div>
                        <p className="font-semibold text-gray-900">Laba Operasional Ketat</p>
                        <p className="text-sm text-gray-500">Pendapatan Bersih dikurangi HPP, lalu dikurangi lagi dengan Pajak, Komisi Staff, dan Biaya Platform.</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="radio" name="profit" value="margin_percentage" checked={dashboardSettings.profitFormula === 'margin_percentage'} onChange={(e) => setDashboardSettings({ ...dashboardSettings, profitFormula: e.target.value })} className="mt-1 w-4 h-4 text-[#276749] border-gray-300 focus:ring-[#276749]" />
                      <div>
                        <p className="font-semibold text-gray-900">Margin Persentase</p>
                        <p className="text-sm text-gray-500">Menampilkan laba sebagai persentase dari Pendapatan Bersih  -  standar analisis profitabilitas.</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">3. Rata-rata Nilai Transaksi (AOV)</h2>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="radio" name="aov" value="net" checked={dashboardSettings.aovFormula === 'net'} onChange={(e) => setDashboardSettings({ ...dashboardSettings, aovFormula: e.target.value })} className="mt-1 w-4 h-4 text-[#276749] border-gray-300 focus:ring-[#276749]" />
                      <div>
                        <p className="font-semibold text-gray-900">Pendapatan Bersih per Transaksi</p>
                        <p className="text-sm text-gray-500">Membagi nilai Pendapatan Bersih (opsi #1) dengan jumlah transaksi unik.</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="radio" name="aov" value="gross" checked={dashboardSettings.aovFormula === 'gross'} onChange={(e) => setDashboardSettings({ ...dashboardSettings, aovFormula: e.target.value })} className="mt-1 w-4 h-4 text-[#276749] border-gray-300 focus:ring-[#276749]" />
                      <div>
                        <p className="font-semibold text-gray-900">Penjualan Kotor per Transaksi</p>
                        <p className="text-sm text-gray-500">Membagi total Omzet dengan jumlah transaksi unik tanpa peduli diskon/retur.</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="radio" name="aov" value="per_unique_customer" checked={dashboardSettings.aovFormula === 'per_unique_customer'} onChange={(e) => setDashboardSettings({ ...dashboardSettings, aovFormula: e.target.value })} className="mt-1 w-4 h-4 text-[#276749] border-gray-300 focus:ring-[#276749]" />
                      <div>
                        <p className="font-semibold text-gray-900">Omzet per Pelanggan Unik</p>
                        <p className="text-sm text-gray-500">Total Omzet dibagi jumlah pelanggan unik  -  mengukur nilai seumur hidup pelanggan (CLV).</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">4. Inventory Turnover</h2>
                  <p className="text-sm text-gray-500 mb-3">Mengukur seberapa cepat stok produk terjual dan diganti.</p>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="radio" name="inventory" value="revenue_over_stock" checked={dashboardSettings.inventoryTurnover === 'revenue_over_stock'} onChange={(e) => setDashboardSettings({ ...dashboardSettings, inventoryTurnover: e.target.value })} className="mt-1 w-4 h-4 text-[#276749] border-gray-300 focus:ring-[#276749]" />
                      <div>
                        <p className="font-semibold text-gray-900">Omzet / Rata-rata Stok</p>
                        <p className="text-sm text-gray-500">Total Omzet dibagi rata-rata nilai stok  -  turnover rate berbasis revenue.</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="radio" name="inventory" value="units_sold_over_active" checked={dashboardSettings.inventoryTurnover === 'units_sold_over_active'} onChange={(e) => setDashboardSettings({ ...dashboardSettings, inventoryTurnover: e.target.value })} className="mt-1 w-4 h-4 text-[#276749] border-gray-300 focus:ring-[#276749]" />
                      <div>
                        <p className="font-semibold text-gray-900">Total Item Terjual / Item Aktif</p>
                        <p className="text-sm text-gray-500">Jumlah unit terjual dibagi jumlah produk aktif  -  turnover rate berbasis volume.</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">5. Customer Metrics</h2>
                  <p className="text-sm text-gray-500 mb-3">Indikator kunci untuk mengukur loyalitas dan frekuensi pelanggan.</p>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="radio" name="customer" value="retention_rate" checked={dashboardSettings.customerMetrics === 'retention_rate'} onChange={(e) => setDashboardSettings({ ...dashboardSettings, customerMetrics: e.target.value })} className="mt-1 w-4 h-4 text-[#276749] border-gray-300 focus:ring-[#276749]" />
                      <div>
                        <p className="font-semibold text-gray-900">Tingkat Retensi Pelanggan</p>
                        <p className="text-sm text-gray-500">Persentase pelanggan yang melakukan pembelian berulang  -  indikator loyalitas utama.</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="radio" name="customer" value="purchase_frequency" checked={dashboardSettings.customerMetrics === 'purchase_frequency'} onChange={(e) => setDashboardSettings({ ...dashboardSettings, customerMetrics: e.target.value })} className="mt-1 w-4 h-4 text-[#276749] border-gray-300 focus:ring-[#276749]" />
                      <div>
                        <p className="font-semibold text-gray-900">Rata-rata Frekuensi Pembelian</p>
                        <p className="text-sm text-gray-500">Jumlah transaksi dibagi pelanggan unik  -  rata-rata berapa kali pelanggan membeli.</p>
                      </div>
                    </label>
                  </div>
                </div>

              </div>


              <div className="mt-8 flex justify-end">
                <button onClick={() => setCurrentView('dashboard')} className="bg-[#276749] text-white px-6 py-2.5 rounded-lg font-bold shadow-sm hover:bg-[#1f533a] transition-colors">
                  Terapkan dan Kembali ke Dashboard
                </button>
              </div>
            </div>
          )}
          {['profil'].includes(currentView) && (
            <div className="p-4 md:p-8 h-full overflow-y-auto">
              {renderProfil()}
            </div>
          )}
          {['bantuan'].includes(currentView) && (
            <div className="p-4 md:p-8 flex flex-col items-center justify-center h-full text-center mt-12 md:mt-20">
              <div className="w-20 h-20 bg-[#DCF4E7] text-[#276749] rounded-full flex items-center justify-center mb-6">
                <LayoutGrid className="w-10 h-10" />
              </div>
              <h1 className="text-2xl font-bold mb-3 text-gray-900">Segera Hadir</h1>
              <p className="text-gray-500 max-w-md text-base leading-relaxed">Menu ini masih dalam tahap pengembangan. Kami sedang menyiapkan inovasi selanjutnya untuk Anda!</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export const DashInsightClientApp = UMKMInsight;
