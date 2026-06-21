// @ts-nocheck
import { useState, useEffect } from 'react';
import { useAuth } from '../../stores/useAuth';
import { adminClientApi, type AdminClient } from '../../services/api';
import { Users, Activity, AlertTriangle, CheckCircle, Clock, BarChart3, ArrowUpRight, ArrowDownRight, Bell, UserPlus, ArrowRight, Shield, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../../components/Common/StatusBadge';

export default function AdminDashboardPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotif, setShowNotif] = useState(true);

  useEffect(() => {
    if (!token) return;
    adminClientApi.list(token)
      .then(res => setClients(res.clients))
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, [token]);

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    expired: clients.filter(c => c.status === 'expired').length,
    suspended: clients.filter(c => c.status === 'suspended').length,
    pending: clients.filter(c => c.status === 'inactive').length,
    totalDatasets: clients.reduce((sum, c) => sum + (c.datasetCount || 0), 0),
  };

  const pendingClients = clients.filter(c => c.status === 'inactive');

  const statCards = [
    { label: 'Total Client', value: stats.total, icon: Users, color: 'bg-[#276749]', textColor: 'text-white', change: null },
    { label: 'Aktif', value: stats.active, icon: CheckCircle, color: 'bg-emerald-100', textColor: 'text-emerald-600', change: stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0 },
    { label: 'Menunggu', value: stats.pending, icon: Clock, color: 'bg-amber-100', textColor: 'text-amber-600', change: null },
    { label: 'Suspended', value: stats.suspended, icon: AlertTriangle, color: 'bg-red-100', textColor: 'text-red-600', change: null },
    { label: 'Total Dataset', value: stats.totalDatasets, icon: Activity, color: 'bg-blue-100', textColor: 'text-blue-600', change: null },
  ];

  const recentClients = [...clients]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  const statusDistribution = [
    { name: 'Aktif', value: stats.active, color: '#10B981' },
    { name: 'Menunggu Approval', value: stats.pending, color: '#F59E0B' },
    { name: 'Suspended', value: stats.suspended, color: '#EF4444' },
    { name: 'Expired', value: stats.expired, color: '#9CA3AF' },
  ].filter(s => s.value > 0);

  const handleApprove = async (clientId: string, durationDays: number = 30) => {
    if (!token) return;
    try {
      await adminClientApi.extend(token, clientId, durationDays);
      const res = await adminClientApi.list(token);
      setClients(res.clients);
    } catch {
      alert('Gagal menyetujui client');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#276749]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-full">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#276749] via-[#2d7a53] to-[#1f533a] rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative">
          <p className="text-white/60 text-sm font-medium mb-1">Selamat datang kembali,</p>
          <h1 className="text-2xl md:text-3xl font-bold">Admin {user?.name || ''}</h1>
          <p className="text-white/70 text-sm mt-2">
            Berikut ringkasan sistem DashInsight hari ini — {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.
          </p>
        </div>
      </div>

      {/* Notification */}
      {showNotif && pendingClients.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Client Baru Menunggu Approval</h3>
                  <p className="text-xs text-gray-600 mt-0.5">Ada {pendingClients.length} client yang mendaftar dan menunggu persetujuan Anda.</p>
                </div>
                <button onClick={() => setShowNotif(false)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
              </div>
              <div className="mt-3 space-y-2">
                {pendingClients.slice(0, 3).map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#276749] rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {c.business_name?.charAt(0) || 'B'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{c.business_name}</p>
                        <p className="text-[10px] text-gray-500">{c.user?.email || '-'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(c.id, 30)}
                        className="px-3 py-1 bg-[#276749] text-white rounded text-[10px] font-bold hover:bg-[#1f533a] transition">
                        Setuju 30 Hari
                      </button>
                      <button onClick={() => navigate(`/admin/clients/${c.id}`)}
                        className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold hover:bg-gray-200 transition flex items-center gap-1">
                        Detail <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat, idx) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color} ${idx === 0 ? 'shadow-md shadow-[#276749]/20' : ''}`}>
                <stat.icon className={`w-5 h-5 ${stat.label === 'Total Client' ? 'text-white' : stat.textColor}`} />
              </div>
              {stat.change !== null && (
                <div className={`flex items-center text-xs font-bold ${stat.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {stat.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(stat.change)}%
                </div>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribution Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900 text-sm">Status Client</h2>
            <BarChart3 className="w-4 h-4 text-gray-400" />
          </div>
          {statusDistribution.length > 0 ? (
            <div className="space-y-3">
              {statusDistribution.map(item => {
                const pct = stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0;
                return (
                  <div key={item.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-medium text-gray-700">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-900">{item.value} <span className="text-gray-400 font-medium">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">Belum ada data</div>
          )}
        </div>

        {/* Recent Clients */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-sm">Client Terbaru</h2>
            <button onClick={() => navigate('/admin/clients')} className="text-xs text-[#276749] font-semibold hover:underline flex items-center gap-1">
              Lihat Semua <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="pb-2.5 font-semibold">Nama Bisnis</th>
                  <th className="pb-2.5 font-semibold">Email</th>
                  <th className="pb-2.5 font-semibold">Tipe</th>
                  <th className="pb-2.5 font-semibold">Status</th>
                  <th className="pb-2.5 font-semibold">Dataset</th>
                  <th className="pb-2.5 font-semibold">Bergabung</th>
                </tr>
              </thead>
              <tbody>
                {recentClients.map(client => (
                  <tr key={client.id} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors" onClick={() => navigate(`/admin/clients/${client.id}`)}>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-[#DCF4E7] text-[#276749] rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                          {client.business_name?.charAt(0) || 'B'}
                        </div>
                        <span className="font-medium text-gray-900 text-xs">{client.business_name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-500 text-xs">{client.user?.email || '-'}</td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">{client.business_type}</span>
                    </td>
                    <td className="py-3 pr-4"><StatusBadge status={client.status} /></td>
                    <td className="py-3 pr-4 text-gray-500 text-xs font-medium">{client.datasetCount || 0}</td>
                    <td className="py-3 text-gray-400 text-xs">{new Date(client.created_at).toLocaleDateString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentClients.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">Belum ada client terdaftar</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Manajemen Client', path: '/admin/clients', icon: Users, desc: 'Kelola semua client' },
          { label: 'Metric & Formula', path: '/admin/formulas', icon: Activity, desc: 'Atur metrik' },
          { label: 'Audit Log', path: '/admin/audit', icon: Shield, desc: 'Lihat aktivitas' },
          { label: 'Pengaturan', path: '/admin/settings', icon: Settings, desc: 'Konfigurasi sistem' },
        ].map(action => (
          <button key={action.path} onClick={() => navigate(action.path)}
            className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md hover:border-[#276749]/30 transition-all duration-200 group">
            <div className="w-9 h-9 bg-[#DCF4E7] rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#276749] group-hover:shadow-sm transition-all">
              <action.icon className="w-4.5 h-4.5 text-[#276749] group-hover:text-white transition-colors" />
            </div>
            <p className="text-xs font-bold text-gray-900">{action.label}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{action.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
