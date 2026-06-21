import * as XLSX from 'xlsx';
import { FIELD_SYNONYMS } from '../constants/fields';

export const parseTransactionDate = (value: any): Date | null => {
  if (!value) return null;
  if (!isNaN(value) && Number(value) > 10000) {
    const date = new Date(Math.round((Number(value) - 25569) * 86400 * 1000));
    return isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

export const toCleanLabel = (value: any, fallback = 'Tidak Diketahui'): string => {
  const label = String(value ?? '').trim();
  return label || fallback;
};

export const groupSum = (rows: any[], key: string, fallback = 'Tidak Diketahui') => {
  const map: Record<string, { name: string; sales: number; quantity: number; transactions: number }> = {};
  rows.forEach(row => {
    const name = toCleanLabel(row[key], fallback);
    const sales = Number(row.sales_amount) || 0;
    const qty = Number(row.quantity) || 0;
    map[name] = map[name] || { name, sales: 0, quantity: 0, transactions: 0 };
    map[name].sales += sales;
    map[name].quantity += qty || 1;
    map[name].transactions += 1;
  });
  return Object.values(map).sort((a, b) => b.sales - a.sales);
};

export const parseNumericValue = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const cleaned = String(value)
    .trim()
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]+/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const NUMERIC_FIELDS = new Set([
  'sales_amount', 'quantity', 'unit_price', 'discount_amount', 'shipping_fee',
  'cogs', 'gross_profit', 'staff_commission', 'duration_mins', 'rating',
  'return_amount', 'return_quantity'
]);

export const isUsefulMappedValue = (field: string, value: any): boolean => {
  if (NUMERIC_FIELDS.has(field)) return parseNumericValue(value) !== 0;
  return String(value ?? '').trim() !== '';
};

// Simple CSV Parser (to avoid external dependencies for MVP core logic)
export const parseCSV = (text: string): { headers: string[]; data: any[] } | any[] => {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const data: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i];
    let row: Record<string, string> = {};
    let inQuotes = false;
    let val = '';
    let colIdx = 0;

    for (let j = 0; j < currentLine.length; j++) {
      const char = currentLine[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row[headers[colIdx]] = val.trim();
        val = '';
        colIdx++;
      } else {
        val += char;
      }
    }
    row[headers[colIdx]] = val.trim();
    data.push(row);
  }
  return { headers, data };
};

// --- LEVENSHTEIN DISTANCE (FUZZY MATCHING) ---
export const levenshtein = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[a.length][b.length];
};

export const getSimilarity = (str1: string, str2: string): number => {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 100;
  return ((maxLen - levenshtein(str1, str2)) / maxLen) * 100;
};

// Auto Mapping Logic
export const autoMapColumns = (headers: string[], dataRows: any[]) => {
  const mapping: any[] = [];
  const savedMappings = JSON.parse(localStorage.getItem('userColumnMappings') || '{}');

  headers.forEach(header => {
    let bestMatch: string | null = null;
    let confidence = 0;
    const lowerHeader = header.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim();

    // 1. User Memory (LocalStorage) - 100% confidence
    if (savedMappings[header]) {
      bestMatch = savedMappings[header];
      confidence = 100;
    } else {
      // 2. Synonyms and Fuzzy Match
      for (const [standardKey, synonyms] of Object.entries(FIELD_SYNONYMS)) {
        if (synonyms.includes(lowerHeader)) {
          bestMatch = standardKey;
          confidence = 100;
          break;
        }

        // Check partial match and fuzzy match
        for (const synonym of synonyms) {
          const sim = getSimilarity(lowerHeader, synonym);
          if (sim > 80 && sim > confidence) {
            bestMatch = standardKey;
            confidence = sim;
          } else if ((lowerHeader.includes(synonym) || synonym.includes(lowerHeader)) && confidence < 80) {
            bestMatch = standardKey;
            confidence = 80;
          }
        }
      }

      // 3. Data Profiling (if confidence is not high enough)
      if (confidence < 90 && dataRows.length > 0) {
        const samples = dataRows.slice(0, 5).map(r => String(r[header] || '').trim()).filter(Boolean);
        if (samples.length > 0) {
          // Check Time (HH:MM)
          const isTime = samples.every(s => /^([01]?[0-9]|2[0-3]):[0-5][0-9]/.test(s));
          if (isTime && (!bestMatch || confidence < 50)) {
            bestMatch = 'transaction_time';
            confidence = 90;
          }
          // Check Large Number (Price/Revenue)
          const isBigNumber = samples.every(s => !isNaN(Number(s.replace(/[^0-9]/g, ''))) && Number(s.replace(/[^0-9]/g, '')) > 5000);
          if (isBigNumber && (!bestMatch || confidence < 40)) {
            if (lowerHeader.includes('total') || lowerHeader.includes('tagihan')) {
              bestMatch = 'sales_amount';
              confidence = 85;
            }
          }
        }
      }
    }

    for (const [standardKey, synonyms] of Object.entries(FIELD_SYNONYMS)) {
      if (synonyms.includes(lowerHeader)) {
        bestMatch = standardKey;
        confidence = 100;
        break;
      }

      const partialMatch = synonyms.find(s => lowerHeader.includes(s) || s.includes(lowerHeader));
      if (partialMatch && confidence < 80) {
        bestMatch = standardKey;
        confidence = 80;
      }
    }

    mapping.push({
      sourceColumn: header,
      targetField: bestMatch,
      confidence: bestMatch ? confidence : 0,
      sampleValues: dataRows.slice(0, 3).map(r => r[header]),
      confirmedByUser: false
    });
  });
  const bestByTarget: Record<string, { item: any; index: number }> = {};
  mapping.forEach((item, index) => {
    if (!item.targetField) return;
    const current = bestByTarget[item.targetField];
    if (!current || item.confidence > current.item.confidence) {
      bestByTarget[item.targetField] = { item, index };
    }
  });

  return mapping.map((item, index) => {
    if (!item.targetField) return item;
    return bestByTarget[item.targetField]?.index === index ? item : { ...item, targetField: null, confidence: 0 };
  });
};

