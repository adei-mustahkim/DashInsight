// DashInsight - Expired Account Page
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../stores/useAuth';
import { useNavigate } from 'react-router-dom';

interface ExpiredAccountPageProps {
  message?: string;
}

export default function ExpiredAccountPage({ message }: ExpiredAccountPageProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1FAF5] via-white to-[#DCF4E7] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Akun Tidak Aktif</h1>
        <p className="text-gray-500 mb-6">
          {message || 'Masa aktif akun Anda telah berakhir. Hubungi admin untuk perpanjangan.'}
        </p>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4">
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full bg-[#276749] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-[#1f533a] transition"
          >
            Kembali ke Login
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-6">
          DashInsight v1.0
        </p>
      </div>
    </div>
  );
}
