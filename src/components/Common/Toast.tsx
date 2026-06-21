import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />, 
    error: <XCircle className="w-5 h-5 text-red-500" />, 
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />, 
    info: <Info className="w-5 h-5 text-blue-500" />, 
  };

  const bgColors: Record<string, string> = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-blue-50 border-blue-200',
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-md animate-slide-in-right">
      <div className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg ${bgColors[type]}`}>
        <div className="flex-shrink-0">{icons[type]}</div>
        <p className="flex-1 text-sm text-gray-800">{message}</p>
        <button onClick={onClose} className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
