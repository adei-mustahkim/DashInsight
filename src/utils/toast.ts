type ToastType = 'success' | 'error' | 'warning' | 'info';

const icons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const bgColors: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export function showToast(message: string, type: ToastType = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg text-sm font-medium ${bgColors[type]} transform translate-x-full opacity-0 transition-all duration-300`;
  toast.innerHTML = `<span class="text-base">${icons[type]}</span><span>${message}</span>`;
  
  container.appendChild(toast);
  
  requestAnimationFrame(() => {
    toast.classList.remove('translate-x-full', 'opacity-0');
    toast.classList.add('translate-x-0', 'opacity-100');
  });

  setTimeout(() => {
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

export function toastSuccess(message: string) { showToast(message, 'success'); }
export function toastError(message: string) { showToast(message, 'error', 4000); }
export function toastWarning(message: string) { showToast(message, 'warning', 4000); }
export function toastInfo(message: string) { showToast(message, 'info'); }
