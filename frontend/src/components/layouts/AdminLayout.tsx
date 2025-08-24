import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout, toggleSidebar } from '../../store/slices/adminSlice';
import { 
  LayoutDashboard, 
  School, 
  Users, 
  MessageSquare, 
  Settings, 
  Activity, 
  FileText, 
  Shield, 
  LogOut, 
  Menu, 
  X,
  Bell,
  User
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { admin, sidebarCollapsed } = useAppSelector((state) => state.admin);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Close mobile menu when route changes
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/admin/login');
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      current: location.pathname === '/admin',
    },
    {
      name: 'Schools',
      href: '/admin/schools',
      icon: School,
      current: location.pathname.startsWith('/admin/schools'),
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
      current: location.pathname.startsWith('/admin/users'),
    },
    {
      name: 'Support Tickets',
      href: '/admin/support',
      icon: MessageSquare,
      current: location.pathname.startsWith('/admin/support'),
    },
    {
      name: 'System Logs',
      href: '/admin/logs',
      icon: Activity,
      current: location.pathname.startsWith('/admin/logs'),
    },
    {
      name: 'Configuration',
      href: '/admin/config',
      icon: Settings,
      current: location.pathname.startsWith('/admin/config'),
    },
    {
      name: 'Admin Actions',
      href: '/admin/actions',
      icon: FileText,
      current: location.pathname.startsWith('/admin/actions'),
    },
    {
      name: 'Security',
      href: '/admin/security',
      icon: Shield,
      current: location.pathname.startsWith('/admin/security'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:inset-0
        ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!sidebarCollapsed && (
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-red-600" />
              <span className="ml-2 text-lg font-semibold text-gray-900">Admin Panel</span>
            </div>
          )}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="hidden lg:block p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
                  ${item.current
                    ? 'bg-red-100 text-red-700 border-r-2 border-red-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <Icon className={`
                  mr-3 h-5 w-5 flex-shrink-0
                  ${item.current ? 'text-red-600' : 'text-gray-400 group-hover:text-gray-500'}
                `} />
                {!sidebarCollapsed && item.name}
              </Link>
            );
          })}
        </nav>

        {/* Admin profile section */}
        {!sidebarCollapsed && admin && (
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {admin.profile_image ? (
                  <img
                    className="h-8 w-8 rounded-full"
                    src={admin.profile_image}
                    alt={admin.first_name}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-red-600" />
                  </div>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {admin.first_name} {admin.last_name}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {admin.role.toLowerCase().replace('_', ' ')}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 w-full flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className={`
        lg:pl-0 flex flex-col flex-1
        ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}
      `}>
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="ml-2 lg:ml-0 text-lg font-semibold text-gray-900">
                {navigation.find(item => item.current)?.name || 'Admin Panel'}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md">
                <Bell className="w-5 h-5" />
              </button>

              {/* Admin profile (mobile) */}
              {sidebarCollapsed && admin && (
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {admin.profile_image ? (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={admin.profile_image}
                        alt={admin.first_name}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-red-600" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
