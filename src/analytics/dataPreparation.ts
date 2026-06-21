import { EXCEL_EPOCH_OFFSET, EXCEL_DATE_THRESHOLD } from '../lib/constants';

type DataRow = Record<string, unknown>;
type LabelField = keyof typeof LABEL_ALIASES | string;

const TITLE_CASE_EXCEPTIONS = new Set(['qris', 'cod', 'pos', 'bca', 'bri', 'bni', 'ovo', 'gopay', 'dana']);

const LABEL_ALIASES: Record<string, Record<string, string>> = {
  sales_channel: {
    gofood: 'GoFood',
    'go food': 'GoFood',
    grabfood: 'GrabFood',
    'grab food': 'GrabFood',
    shopeefood: 'ShopeeFood',
    'shopee food': 'ShopeeFood',
    offline: 'Toko Fisik',
    'toko offline': 'Toko Fisik',
    toko: 'Toko Fisik',
  },
  payment_method: {
    qris: 'QRIS',
    qr: 'QRIS',
    cash: 'Tunai',
    tunai: 'Tunai',
    debit: 'Debit',
    'kartu debit': 'Debit',
    credit: 'Kartu Kredit',
    kredit: 'Kartu Kredit',
    transfer: 'Transfer',
    tf: 'Transfer',
    gopay: 'GoPay',
    ovo: 'OVO',
    dana: 'DANA',
    cod: 'COD',
  },
  payment_status: {
    selesai: 'Selesai',
    completed: 'Selesai',
    paid: 'Lunas',
    lunas: 'Lunas',
    cancel: 'Dibatalkan',
    cancelled: 'Dibatalkan',
    batal: 'Dibatalkan',
    refund: 'Refund',
  },
};

const LABEL_FIELDS = [
  'product_name',
  'category',
  'brand',
  'variant',
  'payment_method',
  'payment_status',
  'customer_name',
  'sales_channel',
  'destination_city',
  'branch',
  'staff_name',
  'supplier',
];

const NUMERIC_FIELDS = [
  'quantity',
  'unit_price',
  'discount_amount',
  'shipping_fee',
  'cogs',
  'gross_profit',
  'sales_amount',
  'return_amount',
  'return_quantity',
  'staff_commission',
  'rating',
  'duration_mins',
  'tax',
  'service_charge',
  'platform_fee',
];

export const normalizeText = (value: unknown): string => {
  const raw = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!raw) return '';
  return raw;
};

export const normalizeLabel = (field: LabelField, value: unknown): string => {
  const raw = normalizeText(value);
  if (!raw) return '';
  const lower = raw.toLowerCase();
  const alias = LABEL_ALIASES[field]?.[lower];
  if (alias) return alias;
  if (TITLE_CASE_EXCEPTIONS.has(lower)) return lower.toUpperCase();
  return raw
    .split(' ')
    .map(part => {
      const clean = part.trim();
      if (!clean) return clean;
      const lowerPart = clean.toLowerCase();
      if (TITLE_CASE_EXCEPTIONS.has(lowerPart)) return lowerPart.toUpperCase();
      return lowerPart.charAt(0).toUpperCase() + lowerPart.slice(1);
    })
    .join(' ');
};

export const parsePreparedNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const cleaned = String(value)
    .replace(/rp/gi, '')
    .replace(/\s/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const normalizeDateValue = (value: unknown): string => {
  if (!value) return '';
  if (!Number.isNaN(value) && Number(value) > EXCEL_DATE_THRESHOLD) {
    const date = new Date(Math.round((Number(value) - EXCEL_EPOCH_OFFSET) * 86400 * 1000));
    return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().split('T')[0];
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value).trim() : date.toISOString().split('T')[0];
};

export const normalizeTimeValue = (value: unknown): string => {
  const raw = normalizeText(value);
  if (!raw) return '';
  const match = raw.match(/(\d{1,2})[:.](\d{1,2})/);
  if (match) {
    const hh = Math.min(23, Number(match[1])).toString().padStart(2, '0');
    const mm = Math.min(59, Number(match[2])).toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }
  const hourOnly = raw.match(/^\d{1,2}$/);
  if (hourOnly) return `${Math.min(23, Number(raw)).toString().padStart(2, '0')}:00`;
  return raw;
};

export const enrichRow = (row: DataRow): DataRow & { __qualityFlags: string[] } => {
  const next: DataRow & { __qualityFlags?: string[] } = { ...row };

  LABEL_FIELDS.forEach(field => {
    if (next[field] !== undefined) next[field] = normalizeLabel(field, next[field]);
  });
  NUMERIC_FIELDS.forEach(field => {
    if (next[field] !== undefined) next[field] = parsePreparedNumber(next[field]);
  });
  if (next.transaction_date !== undefined) next.transaction_date = normalizeDateValue(next.transaction_date);
  if (next.transaction_time !== undefined) next.transaction_time = normalizeTimeValue(next.transaction_time);

  if (!next.quantity || Number(next.quantity) <= 0) next.quantity = 1;
  if (!next.gross_profit && next.sales_amount && next.cogs) {
    next.gross_profit = Number(next.sales_amount) - Number(next.cogs);
  }
  if (!next.unit_price && next.sales_amount && next.quantity) {
    next.unit_price = Number(next.sales_amount) / Math.max(Number(next.quantity), 1);
  }

  const qualityFlags: string[] = [];
  next.__qualityFlags = qualityFlags;
  if (!next.sales_amount || Number(next.sales_amount) <= 0) qualityFlags.push('invalid_sales');
  if (next.transaction_date && Number.isNaN(new Date(String(next.transaction_date)).getTime())) qualityFlags.push('invalid_date');
  if (next.rating && (Number(next.rating) < 1 || Number(next.rating) > 5)) qualityFlags.push('invalid_rating');
  return next as DataRow & { __qualityFlags: string[] };
};

export const prepareRows = (rows: DataRow[]): Array<DataRow & { __qualityFlags: string[] }> => rows.map(enrichRow);
