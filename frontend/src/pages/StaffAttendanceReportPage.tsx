import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { format } from 'date-fns';
import { 
  Download, 
  Calendar,
  TrendingUp,
  Users,
  Clock,
  AlertCircle,
  FileText,
  RefreshCw
} from 'lucide-react';

interface StaffAttendanceReport {
  staff_id: number;
  staff_name: string;
  staff_email: string;
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  leave_days: number;
  attendance_percentage: number;
  total_late_minutes: number;
  total_overtime_hours: number;
}

interface StaffLeaveReport {
  staff_id: number;
  staff_name: string;
  staff_email: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  status: string;
  reason: string;
}

const StaffAttendanceReportPage: React.FC = () => {
  const [reportType, setReportType] = useState<'attendance' | 'leave'>('attendance');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [startDate, setStartDate] = useState(format(new Date().setDate(1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null);

  // Fetch staff list for filtering
  const { data: staffList } = useQuery({
    queryKey: ['staffList'],
    queryFn: () => api.getUsers({ role: 'teacher' }),
  });

  // Fetch attendance reports
  const { data: attendanceReports, isLoading: attendanceLoading } = useQuery({
    queryKey: ['staffAttendanceReports', startDate, endDate, selectedStaff],
    queryFn: () => api.getStaffAttendance({
      start_date: startDate,
      end_date: endDate,
      staff_id: selectedStaff || undefined
    }),
    enabled: reportType === 'attendance',
  });

  // Fetch leave reports
  const { data: leaveReports, isLoading: leaveLoading } = useQuery({
    queryKey: ['staffLeaveReports', startDate, endDate, selectedStaff],
    queryFn: () => api.getStaffLeave({
      staff_id: selectedStaff || undefined
    }),
    enabled: reportType === 'leave',
  });

  const handleExportCSV = () => {
    if (reportType === 'attendance' && attendanceReports) {
      exportAttendanceToCSV(attendanceReports);
    } else if (reportType === 'leave' && leaveReports) {
      exportLeaveToCSV(leaveReports);
    }
  };

  const exportAttendanceToCSV = (data: StaffAttendanceReport[]) => {
    const headers = [
      'Staff ID',
      'Staff Name',
      'Staff Email',
      'Total Days',
      'Present Days',
      'Absent Days',
      'Late Days',
      'Leave Days',
      'Attendance Percentage',
      'Total Late Minutes',
      'Total Overtime Hours'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.staff_id,
        `"${row.staff_name}"`,
        `"${row.staff_email}"`,
        row.total_days,
        row.present_days,
        row.absent_days,
        row.late_days,
        row.leave_days,
        `${row.attendance_percentage}%`,
        row.total_late_minutes,
        row.total_overtime_hours
      ].join(','))
    ].join('\n');

    downloadCSV(csvContent, `staff_attendance_report_${startDate}_to_${endDate}.csv`);
  };

  const exportLeaveToCSV = (data: StaffLeaveReport[]) => {
    const headers = [
      'Staff ID',
      'Staff Name',
      'Staff Email',
      'Leave Type',
      'Start Date',
      'End Date',
      'Total Days',
      'Status',
      'Reason'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.staff_id,
        `"${row.staff_name}"`,
        `"${row.staff_email}"`,
        row.leave_type,
        row.start_date,
        row.end_date,
        row.total_days,
        row.status,
        `"${row.reason}"`
      ].join(','))
    ].join('\n');

    downloadCSV(csvContent, `staff_leave_report_${startDate}_to_${endDate}.csv`);
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported successfully!');
  };

  const getSummaryStats = () => {
    if (reportType === 'attendance' && attendanceReports) {
      const totalStaff = attendanceReports.length;
      const avgAttendance = attendanceReports.reduce((sum, report) => sum + report.attendance_percentage, 0) / totalStaff;
      const totalLateMinutes = attendanceReports.reduce((sum, report) => sum + report.total_late_minutes, 0);
      const totalOvertimeHours = attendanceReports.reduce((sum, report) => sum + report.total_overtime_hours, 0);

      return {
        totalStaff,
        avgAttendance: Math.round(avgAttendance),
        totalLateMinutes,
        totalOvertimeHours
      };
    } else if (reportType === 'leave' && leaveReports) {
      const totalLeaves = leaveReports.length;
      const approvedLeaves = leaveReports.filter(report => report.status === 'approved').length;
      const pendingLeaves = leaveReports.filter(report => report.status === 'pending').length;
      const totalDays = leaveReports.reduce((sum, report) => sum + report.total_days, 0);

      return {
        totalLeaves,
        approvedLeaves,
        pendingLeaves,
        totalDays
      };
    }
    return null;
  };

  const summaryStats = getSummaryStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Staff Attendance Reports</h1>
          <p className="text-secondary-600">Generate and export staff attendance and leave reports</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="btn-primary flex items-center"
            disabled={!summaryStats}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Report Controls */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="label">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as 'attendance' | 'leave')}
              className="input"
            >
              <option value="attendance">Attendance Report</option>
              <option value="leave">Leave Report</option>
            </select>
          </div>
          
          <div>
            <label className="label">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
              className="input"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          
          <div>
            <label className="label">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>
          
          <div>
            <label className="label">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </div>
          
          <div>
            <label className="label">Staff Member</label>
            <select
              value={selectedStaff || ''}
              onChange={(e) => setSelectedStaff(e.target.value ? Number(e.target.value) : null)}
              className="input"
            >
              <option value="">All Staff</option>
              {staffList?.map((staff: any) => (
                <option key={staff.id} value={staff.id}>
                  {staff.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      {summaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportType === 'attendance' ? (
            <>
              <div className="card p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Users className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-secondary-600">Total Staff</p>
                    <p className="text-xl font-bold text-secondary-900">{summaryStats.totalStaff}</p>
                  </div>
                </div>
              </div>
              
              <div className="card p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-success-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-success-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-secondary-600">Avg Attendance</p>
                    <p className="text-xl font-bold text-success-600">{summaryStats.avgAttendance}%</p>
                  </div>
                </div>
              </div>
              
              <div className="card p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-warning-100 rounded-lg">
                    <Clock className="h-5 w-5 text-warning-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-secondary-600">Total Late</p>
                    <p className="text-xl font-bold text-warning-600">{summaryStats.totalLateMinutes} min</p>
                  </div>
                </div>
              </div>
              
              <div className="card p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-secondary-100 rounded-lg">
                    <Clock className="h-5 w-5 text-secondary-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-secondary-600">Total Overtime</p>
                    <p className="text-xl font-bold text-secondary-900">{summaryStats.totalOvertimeHours} hrs</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="card p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <FileText className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-secondary-600">Total Leaves</p>
                    <p className="text-xl font-bold text-secondary-900">{summaryStats.totalLeaves}</p>
                  </div>
                </div>
              </div>
              
              <div className="card p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-success-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-success-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-secondary-600">Approved</p>
                    <p className="text-xl font-bold text-success-600">{summaryStats.approvedLeaves}</p>
                  </div>
                </div>
              </div>
              
              <div className="card p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-warning-100 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-warning-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-secondary-600">Pending</p>
                    <p className="text-xl font-bold text-warning-600">{summaryStats.pendingLeaves}</p>
                  </div>
                </div>
              </div>
              
              <div className="card p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-secondary-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-secondary-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-secondary-600">Total Days</p>
                    <p className="text-xl font-bold text-secondary-900">{summaryStats.totalDays}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Report Data */}
      <div className="card">
        <div className="p-6 border-b border-secondary-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-secondary-900">
              {reportType === 'attendance' ? 'Attendance Report' : 'Leave Report'}
            </h2>
            <button 
              onClick={() => window.location.reload()}
              className="btn-ghost flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
        
        {(attendanceLoading || leaveLoading) ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-secondary-600">Loading report data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {reportType === 'attendance' ? (
              <table className="w-full">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Staff</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Total Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Present</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Absent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Late</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Leave</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Attendance %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Late Minutes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Overtime Hours</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {attendanceReports?.map((report: StaffAttendanceReport) => (
                    <tr key={report.staff_id} className="hover:bg-secondary-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-secondary-900">{report.staff_name}</div>
                          <div className="text-sm text-secondary-500">{report.staff_email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">{report.total_days}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-success-600 font-medium">{report.present_days}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-danger-600 font-medium">{report.absent_days}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-warning-600 font-medium">{report.late_days}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-600 font-medium">{report.leave_days}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          report.attendance_percentage >= 90 ? 'bg-success-100 text-success-800' :
                          report.attendance_percentage >= 75 ? 'bg-warning-100 text-warning-800' :
                          'bg-danger-100 text-danger-800'
                        }`}>
                          {report.attendance_percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">{report.total_late_minutes}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">{report.total_overtime_hours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Staff</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Leave Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Dates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Reason</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {leaveReports?.map((report: StaffLeaveReport) => (
                    <tr key={`${report.staff_id}-${report.start_date}`} className="hover:bg-secondary-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-secondary-900">{report.staff_name}</div>
                          <div className="text-sm text-secondary-500">{report.staff_email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        {report.leave_type.replace('_', ' ').toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        {format(new Date(report.start_date), 'MMM dd')} - {format(new Date(report.end_date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">{report.total_days}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          report.status === 'approved' ? 'bg-success-100 text-success-800' :
                          report.status === 'pending' ? 'bg-warning-100 text-warning-800' :
                          'bg-danger-100 text-danger-800'
                        }`}>
                          {report.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-secondary-900 max-w-xs truncate">
                        {report.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffAttendanceReportPage;
