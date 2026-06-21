// DashInsight - Admin Profile Page
// @ts-nocheck
import { useAuth } from '../../stores/useAuth';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Shield, Clock, Calendar, User } from 'lucide-react';

export default function AdminProfilePage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const name = user?.name || 'Admin';
  const email = user?.email || '-';
  const role = user?.role === 'admin' ? 'Administrator' : 'Klien';
  const lastLogin = user?.last_login_at ? new Date(user.last_login_at).toLocaleString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : '-';
  const status = user?.status || 'active';
  const initials = name.charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto py-8 md:py-12 px-4 md:px-6">
      {/* Header */}
      <div className="text-center space-y-4 mb-10">
        <div className="inline-block bg-[#DCF4E7] text-[#276749] px-3 py-1 rounded-full text-sm font-medium mb-2">
          Profil Admin
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Informasi Akun</h1>
        <p className="text-gray-500 max-w-md mx-auto">Kelola informasi profil administrator DashInsight.</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-[#276749] to-[#1f533a] p-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 ring-4 ring-white/30 shadow-lg">
            {initials}
          </div>
          <h2 className="text-xl font-bold text-white">{name}</h2>
          <p className="text-white/70 text-sm mt-1">{role}</p>
        </div>

        {/* Info Grid */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InfoItem icon={<User className="w-4 h-4" />} label="Nama Lengkap" value={name} />
            <InfoItem icon={<Mail className="w-4 h-4" />} label="Email" value={email} />
            <InfoItem icon={<Shield className="w-4 h-4" />} label="Role" value={role} />
            <InfoItem 
              icon={<Clock className="w-4 h-4" />} 
              label="Status" 
              value={status === 'active' ? '✅ Aktif' : status}
              valueClassName={status === 'active' ? 'text-emerald-600' : 'text-red-600'}
            />
            <InfoItem 
              icon={<Calendar className="w-4 h-4" />} 
              label="Terakhir Login" 
              value={lastLogin}
              className="md:col-span-2"
            />
          </div>
        </div>
      </div>

    </div>
  );
}

function InfoItem({ icon, label, value, className = '', valueClassName = '' }: { 
  icon: React.ReactNode; label: string; value: string; className?: string; valueClassName?: string 
}) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      <p className={`text-sm font-medium text-gray-900 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100 ${valueClassName}`}>
        {value}
      </p>
    </div>
  );
}
