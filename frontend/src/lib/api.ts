import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { LoginRequest, LoginResponse, User, School, SchoolStats } from '../types';

// Settings types
interface SchoolSettings {
  id: number;
  school_id: number;
  school_name: string;
  school_motto?: string;
  school_logo_url?: string;
  school_address?: string;
  school_phone?: string;
  school_email?: string;
  school_website?: string;
  timezone: string;
  default_attendance_mode: string;
  gate_pass_approval_workflow: string;
  biometric_type?: string;
  notification_channels?: string[];
  created_at: string;
  updated_at: string;
}

interface SettingsSummary {
  general: {
    school_name: string;
    school_motto?: string;
    school_logo_url?: string;
    school_address?: string;
    school_phone?: string;
    school_email?: string;
    school_website?: string;
    timezone: string;
  };
  attendance: {
    default_attendance_mode: string;
    morning_attendance_start?: string;
    morning_attendance_end?: string;
    afternoon_attendance_start?: string;
    afternoon_attendance_end?: string;
    late_arrival_threshold?: string;
    absent_threshold?: string;
    auto_logout_time?: string;
  };
  gate_pass: {
    gate_pass_approval_workflow: string;
    gate_pass_auto_expiry_hours: number;
    allowed_exit_start_time?: string;
    allowed_exit_end_time?: string;
    emergency_override_roles?: string[];
  };
  notifications: {
    notification_channels?: string[];
    parent_notification_on_entry: boolean;
    parent_notification_on_exit: boolean;
    parent_notification_late_arrival: boolean;
    teacher_notification_absentees: boolean;
    security_notification_gate_pass: boolean;
  };
  biometric: {
    biometric_type?: string;
    biometric_enrollment_fingers: number;
    biometric_retry_attempts: number;
    rfid_card_format?: string;
    card_reissue_policy?: string;
  };
  staff_attendance: {
    staff_clock_in_start_time?: string;
    staff_clock_in_end_time?: string;
    staff_clock_out_start_time?: string;
    staff_clock_out_end_time?: string;
    staff_late_threshold_minutes?: number;
    staff_overtime_threshold_hours?: number;
    staff_auto_mark_absent_hours?: number;
    staff_attendance_methods?: string[];
    staff_leave_approval_workflow?: string;
    staff_leave_auto_approve_hours?: number;
    staff_leave_types?: string[];
    staff_work_days?: number[];
    staff_holiday_calendar_enabled?: boolean;
    staff_attendance_reports_enabled?: boolean;
    staff_attendance_notifications_enabled?: boolean;
  };
  total_classes: number;
  total_subjects: number;
  total_devices: number;
}

interface ClassLevel {
  id: number;
  name: string;
  code: string;
  description?: string;
  order: number;
  is_active: boolean;
  school_id: number;
  created_at: string;
  updated_at: string;
}

interface Class {
  id: number;
  name: string;
  code: string;
  level_id: number;
  teacher_id?: number;
  capacity: number;
  is_active: boolean;
  school_id: number;
  created_at: string;
  updated_at: string;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  description?: string;
  is_core: boolean;
  is_active: boolean;
  school_id: number;
  created_at: string;
  updated_at: string;
}

interface Device {
  id: number;
  name: string;
  device_type: string;
  device_id: string;
  location: string;
  ip_address?: string;
  port?: number;
  api_key?: string;
  is_active: boolean;
  last_sync?: string;
  school_id: number;
  created_at: string;
  updated_at: string;
}

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_VERSION = '/api/v1';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}${API_VERSION}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and tenant header
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add tenant header (from subdomain or localStorage)
    const tenant = getTenantId();
    if (tenant) {
      config.headers['X-Tenant-ID'] = tenant;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth token and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Utility functions
export function getTenantId(): string | null {
  // Try to get tenant from subdomain first
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  if (parts.length > 2 && parts[0] !== 'www') {
    return parts[0];
  }
  
  // Fallback to localStorage or default
  return localStorage.getItem('tenant_id') || 'demo';
}

export function setTenantId(tenantId: string): void {
  localStorage.setItem('tenant_id', tenantId);
}

export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
}

