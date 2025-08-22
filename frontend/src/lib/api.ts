import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { LoginRequest, LoginResponse, User, School, SchoolStats, UserFilters, CreateUserForm, UpdateUserForm } from '../types';

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

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', {
      current_password: currentPassword,
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
  async getStudents(filters?: { status?: string; class_name?: string }): Promise<any[]> {
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

  // Generic API method for custom requests
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.request<T>(config);
    return response.data;
  }
}

// Export singleton instance
export const api = new ApiClient();
export default api; 