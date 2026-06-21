import { AlertTriangle, CheckCircle2, Info, Lightbulb, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { analyzeWorkspace, loadWorkspace } from '../../storage/clientWorkspace';
import { formatRupiah } from '../../utils/formatting';

export default function ClientInsightsPage() {
  const navigate = useNavigate();
  const workspace = loadWorkspace();
  const analytics = workspace ? analyzeWorkspace(workspace) : null;
  if (!workspace || !analytics) return <EmptyInsights onUpload={() => navigate('/upload')} />;

  const recommendations = [
    analytics.pareto.products.countFor80 > 0 ? `Prioritaskan stok dan promosi untuk ${analytics.pareto.products.countFor80} produk yang menyumbang sekitar 80% omzet.` : null,
    analytics.kpis.profitMargin > 0 ? `Pantau margin saat ini (${analytics.kpis.profitMargin.toFixed(1)}%) dan evaluasi produk dengan kontribusi laba rendah.` : 'Lengkapi kolom HPP agar rekomendasi profit lebih akurat.',
    analytics.dataHealth.score < 80 ? 'Perbaiki isu kualitas data sebelum memakai laporan untuk keputusan besar.' : 'Kualitas data cukup baik; jadwalkan review performa secara berkala.',
  ].filter((item): item is string => Boolean(item));

  return <div className="space-y-6"><div><h1 className="text-xl font-bold text-gray-900">Insight Bisnis</h1><p className="mt-0.5 text-sm text-gray-600">Temuan otomatis dari {workspace.datasetName}.</p></div><div className="grid gap-4 md:grid-cols-3"><Summary label="Omzet dianalisis" value={formatRupiah(analytics.kpis.totalOmzet)} /><Summary label="Skor kualitas" value={`${analytics.dataHealth.score}/100`} /><Summary label="Temuan" value={`${analytics.insights.length} insight`} /></div><section className="rounded-xl border border-gray-200 bg-white"><div className="border-b border-gray-200 px-5 py-4"><h2 className="font-semibold text-gray-900">Temuan utama</h2></div><div className="divide-y divide-gray-100">{analytics.insights.length ? analytics.insights.map((insight, index) => { const Icon = insight.type === 'success' ? CheckCircle2 : insight.type === 'warning' ? AlertTriangle : Info; const tone = insight.type === 'success' ? 'text-emerald-700 bg-emerald-50' : insight.type === 'warning' ? 'text-amber-700 bg-amber-50' : 'text-blue-700 bg-blue-50'; return <div key={index} className="flex items-start gap-3 px-5 py-4"><div className={`rounded-lg p-2 ${tone}`}><Icon className="h-4 w-4" /></div><p className="pt-1 text-sm leading-6 text-gray-700">{insight.text}</p></div>; }) : <p className="px-5 py-12 text-center text-sm text-gray-500">Belum cukup variasi data untuk menghasilkan temuan.</p>}</div></section><section className="rounded-xl border border-gray-200 bg-white p-5"><div className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-amber-600" /><h2 className="font-semibold text-gray-900">Rekomendasi aksi</h2></div><ol className="mt-4 space-y-3">{recommendations.map((item, index) => <li key={item} className="flex gap-3 text-sm text-gray-700"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700">{index + 1}</span><span className="pt-0.5">{item}</span></li>)}</ol></section></div>;
}

function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-sm text-gray-600">{label}</p><p className="mt-2 text-xl font-bold text-gray-900">{value}</p></div>; }
function EmptyInsights({ onUpload }: { onUpload: () => void }) { return <div className="space-y-6"><div><h1 className="text-xl font-bold text-gray-900">Insight Bisnis</h1><p className="mt-0.5 text-sm text-gray-600">Temuan, dampak, dan rekomendasi dari data Anda.</p></div><div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center"><Lightbulb className="mx-auto h-12 w-12 text-gray-300" /><h2 className="mt-4 text-lg font-bold text-gray-900">Belum ada dataset aktif</h2><button onClick={onUpload} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#276749] px-4 py-2 text-sm font-semibold text-white"><Upload className="h-4 w-4" /> Upload Data</button></div></div>; }