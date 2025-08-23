import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { updateUser } from '../store/slices/authSlice';
import { toast } from 'sonner';
import { api } from '../lib/api';
import Modal from '../components/ui/Modal';
import ProfileImageUpload from '../components/ui/ProfileImageUpload';
import { 
  User,
  Mail,
  Phone,
  Shield,
  GraduationCap,
  Heart,
  ShieldCheck,
  Eye,
  EyeOff,
  Save,
  Edit,
  X,
  AlertCircle,
  Calendar,
  Building,
  Badge,
  Lock,
  Key
} from 'lucide-react';
import type { User as UserType } from '../types';

interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  username: string;
  employee_id: string;
  department: string;
  hire_date: string;
}

interface PasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    username: '',
    employee_id: '',
    department: '',
    hire_date: ''
  });

  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Initialize form with user data
  useEffect(() => {
    console.log('ProfilePage: User data changed:', user);
    if (user) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        username: user.username || '',
        employee_id: user.employee_id || '',
        department: user.department || '',
        hire_date: user.hire_date || ''
      });
    }
  }, [user]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (profileData: Partial<UserType>) => api.updateProfile(profileData),
    onSuccess: (updatedUser) => {
      dispatch(updateUser(updatedUser));
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    },
    onError: (error: any) => {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to update profile. Please check your input and try again.';
      toast.error(errorMessage);
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      api.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      setShowPasswordModal(false);
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      toast.success('Password changed successfully!');
    },
    onError: (error: any) => {
      console.error('Error changing password:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to change password. Please check your current password and try again.';
      toast.error(errorMessage);
    },
  });

  const validateProfileForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!profileForm.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!profileForm.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    if (!profileForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileForm.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (profileForm.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(profileForm.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!passwordForm.current_password) {
      newErrors.current_password = 'Current password is required';
    }
    
    if (!passwordForm.new_password) {
      newErrors.new_password = 'New password is required';
    } else if (passwordForm.new_password.length < 8) {
      newErrors.new_password = 'Password must be at least 8 characters long';
    }
    
    if (!passwordForm.confirm_password) {
      newErrors.confirm_password = 'Please confirm your new password';
    } else if (passwordForm.new_password !== passwordForm.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }
    
    updateProfileMutation.mutate(profileForm);
  };

  const handlePasswordSubmit = () => {
    if (!validatePasswordForm()) {
      return;
    }
    
    changePasswordMutation.mutate({
      currentPassword: passwordForm.current_password,
      newPassword: passwordForm.new_password
    });
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePasswordInputChange = (field: keyof PasswordFormData, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="h-5 w-5 text-red-600" />;
      case 'TEACHER':
        return <GraduationCap className="h-5 w-5 text-indigo-600" />;
      case 'PARENT':
        return <Heart className="h-5 w-5 text-yellow-600" />;
      case 'SECURITY':
        return <ShieldCheck className="h-5 w-5 text-green-600" />;
      default:
        return <User className="h-5 w-5 text-gray-400" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleClasses: Record<string, string> = {
      ADMIN: 'bg-red-100 text-red-800 border-red-200',
      TEACHER: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      PARENT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      SECURITY: 'bg-green-100 text-green-800 border-green-200',
    };
    return roleClasses[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    return status === 'ACTIVE' 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="card p-6">
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>User information not available</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">My Profile</h1>
          <p className="text-secondary-600">Manage your account information and settings</p>
        </div>
        <div className="flex gap-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleProfileSubmit}
                disabled={updateProfileMutation.isPending}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
          <button
            onClick={() => setShowPasswordModal(true)}
            className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white font-medium rounded-lg shadow-sm hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-200"
          >
            <Key className="h-4 w-4 mr-2" />
            Change Password
          </button>
        </div>
      </div>

      {/* Profile Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-secondary-900 mb-4">
                {user.full_name}
              </h2>
              <div className="flex items-center justify-center mb-4">
                {getRoleIcon(user.role)}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ml-2 ${getRoleBadge(user.role)}`}>
                  {user.role}
                </span>
              </div>
              <div className="flex items-center justify-center mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(user.status)}`}>
                  {user.status}
                </span>
              </div>
              <div className="text-sm text-secondary-600 mb-6">
                <p>Member since {new Date(user.created_at).toLocaleDateString()}</p>
              </div>
              
              {/* Profile Image Upload */}
              <ProfileImageUpload
                currentImageUrl={user.profile_image}
                userId={user.id}
                userName={user.full_name}
                onImageUpdate={(imageUrl) => {
                  // Update local state if needed
                  console.log('Profile image updated:', imageUrl);
                }}
              />
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h3 className="text-lg font-medium text-secondary-900 mb-6">Personal Information</h3>
            
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={profileForm.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.first_name 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    } ${!isEditing ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    placeholder="John"
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={profileForm.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.last_name 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    } ${!isEditing ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    placeholder="Doe"
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        errors.email 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      placeholder="user@email.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        errors.phone 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      placeholder="+1-555-0123"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={profileForm.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent border-gray-300 ${
                    !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                  }`}
                  placeholder="username"
                />
              </div>

              {/* Employment Information */}
              {(user.role === 'TEACHER' || user.role === 'ADMIN' || user.role === 'SECURITY') && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Employment Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Employee ID
                      </label>
                      <div className="relative">
                        <Badge className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                        <input
                          type="text"
                          value={profileForm.employee_id}
                          onChange={(e) => handleInputChange('employee_id', e.target.value)}
                          disabled={!isEditing}
                          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent border-gray-300 ${
                            !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                          }`}
                          placeholder="EMP001"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <div className="relative">
                        <Building className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                        <input
                          type="text"
                          value={profileForm.department}
                          onChange={(e) => handleInputChange('department', e.target.value)}
                          disabled={!isEditing}
                          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent border-gray-300 ${
                            !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                          }`}
                          placeholder="Department"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hire Date
                    </label>
                    <div className="relative">
                      <Calendar className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                      <input
                        type="date"
                        value={profileForm.hire_date}
                        onChange={(e) => handleInputChange('hire_date', e.target.value)}
                        disabled={!isEditing}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent border-gray-300 ${
                          !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordForm({
            current_password: '',
            new_password: '',
            confirm_password: ''
          });
          setErrors({});
        }}
        onConfirm={handlePasswordSubmit}
        title="Change Password"
        message=""
        type="warning"
        confirmText="Change Password"
        cancelText="Cancel"
        customContent={
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password *
              </label>
              <div className="relative">
                <Lock className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordForm.current_password}
                  onChange={(e) => handlePasswordInputChange('current_password', e.target.value)}
                  className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.current_password 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.current_password && (
                <p className="mt-1 text-sm text-red-600">{errors.current_password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password *
              </label>
              <div className="relative">
                <Key className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.new_password}
                  onChange={(e) => handlePasswordInputChange('new_password', e.target.value)}
                  className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.new_password 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.new_password && (
                <p className="mt-1 text-sm text-red-600">{errors.new_password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <Key className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirm_password}
                  onChange={(e) => handlePasswordInputChange('confirm_password', e.target.value)}
                  className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.confirm_password 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Password Requirements:</p>
                  <ul className="mt-1 list-disc list-inside">
                    <li>At least 8 characters long</li>
                    <li>Should be different from your current password</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        }
        isLoading={changePasswordMutation.isPending}
      />
    </div>
  );
};

export default ProfilePage;
