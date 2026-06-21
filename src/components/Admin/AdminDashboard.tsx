// DashInsight - Admin Dashboard
import { useState, useEffect } from 'react';
import { useAuth } from '../../stores/useAuth';
import { adminClientApi, type AdminClient } from '../../services/api';
import { Users, Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const { token } = useAuth();
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    adminClientApi.list(token)
      .then(res => setClients(res.clients))
      .catch(() => { setClients([]); })
      .finally(() => setLoading(false));
  }, [token]);

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    expired: clients.filter(c => c.status === 'expired').length,
    suspended: clients.filter(c => c.status === 'suspended').length,
    totalDatasets: clients.reduce((sum, c) => sum + (c.datasetCount || 0), 0),
  };

  const statCards = [
    { label: 'Total Client', value: stats.total, icon: Users, color: 'bg-[#276749]', textColor: 'text-[#276749]' },
    { label: 'Aktif', value: stats.active, icon: CheckCircle, color: 'bg-emerald-100', textColor: 'text-emerald-600' },
    { label: 'Expired', value: stats.expired, icon: Clock, color: 'bg-amber-100', textColor: 'text-amber-600' },
    { label: 'Suspended', value: stats.suspended, icon: AlertTriangle, color: 'bg-red-100', textColor: 'text-red-600' },
    { label: 'Total Dataset', value: stats.totalDatasets, icon: Activity, color: 'bg-blue-100', textColor: 'text-blue-600' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#276749]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-sm text-gray-500 mt-1">Ringkasan sistem DashInsight</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon className={`w-5 h-5 ${stat.label === 'Total Client' ? 'text-white' : stat.textColor}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Clients */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Client Terbaru</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-100">
                <th className="px-5 py-3">Nama Bisnis</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Tipe</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Dataset</th>
                <th className="px-5 py-3">Login Terakhir</th>
              </tr>
            </thead>
            <tbody>
              {clients.slice(0, 10).map((client) => (
                <tr key={client.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-5 py-3 font-medium text-gray-900">{client.business_name}</td>
                  <td className="px-5 py-3 text-gray-500">{client.user?.email || '-'}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{client.business_type}</span>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={client.status} />
                  </td>
                  <td className="px-5 py-3 text-gray-500">{client.datasetCount || 0}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {client.user?.last_login_at
                      ? new Date(client.user.last_login_at).toLocaleDateString('id-ID')
                      : '-'}
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">Belum ada client</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    expired: 'bg-amber-100 text-amber-700',
    suspended: 'bg-red-100 text-red-700',
    inactive: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.inactive}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