// API Client Class
class ApiClient {
  // Authentication
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  }

  async updateProfile(profileData: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>('/auth/profile', profileData);
    return response.data;
  }

  async uploadProfileImage(file: File): Promise<{ message: string; image_path: string; image_url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/auth/upload-profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteProfileImage(): Promise<{ message: string }> {
    const response = await apiClient.delete('/auth/delete-profile-image');
    return response.data;
  }

  getProfileImageUrl(userId: number): string {
    return `${API_BASE_URL}/uploads/profile_images/profile_${userId}_${userId}_${Date.now()}.jpg`;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', {
      email: email.toLowerCase(),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/reset-password', {
      token: token,
      new_password: newPassword,
    });
  }

  // Schools
  async getCurrentSchool(): Promise<School> {
    const response = await apiClient.get<School>('/schools/current');
    return response.data;
  }

  async updateSchool(schoolData: Partial<School>): Promise<School> {
    const response = await apiClient.put<School>('/schools/current', schoolData);
    return response.data;
  }

  async getSchoolStats(): Promise<SchoolStats> {
    const response = await apiClient.get<SchoolStats>('/schools/stats');
    return response.data;
  }

  async validateSlug(slug: string): Promise<{ available: boolean; message: string }> {
    const response = await apiClient.get(`/schools/validate-slug/${slug}`);
    return response.data;
  }

  // Users
  async getUsers(filters?: { role?: string; status?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await apiClient.get(`/users/?${params.toString()}`);
    return response.data;
  }

  async getUser(userId: number): Promise<any> {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  }

  async createUser(userData: any): Promise<any> {
    const response = await apiClient.post('/users/', userData);
    return response.data;
  }

  async updateUser(userId: number, userData: any): Promise<any> {
    const response = await apiClient.put(`/users/${userId}`, userData);
    return response.data;
  }

  async deleteUser(userId: number): Promise<void> {
    await apiClient.delete(`/users/${userId}`);
  }

  async getTeachers(): Promise<User[]> {
    const response = await apiClient.get<User[]>('/users/teachers/');
    return response.data;
  }

  async getParents(): Promise<User[]> {
    const response = await apiClient.get<User[]>('/users/parents/');
    return response.data;
  }

  // Students
  async getStudents(filters?: { status?: string; class_name?: string; search?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await apiClient.get(`/students/?${params.toString()}`);
    return response.data;
  }

  async getStudent(studentId: number): Promise<any> {
    const response = await apiClient.get(`/students/${studentId}`);
    return response.data;
  }

  async createStudent(studentData: any): Promise<any> {
    const response = await apiClient.post('/students/', studentData);
    return response.data;
  }

  async updateStudent(studentId: number, studentData: any): Promise<any> {
    const response = await apiClient.put(`/students/${studentId}`, studentData);
    return response.data;
  }

  async deleteStudent(studentId: number): Promise<void> {
    await apiClient.delete(`/students/${studentId}`);
  }

  async uploadStudentProfileImage(studentId: number, file: File): Promise<{ message: string; image_path: string; image_url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post(`/students/${studentId}/upload-profile-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteStudentProfileImage(studentId: number): Promise<{ message: string }> {
    const response = await apiClient.delete(`/students/${studentId}/delete-profile-image`);
    return response.data;
  }

  // Attendance
  async getAttendance(filters?: { date?: string; student_id?: number; class_name?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await apiClient.get(`/attendance/?${params.toString()}`);
    return response.data;
  }

  async markAttendance(attendanceData: { student_id: number; status: string; date: string; notes?: string }): Promise<any> {
    const response = await apiClient.post('/attendance/', attendanceData);
    return response.data;
  }

  async bulkMarkAttendance(attendanceRecords: Array<{ student_id: number; status: string; date: string; notes?: string }>): Promise<any> {
    const response = await apiClient.post('/attendance/bulk', { records: attendanceRecords });
    return response.data;
  }

  async getAttendanceStats(date?: string): Promise<any> {
    const params = date ? `?date=${date}` : '';
    const response = await apiClient.get(`/attendance/stats${params}`);
    return response.data;
  }

  async getClassAttendance(date?: string): Promise<any[]> {
    const params = date ? `?date=${date}` : '';
    const response = await apiClient.get(`/attendance/by-class${params}`);
    return response.data;
  }

  async getStudentAttendanceHistory(studentId: number, startDate?: string, endDate?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await apiClient.get(`/attendance/student/${studentId}?${params.toString()}`);
    return response.data;
  }

  // Gate Passes
  async getGatePasses(filters?: { status?: string; type?: string; date?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await apiClient.get(`/gate-pass/?${params.toString()}`);
    return response.data;
  }

  async getGatePass(passId: number): Promise<any> {
    const response = await apiClient.get(`/gate-pass/${passId}`);
    return response.data;
  }

  async createGatePass(passData: any): Promise<any> {
    const response = await apiClient.post('/gate-pass/', passData);
    return response.data;
  }

  async approveGatePass(passId: number, notes?: string): Promise<any> {
    const response = await apiClient.put(`/gate-pass/${passId}/approve`, { notes });
    return response.data;
  }

  async denyGatePass(passId: number, notes?: string): Promise<any> {
    const response = await apiClient.put(`/gate-pass/${passId}/deny`, { notes });
    return response.data;
  }

  async updateGatePass(passId: number, passData: any): Promise<any> {
    const response = await apiClient.put(`/gate-pass/${passId}`, passData);
    return response.data;
  }

  async deleteGatePass(passId: number): Promise<void> {
    await apiClient.delete(`/gate-pass/${passId}`);
  }

  // Settings
  async getSettingsSummary(): Promise<SettingsSummary> {
    const response = await apiClient.get<SettingsSummary>('/settings/summary');
    return response.data;
  }

  async getSchoolSettings(): Promise<SchoolSettings> {
    const response = await apiClient.get<SchoolSettings>('/settings/');
    return response.data;
  }

  async updateSchoolSettings(settings: Partial<SchoolSettings>): Promise<SchoolSettings> {
    const response = await apiClient.put<SchoolSettings>('/settings/', settings);
    return response.data;
  }

  // Class Levels
  async getClassLevels(): Promise<ClassLevel[]> {
    const response = await apiClient.get<ClassLevel[]>('/settings/class-levels');
    return response.data;
  }

  async createClassLevel(classLevel: { name: string; code: string; description?: string; order?: number }): Promise<ClassLevel> {
    const response = await apiClient.post<ClassLevel>('/settings/class-levels', classLevel);
    return response.data;
  }

  async updateClassLevel(id: number, classLevel: Partial<ClassLevel>): Promise<ClassLevel> {
    const response = await apiClient.put<ClassLevel>(`/settings/class-levels/${id}`, classLevel);
    return response.data;
  }

  async deleteClassLevel(id: number): Promise<void> {
    await apiClient.delete(`/settings/class-levels/${id}`);
  }

  // Classes
  async getClasses(levelId?: number): Promise<Class[]> {
    const params = levelId ? `?level_id=${levelId}` : '';
    const response = await apiClient.get<Class[]>(`/settings/classes${params}`);
    return response.data;
  }

  async createClass(classData: { name: string; code: string; level_id: number; teacher_id?: number; capacity?: number }): Promise<Class> {
    const response = await apiClient.post<Class>('/settings/classes', classData);
    return response.data;
  }

  async updateClass(id: number, classData: Partial<Class>): Promise<Class> {
    const response = await apiClient.put<Class>(`/settings/classes/${id}`, classData);
    return response.data;
  }

  async deleteClass(id: number): Promise<void> {
    await apiClient.delete(`/settings/classes/${id}`);
  }

  // Subjects
  async getSubjects(isCore?: boolean): Promise<Subject[]> {
    const params = isCore !== undefined ? `?is_core=${isCore}` : '';
    const response = await apiClient.get<Subject[]>(`/settings/subjects${params}`);
    return response.data;
  }

  async createSubject(subject: { name: string; code: string; description?: string; is_core?: boolean }): Promise<Subject> {
    const response = await apiClient.post<Subject>('/settings/subjects', subject);
    return response.data;
  }

  async updateSubject(id: number, subject: Partial<Subject>): Promise<Subject> {
    const response = await apiClient.put<Subject>(`/settings/subjects/${id}`, subject);
    return response.data;
  }

  async deleteSubject(id: number): Promise<void> {
    await apiClient.delete(`/settings/subjects/${id}`);
  }

  // Devices
  async getDevices(deviceType?: string): Promise<Device[]> {
    const params = deviceType ? `?device_type=${deviceType}` : '';
    const response = await apiClient.get<Device[]>(`/settings/devices${params}`);
    return response.data;
  }

  // Staff Attendance
  async getStaffAttendance(filters?: { staff_id?: number; start_date?: string; end_date?: string; status?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await apiClient.get(`/staff-attendance/?${params.toString()}`);
    return response.data;
  }

  async createStaffAttendance(attendanceData: any): Promise<any> {
    const response = await apiClient.post('/staff-attendance/', attendanceData);
    return response.data;
  }

  async updateStaffAttendance(attendanceId: number, attendanceData: any): Promise<any> {
    const response = await apiClient.put(`/staff-attendance/${attendanceId}`, attendanceData);
    return response.data;
  }

  async deleteStaffAttendance(attendanceId: number): Promise<void> {
    await apiClient.delete(`/staff-attendance/${attendanceId}`);
  }

  async staffClockIn(clockInData: { staff_id: number; method?: string; device_id?: string; location?: string; notes?: string }): Promise<any> {
    const response = await apiClient.post('/staff-attendance/clock-in', clockInData);
    return response.data;
  }

  async staffClockOut(clockOutData: { staff_id: number; method?: string; device_id?: string; location?: string; notes?: string; overtime_hours?: number }): Promise<any> {
    const response = await apiClient.post('/staff-attendance/clock-out', clockOutData);
    return response.data;
  }

  async getStaffAttendanceDashboard(): Promise<any> {
    const response = await apiClient.get('/staff-attendance/dashboard/overview');
    return response.data;
  }

  // Staff Leave Management
  async getStaffLeave(filters?: { staff_id?: number; status?: string; leave_type?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await apiClient.get(`/staff-attendance/leave?${params.toString()}`);
    return response.data;
  }

  async createStaffLeave(leaveData: any): Promise<any> {
    const response = await apiClient.post('/staff-attendance/leave', leaveData);
    return response.data;
  }

  async approveStaffLeave(leaveId: number): Promise<any> {
    const response = await apiClient.put(`/staff-attendance/leave/${leaveId}/approve`);
    return response.data;
  }

  async rejectStaffLeave(leaveId: number, rejectionReason: string): Promise<any> {
    const response = await apiClient.put(`/staff-attendance/leave/${leaveId}/reject?rejection_reason=${encodeURIComponent(rejectionReason)}`);
    return response.data;
  }

  // Staff Schedule Management
  async getStaffSchedule(filters?: { staff_id?: number; day_of_week?: number }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await apiClient.get(`/staff-attendance/schedule?${params.toString()}`);
    return response.data;
  }

  async createStaffSchedule(scheduleData: any): Promise<any> {
    const response = await apiClient.post('/staff-attendance/schedule', scheduleData);
    return response.data;
  }

  async updateStaffSchedule(scheduleId: number, scheduleData: any): Promise<any> {
    const response = await apiClient.put(`/staff-attendance/schedule/${scheduleId}`, scheduleData);
    return response.data;
  }

  async deleteStaffSchedule(scheduleId: number): Promise<void> {
    await apiClient.delete(`/staff-attendance/schedule/${scheduleId}`);
  }

  async createDevice(device: { name: string; device_type: string; device_id: string; location: string; ip_address?: string; port?: number }): Promise<Device> {
    const response = await apiClient.post<Device>('/settings/devices', device);
    return response.data;
  }

  async updateDevice(id: number, device: Partial<Device>): Promise<Device> {
    const response = await apiClient.put<Device>(`/settings/devices/${id}`, device);
    return response.data;
  }

  async deleteDevice(id: number): Promise<void> {
    await apiClient.delete(`/settings/devices/${id}`);
  }

  // ENUMs
  async getAttendanceModes(): Promise<string[]> {
    const response = await apiClient.get<string[]>('/settings/enums/attendance-modes');
    return response.data;
  }

  async getBiometricTypes(): Promise<string[]> {
    const response = await apiClient.get<string[]>('/settings/enums/biometric-types');
    return response.data;
  }

  async getNotificationChannels(): Promise<string[]> {
    const response = await apiClient.get<string[]>('/settings/enums/notification-channels');
    return response.data;
  }

  async getGatePassWorkflows(): Promise<string[]> {
    const response = await apiClient.get<string[]>('/settings/enums/gate-pass-workflows');
    return response.data;
  }

  // Generic API method for custom requests
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.request<T>(config);
    return response.data;
  }
}

// Export singleton instance
export const api = new ApiClient();
export default api; 