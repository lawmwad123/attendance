import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Super Admin Types
interface SuperAdmin {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'SYSTEM_DEVELOPER' | 'SYSTEM_ADMIN' | 'SUPPORT_AGENT' | 'FINANCIAL_ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  is_active: boolean;
  is_verified: boolean;
  two_factor_enabled: boolean;
  last_login?: string;
  profile_image?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

interface SuperAdminLoginRequest {
  email: string;
  password: string;
}

interface SuperAdminLoginResponse {
  access_token: string;
  token_type: string;
  admin: SuperAdmin;
}

interface SystemStats {
  total_schools: number;
  active_schools: number;
  total_users: number;
  active_users: number;
  total_students: number;
  active_students: number;
  total_support_tickets: number;
  open_support_tickets: number;
  system_uptime_hours: number;
  storage_used_gb: number;
  storage_total_gb: number;
}

interface SchoolSummary {
  id: number;
  name: string;
  slug: string;
  total_students: number;
  total_teachers: number;
  is_active: boolean;
  subscription_plan: string;
  subscription_expires_at?: string;
  last_activity?: string;
  created_at: string;
}

interface SupportTicket {
  id: number;
  ticket_number: string;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  school_id: number;
  school_name: string;
  contact_email: string;
  contact_phone?: string;
  assigned_admin_id?: number;
  assigned_at?: string;
  resolution?: string;
  resolved_at?: string;
  resolution_time_hours?: number;
  created_at: string;
  updated_at: string;
}

interface SystemConfiguration {
  id: number;
  key: string;
  value: string;
  description?: string;
  is_public: boolean;
  data_type: string;
  category: string;
  created_at: string;
  updated_at: string;
}

interface SystemLog {
  id: number;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  details?: any;
  admin_id?: number;
  school_id?: number;
  user_id?: number;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

interface AdminActionLog {
  id: number;
  action: string;
  resource_type: string;
  resource_id?: number;
  details?: any;
  admin_id: number;
  admin_email: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_VERSION = '/api/v1';

// Create axios instance for admin API
const adminApiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}${API_VERSION}/super-admin`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
adminApiClient.interceptors.request.use(
  (config) => {
    // Add auth token
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
adminApiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear admin token
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      
      // Only redirect to admin login if we're on an admin route
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/admin') && currentPath !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Utility functions
export function getAdminToken(): string | null {
  return localStorage.getItem('admin_token');
}

export function setAdminToken(token: string): void {
  localStorage.setItem('admin_token', token);
}

export function removeAdminToken(): void {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
}

// Admin API Client Class
class AdminApiClient {
  // Authentication
  async login(credentials: SuperAdminLoginRequest): Promise<SuperAdminLoginResponse> {
    const response = await adminApiClient.post<SuperAdminLoginResponse>('/login', credentials);
    return response.data;
  }

  async getCurrentAdmin(): Promise<SuperAdmin> {
    const response = await adminApiClient.get<SuperAdmin>('/me');
    return response.data;
  }

  // Super Admin Management
  async getSuperAdmins(filters?: { role?: string; status?: string }): Promise<SuperAdmin[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await adminApiClient.get<SuperAdmin[]>(`/admins?${params.toString()}`);
    return response.data;
  }

  async createSuperAdmin(adminData: any): Promise<SuperAdmin> {
    const response = await adminApiClient.post<SuperAdmin>('/admins', adminData);
    return response.data;
  }

  async updateSuperAdmin(adminId: number, adminData: any): Promise<SuperAdmin> {
    const response = await adminApiClient.put<SuperAdmin>(`/admins/${adminId}`, adminData);
    return response.data;
  }

  // System Management
  async getSystemStats(): Promise<SystemStats> {
    const response = await adminApiClient.get<SystemStats>('/dashboard/stats');
    return response.data;
  }

  async getSchoolsSummary(filters?: { is_active?: boolean }): Promise<SchoolSummary[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await adminApiClient.get<SchoolSummary[]>(`/schools?${params.toString()}`);
    return response.data;
  }

  async suspendSchool(schoolId: number): Promise<{ message: string }> {
    const response = await adminApiClient.put<{ message: string }>(`/schools/${schoolId}/suspend`);
    return response.data;
  }

  async activateSchool(schoolId: number): Promise<{ message: string }> {
    const response = await adminApiClient.put<{ message: string }>(`/schools/${schoolId}/activate`);
    return response.data;
  }

  // Support Tickets
  async getSupportTickets(filters?: { status?: string; priority?: string }): Promise<SupportTicket[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await adminApiClient.get<SupportTicket[]>(`/support-tickets?${params.toString()}`);
    return response.data;
  }

  async createSupportTicket(ticketData: any): Promise<SupportTicket> {
    const response = await adminApiClient.post<SupportTicket>('/support-tickets', ticketData);
    return response.data;
  }

  async updateSupportTicket(ticketId: number, ticketData: any): Promise<SupportTicket> {
    const response = await adminApiClient.put<SupportTicket>(`/support-tickets/${ticketId}`, ticketData);
    return response.data;
  }

  // System Configuration
  async getSystemConfigurations(category?: string): Promise<SystemConfiguration[]> {
    const params = category ? `?category=${category}` : '';
    const response = await adminApiClient.get<SystemConfiguration[]>(`/configurations${params}`);
    return response.data;
  }

  async createSystemConfiguration(configData: any): Promise<SystemConfiguration> {
    const response = await adminApiClient.post<SystemConfiguration>('/configurations', configData);
    return response.data;
  }

  async updateSystemConfiguration(configId: number, configData: any): Promise<SystemConfiguration> {
    const response = await adminApiClient.put<SystemConfiguration>(`/configurations/${configId}`, configData);
    return response.data;
  }

  // System Logs
  async getSystemLogs(filters?: { level?: string }): Promise<SystemLog[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await adminApiClient.get<SystemLog[]>(`/logs?${params.toString()}`);
    return response.data;
  }

  // Admin Action Logs
  async getAdminActionLogs(filters?: { action?: string; resource_type?: string }): Promise<AdminActionLog[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await adminApiClient.get<AdminActionLog[]>(`/admin-actions?${params.toString()}`);
    return response.data;
  }

  // Generic API method for custom requests
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await adminApiClient.request<T>(config);
    return response.data;
  }
}

// Export singleton instance
export const adminApi = new AdminApiClient();
export default adminApi;
