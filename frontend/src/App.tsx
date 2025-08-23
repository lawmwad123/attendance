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

// Layout components
import PublicLayout from './components/layouts/PublicLayout';
import DashboardLayout from './components/layouts/DashboardLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import StudentsPage from './pages/StudentsPage';
import AttendancePage from './pages/AttendancePage';
import GatePassPage from './pages/GatePassPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

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

// App initialization component
const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initialize auth state from localStorage
    dispatch(initializeAuth());

    // Set tenant ID from URL or localStorage
    const tenantId = getTenantId();
    if (tenantId) {
      dispatch(setTenantId(tenantId));
    }
  }, [dispatch]);

  return <>{children}</>;
};

// Main app routes component
const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={
          <PublicLayout>
            <LoginPage />
          </PublicLayout>
        } />

        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout>
              <DashboardPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout>
              <DashboardPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/users" element={
          <ProtectedRoute>
            <DashboardLayout>
              <UsersPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/students" element={
          <ProtectedRoute>
            <DashboardLayout>
              <StudentsPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/attendance" element={
          <ProtectedRoute>
            <DashboardLayout>
              <AttendancePage />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/gate-pass" element={
          <ProtectedRoute>
            <DashboardLayout>
              <GatePassPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/analytics" element={
          <ProtectedRoute>
            <DashboardLayout>
              <AnalyticsPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <DashboardLayout>
              <SettingsPage />
            </DashboardLayout>
          </ProtectedRoute>
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
