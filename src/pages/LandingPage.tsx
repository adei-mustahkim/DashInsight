import { useMemo, useState, useEffect } from 'react';
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Coffee,
  FileSpreadsheet,
  Globe2,
  Lock,
  Mail,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  Sparkles,
  Store,
  Upload,
  User,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import InteractiveDemo from '../components/Demo/InteractiveDemo';
import logoImg from '../assets/logo-removebg-preview.png';
import dashboardPreview from '../assets/gambar_1.png';
import arifBudimanImg from '../assets/arif_budiman.png';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
// Default WA jika gagal ambil dari API
const DEFAULT_ADMIN_WHATSAPP = '6285373328500';

type BusinessKey = 'Retail' | 'F&B' | 'Jasa' | 'Marketplace';

type SolutionContent = {
  icon: typeof Store;
  title: string;
  description: string;
  bullets: string[];
  bars: Array<{ label: string; value: number }>;
  stats: Array<{ label: string; value: string; note: string }>;
};

const businessSolutions: Record<BusinessKey, SolutionContent> = {
  Retail: {
    icon: Store,
    title: 'Tahu produk mana yang gerakkan omzet paling besar.',
    description: 'Pantau stok, margin, dan varian produk supaya keputusan restock lebih cepat dan lebih tajam.',
    bullets: ['Deteksi produk laku keras', 'Lihat margin per SKU', 'Baca stok menipis lebih awal'],
    bars: [
      { label: 'Speaker Bluetooth', value: 92 },
      { label: 'Headset', value: 76 },
      { label: 'Mouse Wireless', value: 63 },
      { label: 'Keyboard Mekanik', value: 55 },
      { label: 'Charger Fast', value: 41 },
    ],
    stats: [
      { label: 'Margin Keuntungan', value: '23,8%', note: 'naik 4,2% dari bulan lalu' },
      { label: 'Stok Menipis', value: '8', note: 'produk butuh restock' },
    ],
  },
  'F&B': {
    icon: Coffee,
    title: 'Jaga jam ramai, menu laris, dan promo tetap efisien.',
    description: 'Baca performa menu, jam sibuk, dan pola pembelian untuk atur staf dan promo lebih presisi.',
    bullets: ['Menu terlaris tiap jam', 'Efektivitas promo harian', 'Pantau dine-in dan delivery'],
    bars: [
      { label: 'Kopi Susu', value: 95 },
      { label: 'Nasi Ayam', value: 80 },
      { label: 'Croissant', value: 68 },
      { label: 'Es Teh', value: 57 },
      { label: 'Pasta', value: 45 },
    ],
    stats: [
      { label: 'Jam Ramai', value: '18.00–20.00', note: 'puncak transaksi harian' },
      { label: 'Promo Efektif', value: '2', note: 'promo paling sehat' },
    ],
  },
  Jasa: {
    icon: Briefcase,
    title: 'Ukur produktivitas tanpa bikin tim terasa diawasi.',
    description: 'Bandingkan kontribusi layanan, durasi kerja, dan performa staf dengan data yang mudah dibaca.',
    bullets: ['Lihat performa staf', 'Pantau waktu layanan', 'Ukur order per hari'],
    bars: [
      { label: 'Service A', value: 88 },
      { label: 'Service B', value: 71 },
      { label: 'Service C', value: 64 },
      { label: 'Service D', value: 52 },
      { label: 'Service E', value: 39 },
    ],
    stats: [
      { label: 'Waktu Layanan', value: '46 menit', note: 'lebih cepat 12 menit' },
      { label: 'Tim Aktif', value: '3', note: 'staf paling produktif' },
    ],
  },
  Marketplace: {
    icon: Globe2,
    title: 'Baca channel penjualan dan kota sebagai satu cerita.',
    description: 'Temukan channel yang paling sehat, wilayah terkuat, dan biaya kirim yang paling aman untuk margin.',
    bullets: ['Analisis channel terbaik', 'Lihat kota paling aktif', 'Pantau ongkir dan margin'],
    bars: [
      { label: 'Shopee', value: 87 },
      { label: 'Tokopedia', value: 75 },
      { label: 'TikTok Shop', value: 68 },
      { label: 'Website', value: 59 },
      { label: 'Reseller', value: 47 },
    ],
    stats: [
      { label: 'Channel Terbaik', value: 'Toko sendiri', note: 'margin paling sehat' },
      { label: 'Kota Aktif', value: '14', note: 'kontribusi stabil' },
    ],
  },
};

