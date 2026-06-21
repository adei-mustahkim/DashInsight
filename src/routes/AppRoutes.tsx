// DashInsight - App Routes
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../stores/useAuth';
import AuthLayout from '../components/Layout/AuthLayout';
import AdminLayout from '../components/Layout/AdminLayout';
import ClientLayout from '../components/Layout/ClientLayout';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminClientsPage from '../pages/admin/AdminClientsPage';
import AdminClientDetailPage from '../pages/admin/AdminClientDetailPage';
import AdminChartsPage from '../pages/admin/AdminChartsPage';
import AdminFormulasPage from '../pages/admin/AdminFormulasPage';
import AdminKpisPage from '../pages/admin/AdminKpisPage';
import AdminDictionaryPage from '../pages/admin/AdminDictionaryPage';
import AdminAuditPage from '../pages/admin/AdminAuditPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';
import AdminProfilePage from '../pages/admin/AdminProfilePage';
import ClientChartsPage from '../pages/client/ClientChartsPage';
import ClientDashboardBuilder from '../pages/client/ClientDashboardBuilder';
import { DashInsightClientApp } from '../App';
import ExpiredAccountPage from '../pages/ExpiredAccountPage';
import NotFoundPage from '../pages/NotFoundPage';
import LoadingScreen from '../components/Common/LoadingScreen';

// Protected Route - requires authentication
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: ('admin' | 'client')[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role as 'admin' | 'client')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Client Route - requires client role + refresh auth
function ClientRoute({ children }: { children: React.ReactNode }) {
  const { user, clientActive, clientExpiredMessage, loading, token, refreshMe } = useAuth();

  // Trigger auth refresh on mount if token exists but user is not loaded
  useEffect(() => {
    if (token && !user) {
      refreshMe();
    }
  }, [token, user, refreshMe]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'client') {
    return <Navigate to="/admin" replace />;
  }

  if (!clientActive) {
    return <ExpiredAccountPage message={clientExpiredMessage} />;
  }

  return <ClientLayout>{children}</ClientLayout>;
}

// Client Charts Page Route
function ClientChartsRoute() {
  return (
    <ClientRoute>
      <ClientChartsPage />
    </ClientRoute>
  );
}
function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  );
}

function CoreClientRoute({ initialView }: { initialView?: string }) {
  const { user, clientActive, clientExpiredMessage, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== 'client') {
    return <Navigate to="/admin" replace />;
  }

  if (!clientActive) {
    return <ExpiredAccountPage message={clientExpiredMessage} />;
  }

  return <DashInsightClientApp initialView={initialView} />;
}

export default function AppRoutes() {
  const { user, loading } = useAuth();

  if ((window as any).__EXPORTED_DATA__) {
    return <DashInsightClientApp initialView="home" />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page - hanya untuk pengunjung */}
        <Route path="/" element={
          loading ? <LoadingScreen /> : 
          user ? (user.role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />) : 
          <LandingPage />
        } />

        {/* Public Routes */}
        <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
        <Route path="/expired" element={<ExpiredAccountPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        <Route path="/admin/clients" element={<AdminRoute><AdminClientsPage /></AdminRoute>} />
        <Route path="/admin/clients/:id" element={<AdminRoute><AdminClientDetailPage /></AdminRoute>} />
        <Route path="/admin/charts" element={<AdminRoute><AdminChartsPage /></AdminRoute>} />
        <Route path="/admin/formulas" element={<AdminRoute><AdminFormulasPage /></AdminRoute>} />
        <Route path="/admin/kpis" element={<AdminRoute><AdminKpisPage /></AdminRoute>} />
        <Route path="/admin/dictionary" element={<AdminRoute><AdminDictionaryPage /></AdminRoute>} />
        <Route path="/admin/audit" element={<AdminRoute><AdminAuditPage /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><AdminSettingsPage /></AdminRoute>} />
        <Route path="/admin/profile" element={<AdminRoute><AdminProfilePage /></AdminRoute>} />

        {/* Client Routes - CoreClientRoute has its own sidebar */}
        <Route path="/dashboard" element={<CoreClientRoute initialView="home" />} />
        <Route path="/upload" element={<CoreClientRoute initialView="upload" />} />
        <Route path="/insights" element={<CoreClientRoute initialView="insights" />} />
        <Route path="/reports" element={<CoreClientRoute initialView="reports" />} />
        <Route path="/settings" element={<CoreClientRoute initialView="pengaturan" />} />
        <Route path="/profile" element={<CoreClientRoute initialView="profile" />} />

        {/* Client Charts Page */}
        <Route path="/charts" element={<ClientChartsRoute />} />

        {/* Client Dashboard Builder - Shows enabled charts */}
        <Route path="/my-dashboard" element={
          <ClientRoute>
            <ClientDashboardBuilder />
          </ClientRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
