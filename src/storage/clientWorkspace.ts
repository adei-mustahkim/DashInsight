import { computeDashboardAnalytics } from '../analytics/dashboardAnalytics';
import { prepareRows } from '../analytics/dataPreparation';
import type { DashboardAnalyticsOutput, DataRow } from '../types';
import type { ClientDashboardConfig, ClientChartConfig } from '../types/clientDashboard';

const WORKSPACE_KEY = 'dashinsight_client_workspace_v1';
const PREFERENCES_KEY = 'dashinsight_client_preferences_v1';

export interface ClientWorkspace {
  id: string;
  datasetName: string;
  fileName: string;
  businessType: string;
  headers: string[];
  rawHeaders?: string[];
  rows: DataRow[];
  rawRows?: DataRow[];
  processedRows?: DataRow[];
  columnMapping?: unknown[];
  filters?: Record<string, unknown>;
  // Dashboard configuration - charts enabled and their field mappings
  dashboardConfig?: ClientDashboardConfig;
  enabledCharts?: ClientChartConfig[];
  analyticsCache?: unknown;
  savedAt: string;
}

export const DEFAULT_DASHBOARD_CONFIG: ClientDashboardConfig = {
  version: 1,
  charts: [],
  layout: {
    columns: 2,
    gap: 16,
  },
  lastUpdated: new Date().toISOString(),
};

export interface ClientPreferences {
  netRevenueFormula: 'gross' | 'net_of_returns' | 'net_of_discounts_returns';
  profitFormula: 'auto' | 'gross_profit' | 'operating_profit';
  aovFormula: 'net' | 'gross';
  compactNumbers: boolean;
}

export const DEFAULT_PREFERENCES: ClientPreferences = {
  netRevenueFormula: 'gross',
  profitFormula: 'auto',
  aovFormula: 'net',
  compactNumbers: true,
};

const aliases: Record<string, string[]> = {
  transaction_date: ['transaction_date', 'tanggal', 'tgl', 'tanggal transaksi', 'order date', 'date'],
  transaction_time: ['transaction_time', 'jam', 'waktu', 'time'],
  transaction_id: ['transaction_id', 'nomor transaksi', 'no transaksi', 'invoice', 'order id'],
  product_name: ['product_name', 'nama produk', 'produk', 'barang', 'item', 'menu'],
  category: ['category', 'kategori', 'kategori produk', 'jenis'],
  quantity: ['quantity', 'qty', 'jumlah', 'jumlah barang'],
  unit_price: ['unit_price', 'harga', 'harga satuan', 'price'],
  sales_amount: ['sales_amount', 'total', 'total penjualan', 'omzet', 'revenue', 'amount', 'grand total'],
  cogs: ['cogs', 'hpp', 'modal', 'harga pokok'],
  discount_amount: ['discount_amount', 'diskon', 'discount'],
  return_amount: ['return_amount', 'retur', 'return'],
  payment_method: ['payment_method', 'metode pembayaran', 'pembayaran', 'payment'],
  customer_name: ['customer_name', 'nama pelanggan', 'pelanggan', 'customer'],
  customer_id: ['customer_id', 'id pelanggan', 'customer id'],
  sales_channel: ['sales_channel', 'channel', 'kanal', 'sales channel'],
  branch: ['branch', 'cabang', 'toko', 'outlet'],
  staff_name: ['staff_name', 'staff', 'karyawan', 'kasir'],
  brand: ['brand', 'merek'],
  supplier: ['supplier', 'pemasok'],
  rating: ['rating', 'ulasan', 'review'],
  destination_city: ['destination_city', 'kota', 'kota tujuan'],
};

const normalizeHeader = (value: string) => value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');

const DB_NAME = 'dashinsight_local_first';
const DB_VERSION = 1;
const STORE_NAME = 'workspaces';

function openWorkspaceDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB tidak tersedia.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveWorkspaceToIndexedDb(workspace: ClientWorkspace) {
  const db = await openWorkspaceDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(workspace);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function loadWorkspaceFromIndexedDb(id: string): Promise<ClientWorkspace | null> {
  const db = await openWorkspaceDb();
  const workspace = await new Promise<ClientWorkspace | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve((request.result as ClientWorkspace | undefined) || null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return workspace;
}

export const mapRowsToCanonical = (rows: DataRow[]): { rows: DataRow[]; headers: string[]; mappedCount: number } => {
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const mapping = new Map<string, string>();
  headers.forEach(header => {
    const normalized = normalizeHeader(header);
    const match = Object.entries(aliases).find(([, values]) => values.some(value => normalizeHeader(value) === normalized));
    mapping.set(header, match?.[0] || header.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''));
  });
  const mapped = rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [mapping.get(key) || key, value])));
  return { rows: mapped, headers: [...new Set(mapping.values())], mappedCount: [...mapping.entries()].filter(([source, target]) => normalizeHeader(source) !== normalizeHeader(target) || aliases[target]).length };
};

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingWorkspace: ClientWorkspace | null = null;

