import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock,
  User,
  Phone,
  Building,
  Globe,
  AlertCircle,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { api } from '../lib/api';

interface RegisterFormData {
  // School Information
  name: string;
  slug: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  principal_name: string;
  
  // Admin Information
  admin_first_name: string;
  admin_last_name: string;
  admin_email: string;
  admin_phone: string;
  admin_password: string;
  admin_password_confirm: string;
  
  // Settings
  timezone: string;
  school_start_time: string;
  school_end_time: string;
  
  // Plan
  subscription_plan: string;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    slug: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    principal_name: '',
    admin_first_name: '',
    admin_last_name: '',
    admin_email: '',
    admin_phone: '',
    admin_password: '',
    admin_password_confirm: '',
    timezone: 'UTC',
    school_start_time: '08:00',
    school_end_time: '15:00',
    subscription_plan: 'basic'
  });

  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Auto-generate slug from school name
    if (field === 'name') {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 2) return;
    
    setIsCheckingSlug(true);
    try {
      const result = await api.validateSlug(slug);
      setSlugAvailable(result.available);
      if (!result.available) {
        setErrors(prev => ({ ...prev, slug: result.message }));
      }
    } catch (error) {
      console.error('Error checking slug availability:', error);
    } finally {
      setIsCheckingSlug(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {};
    
    // School validation
    if (!formData.name.trim()) {
      newErrors.name = 'School name is required';
    }
    
    if (!formData.slug.trim()) {
      newErrors.slug = 'School slug is required';
    } else if (formData.slug.length < 2) {
      newErrors.slug = 'Slug must be at least 2 characters';
    } else if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Website must start with http:// or https://';
    }
    
    // Admin validation
    if (!formData.admin_first_name.trim()) {
      newErrors.admin_first_name = 'First name is required';
    }
    
    if (!formData.admin_last_name.trim()) {
      newErrors.admin_last_name = 'Last name is required';
    }
    
    if (!formData.admin_email.trim()) {
      newErrors.admin_email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.admin_email)) {
      newErrors.admin_email = 'Please enter a valid email address';
    }
    
    if (!formData.admin_password) {
      newErrors.admin_password = 'Password is required';
    } else if (formData.admin_password.length < 8) {
      newErrors.admin_password = 'Password must be at least 8 characters';
    }
    
    if (formData.admin_password !== formData.admin_password_confirm) {
      newErrors.admin_password_confirm = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (slugAvailable === false) {
      toast.error('Please choose a different school slug');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create school registration data
      const schoolData = {
        name: formData.name,
        slug: formData.slug,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        principal_name: formData.principal_name,
        admin_email: formData.admin_email,
        admin_password: formData.admin_password,
        admin_first_name: formData.admin_first_name,
        admin_last_name: formData.admin_last_name,
        admin_phone: formData.admin_phone,
        timezone: formData.timezone,
        school_start_time: formData.school_start_time,
        school_end_time: formData.school_end_time
      };
      
      // Call the API to create school
      const response = await api.request({
        method: 'POST',
        url: '/schools/',
        data: schoolData
      });
      
      toast.success('School registered successfully! You can now log in.');
      navigate('/login');
      
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.detail || 'Registration failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <div className="bg-indigo-100 p-3 rounded-lg inline-flex mb-4">
            <Shield className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Register Your School
          </h1>
          <p className="text-gray-600">
            Set up your school's attendance management system in minutes
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* School Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2" />
                School Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    School Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="St. Mary's Academy"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                  {errors.name && (
                    <div className="flex items-center mt-1 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.name}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                    School URL *
                  </label>
                  <div className="relative">
                    <input
                      id="slug"
                      type="text"
                      required
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        errors.slug ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="st-marys-academy"
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      onBlur={() => checkSlugAvailability(formData.slug)}
                    />
                    <div className="absolute right-3 top-3">
                      {isCheckingSlug && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                      )}
                      {slugAvailable === true && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {slugAvailable === false && (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Your school will be accessible at: {formData.slug}.attendly.com
                  </div>
                  {errors.slug && (
                    <div className="flex items-center mt-1 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.slug}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    School Email
                  </label>
                  <div className="relative">
                    <Mail className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="admin@school.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  {errors.email && (
                    <div className="flex items-center mt-1 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.email}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    School Phone
                  </label>
                  <div className="relative">
                    <Phone className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                    <input
                      id="phone"
                      type="tel"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    School Address
                  </label>
                  <textarea
                    id="address"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="123 Education Street, City, State 12345"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                    School Website
                  </label>
                  <div className="relative">
                    <Globe className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                    <input
                      id="website"
                      type="url"
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        errors.website ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="https://www.school.com"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                    />
                  </div>
                  {errors.website && (
                    <div className="flex items-center mt-1 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.website}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="principal_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Principal Name
                  </label>
                  <input
                    id="principal_name"
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Dr. John Smith"
                    value={formData.principal_name}
                    onChange={(e) => handleInputChange('principal_name', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Admin Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Administrator Account
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="admin_first_name" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    id="admin_first_name"
                    type="text"
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.admin_first_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="John"
                    value={formData.admin_first_name}
                    onChange={(e) => handleInputChange('admin_first_name', e.target.value)}
                  />
                  {errors.admin_first_name && (
                    <div className="flex items-center mt-1 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.admin_first_name}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="admin_last_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    id="admin_last_name"
                    type="text"
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.admin_last_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Smith"
                    value={formData.admin_last_name}
                    onChange={(e) => handleInputChange('admin_last_name', e.target.value)}
                  />
                  {errors.admin_last_name && (
                    <div className="flex items-center mt-1 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.admin_last_name}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="admin_email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                    <input
                      id="admin_email"
                      type="email"
                      required
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        errors.admin_email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="admin@school.com"
                      value={formData.admin_email}
                      onChange={(e) => handleInputChange('admin_email', e.target.value)}
                    />
                  </div>
                  {errors.admin_email && (
                    <div className="flex items-center mt-1 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.admin_email}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="admin_phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                    <input
                      id="admin_phone"
                      type="tel"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                      value={formData.admin_phone}
                      onChange={(e) => handleInputChange('admin_phone', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="admin_password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                    <input
                      id="admin_password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        errors.admin_password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Create a strong password"
                      value={formData.admin_password}
                      onChange={(e) => handleInputChange('admin_password', e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.admin_password && (
                    <div className="flex items-center mt-1 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.admin_password}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="admin_password_confirm" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                    <input
                      id="admin_password_confirm"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        errors.admin_password_confirm ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Confirm your password"
                      value={formData.admin_password_confirm}
                      onChange={(e) => handleInputChange('admin_password_confirm', e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.admin_password_confirm && (
                    <div className="flex items-center mt-1 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.admin_password_confirm}
                    </div>
                  )}
                </div>
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
                    Creating School Account...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Register School
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
