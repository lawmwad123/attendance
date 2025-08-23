import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { 
  Calendar,
  Users,
  UserCheck,
  UserX,
  Clock,
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  BookOpen,
  Eye,
  X
} from 'lucide-react';

interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  class_name: string;
  section: string;
  status: 'active' | 'inactive';
}

interface AttendanceRecord {
  id: number;
  student_id: number;
  student: Student;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  check_in_time?: string;
  check_out_time?: string;
  notes?: string;
  marked_by: string;
  created_at: string;
}

interface AttendanceStats {
  total_students: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendance_rate: number;
}

interface ClassAttendance {
  class_name: string;
  section: string;
  total_students: number;
  present: number;
  absent: number;
  attendance_rate: number;
}

const AttendancePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMarkAttendance, setShowMarkAttendance] = useState(false);
  const [attendanceData, setAttendanceData] = useState<{[key: number]: 'present' | 'absent' | 'late' | 'excused'}>({});
  const [showHistory, setShowHistory] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const queryClient = useQueryClient();

  // Get today's date for comparison
  const today = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === today;

  // Fetch students for attendance marking
  const { data: students, isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ['students', selectedClass],
    queryFn: async () => {
      const filters = selectedClass !== 'all' ? { class_name: selectedClass.split('-')[0] } : undefined;
      return await api.getStudents(filters);
    },
  });

  // Fetch attendance records for selected date
  const { data: attendanceRecords, isLoading: attendanceLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', selectedDate, selectedClass],
    queryFn: async () => {
      const filters: any = { date: selectedDate };
      if (selectedClass !== 'all') {
        filters.class_name = selectedClass.split('-')[0];
      }
      return await api.getAttendance(filters);
    },
    enabled: !!students,
  });

  // Fetch attendance statistics
  const { data: stats, isLoading: statsLoading } = useQuery<AttendanceStats>({
    queryKey: ['attendanceStats', selectedDate],
    queryFn: async () => {
      return await api.getAttendanceStats(selectedDate);
    },
  });

  // Fetch class-wise attendance
  const { data: classAttendance, isLoading: classLoading } = useQuery<ClassAttendance[]>({
    queryKey: ['classAttendance', selectedDate],
    queryFn: async () => {
      return await api.getClassAttendance(selectedDate);
    },
  });

  // Mark attendance mutation (single)
  const markAttendanceMutation = useMutation({
    mutationFn: async (data: { student_id: number; status: string; date: string; notes?: string }) => {
      return await api.markAttendance(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceStats'] });
      queryClient.invalidateQueries({ queryKey: ['classAttendance'] });
    },
    onError: (error: any) => {
      console.error('Error marking attendance:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to mark attendance. Please try again.';
      toast.error(errorMessage);
    },
  });

  // Bulk mark attendance mutation
  const bulkMarkAttendanceMutation = useMutation({
    mutationFn: async (records: Array<{ student_id: number; status: string; date: string; notes?: string }>) => {
      return await api.bulkMarkAttendance(records);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceStats'] });
      queryClient.invalidateQueries({ queryKey: ['classAttendance'] });
      setShowMarkAttendance(false);
    },
    onError: (error: any) => {
      console.error('Error bulk marking attendance:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to save attendance. Please try again.';
      toast.error(errorMessage);
    },
  });

  // Initialize attendance data when students load
  useEffect(() => {
    if (students && attendanceRecords) {
      const initialData: {[key: number]: 'present' | 'absent' | 'late' | 'excused'} = {};
      
      students.forEach(student => {
        const existingRecord = attendanceRecords.find(record => record.student_id === student.id);
        if (existingRecord) {
          initialData[student.id] = existingRecord.status;
        } else {
          initialData[student.id] = 'absent'; // Default to absent
        }
      });
      
      setAttendanceData(initialData);
    }
  }, [students, attendanceRecords]);

  const handleAttendanceChange = (studentId: number, status: 'present' | 'absent' | 'late' | 'excused') => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    const records = Object.entries(attendanceData).map(([studentId, status]) => ({
      student_id: parseInt(studentId),
      status,
      date: selectedDate,
    }));

    bulkMarkAttendanceMutation.mutate(records);
  };

  const filteredStudents = students?.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.student_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || `${student.class_name}-${student.section}` === selectedClass;
    return matchesSearch && matchesClass;
  }) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-5 w-5 text-success-600" />;
      case 'absent':
        return <XCircle className="h-5 w-5 text-danger-600" />;
      case 'late':
        return <Clock className="h-5 w-5 text-warning-600" />;
      case 'excused':
        return <AlertTriangle className="h-5 w-5 text-secondary-600" />;
      default:
        return <XCircle className="h-5 w-5 text-secondary-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return 'badge-success';
      case 'absent':
        return 'badge-danger';
      case 'late':
        return 'badge-warning';
      case 'excused':
        return 'badge-secondary';
      default:
        return 'badge-secondary';
    }
  };

  const uniqueClasses = Array.from(new Set(
    students?.map(student => `${student.class_name}-${student.section}`) || []
  ));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
          <h1 className="text-2xl font-bold text-secondary-900">Attendance Management</h1>
        <p className="text-secondary-600">Track and manage student attendance</p>
        </div>
        <div className="flex gap-3">
          {isToday && (
            <button
              onClick={() => setShowMarkAttendance(true)}
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-105"
            >
              <UserCheck className="h-5 w-5 mr-2" />
              Mark Attendance
            </button>
          )}
          <button className="inline-flex items-center px-6 py-3 bg-white text-gray-700 font-medium rounded-lg shadow-sm border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200">
            <Download className="h-5 w-5 mr-2" />
            Export
          </button>
        </div>
      </div>
      
      {/* Date and Class Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Select Date</label>
            <div className="relative">
              <Calendar className="h-5 w-5 absolute left-3 top-3 text-secondary-400" />
              <input
                type="date"
                className="input pl-10"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={today}
              />
            </div>
          </div>
          
          <div>
            <label className="label">Class Filter</label>
            <div className="relative">
              <BookOpen className="h-5 w-5 absolute left-3 top-3 text-secondary-400" />
              <select
                className="input pl-10"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="all">All Classes</option>
                {uniqueClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="label">Search Students</label>
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-3 text-secondary-400" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="h-5 w-5 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Total</p>
              <p className="text-xl font-bold text-secondary-900">
                {statsLoading ? '...' : stats?.total_students || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <UserCheck className="h-5 w-5 text-success-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Present</p>
              <p className="text-xl font-bold text-success-600">
                {statsLoading ? '...' : stats?.present || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-danger-100 rounded-lg">
              <UserX className="h-5 w-5 text-danger-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Absent</p>
              <p className="text-xl font-bold text-danger-600">
                {statsLoading ? '...' : stats?.absent || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg">
              <Clock className="h-5 w-5 text-warning-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Late</p>
              <p className="text-xl font-bold text-warning-600">
                {statsLoading ? '...' : stats?.late || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-secondary-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-secondary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Rate</p>
              <p className="text-xl font-bold text-secondary-900">
                {statsLoading ? '...' : `${stats?.attendance_rate || 0}%`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Class-wise Attendance */}
      <div className="card">
        <div className="p-6 border-b border-secondary-200">
          <h2 className="text-lg font-semibold text-secondary-900">Class-wise Attendance</h2>
        </div>
        <div className="p-6">
          {classLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-secondary-600 mt-2">Loading class attendance...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classAttendance?.map((cls, index) => (
                <div key={index} className="bg-secondary-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-secondary-900">
                      {cls.class_name} - {cls.section}
                    </h3>
                    <span className={`badge ${cls.attendance_rate >= 80 ? 'badge-success' : cls.attendance_rate >= 60 ? 'badge-warning' : 'badge-danger'}`}>
                      {cls.attendance_rate}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-secondary-600">
                    <span>Present: {cls.present}</span>
                    <span>Absent: {cls.absent}</span>
                    <span>Total: {cls.total_students}</span>
                  </div>
                  <div className="w-full bg-secondary-200 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full ${cls.attendance_rate >= 80 ? 'bg-success-600' : cls.attendance_rate >= 60 ? 'bg-warning-600' : 'bg-danger-600'}`}
                      style={{ width: `${cls.attendance_rate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Attendance Records */}
      <div className="card">
        <div className="p-6 border-b border-secondary-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-secondary-900">
              Attendance Records - {new Date(selectedDate).toLocaleDateString()}
            </h2>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['attendance'] })}
              className="btn-ghost flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {attendanceLoading || studentsLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-secondary-600 mt-2">Loading attendance records...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-6 text-center">
            <Users className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">No students found</h3>
            <p className="text-secondary-600">
              {searchTerm || selectedClass !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'No students available for attendance.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {filteredStudents.map((student) => {
                  const record = attendanceRecords?.find(r => r.student_id === student.id);
                  const status = record?.status || 'absent';
                  
                  return (
                    <tr key={student.id} className="hover:bg-secondary-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-secondary-900">
                            {student.full_name}
                          </div>
                          <div className="text-sm text-secondary-500">
                            ID: {student.student_id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-secondary-900">
                          {student.class_name} - {student.section}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(status)}
                          <span className={`badge ${getStatusBadge(status)} ml-2`}>
                            {status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-secondary-900">
                          {record?.check_in_time ? (
                            <div>
                              <div>In: {record.check_in_time}</div>
                              {record.check_out_time && (
                                <div>Out: {record.check_out_time}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-secondary-400">--</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowHistory(true);
                          }}
                          className="text-primary-600 hover:text-primary-900"
                          title="View History"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mark Attendance Modal */}
      {showMarkAttendance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-secondary-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-secondary-900">
                  Mark Attendance - {new Date(selectedDate).toLocaleDateString()}
                </h2>
                <button
                  onClick={() => setShowMarkAttendance(false)}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                    <div>
                      <div className="font-medium text-secondary-900">{student.full_name}</div>
                      <div className="text-sm text-secondary-500">
                        {student.student_id} • {student.class_name} - {student.section}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {['present', 'absent', 'late', 'excused'].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleAttendanceChange(student.id, status as any)}
                          className={`px-3 py-1 text-sm rounded-md border ${
                            attendanceData[student.id] === status
                              ? `bg-${status === 'present' ? 'success' : status === 'absent' ? 'danger' : status === 'late' ? 'warning' : 'secondary'}-600 text-white border-transparent`
                              : 'bg-white text-secondary-700 border-secondary-300 hover:bg-secondary-50'
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-secondary-200 mt-6">
                <button
                  onClick={() => setShowMarkAttendance(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAttendance}
                  disabled={bulkMarkAttendanceMutation.isPending}
                  className="btn-primary flex items-center"
                >
                  {bulkMarkAttendanceMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Save Attendance
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student History Modal */}
      {showHistory && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-secondary-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-secondary-900">
                  Attendance History - {selectedStudent.full_name}
                </h2>
                <button
                  onClick={() => {
                    setShowHistory(false);
                    setSelectedStudent(null);
                  }}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="text-center text-secondary-600">
                  <Calendar className="h-12 w-12 mx-auto mb-2 text-secondary-400" />
                  <p>Loading attendance history...</p>
                  <p className="text-sm">This will show the student's attendance history from the backend.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage; 