import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { loginUser } from '../store/slices/authSlice';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(loginUser({ email, password }));
    
    if (loginUser.rejected.match(result)) {
      toast.error(result.payload || 'Login failed. Please check your credentials.');
    } else if (loginUser.fulfilled.match(result)) {
      toast.success('Login successful!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-secondary-900">
            Sign in to your school
          </h2>
          <p className="mt-2 text-center text-sm text-secondary-600">
            School Attendance Management System
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input mt-1"
                placeholder="admin@demo-school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input mt-1"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full h-12"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-secondary-600">
              Demo credentials: admin@demo-school.com / admin123
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage; 