export const extractSheetData = (worksheet: XLSX.WorkSheet) => {
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", raw: false, dateNF: 'yyyy-mm-dd hh:mm:ss' }) as any[];
  if (rawRows.length === 0) return { headers: [], data: [], headerRowIndex: 0, rawRows: [] };

  let headerRowIndex = 0;
  let maxCols = 0;
  for (let i = 0; i < Math.min(25, rawRows.length); i++) {
    const row = rawRows[i];
    if (!Array.isArray(row)) continue;
    const nonEmptyCount = row.filter(cell => cell !== null && cell !== undefined && String(cell).trim() !== '').length;
    if (nonEmptyCount > maxCols) {
      maxCols = nonEmptyCount;
      headerRowIndex = i;
    }
  }

  const headers = (rawRows[headerRowIndex] as any[]).map((h, i) => {
    const val = h ? String(h).trim() : '';
    return val || `Kolom_Tanpa_Nama_${i + 1}`;
  });

  const data: any[] = [];
  for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
    const rowArr = rawRows[i];
    if (!Array.isArray(rowArr) || rowArr.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) continue;

    const rowObj: Record<string, any> = {};
    headers.forEach((h, colIdx) => {
      rowObj[h] = rowArr[colIdx] !== undefined ? rowArr[colIdx] : "";
    });
    data.push(rowObj);
  }

  return { headers, data, headerRowIndex, rawRows };
};

export const profileSheet = (name: string, worksheet: XLSX.WorkSheet) => {
  const extracted = extractSheetData(worksheet);
  const lowerName = name.toLowerCase();
  const headerText = extracted.headers.join(' ').toLowerCase();
  const mapped = autoMapColumns(extracted.headers, extracted.data);
  const mappedFields = new Set(mapped.map(item => item.targetField).filter(Boolean));
  let score = 0;

  if (/raw|clean|transaksi|transaction|upload|order|sales|penjualan/.test(lowerName)) score += 35;
  if (/readme|mapping|issue|summary|monthly|master/.test(lowerName)) score -= 35;
  if (mappedFields.has('sales_amount')) score += 25;
  if (mappedFields.has('transaction_date')) score += 20;
  if (mappedFields.has('product_name')) score += 15;
  if (mappedFields.has('quantity')) score += 8;
  if (extracted.data.length > 20) score += 12;
  if (/total|omzet|invoice|produk|barang|qty|tanggal|order/.test(headerText)) score += 10;

  const type = /readme/.test(lowerName)
    ? 'Dokumentasi'
    : /master/.test(lowerName)
      ? 'Master Data'
      : /summary|monthly/.test(lowerName)
        ? 'Ringkasan'
        : score >= 35
          ? 'Transaksi'
          : 'Lainnya';

  return {
    name,
    type,
    score,
    recommended: false,
    headers: extracted.headers,
    data: extracted.data,
    headerRowIndex: extracted.headerRowIndex,
    rowCount: extracted.data.length,
    columnCount: extracted.headers.length,
    sample: extracted.data.slice(0, 3),
  };
};
