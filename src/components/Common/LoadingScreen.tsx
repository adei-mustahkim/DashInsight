// DashInsight - Loading Screen
import { BarChart3 } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1FAF5] via-white to-[#DCF4E7] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#276749] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
          <BarChart3 className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-500">Memuat...</p>
      </div>
    </div>
  );
}
