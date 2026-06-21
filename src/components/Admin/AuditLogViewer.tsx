// DashInsight - Audit Log Viewer
import { useState, useEffect } from 'react';
import { useAuth } from '../../stores/useAuth';
import { adminAuditApi, type AuditLog } from '../../services/api';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { showToast } from '../../utils/toast';

const ACTION_LABELS: Record<string, string> = {
  login: 'Login',
  logout: 'Logout',
  create_client: 'Buat Client',
  update_client: 'Update Client',
  update_client_status: 'Ubah Status',
  extend_client: 'Perpanjang',
  reset_password: 'Reset Password',
};

export default function AuditLogViewer() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const limit = 30;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) return;
      setLoading(true);
      try {
        const res = await adminAuditApi.list(token, limit, page * limit);
        if (!cancelled) setLogs(res.logs);
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [token, page, refreshKey]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-0.5">Riwayat aktivitas sistem</p>
        </div>
        <button onClick={() => setRefreshKey(k => k + 1)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-3">Waktu</th>
                <th className="px-5 py-3">Aksi</th>
                <th className="px-5 py-3">Deskripsi</th>
                <th className="px-5 py-3">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="px-5 py-3">
                    <ActionBadge action={log.action} />
                  </td>
                  <td className="px-5 py-3 text-gray-600 text-xs max-w-xs truncate">{log.description || '-'}</td>
                  <td className="px-5 py-3">
                    {log.metadata_json ? (
                      <button
                        onClick={() => { navigator.clipboard.writeText(JSON.stringify(log.metadata_json, null, 2)).then(() => showToast('Metadata disalin ke clipboard')); }}
                        className="text-xs text-[#276749] hover:underline"
                      >
                        Lihat
                      </button>
                    ) : '-'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-gray-400">
                  {loading ? 'Memuat data...' : 'Belum ada audit log'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">Halaman {page + 1}</p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={logs.length < limit}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const styles: Record<string, string> = {
    login: 'bg-blue-100 text-blue-700',
    logout: 'bg-gray-100 text-gray-600',
    create_client: 'bg-emerald-100 text-emerald-700',
    update_client: 'bg-amber-100 text-amber-700',
    update_client_status: 'bg-orange-100 text-orange-700',
    extend_client: 'bg-purple-100 text-purple-700',
    reset_password: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[action] || 'bg-gray-100 text-gray-600'}`}>
      {ACTION_LABELS[action] || action}
    </span>
  );
}
