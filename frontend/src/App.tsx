import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './hooks/redux';
import { initializeAuth } from './store/slices/authSlice';
import { setTenantId } from './store/slices/appSlice';
import { getTenantId } from './lib/api';
import { initializeAdminAuth } from './store/slices/adminSlice';

// Layout components
import PublicLayout from './components/layouts/PublicLayout';
import DashboardLayout from './components/layouts/DashboardLayout';
import AdminLayout from './components/layouts/AdminLayout';
import SecurityLayout from './components/layouts/SecurityLayout';

// Guards
import RoleGuard from './components/guards/RoleGuard';
import AdminRoleGuard from './components/guards/AdminRoleGuard';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import StudentsPage from './pages/StudentsPage';
import AttendancePage from './pages/AttendancePage';
import StaffAttendancePage from './pages/StaffAttendancePage';
import StaffAttendanceReportPage from './pages/StaffAttendanceReportPage';
import GatePassPage from './pages/GatePassPage';
import VisitorsPage from './pages/VisitorsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Admin Pages
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

// Security Pages
import SecurityDashboardPage from './pages/security/SecurityDashboardPage';
import CheckInOutPage from './pages/security/CheckInOutPage';
import SecurityVisitorsPage from './pages/security/VisitorsPage';

// Protected Route component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Admin Protected Route component
interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.admin);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" replace />;
};

// App initialization component
const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Set tenant ID from URL or localStorage first
    const tenantId = getTenantId();
    if (tenantId) {
      dispatch(setTenantId(tenantId));
    }

    // Initialize auth state from localStorage
    dispatch(initializeAuth());

    // Initialize admin auth state from localStorage (only if needed)
    // This will only make API calls if admin tokens exist
    dispatch(initializeAdminAuth());
  }, []); // Empty dependency array to run only once

  return <>{children}</>;
};

