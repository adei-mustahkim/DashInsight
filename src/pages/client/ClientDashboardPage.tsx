import { BarChart3, FileSpreadsheet, HeartPulse, Lightbulb, ShoppingCart, TrendingUp, Upload, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../stores/useAuth';
import { analyzeWorkspace, loadWorkspace } from '../../storage/clientWorkspace';
import { formatNumber, formatRupiah } from '../../utils/formatting';

export default function ClientDashboardPage() {
  const { client } = useAuth();
  const navigate = useNavigate();
  const workspace = loadWorkspace();
  const analytics = workspace ? analyzeWorkspace(workspace) : null;

  if (!workspace || !analytics) return (
    <div className="space-y-6"><div><h1 className="text-xl font-bold text-gray-900">Dashboard</h1><p className="mt-0.5 text-sm text-gray-600">Selamat datang, {client?.business_name || 'Client'}.</p></div><div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center"><FileSpreadsheet className="mx-auto h-12 w-12 text-gray-300" /><h2 className="mt-4 text-lg font-bold text-gray-900">Mulai dari data penjualan Anda</h2><p className="mx-auto mt-2 max-w-md text-sm text-gray-600">Upload CSV atau Excel untuk membangun KPI, chart, insight, dan laporan secara lokal.</p><button onClick={() => navigate('/upload')} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#276749] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f533a]"><Upload className="h-4 w-4" /> Upload Data</button></div></div>
  );

  const kpis = analytics.kpis;
  const topProducts = analytics.charts.topProducts.slice(0, 6);
  const maxSales = Math.max(...topProducts.map(item => item.sales), 1);
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-xl font-bold text-gray-900">Dashboard</h1><p className="mt-0.5 text-sm text-gray-600">{workspace.datasetName} · {workspace.rows.length.toLocaleString('id-ID')} baris · diperbarui {new Date(workspace.savedAt).toLocaleString('id-ID')}</p></div><button onClick={() => navigate('/upload')} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><Upload className="h-4 w-4" /> Ganti Dataset</button></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Kpi icon={TrendingUp} label="Total Omzet" value={formatRupiah(kpis.totalOmzet)} /><Kpi icon={ShoppingCart} label="Transaksi" value={formatNumber(kpis.totalTransaksi)} /><Kpi icon={BarChart3} label="Rata-rata Transaksi" value={formatRupiah(kpis.avgTransaksi)} /><Kpi icon={Users} label="Pelanggan" value={formatNumber(kpis.jumlahPelanggan)} /></div>
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-xl border border-gray-200 bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-gray-900">Produk Teratas</h2><p className="mt-0.5 text-xs text-gray-600">Berdasarkan omzet</p></div><BarChart3 className="h-5 w-5 text-blue-600" /></div><div className="mt-5 space-y-4">{topProducts.length ? topProducts.map(item => <div key={item.name}><div className="mb-1 flex justify-between gap-3 text-sm"><span className="truncate text-gray-700">{item.name}</span><strong className="shrink-0 text-gray-900">{formatRupiah(item.sales)}</strong></div><div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[#276749]" style={{ width: `${Math.max(4, item.sales / maxSales * 100)}%` }} /></div></div>) : <p className="py-10 text-center text-sm text-gray-500">Kolom produk belum tersedia.</p>}</div></section>
        <section className="rounded-xl border border-gray-200 bg-white p-5"><div className="flex items-center gap-2"><HeartPulse className="h-5 w-5 text-emerald-700" /><h2 className="font-semibold text-gray-900">Kualitas Data</h2></div><div className="mt-5 flex items-end gap-3"><span className="text-4xl font-bold text-gray-900">{analytics.dataHealth.score}</span><span className="pb-1 text-sm text-gray-600">/100 · {analytics.dataHealth.label}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${analytics.dataHealth.score}%` }} /></div><div className="mt-5 space-y-2">{analytics.dataHealth.issues.slice(0, 3).map((issue, index) => <p key={index} className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700">{issue.text}</p>)}</div></section>
      </div>
      <button onClick={() => navigate('/insights')} className="flex w-full items-center justify-between rounded-xl bg-[#276749] px-5 py-4 text-left text-white hover:bg-[#1f533a]"><span><strong className="block">Lihat Insight Bisnis</strong><span className="text-sm text-white/80">{analytics.insights.length} temuan tersedia dari dataset ini</span></span><Lightbulb className="h-6 w-6" /></button>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: typeof TrendingUp; label: string; value: string }) {
  return <div className="rounded-xl border border-gray-200 bg-white p-4"><div className="flex items-center gap-2 text-sm text-gray-600"><Icon className="h-4 w-4 text-[#276749]" />{label}</div><p className="mt-3 text-xl font-bold text-gray-900">{value}</p></div>;
}