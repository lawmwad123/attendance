import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  UserPlus, 
  Search, 
  Bell, 
  QrCode, 
  CreditCard,
  TrendingUp,
  Shield,
  Activity,
  MapPin
} from 'lucide-react';
import { api } from '../../lib/api';

const SecurityDashboardPage: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['securityDashboard'],
    queryFn: () => api.getSecurityDashboard(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const quickActions = [
    {
      name: 'Check-in/Out',
      description: 'Mark student or staff entry/exit',
      icon: Clock,
      href: '/security/check-in-out',
      color: 'bg-blue-500 hover:bg-blue-600',
      textColor: 'text-white'
    },
    {
      name: 'QR Scanner',
      description: 'Scan QR codes for quick check-in',
      icon: QrCode,
      href: '/security/qr-scanner',
      color: 'bg-green-500 hover:bg-green-600',
      textColor: 'text-white'
    },
    {
      name: 'Card Reader',
      description: 'Read ID cards or RFID tags',
      icon: CreditCard,
      href: '/security/card-reader',
      color: 'bg-purple-500 hover:bg-purple-600',
      textColor: 'text-white'
    },
    {
      name: 'Search',
      description: 'Find students or staff members',
      icon: Search,
      href: '/security/search',
      color: 'bg-orange-500 hover:bg-orange-600',
      textColor: 'text-white'
    },
    {
      name: 'Visitor Registration',
      description: 'Register new visitors',
      icon: UserPlus,
      href: '/security/visitors',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      textColor: 'text-white'
    },
    {
      name: 'Report Incident',
      description: 'Report security incidents',
      icon: AlertTriangle,
      href: '/security/incidents',
      color: 'bg-red-500 hover:bg-red-600',
      textColor: 'text-white'
    }
  ];

  const stats = [
    {
      name: 'Students Present',
      value: dashboardData?.studentsPresent || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Staff Present',
      value: dashboardData?.staffPresent || 0,
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Visitors Today',
      value: dashboardData?.visitorsToday || 0,
      icon: UserPlus,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      name: 'Active Incidents',
      value: dashboardData?.activeIncidents || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Security Dashboard</h1>
            <p className="mt-2 text-lg text-gray-600">
              Welcome back, {dashboardData?.securityOfficer?.first_name || 'Officer'}
            </p>
          </div>
          <div className="mt-4 md:mt-0 text-right">
            <div className="text-2xl font-bold text-gray-900">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-lg text-gray-600">
              {currentTime.toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className="group block"
            >
              <div className={`
                relative overflow-hidden rounded-xl p-8 transition-all duration-200 
                ${action.color} ${action.textColor} shadow-lg hover:shadow-xl
                transform hover:scale-105
              `}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{action.name}</h3>
                    <p className="text-lg opacity-90">{action.description}</p>
                  </div>
                  <action.icon className="h-12 w-12 opacity-80" />
                </div>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Check-ins */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Check-ins</h2>
          <div className="space-y-4">
            {dashboardData?.recentCheckins?.map((checkin: any, index: number) => (
              <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-lg font-medium text-gray-900">
                    {checkin.person_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {checkin.type} • {checkin.time}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`
                    inline-flex px-2 py-1 text-xs font-semibold rounded-full
                    ${checkin.type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                  `}>
                    {checkin.type}
                  </span>
                </div>
              </div>
            )) || (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent check-ins</p>
              </div>
            )}
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Alerts</h2>
          <div className="space-y-4">
            {dashboardData?.activeAlerts?.map((alert: any, index: number) => (
              <div key={index} className="flex items-start p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-lg font-medium text-red-900">
                    {alert.title}
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    {alert.description}
                  </p>
                  <p className="text-xs text-red-600 mt-2">
                    {alert.time}
                  </p>
                </div>
              </div>
            )) || (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No active alerts</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Emergency Contacts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardData?.emergencyContacts?.map((contact: any, index: number) => (
            <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-lg font-medium text-gray-900">{contact.name}</p>
                <p className="text-sm text-gray-600">{contact.role}</p>
                <p className="text-sm text-blue-600 font-medium">{contact.phone}</p>
              </div>
            </div>
          )) || (
            <div className="col-span-full text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No emergency contacts configured</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboardPage;
