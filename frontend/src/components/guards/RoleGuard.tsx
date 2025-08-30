import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackPath?: string;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ 
  children, 
  allowedRoles, 
  fallbackPath = '/login' 
}) => {
  const { user, isAuthenticated } = useAppSelector((state: any) => state.auth);

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} replace />;
  }

  // If user has no role or role is not in allowed roles, redirect
  if (!user?.role || !allowedRoles.includes(user.role)) {
    // Redirect security users to security dashboard
    if (user?.role === 'SECURITY') {
      return <Navigate to="/security/dashboard" replace />;
    }
    // Default fallback
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