const processSteps = [
  {
    number: '1',
    icon: Upload,
    title: 'Upload Data',
    description: 'Unggah file Excel atau CSV dari kasir, marketplace, atau pencatatan internal Anda.',
  },
  {
    number: '2',
    icon: FileSpreadsheet,
    title: 'Periksa Otomatis',
    description: 'Sistem membaca struktur data, mendeteksi masalah, lalu merapikan mapping secara lokal.',
  },
  {
    number: '3',
    icon: BarChart3,
    title: 'Ambil Keputusan',
    description: 'Dashboard, insight, dan rekomendasi tindakan langsung siap dipakai untuk langkah berikutnya.',
  },
] as const;

const testimonials = [
  { initials: 'AB', name: 'Arif Budiman', role: 'Pemilik toko elektronik', business: 'Retail', result: '+20% profit', quote: 'Laporan yang dulu lama sekarang tinggal lihat sekali. Saya cepat tahu produk mana yang harus diisi lagi.' },
  { initials: 'SR', name: 'Siti Rahma', role: 'Owner coffee shop', business: 'F&B', result: '-40% waktu laporan', quote: 'Jam ramai dan menu laris langsung kebaca. Tim jadi lebih enak atur stok dan jadwal shift.' },
  { initials: 'DA', name: 'Dimas Arta', role: 'Founder agency', business: 'Jasa', result: '3x lebih cepat', quote: 'Produktivitas tim lebih gampang dipantau tanpa bikin kerjaan jadi ribet.' },
  { initials: 'NL', name: 'Nina Lestari', role: 'Pemilik online shop', business: 'Marketplace', result: 'Insight harian', quote: 'Saya bisa bandingin channel penjualan dalam satu tampilan tanpa pusing pindah file.' },
  { initials: 'RF', name: 'Raka Firmansyah', role: 'Owner minimarket', business: 'Retail', result: 'Restock tepat', quote: 'Produk lambat dan stok tipis ketahuan lebih awal. Keputusan belanja jadi lebih aman.' },
  { initials: 'MP', name: 'Maya Putri', role: 'UMKM kuliner', business: 'F&B', result: 'Promo lebih efektif', quote: 'Saya jadi tahu promo mana yang benar-benar jalan, bukan cuma kelihatan ramai.' },
  { initials: 'AR', name: 'Ari Pratama', role: 'Pemilik bengkel', business: 'Jasa', result: 'Layanan rapi', quote: 'Durasi layanan dan order harian gampang dibaca. Operasional jadi lebih terarah.' },
  { initials: 'KS', name: 'Kirana Sari', role: 'Seller fashion', business: 'Marketplace', result: 'Margin sehat', quote: 'Channel yang paling untung langsung kelihatan. Saya bisa fokus ke yang benar-benar menghasilkan.' },
  { initials: 'BW', name: 'Budi Wibowo', role: 'Owner distro', business: 'Retail', result: 'Keputusan cepat', quote: 'Seluruh data penjualan jadi lebih masuk akal saat dibaca lewat dashboard.' },
  { initials: 'HN', name: 'Hana Nabila', role: 'Pemilik bakery', business: 'F&B', result: 'Kerja hemat waktu', quote: 'Sekarang laporan harian selesai jauh lebih cepat dan tidak bikin capek.' },
] as const;

