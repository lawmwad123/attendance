import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { format } from 'date-fns';
import { 
  Clock, 
  UserCheck, 
  AlertCircle, 
  Calendar,
  Plus,
  RefreshCw,
  LogOut,
  LogIn,
  TrendingUp
} from 'lucide-react';

interface StaffAttendance {
  id: number;
  staff_id: number;
  staff_name: string;
  staff_email: string;
  staff_role: string;
  attendance_date: string;
  status: string;
  actual_check_in?: string;
  actual_check_out?: string;
  minutes_late: number;
  overtime_hours: number;
  notes?: string;
}

interface StaffLeave {
  id: number;
  staff_id: number;
  staff_name: string;
  staff_email: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  reason: string;
  total_days: number;
}

interface StaffSchedule {
  id: number;
  staff_id: number;
  staff_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_working_day: boolean;
}

interface CreateLeaveForm {
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  emergency_contact: string;
  emergency_phone: string;
}

const StaffAttendancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState<CreateLeaveForm>({
    leave_type: 'personal_leave',
    start_date: '',
    end_date: '',
    reason: '',
    emergency_contact: '',
    emergency_phone: ''
  });

  const queryClient = useQueryClient();

  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError
  } = useQuery({
    queryKey: ['staffAttendanceDashboard'],
    queryFn: () => api.getStaffAttendanceDashboard(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch staff schedules
  const {
    data: schedules
  } = useQuery({
    queryKey: ['staffSchedules'],
    queryFn: () => api.getStaffSchedule(),
  });

  // Clock in/out mutations
  const clockInMutation = useMutation({
    mutationFn: (data: { staff_id: number; method?: string; device_id?: string; location?: string; notes?: string }) =>
      api.staffClockIn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffAttendanceDashboard'] });
      toast.success('Successfully clocked in!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to clock in');
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: (data: { staff_id: number; method?: string; device_id?: string; location?: string; notes?: string; overtime_hours?: number }) =>
      api.staffClockOut(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffAttendanceDashboard'] });
      toast.success('Successfully clocked out!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to clock out');
    },
  });

  // Leave management mutations
  const createLeaveMutation = useMutation({
    mutationFn: (data: CreateLeaveForm) => api.createStaffLeave(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffAttendanceDashboard'] });
      setShowLeaveModal(false);
      setLeaveForm({
        leave_type: 'personal_leave',
        start_date: '',
        end_date: '',
        reason: '',
        emergency_contact: '',
        emergency_phone: ''
      });
      toast.success('Leave request submitted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to submit leave request');
    },
  });

  const approveLeaveMutation = useMutation({
    mutationFn: (leaveId: number) => api.approveStaffLeave(leaveId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffAttendanceDashboard'] });
      toast.success('Leave request approved!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to approve leave request');
    },
  });

  const rejectLeaveMutation = useMutation({
    mutationFn: ({ leaveId, reason }: { leaveId: number; reason: string }) => 
      api.rejectStaffLeave(leaveId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffAttendanceDashboard'] });
      toast.success('Leave request rejected!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to reject leave request');
    },
  });

  const handleClockIn = async () => {
    // Get current user ID from localStorage or context
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      toast.error('User not found. Please log in again.');
      return;
    }
    
    const user = JSON.parse(userStr);
    clockInMutation.mutate({
      staff_id: user.id,
      method: 'web_portal',
      location: 'Web Dashboard'
    });
  };

  const handleClockOut = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      toast.error('User not found. Please log in again.');
      return;
    }
    
    const user = JSON.parse(userStr);
    clockOutMutation.mutate({
      staff_id: user.id,
      method: 'web_portal',
      location: 'Web Dashboard'
    });
  };

  const handleLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    createLeaveMutation.mutate(leaveForm);
  };

  const handleApproveLeave = async (leaveId: number) => {
    approveLeaveMutation.mutate(leaveId);
  };

  const handleRejectLeave = async (leaveId: number) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    rejectLeaveMutation.mutate({ leaveId, reason });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-100';
      case 'absent': return 'text-red-600 bg-red-100';
      case 'late': return 'text-yellow-600 bg-yellow-100';
      case 'on_leave': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getLeaveStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayOfWeek];
  };

  if (dashboardError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Staff Attendance</h1>
          <p className="text-secondary-600">Manage teacher and staff attendance, schedules, and leave requests</p>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center text-danger-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Error loading staff attendance data. Please try again.</span>
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
          <h1 className="text-2xl font-bold text-secondary-900">Staff Attendance</h1>
          <p className="text-secondary-600">Manage teacher and staff attendance, schedules, and leave requests</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-secondary-900">
            {format(new Date(), 'HH:mm')}
          </div>
          <div className="text-sm text-secondary-600">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={handleClockIn}
              disabled={clockInMutation.isPending}
              className="w-full btn-primary text-left flex items-center justify-between p-4 h-auto disabled:opacity-50"
            >
              <div className="flex items-center">
                <LogIn className="h-5 w-5 mr-3" />
                <span>{clockInMutation.isPending ? 'Clocking In...' : 'Clock In'}</span>
              </div>
              <span className="text-sm opacity-75">→</span>
            </button>
            
            <button
              onClick={handleClockOut}
              disabled={clockOutMutation.isPending}
              className="w-full btn-secondary text-left flex items-center justify-between p-4 h-auto disabled:opacity-50"
            >
              <div className="flex items-center">
                <LogOut className="h-5 w-5 mr-3" />
                <span>{clockOutMutation.isPending ? 'Clocking Out...' : 'Clock Out'}</span>
              </div>
              <span className="text-sm opacity-75">→</span>
            </button>
            
            <button
              onClick={() => setShowLeaveModal(true)}
              className="w-full btn-outline text-left flex items-center justify-between p-4 h-auto"
            >
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-3" />
                <span>Request Leave</span>
              </div>
              <span className="text-sm opacity-75">→</span>
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Today's Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Total Staff:</span>
              <span className="font-semibold">{dashboardData?.attendance_stats?.total || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Present:</span>
              <span className="font-semibold text-success-600">{dashboardData?.attendance_stats?.present || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Absent:</span>
              <span className="font-semibold text-danger-600">{dashboardData?.attendance_stats?.absent || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Late:</span>
              <span className="font-semibold text-warning-600">{dashboardData?.attendance_stats?.late || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>On Leave:</span>
              <span className="font-semibold text-primary-600">{dashboardData?.attendance_stats?.on_leave || 0}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between">
                <span>Attendance Rate:</span>
                <span className="font-semibold">{dashboardData?.attendance_stats?.present_percentage || 0}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Date Selection</h3>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'dashboard', name: 'Dashboard', icon: TrendingUp },
            { id: 'attendance', name: 'Attendance Records', icon: UserCheck },
            { id: 'leave', name: 'Leave Management', icon: Calendar },
            { id: 'schedule', name: 'Work Schedules', icon: Clock }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="card">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Today's Attendance</h2>
              <button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['staffAttendanceDashboard'] })}
                className="btn-ghost flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
            
            {dashboardLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-secondary-600">Loading attendance data...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Staff</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Check In</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Check Out</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Late</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Overtime</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-secondary-200">
                    {dashboardData?.today_attendance?.map((record: StaffAttendance) => (
                      <tr key={record.id} className="hover:bg-secondary-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-secondary-900">{record.staff_name}</div>
                            <div className="text-sm text-secondary-500">{record.staff_email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                            {record.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                          {record.actual_check_in ? format(new Date(record.actual_check_in), 'HH:mm') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                          {record.actual_check_out ? format(new Date(record.actual_check_out), 'HH:mm') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                          {record.minutes_late > 0 ? `${record.minutes_late} min` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                          {record.overtime_hours > 0 ? `${record.overtime_hours} hrs` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Leave Management Tab */}
        {activeTab === 'leave' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Leave Requests</h2>
              <button
                onClick={() => setShowLeaveModal(true)}
                className="btn-primary flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Leave Request
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Staff</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Dates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {dashboardData?.pending_leaves?.map((leave: StaffLeave) => (
                    <tr key={leave.id} className="hover:bg-secondary-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-secondary-900">{leave.staff_name}</div>
                          <div className="text-sm text-secondary-500">{leave.staff_email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        {leave.leave_type.replace('_', ' ').toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        {format(new Date(leave.start_date), 'MMM dd')} - {format(new Date(leave.end_date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        {leave.total_days} days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLeaveStatusColor(leave.status)}`}>
                          {leave.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {leave.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveLeave(leave.id)}
                              className="text-success-600 hover:text-success-900"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectLeave(leave.id)}
                              className="text-danger-600 hover:text-danger-900"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Work Schedules Tab */}
        {activeTab === 'schedule' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Work Schedules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedules?.map((schedule: StaffSchedule) => (
                <div key={schedule.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{schedule.staff_name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${schedule.is_working_day ? 'bg-success-100 text-success-800' : 'bg-secondary-100 text-secondary-800'}`}>
                      {schedule.is_working_day ? 'Working' : 'Off'}
                    </span>
                  </div>
                  <div className="text-sm text-secondary-600">
                    <div><strong>Day:</strong> {getDayName(schedule.day_of_week)}</div>
                    <div><strong>Time:</strong> {schedule.start_time} - {schedule.end_time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Leave Request Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Request Leave</h3>
              <form onSubmit={handleLeaveRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Leave Type</label>
                  <select
                    value={leaveForm.leave_type}
                    onChange={(e) => setLeaveForm({...leaveForm, leave_type: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="personal_leave">Personal Leave</option>
                    <option value="sick_leave">Sick Leave</option>
                    <option value="annual_leave">Annual Leave</option>
                    <option value="emergency_leave">Emergency Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={leaveForm.start_date}
                    onChange={(e) => setLeaveForm({...leaveForm, start_date: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    value={leaveForm.end_date}
                    onChange={(e) => setLeaveForm({...leaveForm, end_date: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reason</label>
                  <textarea
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowLeaveModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffAttendancePage;
