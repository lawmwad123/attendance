import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logoutUser } from '../../store/slices/authSlice';
import { toggleSidebar } from '../../store/slices/appSlice';
import { toast } from 'sonner';
import Modal from '../ui/Modal';
import {
  Home,
  Users,
  GraduationCap,
  CheckSquare,
  Clock,
  Shield,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  Bell,
  School,
  User,
  UserPlus
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { sidebarOpen, school } = useAppSelector((state) => state.app);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: false,
    },
    {
      name: 'Users',
      href: '/users',
      icon: Users,
      current: false,
    },
    {
      name: 'Students',
      href: '/students',
      icon: GraduationCap,
      current: false,
    },
    {
      name: 'Student Attendance',
      href: '/attendance',
      icon: CheckSquare,
      current: false,
    },
    {
      name: 'Staff Attendance',
      href: '/staff-attendance',
      icon: Clock,
      current: false,
    },
    {
      name: 'Gate Pass',
      href: '/gate-pass',
      icon: Shield,
      current: false,
    },
    {
      name: 'Visitors',
      href: '/visitors',
      icon: UserPlus,
      current: false,
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      current: false,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      current: false,
    },
  ];

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-secondary-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between p-4 border-b border-secondary-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <School className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-secondary-900">
                  {school?.name || 'School System'}
                </h1>
                <p className="text-xs text-secondary-600">
                  Attendance Manager
                </p>
              </div>
            </div>
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="lg:hidden p-2 rounded-md text-secondary-400 hover:text-secondary-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                      : 'text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-secondary-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
                {user?.profile_image ? (
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/uploads/${user.profile_image}`}
                    alt={user.full_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <span className={`text-sm font-medium text-primary-700 ${user?.profile_image ? 'hidden' : ''}`}>
                  {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-secondary-900">
                  {user?.full_name}
                </p>
                <p className="text-xs text-secondary-600 capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <NavLink
                to="/profile"
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900 rounded-lg transition-colors"
              >
                <User className="w-4 h-4 mr-3" />
                My Profile
              </NavLink>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-danger-700 hover:bg-danger-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top header */}
        <div className="bg-white shadow-sm border-b border-secondary-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <button
                onClick={() => dispatch(toggleSidebar())}
                className="lg:hidden p-2 rounded-md text-secondary-400 hover:text-secondary-600"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden lg:block">
                <h2 className="text-lg font-semibold text-secondary-900">
                  Welcome back, {user?.first_name}!
                </h2>
                <p className="text-sm text-secondary-600">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 text-secondary-400 hover:text-secondary-600 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-danger-500 rounded-full"></span>
              </button>

              {/* User menu */}
              <div className="flex items-center space-x-3">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-secondary-900">
                    {user?.full_name}
                  </p>
                  <p className="text-xs text-secondary-600 capitalize">
                    {user?.role}
                  </p>
                </div>
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
                  {user?.profile_image ? (
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/uploads/${user.profile_image}`}
                      alt={user.full_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to initials if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <span className={`text-sm font-medium text-primary-700 ${user?.profile_image ? 'hidden' : ''}`}>
                    {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out? You will need to log in again to access the system."
        type="warning"
        confirmText="Logout"
        cancelText="Cancel"
      />
    </div>
  );
};

export default DashboardLayout; 