export default function LandingPage() {
  const navigate = useNavigate();
  const [showRegister, setShowRegister] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<BusinessKey>('Retail');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    business_name: '',
    business_type: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [adminWhatsapp, setAdminWhatsapp] = useState(DEFAULT_ADMIN_WHATSAPP);

  // Ambil konfigurasi public dari database (misal WA Admin)
  useEffect(() => {
    fetch(`${API_BASE}/settings/public`)
      .then(res => res.json())
      .then(data => {
        if (data && data.admin_whatsapp) {
          setAdminWhatsapp(data.admin_whatsapp);
        }
      })
      .catch(err => console.error('Gagal mengambil pengaturan public', err));
  }, []);

  const solution = useMemo(() => businessSolutions[activeTab], [activeTab]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(current => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Pendaftaran belum berhasil. Periksa kembali data Anda.');
        return;
      }
      const message = encodeURIComponent(
        `*PENDAFTARAN CLIENT BARU*\n\nNama: ${formData.name}\nEmail: ${formData.email}\nBisnis: ${formData.business_name}\nTipe: ${formData.business_type}\nTelepon: ${formData.phone}\nAlamat: ${formData.address}\n\n_Menunggu persetujuan admin._`,
      );
      window.open(`https://wa.me/${adminWhatsapp}?text=${message}`, '_blank');
      setSuccess(true);
    } catch {
      setError('Kami belum dapat menghubungi server. Periksa koneksi lalu coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-page min-h-screen overflow-x-hidden bg-white text-[#153629]">
      <header className="sticky top-0 z-40 border-b border-[#E1E8E3] bg-white/94 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1240px] items-center justify-between px-5 lg:px-8">
          <a href="#top" className="inline-flex items-center" aria-label="DashInsight, kembali ke atas">
            <img src={logoImg} alt="DashInsight" className="h-14 w-auto object-contain" />
          </a>

          <nav className="hidden items-center gap-8 text-sm font-medium text-[#41554B] md:flex" aria-label="Navigasi utama">
            <a href="#demo" className="transition-colors hover:text-[#173F2E]">Demo</a>
            <a href="#solutions" className="transition-colors hover:text-[#173F2E]">Solusi</a>
            <a href="#how" className="transition-colors hover:text-[#173F2E]">Cara Kerja</a>
            <a href="#testimonials" className="transition-colors hover:text-[#173F2E]">Testimoni</a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <button onClick={() => navigate('/login')} className="landing-button-secondary">Masuk</button>
            <button onClick={() => setShowRegister(true)} className="landing-button-primary">Mulai Sekarang</button>
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[#173F2E] md:hidden"
            onClick={() => setMobileMenuOpen(open => !open)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[#E1E8E3] bg-white px-5 py-4 md:hidden">
            <nav className="flex flex-col gap-1">
              {[
                ['Demo', '#demo'],
                ['Solusi', '#solutions'],
                ['Cara Kerja', '#how'],
                ['Testimoni', '#testimonials'],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-3 py-3 text-base font-semibold text-[#2D4138] hover:bg-[#F0F7F3]"
                >
                  {label}
                </a>
              ))}
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[#E4ECE7] pt-4">
                <button onClick={() => navigate('/login')} className="landing-button-secondary">Masuk</button>
                <button onClick={() => setShowRegister(true)} className="landing-button-primary">Mulai Sekarang</button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main id="top">
        <section className="border-b border-[#E7ECE8] bg-[radial-gradient(circle_at_top_left,_rgba(39,103,73,0.09),_transparent_38%),linear-gradient(180deg,#ffffff_0%,#fbfdfc_100%)]">
          <div className="mx-auto grid max-w-[1240px] gap-14 px-5 py-16 sm:py-20 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:px-8 lg:py-24">
            <div className="max-w-[600px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D8E8DF] bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#2B6B4B] shadow-[0_6px_20px_rgba(12,31,23,0.04)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2F8A60]" />
                DashInsight
              </div>
              <h1 className="mt-5 max-w-[12ch] text-balance text-[clamp(2.35rem,4.8vw,4.2rem)] font-semibold leading-[1.04] tracking-[-0.04em] text-[#173F2E] sm:max-w-[13ch]">
                Data bisnis yang rumit, jadi keputusan yang sederhana.
              </h1>
              <p className="mt-5 max-w-[56ch] text-pretty text-base leading-7 text-[#51645B] sm:text-[17px]">
                Unggah file Excel atau CSV, lihat dashboard otomatis, dan pahami mana produk, channel, serta langkah bisnis yang paling penting—langsung dari perangkat Anda.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })} className="landing-button-primary landing-button-large">
                  Coba Demo Interaktif <ArrowRight className="h-4 w-4" />
                </button>
                <button onClick={() => navigate('/login')} className="landing-button-secondary landing-button-large">Masuk</button>
              </div>
              <div className="mt-8 grid gap-4 border-t border-[#DDE7E1] pt-5 sm:grid-cols-3">
                <TrustItem icon={ShieldCheck} label="Data aman & lokal" />
                <TrustItem icon={Clock3} label="Siap dalam menit" />
                <TrustItem icon={Sparkles} label="Insight instan" />
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-[radial-gradient(circle,_rgba(39,103,73,0.14),_transparent_65%)] blur-2xl" />
              <div className="overflow-hidden rounded-[2rem] border border-[#DFE9E3] bg-[#0D1713] p-3 shadow-[0_35px_90px_rgba(12,31,23,0.2)] ring-1 ring-black/5">
                <div className="flex h-9 items-center gap-1.5 px-2" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F07167]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#E9C46A]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#62B38A]" />
                  <span className="ml-auto text-[11px] font-medium tracking-wide text-white/55">Dashboard preview</span>
                </div>
                <img src={dashboardPreview} alt="Pratinjau dashboard DashInsight" className="aspect-[16/10] w-full rounded-[1.1rem] bg-white object-cover object-top" />
              </div>
              <div className="absolute -bottom-5 left-7 inline-flex items-center gap-2 rounded-2xl bg-[#173F2E] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(23,63,46,0.28)]">
                Dashboard siap dipakai <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#E7ECE8] bg-[#173F2E] text-white">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-12 gap-y-4 px-5 py-7 text-sm lg:px-8">
            <p className="font-semibold text-white">Dibuat untuk cara kerja bisnis Indonesia.</p>
            <div className="flex flex-wrap gap-x-7 gap-y-3 text-[#D9EBE1]">
              <span>Retail</span>
              <span>F&amp;B</span>
              <span>Jasa</span>
              <span>Marketplace</span>
            </div>
            <p className="text-[#BFD8CA]">Excel, CSV, dan data POS</p>
          </div>
        </section>

        <section className="border-b border-[#E7ECE8] bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
            <div className="mb-10 grid gap-8 lg:grid-cols-[1.03fr_0.97fr] lg:items-end">
              <div className="max-w-[720px]">
                <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#2B6B4B]">Bukti Produk</p>
                <h2 className="mt-4 text-balance text-[clamp(2.1rem,4vw,3.6rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-[#173F2E]">
                  Dashboard lengkap. Data tetap di perangkat Anda.
                </h2>
                <p className="mt-5 max-w-[58ch] text-base leading-7 text-[#566960]">
                  Data tidak diunggah ke server. DashInsight memproses file secara lokal agar aman, cepat, dan tetap nyaman dipakai oleh tim UMKM.
                </p>
              </div>
              <p className="max-w-[460px] text-base leading-7 text-[#566960]">
                Bukti produk ini menunjukkan alur sederhana: upload file, periksa hasil, lalu pahami insight tanpa memindahkan data sensitif ke luar perangkat.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.1fr_0.9fr] lg:items-center">
              <div className="space-y-4">
                {[
                  '100% data tetap di perangkat Anda',
                  'Tidak ada instalasi rumit',
                  'Kompatibel dengan Excel & CSV',
                ].map(item => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-[#E4ECE7] bg-[#F8FBF9] p-4">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#DCEEE4] text-[#276749]"><Check className="h-3.5 w-3.5" /></span>
                    <p className="text-sm font-semibold leading-6 text-[#30463C]">{item}</p>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-[1.75rem] border border-[#E2EAE4] bg-white shadow-[0_18px_50px_rgba(12,31,23,0.08)]">
                <img src={dashboardPreview} alt="Mockup dashboard DashInsight" className="w-full object-cover" />
              </div>

              <div className="rounded-[1.75rem] border border-[#E2EAE4] bg-[#F8FBF9] p-6 shadow-[0_18px_50px_rgba(12,31,23,0.05)]">
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#2B6B4B]">Proses Lokal</p>
                <div className="mt-7 flex items-center gap-3 text-[#173F2E]">
                  <DataChip label="XLSX" tone="bg-white" />
                  <ChevronRight className="h-4 w-4 text-[#7A8B82]" />
                  <DataChip label="CSV" tone="bg-white" />
                  <ChevronRight className="h-4 w-4 text-[#7A8B82]" />
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#173F2E] text-white shadow-lg">
                    <ShieldCheck className="h-7 w-7" />
                  </div>
                </div>
                <div className="mt-6 border-l-2 border-dashed border-[#BFD8CA] pl-4">
                  <p className="text-sm font-semibold text-[#30463C]">Diproses lokal di perangkat Anda</p>
                  <p className="mt-2 text-sm leading-6 text-[#607269]">File Anda dibaca langsung dari browser tanpa upload ke server pusat.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="demo" className="scroll-mt-24 bg-[#F6FAF8] py-20 sm:py-28">
          <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
            <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div className="max-w-[700px]">
                <p className="mb-4 text-sm font-bold text-[#276749]">Bukan gambar statis</p>
                <h2 className="text-balance text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[#173F2E]">
                  Klik, filter, dan rasakan produknya langsung.
                </h2>
              </div>
              <p className="max-w-[450px] text-base leading-7 text-[#566960]">
                Demo di bawah memakai mesin dashboard dan dataset simulasi DashInsight yang sebenarnya. Pilih jenis bisnis untuk melihat analisis yang berbeda.
              </p>
            </div>
            <InteractiveDemo />
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-[#63756C]">
              <p>Data demo bersifat simulasi. Semua interaksi dashboard dapat dicoba.</p>
              <button onClick={() => setShowRegister(true)} className="font-bold text-[#276749] hover:text-[#173F2E]">Gunakan dengan data saya →</button>
            </div>
          </div>
        </section>

        <section id="solutions" className="scroll-mt-24 border-y border-[#E7ECE8] bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
            <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-[720px]">
                <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#2B6B4B]">Solusi Untuk Berbagai Industri</p>
                <h2 className="mt-4 text-balance text-[clamp(2rem,3.8vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[#173F2E]">
                  Satu platform untuk berbagai jenis bisnis.
                </h2>
              </div>
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Jenis bisnis">
                {(Object.keys(businessSolutions) as BusinessKey[]).map(key => {
                  const active = activeTab === key;
                  return (
                    <button
                      key={key}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveTab(key)}
                      className={`min-h-11 rounded-full px-5 text-sm font-semibold transition-all ${active ? 'bg-[#173F2E] text-white shadow-[0_10px_24px_rgba(23,63,46,0.2)]' : 'bg-[#EEF5F1] text-[#3E554A] hover:bg-[#DCEBE3]'}`}
                    >
                      {key}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.2fr_0.8fr] lg:items-stretch">
              <div className="rounded-[1.75rem] border border-[#E2EAE4] bg-[#F8FBF9] p-7 shadow-[0_14px_40px_rgba(12,31,23,0.05)]">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#DCEEE4] text-[#276749]">
                  <solution.icon className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-2xl font-semibold leading-tight text-[#173F2E]">{solution.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#566960]">{solution.description}</p>
                <ul className="mt-7 space-y-3">
                  {solution.bullets.map(point => (
                    <li key={point} className="flex items-start gap-3 text-sm font-semibold text-[#30463C]">
                      <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#D9EBE1] text-[#276749]"><Check className="h-3 w-3" /></span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[1.75rem] border border-[#E2EAE4] bg-white p-7 shadow-[0_14px_40px_rgba(12,31,23,0.05)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#2B6B4B]">Penjualan per Produk</p>
                    <p className="mt-2 text-sm text-[#63756C]">Grafik batang horizontal berubah sesuai tab aktif.</p>
                  </div>
                  <div className="rounded-2xl bg-[#F2F7F4] px-4 py-2 text-sm font-semibold text-[#173F2E]">{activeTab}</div>
                </div>
                <div className="mt-8 space-y-4">
                  {solution.bars.map(item => (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between text-sm text-[#41554B]">
                        <span className="font-medium">{item.label}</span>
                        <span className="font-semibold text-[#173F2E]">{item.value}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-[#EAF1ED]">
                        <div className="h-3 rounded-full bg-gradient-to-r from-[#236043] to-[#6FC89A] transition-all duration-500 ease-out" style={{ width: `${item.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                {solution.stats.map(stat => (
                  <div key={stat.label} className="rounded-[1.75rem] border border-[#E2EAE4] bg-[#173F2E] p-6 text-white shadow-[0_14px_40px_rgba(12,31,23,0.08)]">
                    <p className="text-sm text-[#BFD8CA]">{stat.label}</p>
                    <p className="mt-3 text-3xl font-semibold tracking-[-0.03em]">{stat.value}</p>
                    <p className="mt-3 text-sm leading-6 text-[#D9EBE1]">{stat.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="scroll-mt-24 bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
            <div className="max-w-[740px]">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#2B6B4B]">Cara Kerja</p>
              <h2 className="mt-4 text-balance text-[clamp(2rem,3.8vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[#173F2E]">
                Tiga langkah sederhana, insight langsung terasa.
              </h2>
            </div>
            <div className="relative mt-14 grid gap-8 lg:grid-cols-3 lg:gap-10">
              <div className="hidden lg:absolute lg:left-[calc(33.333%-24px)] lg:top-[73px] lg:block lg:h-px lg:w-[calc(33.333%+36px)] lg:border-t-2 lg:border-dashed lg:border-[#BFD8CA]" />
              <div className="hidden lg:absolute lg:left-[calc(66.666%-24px)] lg:top-[73px] lg:block lg:h-px lg:w-[calc(33.333%+36px)] lg:border-t-2 lg:border-dashed lg:border-[#BFD8CA]" />
              {processSteps.map(step => (
                <ProcessStepCard key={step.number} {...step} />
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="scroll-mt-24 border-y border-[#E7ECE8] bg-[radial-gradient(circle_at_top,_rgba(39,103,73,0.08),_transparent_35%),linear-gradient(180deg,#F7FBF8_0%,#F3F8F5_100%)] py-20 sm:py-28">
          <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
            <div className="max-w-[760px]">
              <p className="text-sm font-bold uppercase tracking-[0.32em] text-[#2B6B4B]">Testimoni</p>
              <h2 className="mt-4 text-balance text-[clamp(2rem,3.8vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[#173F2E]">
                Banyak cerita, satu dampak: kerja jadi lebih cepat.
              </h2>
              <p className="mt-5 max-w-[60ch] text-base leading-7 text-[#566960]">
                Satu section menampilkan banyak testimoni supaya bukti sosial tetap terasa hidup tanpa makan banyak ruang.
              </p>
            </div>

            <div className="mt-10 w-full overflow-hidden relative">
              {/* Fade masks for edges */}
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 sm:w-24 bg-gradient-to-r from-[#F6FAF7] to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 sm:w-24 bg-gradient-to-l from-[#F6FAF7] to-transparent" />
              
              <div className="flex w-max animate-marquee gap-5 py-4 hover:animate-pause">
                {[...testimonials, ...testimonials].map((item, idx) => (
                  <article key={item.name + idx} className="w-[340px] shrink-0 group relative overflow-hidden rounded-[1.6rem] border border-[#DDE7E1] bg-white p-6 shadow-[0_8px_30px_rgba(12,31,23,0.04)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(12,31,23,0.08)] flex flex-col justify-between">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#236043] via-[#63B88A] to-[#DCEEE4]" />
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#DCEEE4] text-sm font-semibold text-[#276749] shadow-inner">
                            {item.initials}
                          </div>
                          <div>
                            <p className="font-semibold text-[#173F2E] text-sm">{item.name}</p>
                            <p className="text-xs text-[#607269]">{item.role}</p>
                          </div>
                        </div>
                        <span className="shrink-0 rounded-full bg-[#F0F7F3] px-2.5 py-1 text-[11px] font-semibold text-[#2B6B4B]">{item.result}</span>
                      </div>
                      <p className="mt-5 text-[14.5px] leading-relaxed text-[#41554B]">“{item.quote}”</p>
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-[#EDF3EF] pt-4 text-xs text-[#7A8B82]">
                      <span className="font-medium">{item.business}</span>
                      <span className="flex items-center gap-1.5 text-[#2B6B4B]"><span className="h-1.5 w-1.5 rounded-full bg-[#2F8A60]" />Aktif</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#236043] text-white">
          <div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-9 px-5 py-16 sm:py-20 lg:flex-row lg:items-center lg:px-8">
            <div className="max-w-[700px]">
              <h2 className="text-balance text-[clamp(2.2rem,4.4vw,4rem)] font-semibold leading-[1.05] tracking-[-0.035em]">Mulai pahami bisnis Anda hari ini.</h2>
              <p className="mt-5 max-w-[58ch] text-lg leading-8 text-[#D9EBE1]">Unggah data Anda dan rasakan bagaimana DashInsight membantu Anda membuat keputusan yang lebih baik.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <button onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })} className="landing-button-light">Coba Demo Interaktif <ArrowRight className="h-4 w-4" /></button>
              <button onClick={() => setShowRegister(true)} className="landing-button-dark">Mulai Sekarang</button>
            </div>
          </div>
          <div className="mx-auto grid max-w-[1240px] gap-4 px-5 pb-16 text-sm text-[#D9EBE1] sm:grid-cols-3 lg:px-8">
            <TrustItemLight icon={ShieldCheck} label="Data aman & lokal" />
            <TrustItemLight icon={Clock3} label="Siap dalam menit" />
            <TrustItemLight icon={Lock} label="Tanpa kartu kredit" />
          </div>
        </section>
      </main>

      <footer className="bg-[#0C1F17] text-white">
        <div className="mx-auto max-w-[1240px] px-5 py-12 lg:px-8">
          <div className="grid gap-10 border-b border-white/10 pb-10 lg:grid-cols-[1.1fr_1fr_0.9fr]">
            <div className="max-w-sm">
              <img src={logoImg} alt="DashInsight" className="h-14 w-auto object-contain brightness-0 invert" />
              <p className="mt-4 text-sm leading-6 text-[#AFCBBC]">Platform analitik bisnis lokal-first untuk UMKM Indonesia yang ingin ambil keputusan lebih cepat, lebih aman, dan lebih tajam.</p>
              <div className="mt-6 flex gap-3 text-[#D8E8DF]">
                {['ig', 'fb', 'in'].map(item => (
                  <span key={item} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-semibold uppercase">{item}</span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
              <FooterCol title="Produk" links={['Demo', 'Solusi', 'Cara Kerja', 'Testimoni']} />
              <FooterCol title="Perusahaan" links={['Tentang', 'Tim', 'Karier', 'Kontak']} />
              <FooterCol title="Sumber Daya" links={['Panduan', 'Kebijakan Privasi', 'Syarat & Ketentuan', 'FAQ']} />
            </div>

            <div>
              <h3 className="text-lg font-semibold">Dapatkan insight bisnis terbaru</h3>
              <p className="mt-3 text-sm leading-6 text-[#AFCBBC]">Mingguan. Singkat. Berguna untuk keputusan operasional.</p>
              <div className="mt-5 flex overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <input type="email" placeholder="Masukkan email Anda" className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder:text-[#8FA59A] outline-none" />
                <button className="flex items-center gap-2 bg-[#2F8A60] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#3A9A6B]">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-6 text-xs text-[#8FB19F] sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 DashInsight. Seluruh hak cipta dilindungi.</p>
            <p>Data transaksi diproses secara lokal di perangkat pengguna.</p>
          </div>
        </div>
      </footer>

      {showRegister && (
        <RegistrationModal
          success={success}
          loading={loading}
          error={error}
          formData={formData}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowRegister(false);
            setSuccess(false);
            setError('');
          }}
        />
      )}
    </div>
  );
}

function TrustItem({ icon: Icon, label }: { icon: typeof ShieldCheck; label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm font-semibold text-[#43584E]">
      <Icon className="h-4 w-4 text-[#276749]" />
      {label}
    </div>
  );
}

function TrustItemLight({ icon: Icon, label }: { icon: typeof ShieldCheck; label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-[#D9EBE1]">
      <Icon className="h-4 w-4 text-[#8FE3B8]" />
      {label}
    </div>
  );
}

function DataChip({ label, tone }: { label: string; tone: string }) {
  return <div className={`rounded-2xl px-4 py-3 text-sm font-semibold text-[#173F2E] shadow-sm ${tone}`}>{label}</div>;
}

function ProcessStepCard({ number, icon: Icon, title, description }: { number: string; icon: typeof Upload; title: string; description: string; }) {
  return (
    <div className="relative rounded-[1.75rem] border border-[#E2EAE4] bg-[#F8FBF9] p-7 shadow-[0_14px_40px_rgba(12,31,23,0.05)]">
      <div className="mb-7 flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#DCEEE4] font-semibold text-[#276749]">{number}</span>
        <Icon className="h-6 w-6 text-[#276749]" />
      </div>
      <h3 className="text-xl font-semibold text-[#173F2E]">{title}</h3>
      <p className="mt-3 max-w-[38ch] leading-7 text-[#566960]">{description}</p>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h3 className="font-semibold text-white">{title}</h3>
      <ul className="mt-4 space-y-3 text-[#D8E8DF]">
        {links.map(link => <li key={link}><a href="#" className="transition-colors hover:text-white">{link}</a></li>)}
      </ul>
    </div>
  );
}

type RegistrationModalProps = {
  success: boolean;
  loading: boolean;
  error: string;
  formData: Record<string, string>;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmit: (event: React.FormEvent) => void;
  onClose: () => void;
};

function RegistrationModal({ success, loading, error, formData, onChange, onSubmit, onClose }: RegistrationModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0C1F17]/75 p-4" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }} role="dialog" aria-modal="true" aria-labelledby="register-title">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-[0_8px_24px_rgba(12,31,23,0.24)]">
        {success ? (
          <div className="p-8 text-center sm:p-10">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#DCEEE4] text-[#276749]"><CheckCircle2 className="h-7 w-7" /></span>
            <h2 id="register-title" className="mt-5 text-2xl font-bold text-[#173F2E]">Pendaftaran sudah dikirim</h2>
            <p className="mt-3 leading-7 text-[#566960]">Lanjutkan verifikasi melalui WhatsApp agar admin dapat memeriksa dan mengaktifkan akun Anda.</p>
            <button onClick={onClose} className="landing-button-primary mt-7 w-full justify-center">Tutup</button>
          </div>
        ) : (
          <>
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#DDE7E1] bg-white px-6 py-5">
              <div>
                <h2 id="register-title" className="text-xl font-bold text-[#173F2E]">Ajukan akun DashInsight</h2>
                <p className="mt-1 text-sm text-[#63756C]">Isi data bisnis untuk memulai proses aktivasi.</p>
              </div>
              <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-lg text-[#53665D] hover:bg-[#EFF5F1]" aria-label="Tutup formulir"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={onSubmit} className="grid gap-5 p-6 sm:grid-cols-2">
              <FormField icon={User} label="Nama lengkap" name="name" value={formData.name} onChange={onChange} placeholder="Nama Anda" required />
              <FormField icon={Mail} label="Email bisnis" name="email" type="email" value={formData.email} onChange={onChange} placeholder="nama@bisnis.com" required />
              <FormField icon={Lock} label="Kata sandi" name="password" type="password" value={formData.password} onChange={onChange} placeholder="Minimal 6 karakter" minLength={6} required />
              <FormField icon={Building2} label="Nama bisnis" name="business_name" value={formData.business_name} onChange={onChange} placeholder="Nama usaha Anda" required />
              <label className="text-sm font-semibold text-[#30463C]">Jenis bisnis
                <select name="business_type" required value={formData.business_type} onChange={onChange} className="landing-input mt-2">
                  <option value="">Pilih jenis bisnis</option>
                  {['Retail', 'Kuliner', 'Fashion', 'Online Shop', 'Jasa', 'F&B', 'E-commerce', 'Distributor'].map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <FormField icon={Phone} label="Nomor WhatsApp" name="phone" type="tel" value={formData.phone} onChange={onChange} placeholder="08xxxxxxxxxx" required />
              <label className="text-sm font-semibold text-[#30463C] sm:col-span-2">Alamat bisnis <span className="font-normal text-[#71837A]">(opsional)</span>
                <div className="relative mt-2"><MapPin className="absolute left-3 top-3.5 h-4 w-4 text-[#71837A]" /><textarea name="address" value={formData.address} onChange={onChange} rows={3} className="landing-input resize-none pl-10" placeholder="Alamat lengkap bisnis" /></div>
              </label>
              {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm leading-6 text-red-700 sm:col-span-2" role="alert">{error}</p>}
              <button type="submit" disabled={loading} className="landing-button-primary min-h-12 justify-center disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2">{loading ? 'Mengirim pendaftaran…' : 'Ajukan Pendaftaran'}</button>
              <p className="text-center text-xs leading-5 text-[#71837A] sm:col-span-2">Setelah dikirim, WhatsApp akan terbuka untuk melanjutkan verifikasi dengan admin.</p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}


function FormField({ icon: Icon, label, ...props }: { icon: typeof User; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="text-sm font-semibold text-[#30463C]">{label}
      <div className="relative mt-2"><Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71837A]" /><input {...props} className="landing-input !pl-10" /></div>
    </label>
  );
}
