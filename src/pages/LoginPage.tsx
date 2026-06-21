// DashInsight - Login Page
import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../stores/useAuth';
import { Lock, Mail, Eye, EyeOff, ArrowLeft, BarChart3, ShieldCheck } from 'lucide-react';
import logoImg from '../assets/logo.png';
import logoWhiteImg from '../assets/logo-removebg-preview.png';

export default function LoginPage() {
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Email dan password harus diisi'); return; }
    setLoading(true);
    setError('');
    const result = await login(email, password);
    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Kiri - Area Dekorasi (Sembunyi di Mobile) */}
      <div className="hidden w-[45%] flex-col justify-between overflow-hidden bg-[#0D1F16] p-10 lg:flex xl:w-1/2">
        <div className="relative z-10">
          <img src={logoWhiteImg} alt="DashInsight" className="h-10 w-auto object-contain brightness-0 invert opacity-90" />
        </div>

        <div className="relative z-10 mb-10 max-w-md">
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white xl:text-5xl">
            Satu platform.<br />
            Ribuan keputusan bisnis<br />yang lebih tajam.
          </h1>
          <p className="mt-6 text-lg text-[#AFCBBC]">
            Kelola data UMKM Anda dengan cepat, aman, dan langsung dari perangkat Anda sendiri.
          </p>
          
          <div className="mt-12 flex items-center gap-6">
            <div className="flex -space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#0D1F16] bg-[#276749] text-xs font-bold text-white shadow-sm">AB</div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#0D1F16] bg-[#DCEEE4] text-xs font-bold text-[#173F2E] shadow-sm">SR</div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#0D1F16] bg-[#2B6B4B] text-xs font-bold text-white shadow-sm">RF</div>
            </div>
            <p className="text-sm font-medium text-[#AFCBBC]">Dipercaya oleh<br /><strong className="text-white">ratusan UMKM</strong></p>
          </div>
        </div>

        {/* Efek Latar Belakang Premium */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(39,103,73,0.35),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(39,103,73,0.15),_transparent_40%)]" />
        <div className="absolute -bottom-24 -right-24 z-0 h-96 w-96 rounded-full bg-[#276749] opacity-20 blur-3xl" />
      </div>

      {/* Kanan - Form Login */}
      <div className="relative flex w-full flex-col justify-center px-6 lg:w-[55%] xl:w-1/2 xl:px-20">
        
        {/* Tombol Kembali (Absolute) */}
        <Link 
          to="/" 
          className="absolute left-6 top-6 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[#51645B] transition-colors hover:bg-[#F3F8F5] hover:text-[#173F2E] lg:left-10 lg:top-10"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke beranda
        </Link>

        {/* Header Form */}
        <div className="mx-auto w-full max-w-[420px]">
          <div className="mb-10 lg:hidden">
            <img src={logoImg} alt="DashInsight Logo" className="h-12 w-auto object-contain" />
          </div>

          <div className="mb-8">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF5F1] text-[#276749] shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-[#173F2E]">Selamat datang kembali</h2>
            <p className="mt-2 text-[#51645B]">Silakan masuk ke akun admin dashboard Anda.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-[#173F2E]">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#A4B5AC]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@dashinsight.id"
                  className="w-full rounded-xl border border-[#DCEEE4] bg-[#F8FBF9] py-3.5 pl-11 pr-4 text-sm font-medium text-[#173F2E] placeholder-[#A4B5AC] outline-none transition-all focus:border-[#276749] focus:bg-white focus:ring-4 focus:ring-[#276749]/10"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-[#173F2E]">Kata sandi</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#A4B5AC]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full rounded-xl border border-[#DCEEE4] bg-[#F8FBF9] py-3.5 pl-11 pr-12 text-sm font-medium text-[#173F2E] placeholder-[#A4B5AC] outline-none transition-all focus:border-[#276749] focus:bg-white focus:ring-4 focus:ring-[#276749]/10"
                  autoComplete="current-password"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A4B5AC] hover:text-[#173F2E] transition-colors"
                  aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 ring-1 ring-red-100">
                <div className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full min-h-[3.25rem] items-center justify-center gap-2 rounded-xl bg-[#276749] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(39,103,73,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#1C4E36] hover:shadow-[0_12px_24px_rgba(39,103,73,0.3)] disabled:pointer-events-none disabled:opacity-60"
            >
              {loading ? 'Sedang Memasukkan...' : 'Masuk ke Dashboard'}
            </button>
          </form>

          <p className="mt-12 text-center text-xs font-medium text-[#A4B5AC]">
            © {new Date().getFullYear()} DashInsight. Seluruh hak cipta dilindungi.
          </p>
        </div>
      </div>
    </div>
  );
}
