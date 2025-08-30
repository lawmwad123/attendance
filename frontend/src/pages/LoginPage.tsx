import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { loginUser } from '../store/slices/authSlice';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Handle redirection when user is already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('User already authenticated, redirecting based on role:', user.role);
      if (user.role === 'SECURITY') {
        navigate('/security/dashboard', { replace: true });
      } else if (user.role === 'ADMIN' || user.role === 'TEACHER' || user.role === 'PARENT') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    console.log('Attempting login with:', { email });
    
    const result = await dispatch(loginUser({ email, password }));
    
    console.log('Login result:', result);
    
    if (loginUser.rejected.match(result)) {
      console.error('Login failed:', result.payload);
      toast.error(result.payload || 'Login failed. Please check your credentials.');
    } else if (loginUser.fulfilled.match(result)) {
      console.log('Login successful:', result.payload);
      toast.success('Login successful!');
      
      // Manual navigation based on user role
      const userRole = result.payload.user.role;
      if (userRole === 'SECURITY') {
        navigate('/security/dashboard', { replace: true });
      } else if (userRole === 'ADMIN' || userRole === 'TEACHER' || userRole === 'PARENT') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  };

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    if (field === 'email') {
      setEmail(value);
    } else {
      setPassword(value);
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="text-center">
            <div className="bg-indigo-100 p-3 rounded-lg inline-flex mb-4">
              <Shield className="h-8 w-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">
              Sign in to your school attendance management system
            </p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                    errors.email 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="teacher@demo-school.com"
                  value={email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
                {errors.email && (
                  <div className="flex items-center mt-1 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.email}
                  </div>
                )}
              </div>
            </div>
            
            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                    errors.password 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="demo123"
                  value={password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                {errors.password && (
                  <div className="flex items-center mt-1 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.password}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex justify-center items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Forgot Password & Register Links */}
          <div className="mt-6 space-y-4">
            <div className="text-center">
              <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Forgot your password?
              </Link>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have a school account?{' '}
                <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-700">
                  Register your school
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            School Attendance Management System
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 