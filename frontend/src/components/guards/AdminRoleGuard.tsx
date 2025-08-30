import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';

interface AdminRoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackPath?: string;
}

const AdminRoleGuard: React.FC<AdminRoleGuardProps> = ({ 
  children, 
  allowedRoles, 
  fallbackPath = '/admin/login' 
}) => {
  const { admin, isAuthenticated } = useAppSelector((state: any) => state.admin);

  // If not authenticated, redirect to admin login
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} replace />;
  }

  // If admin has no role or role is not in allowed roles, redirect
  if (!admin?.role || !allowedRoles.includes(admin.role)) {
    // Default fallback to admin login
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default AdminRoleGuard;
