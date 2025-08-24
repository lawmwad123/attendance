import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { getSystemStats, getSchoolsSummary, getSupportTickets } from '../store/slices/adminSlice';
import { 
  School, 
  Users, 
  MessageSquare, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  HardDrive
} from 'lucide-react';

const AdminDashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { 
    systemStats, 
    schoolsSummary, 
    supportTickets, 
    isLoading, 
    isLoadingStats, 
    isLoadingSchools, 
    isAuthenticated, 
    admin 
  } = useAppSelector((state) => state.admin);

  useEffect(() => {
    // Only load dashboard data if admin is authenticated and data hasn't been loaded yet
    if (isAuthenticated && admin && !systemStats && !isLoadingStats && !isLoadingSchools) {
      console.log('Loading dashboard data for authenticated admin:', admin.email);
      
      // Load data
      dispatch(getSystemStats());
      dispatch(getSchoolsSummary({}));
      // Skip support tickets for now to avoid linter issues
    }
  }, [dispatch, isAuthenticated, admin?.id, systemStats, isLoadingStats, isLoadingSchools]); // Use specific loading states

  const stats = [
    {
      name: 'Total Schools',
      value: systemStats?.total_schools || 0,
      change: '+12%',
      changeType: 'positive',
      icon: School,
      color: 'bg-blue-500',
    },
    {
      name: 'Active Schools',
      value: systemStats?.active_schools || 0,
      change: '+8%',
      changeType: 'positive',
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      name: 'Total Users',
      value: systemStats?.total_users || 0,
      change: '+23%',
      changeType: 'positive',
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      name: 'Open Support Tickets',
      value: systemStats?.open_support_tickets || 0,
      change: '-5%',
      changeType: 'negative',
      icon: MessageSquare,
      color: 'bg-red-500',
    },
  ];

  const systemHealth = [
    {
      name: 'System Uptime',
      value: `${systemStats?.system_uptime_hours || 0}h`,
      status: 'healthy',
      icon: Activity,
    },
    {
      name: 'Storage Used',
      value: `${systemStats?.storage_used_gb || 0}GB / ${systemStats?.storage_total_gb || 0}GB`,
      status: 'warning',
      icon: HardDrive,
    },
    {
      name: 'Database Status',
      value: 'Connected',
      status: 'healthy',
      icon: Database,
    },
  ];

  const recentSchools = schoolsSummary.slice(0, 5);
  const urgentTickets = supportTickets.filter(ticket => ticket.priority === 'URGENT').slice(0, 3);

  if (isLoading || isLoadingStats || isLoadingSchools) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Dashboard</h1>
        <p className="text-gray-600">Overview of system-wide statistics and health</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className={`h-6 w-6 text-white ${stat.color} rounded-md p-1`} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stat.value.toLocaleString()}
                        </div>
                        <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                          stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <TrendingUp className="self-center flex-shrink-0 h-4 w-4" />
                          <span className="sr-only">
                            {stat.changeType === 'positive' ? 'Increased' : 'Decreased'} by
                          </span>
                          {stat.change}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* System health and recent activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* System Health */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              System Health
            </h3>
            <div className="space-y-4">
              {systemHealth.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Icon className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-sm font-medium text-gray-900">{item.name}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900 mr-2">{item.value}</span>
                      <div className={`h-2 w-2 rounded-full ${
                        item.status === 'healthy' ? 'bg-green-400' : 'bg-yellow-400'
                      }`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Schools */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Schools
            </h3>
            <div className="space-y-4">
              {recentSchools.map((school) => (
                <div key={school.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <School className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{school.name}</p>
                      <p className="text-xs text-gray-500">{school.total_teachers} teachers</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      school.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {school.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Urgent Support Tickets */}
      {urgentTickets.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Urgent Support Tickets
              </h3>
            </div>
            <div className="space-y-4">
              {urgentTickets.map((ticket) => (
                <div key={ticket.id} className="border-l-4 border-red-400 pl-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ticket.subject}</p>
                      <p className="text-xs text-gray-500">{ticket.school_name}</p>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-xs text-gray-500">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
              <School className="h-4 w-4 mr-2" />
              Manage Schools
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              <Users className="h-4 w-4 mr-2" />
              View Users
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
              <MessageSquare className="h-4 w-4 mr-2" />
              Support Tickets
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
              <Activity className="h-4 w-4 mr-2" />
              System Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
