// DashInsight - Login Page
import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../stores/useAuth';
import { Lock, Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import logoImg from '../assets/logo.png';

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
    <div className="relative flex min-h-screen items-center justify-center bg-[#F4F9F6] p-4 overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-[#276749]/10 to-transparent blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-[#276749]/15 to-transparent blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[440px]">
        
        {/* Tombol Kembali */}
        <div className="mb-6 flex justify-center sm:justify-start">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 rounded-full bg-white/60 backdrop-blur-md px-4 py-2 text-sm font-semibold text-[#30463C] shadow-sm border border-white/40 transition-all hover:bg-white hover:shadow-md hover:-translate-y-0.5"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
          </Link>
        </div>

        {/* Card Login Utama */}
        <div className="rounded-[2rem] bg-white/80 backdrop-blur-xl p-8 sm:p-10 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] border border-white">
          
          <div className="mb-8 flex flex-col items-center text-center">
            <img src={logoImg} alt="DashInsight Logo" className="h-16 w-auto mb-6 object-contain drop-shadow-sm" />
            <h2 className="text-2xl font-bold tracking-tight text-[#173F2E]">Selamat Datang</h2>
            <p className="mt-1.5 text-sm text-[#51645B]">Masuk untuk mengelola sistem analitik UMKM</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-[#173F2E]">Email Admin</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#A4B5AC] transition-colors group-focus-within:text-[#276749]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@dashinsight.id"
                  className="w-full rounded-xl border-2 border-[#E8EFEA] bg-white/50 py-3.5 pl-12 pr-4 text-sm font-semibold text-[#173F2E] placeholder-[#A4B5AC] outline-none transition-all focus:border-[#276749] focus:bg-white"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-[#173F2E]">Kata Sandi</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#A4B5AC] transition-colors group-focus-within:text-[#276749]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full rounded-xl border-2 border-[#E8EFEA] bg-white/50 py-3.5 pl-12 pr-12 text-sm font-semibold text-[#173F2E] placeholder-[#A4B5AC] outline-none transition-all focus:border-[#276749] focus:bg-white"
                  autoComplete="current-password"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A4B5AC] hover:text-[#173F2E] transition-colors"
                  aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 rounded-xl bg-red-50/80 p-3.5 text-sm font-medium text-red-700 ring-1 ring-red-100/50 backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full h-[3.25rem] items-center justify-center gap-2 rounded-xl bg-[#276749] px-4 text-sm font-bold text-white shadow-[0_8px_16px_-4px_rgba(39,103,73,0.3)] transition-all hover:-translate-y-0.5 hover:bg-[#1C4E36] hover:shadow-[0_12px_20px_-4px_rgba(39,103,73,0.4)] disabled:pointer-events-none disabled:opacity-60"
            >
              {loading ? 'Mengautentikasi...' : 'Masuk Dashboard'}
            </button>
          </form>

          <p className="mt-8 text-center text-[11px] font-medium text-[#A4B5AC] uppercase tracking-wider">
            Protected by DashInsight Security
          </p>
        </div>
      </div>
    </div>
  );
}