// Main app routes component
const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Default redirect based on role */}
        <Route path="/default" element={
          <RoleGuard allowedRoles={['admin', 'teacher', 'parent', 'security']}>
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          </RoleGuard>
        } />
        
        <Route path="/login" element={
          <PublicLayout>
            <LoginPage />
          </PublicLayout>
        } />
        
        <Route path="/register" element={
          <PublicLayout>
            <RegisterPage />
          </PublicLayout>
        } />
        
        <Route path="/forgot-password" element={
          <PublicLayout>
            <ForgotPasswordPage />
          </PublicLayout>
        } />
        
        <Route path="/reset-password" element={
          <PublicLayout>
            <ResetPasswordPage />
          </PublicLayout>
        } />
        
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        
        <Route path="/admin" element={
          <AdminRoleGuard allowedRoles={['SYSTEM_ADMIN', 'SYSTEM_DEVELOPER']}>
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminDashboardPage />
              </AdminLayout>
            </AdminProtectedRoute>
          </AdminRoleGuard>
        } />

        {/* Protected routes - Admin/Teacher/Parent only */}
        <Route path="/dashboard" element={
          <RoleGuard allowedRoles={['ADMIN', 'TEACHER', 'PARENT']}>
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            </ProtectedRoute>
          </RoleGuard>
        } />

        <Route path="/users" element={
          <RoleGuard allowedRoles={['ADMIN']}>
            <ProtectedRoute>
              <DashboardLayout>
                <UsersPage />
              </DashboardLayout>
            </ProtectedRoute>
          </RoleGuard>
        } />

        <Route path="/students" element={
          <RoleGuard allowedRoles={['ADMIN', 'TEACHER']}>
            <ProtectedRoute>
              <DashboardLayout>
                <StudentsPage />
              </DashboardLayout>
            </ProtectedRoute>
          </RoleGuard>
        } />

        <Route path="/attendance" element={
          <RoleGuard allowedRoles={['ADMIN', 'TEACHER']}>
            <ProtectedRoute>
              <DashboardLayout>
                <AttendancePage />
              </DashboardLayout>
            </ProtectedRoute>
          </RoleGuard>
        } />

        <Route path="/staff-attendance" element={
          <RoleGuard allowedRoles={['ADMIN', 'TEACHER']}>
            <ProtectedRoute>
              <DashboardLayout>
                <StaffAttendancePage />
              </DashboardLayout>
            </ProtectedRoute>
          </RoleGuard>
        } />

        <Route path="/staff-attendance/reports" element={
          <RoleGuard allowedRoles={['ADMIN', 'TEACHER']}>
            <ProtectedRoute>
              <DashboardLayout>
                <StaffAttendanceReportPage />
              </DashboardLayout>
            </ProtectedRoute>
          </RoleGuard>
        } />

        <Route path="/gate-pass" element={
          <RoleGuard allowedRoles={['ADMIN', 'TEACHER', 'PARENT']}>
            <ProtectedRoute>
              <DashboardLayout>
                <GatePassPage />
              </DashboardLayout>
            </ProtectedRoute>
          </RoleGuard>
        } />

        <Route path="/visitors" element={
          <RoleGuard allowedRoles={['ADMIN']}>
            <ProtectedRoute>
              <DashboardLayout>
                <VisitorsPage />
              </DashboardLayout>
            </ProtectedRoute>
          </RoleGuard>
        } />

        <Route path="/analytics" element={
          <RoleGuard allowedRoles={['ADMIN', 'TEACHER']}>
            <ProtectedRoute>
              <DashboardLayout>
                <AnalyticsPage />
              </DashboardLayout>
            </ProtectedRoute>
          </RoleGuard>
        } />

        <Route path="/settings" element={
          <RoleGuard allowedRoles={['ADMIN']}>
            <ProtectedRoute>
              <DashboardLayout>
                <SettingsPage />
              </DashboardLayout>
            </ProtectedRoute>
          </RoleGuard>
        } />

        <Route path="/profile" element={
          <RoleGuard allowedRoles={['ADMIN', 'TEACHER', 'PARENT', 'SECURITY']}>
            <ProtectedRoute>
              <DashboardLayout>
                <ProfilePage />
              </DashboardLayout>
            </ProtectedRoute>
          </RoleGuard>
        } />

        <Route path="/security/profile" element={
          <RoleGuard allowedRoles={['SECURITY']}>
            <ProtectedRoute>
              <SecurityLayout>
                <ProfilePage />
              </SecurityLayout>
            </ProtectedRoute>
          </RoleGuard>
        } />

        <Route path="/security/settings" element={
          <RoleGuard allowedRoles={['SECURITY']}>
            <ProtectedRoute>
              <SecurityLayout>
                <SettingsPage />
              </SecurityLayout>
            </ProtectedRoute>
          </RoleGuard>
        } />

        <Route path="/security/reports" element={
          <RoleGuard allowedRoles={['SECURITY']}>
            <ProtectedRoute>
              <SecurityLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Security Reports</h1>
                  <p className="text-gray-600">Security reports and analytics will be available here.</p>
                </div>
              </SecurityLayout>
            </ProtectedRoute>
          </RoleGuard>
        } />

        {/* Security routes - Security role only */}
        <Route path="/security/dashboard" element={
          <RoleGuard allowedRoles={['SECURITY']}>
            <ProtectedRoute>
              <SecurityLayout>
                <SecurityDashboardPage />
              </SecurityLayout>
            </ProtectedRoute>
          </RoleGuard>
        } />

        <Route path="/security/check-in-out" element={
          <RoleGuard allowedRoles={['SECURITY']}>
            <ProtectedRoute>
              <SecurityLayout>
                <CheckInOutPage />
              </SecurityLayout>
            </ProtectedRoute>
          </RoleGuard>
        } />

        <Route path="/security/visitors" element={
          <RoleGuard allowedRoles={['SECURITY']}>
            <ProtectedRoute>
              <SecurityLayout>
                <SecurityVisitorsPage />
              </SecurityLayout>
            </ProtectedRoute>
          </RoleGuard>
        } />

        {/* 404 page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

// Query client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Main App component
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppInitializer>
          <AppRoutes />
        </AppInitializer>
        <Toaster 
          position="top-right"
          richColors
          closeButton
          duration={4000} 
        />
      </QueryClientProvider>
    </Provider>
  );
};

export default App;