function debouncedSaveToIndexedDb(workspace: ClientWorkspace) {
  pendingWorkspace = workspace;
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    if (pendingWorkspace) {
      try {
        await saveWorkspaceToIndexedDb(pendingWorkspace);
      } catch {
        // localStorage remains the compatibility fallback for older browsers.
      }
      pendingWorkspace = null;
    }
  }, 500);
}

export function saveWorkspace(workspace: ClientWorkspace) {
  try {
    localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace));
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('Storage quota exceeded. Clearing old data...');
      localStorage.clear();
      throw new Error('Penyimpanan penuh. Data lama telah dihapus, silakan coba lagi.', { cause: error });
    }
    throw error;
  }
  debouncedSaveToIndexedDb(workspace);
  window.dispatchEvent(new Event('dashinsight-workspace-change'));
}

export function loadWorkspace(): ClientWorkspace | null {
  try { return JSON.parse(localStorage.getItem(WORKSPACE_KEY) || 'null') as ClientWorkspace | null; } catch { return null; }
}

export async function loadWorkspaceAsync(): Promise<ClientWorkspace | null> {
  const local = loadWorkspace();
  if (!local?.id) return local;
  try {
    return await loadWorkspaceFromIndexedDb(local.id) || local;
  } catch {
    return local;
  }
}

export function clearWorkspace() {
  localStorage.removeItem(WORKSPACE_KEY);
  window.dispatchEvent(new Event('dashinsight-workspace-change'));
}

export function loadPreferences(): ClientPreferences {
  try { return { ...DEFAULT_PREFERENCES, ...(JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}') as Partial<ClientPreferences>) }; } catch { return DEFAULT_PREFERENCES; }
}

export function savePreferences(preferences: ClientPreferences) {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('Storage quota exceeded for preferences');
      throw new Error('Penyimpanan penuh. Tidak dapat menyimpan preferensi.', { cause: error });
    }
    throw error;
  }
}


// Export workspace to .dashinsight file
export function exportWorkspace(): void {
  const workspace = loadWorkspace();
  const preferences = loadPreferences();
  if (!workspace) throw new Error('Tidak ada dataset aktif untuk di-export.');

  const payload = {
    format: 'dashinsight',
    version: 1,
    exportedAt: new Date().toISOString(),
    workspace,
    preferences,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${workspace.datasetName || 'workspace'}.dashinsight`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import workspace from .dashinsight file
export function importWorkspace(file: File): Promise<{ workspace: ClientWorkspace; message: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);

        if (data.format !== 'dashinsight') {
          reject(new Error('Format file tidak valid. Gunakan file .dashinsight.'));
          return;
        }

        if (!data.workspace || !data.workspace.rows || !data.workspace.headers) {
          reject(new Error('File workspace corrupt atau tidak lengkap.'));
          return;
        }

        saveWorkspace(data.workspace);
        if (data.preferences) {
          savePreferences(data.preferences);
        }

        resolve({
          workspace: data.workspace,
          message: `Berhasil import "${data.workspace.datasetName}" (${data.workspace.rows.length} baris).`,
        });
      } catch {
        reject(new Error('Gagal membaca file. Pastikan file .dashinsight valid.'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file.'));
    reader.readAsText(file);
  });
}

export function analyzeWorkspace(workspace: ClientWorkspace): DashboardAnalyticsOutput {
  const preferences = loadPreferences();
  const prepared = prepareRows(workspace.rows);
  const result = computeDashboardAnalytics(prepared, {
    dateFilter: 'all', trendGranularity: 'daily', categoryFilter: 'all', channelFilter: 'all', branchFilter: 'all', paymentFilter: 'all',
  }, preferences);
  if (!result) throw new Error('Dataset belum cukup untuk dianalisis.');
  return result as unknown as DashboardAnalyticsOutput;
}
