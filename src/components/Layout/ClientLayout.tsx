// DashInsight - Client Layout
import type { ReactNode } from 'react';
import { useAuth } from '../../stores/useAuth';
import {
  BarChart3, LayoutDashboard, Upload, Lightbulb, FileText, Settings, LogOut,
  Menu, X, Database, Layers
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../../assets/logo.png';

type ClientView = 'dashboard' | 'upload' | 'insights' | 'reports' | 'settings' | 'charts';

const NAV_ITEMS: { id: ClientView; label: string; icon: typeof BarChart3; path: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'charts', label: 'Visualisasi Data', icon: Layers, path: '/charts' },
  { id: 'upload', label: 'Upload Data', icon: Upload, path: '/upload' },
  { id: 'insights', label: 'Insight', icon: Lightbulb, path: '/insights' },
  { id: 'reports', label: 'Laporan', icon: FileText, path: '/reports' },
  { id: 'settings', label: 'Pengaturan', icon: Settings, path: '/settings' },
];

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const { client, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeView = NAV_ITEMS.find(item => item.path === location.pathname)?.id || 'dashboard';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 print:hidden bg-white border-r border-gray-200
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1 min-w-0">
              <img src={logoImg} alt="DashInsight Logo" className="h-14 w-auto object-contain" />
              <p className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold truncate">{client?.business_name || 'Client'}</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
                  ${isActive
                    ? 'bg-[#DCF4E7] text-[#276749]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className="w-4.5 h-4.5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-[#276749] rounded-full flex items-center justify-center text-white text-xs font-bold">
              {client?.business_name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{client?.business_name}</p>
              <p className="text-xs text-gray-400 truncate">{client?.business_type}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
          >
            <LogOut className="w-4.5 h-4.5" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="print:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Database className="w-4 h-4" />
            <span className="text-gray-900 font-semibold">{NAV_ITEMS.find(n => n.id === activeView)?.label}</span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
            <span className="hidden sm:inline">Data tersimpan di perangkat ini</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
