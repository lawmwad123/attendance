import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Users, UserCheck, UserX, Clock, Plus, TrendingUp, School, AlertCircle } from 'lucide-react';

interface SchoolStats {
  total_students: number;
  total_teachers: number;
  total_staff: number;
  active_students: number;
  present_today: number;
  absent_today: number;
  pending_gate_passes: number;
}

const DashboardPage: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch school stats
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery<SchoolStats>({
    queryKey: ['schoolStats'],
    queryFn: () => api.getSchoolStats(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (statsError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
          <p className="text-secondary-600">Welcome to the School Attendance Management System</p>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center text-danger-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Error loading dashboard data. Please try again.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
          <p className="text-secondary-600">Welcome to the School Attendance Management System</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-secondary-900">{formatTime(currentTime)}</div>
          <div className="text-sm text-secondary-600">{formatDate(currentTime)}</div>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-secondary-600">Total Students</h3>
              <p className="text-2xl font-bold text-secondary-900">
                {statsLoading ? '...' : stats?.total_students || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-secondary-600">Present Today</h3>
              <p className="text-2xl font-bold text-success-600">
                {statsLoading ? '...' : stats?.present_today || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-danger-100 rounded-lg">
              <UserX className="h-6 w-6 text-danger-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-secondary-600">Absent Today</h3>
              <p className="text-2xl font-bold text-danger-600">
                {statsLoading ? '...' : stats?.absent_today || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg">
              <Clock className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-secondary-600">Pending Passes</h3>
              <p className="text-2xl font-bold text-warning-600">
                {statsLoading ? '...' : stats?.pending_gate_passes || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/attendance'}
              className="w-full btn-primary text-left flex items-center justify-between p-4 h-auto"
            >
              <div className="flex items-center">
                <UserCheck className="h-5 w-5 mr-3" />
                <span>Mark Attendance</span>
              </div>
              <span className="text-sm opacity-75">→</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/students'}
              className="w-full btn-secondary text-left flex items-center justify-between p-4 h-auto"
            >
              <div className="flex items-center">
                <Plus className="h-5 w-5 mr-3" />
                <span>Add New Student</span>
              </div>
              <span className="text-sm opacity-75">→</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/gate-pass'}
              className="w-full btn-outline text-left flex items-center justify-between p-4 h-auto"
            >
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-3" />
                <span>Manage Gate Passes</span>
              </div>
              <span className="text-sm opacity-75">→</span>
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">School Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
              <div className="flex items-center">
                <School className="h-5 w-5 text-secondary-600 mr-3" />
                <span className="text-secondary-700">Teaching Staff</span>
              </div>
              <span className="font-semibold text-secondary-900">
                {statsLoading ? '...' : stats?.total_teachers || 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-secondary-600 mr-3" />
                <span className="text-secondary-700">Total Staff</span>
              </div>
              <span className="font-semibold text-secondary-900">
                {statsLoading ? '...' : stats?.total_staff || 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-secondary-600 mr-3" />
                <span className="text-secondary-700">Active Students</span>
              </div>
              <span className="font-semibold text-secondary-900">
                {statsLoading ? '...' : stats?.active_students || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">Today's Attendance Summary</h2>
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-success-600 mb-2">
                {stats.total_students > 0 
                  ? `${Math.round((stats.present_today / stats.total_students) * 100)}%`
                  : '0%'
                }
              </div>
              <div className="text-secondary-600">Attendance Rate</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {stats.present_today}
              </div>
              <div className="text-secondary-600">Students Present</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-warning-600 mb-2">
                {stats.pending_gate_passes}
              </div>
              <div className="text-secondary-600">Pending Requests</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage; 