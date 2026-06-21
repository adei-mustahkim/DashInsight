// DashInsight - Auth Layout
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1FAF5] via-white to-[#DCF4E7]">
      {children}
    </div>
  );
}
