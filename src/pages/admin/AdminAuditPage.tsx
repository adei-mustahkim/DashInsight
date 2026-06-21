// @ts-nocheck
// DashInsight - Admin Audit Log Page (Full Implementation)
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../stores/useAuth';
import { adminAuditApi, type AuditLog } from '../../services/api';
import { Shield, RefreshCw, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const ACTION_COLORS: Record<string, string> = {
  login: 'bg-blue-100 text-blue-700',
  logout: 'bg-gray-100 text-gray-700',
  create_client: 'bg-emerald-100 text-emerald-700',
  update_client: 'bg-amber-100 text-amber-700',
  update_client_status: 'bg-purple-100 text-purple-700',
  extend_client: 'bg-cyan-100 text-cyan-700',
  reset_password: 'bg-red-100 text-red-700',
  create_chart: 'bg-indigo-100 text-indigo-700',
  update_chart: 'bg-amber-100 text-amber-700',
  create_formula: 'bg-pink-100 text-pink-700',
  update_formula: 'bg-orange-100 text-orange-700',
};

export default function AdminAuditPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!token) return;

    async function loadData() {
      setLoading(true);
      try {
        const res = await adminAuditApi.list(
          token,
          limit,
          offset,
          undefined,
          actionFilter || undefined
        );
        if (mountedRef.current) {
          setLogs(res.logs);
          setTotal(res.total);
        }
      } catch { /* ignore */ } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => { mountedRef.current = false; };
  }, [token, limit, offset, actionFilter, refreshKey]);

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-5 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} aktivitas tercatat</p>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setOffset(0); }}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#276749]"
          >
            <option value="">Semua Aktivitas</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="create_client">Buat Client</option>
            <option value="update_client">Update Client</option>
            <option value="update_client_status">Ubah Status Client</option>
            <option value="extend_client">Perpanjang Masa Aktif</option>
            <option value="reset_password">Reset Password</option>
          </select>
        </div>
      </div>

      {/* Log List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#276749]" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada aktivitas</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => (
              <div key={log.id} className="px-5 py-4 hover:bg-gray-50 transition">
                <div className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                    <span className="text-xs font-bold">{log.action.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">{log.action.replace(/_/g, ' ')}</span>
                      {log.user && (
                        <>
                          <span className="text-gray-300">â•</span>
                          <span className="text-sm text-gray-600">{log.user.name}</span>
                          <span className="text-xs text-gray-400">({log.user.email})</span>
                        </>
                      )}
                    </div>
                    {log.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{log.description}</p>
                    )}
                    {log.metadata_json && Object.keys(log.metadata_json).length > 0 && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs font-mono overflow-x-auto">
                        <pre className="text-gray-600 whitespace-pre-wrap">
                          {JSON.stringify(log.metadata_json, null, 2)}
                        </pre>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{formatDate(log.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Menampilkan {offset + 1}-{Math.min(offset + limit, total)} dari {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setOffset(Math.min(total - limit, offset + limit))}
              disabled={offset + limit >= total}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
