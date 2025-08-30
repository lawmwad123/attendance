import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Clock, 
  AlertTriangle, 
  UserPlus, 
  Search, 
  Bell, 
  LogOut,
  Menu,
  X,
  Home,
  QrCode,
  CreditCard,
  FileText,
  Settings,
  ChevronDown,
  User
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logoutUser } from '../../store/slices/authSlice';

interface SecurityLayoutProps {
  children: React.ReactNode;
}

const SecurityLayout: React.FC<SecurityLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target as Node)) {
        setSettingsDropdownOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSettingsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/security/dashboard',
      icon: Home,
      description: 'Overview and alerts'
    },
    {
      name: 'Check-in/Out',
      href: '/security/check-in-out',
      icon: Clock,
      description: 'Mark entry and exit'
    },
    {
      name: 'QR Scanner',
      href: '/security/qr-scanner',
      icon: QrCode,
      description: 'Scan QR codes'
    },
    {
      name: 'Card Reader',
      href: '/security/card-reader',
      icon: CreditCard,
      description: 'Read ID cards'
    },
    {
      name: 'Search',
      href: '/security/search',
      icon: Search,
      description: 'Find students/staff'
    },
    {
      name: 'Visitors',
      href: '/security/visitors',
      icon: UserPlus,
      description: 'Manage visitors'
    },
    {
      name: 'Incidents',
      href: '/security/incidents',
      icon: AlertTriangle,
      description: 'Report issues'
    },
    {
      name: 'Notifications',
      href: '/security/notifications',
      icon: Bell,
      description: 'View alerts'
    }
  ];

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-80 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Security Portal</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <nav className="flex-1 space-y-2 px-4 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    group flex items-center rounded-lg px-4 py-4 text-lg font-medium transition-colors
                    ${isActive
                      ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <item.icon className={`mr-4 h-6 w-6 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div>
                    <div>{item.name}</div>
                    <div className="text-sm text-gray-500">{item.description}</div>
                  </div>
                </Link>
              );
            })}
          </nav>
          
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center px-4 py-2">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-gray-500">Security Officer</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 w-full flex items-center justify-center px-4 py-3 text-lg font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="mr-2 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-80 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white shadow-xl">
          <div className="flex h-16 items-center px-6">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">Security Portal</span>
          </div>
          
          <nav className="flex-1 space-y-2 px-4 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center rounded-lg px-4 py-4 text-lg font-medium transition-colors
                    ${isActive
                      ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <item.icon className={`mr-4 h-6 w-6 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div>
                    <div>{item.name}</div>
                    <div className="text-sm text-gray-500">{item.description}</div>
                  </div>
                </Link>
              );
            })}
          </nav>
          
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center px-4 py-2">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-gray-500">Security Officer</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 w-full flex items-center justify-center px-4 py-3 text-lg font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="mr-2 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-80">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center justify-between">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  {navigation.find(item => item.href === location.pathname)?.name || 'Security Portal'}
                </h1>
              </div>
              
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                {/* Notifications */}
                <button className="relative p-2 text-gray-400 hover:text-gray-500">
                  <Bell className="h-6 w-6" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
                </button>
                
                {/* Settings Dropdown */}
                <div className="relative" ref={settingsDropdownRef}>
                  <button
                    onClick={() => setSettingsDropdownOpen(!settingsDropdownOpen)}
                    className="flex items-center gap-x-2 p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Settings className="h-6 w-6" />
                    <ChevronDown className={`h-4 w-4 transition-transform ${settingsDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {settingsDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 lg:right-0 sm:right-0 transform transition-all duration-200 ease-in-out">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{user?.first_name} {user?.last_name}</p>
                            <p className="text-xs text-gray-500">Security Officer</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Menu Items */}
                      <div className="py-1">
                        <Link
                          to="/security/settings"
                          onClick={() => setSettingsDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Settings className="mr-3 h-4 w-4" />
                          Settings
                        </Link>
                        
                        <Link
                          to="/security/profile"
                          onClick={() => setSettingsDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <User className="mr-3 h-4 w-4" />
                          Profile
                        </Link>
                        
                        <Link
                          to="/security/reports"
                          onClick={() => setSettingsDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <FileText className="mr-3 h-4 w-4" />
                          Reports
                        </Link>
                      </div>
                      
                      {/* Divider */}
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      {/* Logout */}
                      <button
                        onClick={() => {
                          setSettingsDropdownOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SecurityLayout;
