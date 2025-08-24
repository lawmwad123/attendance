import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { adminApi, setAdminToken, removeAdminToken } from '../../lib/adminApi';

// Types
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

interface AdminState {
  // Authentication
  admin: SuperAdmin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Dashboard
  systemStats: SystemStats | null;
  schoolsSummary: SchoolSummary[];
  supportTickets: SupportTicket[];
  
  // UI State
  currentPage: string;
  sidebarCollapsed: boolean;
}

const initialState: AdminState = {
  admin: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  systemStats: null,
  schoolsSummary: [],
  supportTickets: [],
  currentPage: 'dashboard',
  sidebarCollapsed: false,
};

// Async thunks
export const adminLogin = createAsyncThunk(
  'admin/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await adminApi.login(credentials);
      setAdminToken(response.access_token);
      localStorage.setItem('admin_user', JSON.stringify(response.admin));
      return response.admin;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Login failed');
    }
  }
);

export const getCurrentAdmin = createAsyncThunk(
  'admin/getCurrentAdmin',
  async (_, { rejectWithValue }) => {
    try {
      const admin = await adminApi.getCurrentAdmin();
      return admin;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to get admin info');
    }
  }
);

export const getSystemStats = createAsyncThunk(
  'admin/getSystemStats',
  async (_, { rejectWithValue }) => {
    try {
      const stats = await adminApi.getSystemStats();
      return stats;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to get system stats');
    }
  }
);

export const getSchoolsSummary = createAsyncThunk(
  'admin/getSchoolsSummary',
  async (filters?: { is_active?: boolean }, { rejectWithValue }) => {
    try {
      const schools = await adminApi.getSchoolsSummary(filters);
      return schools;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to get schools summary');
    }
  }
);

export const getSupportTickets = createAsyncThunk(
  'admin/getSupportTickets',
  async (filters?: { status?: string; priority?: string }, { rejectWithValue }) => {
    try {
      const tickets = await adminApi.getSupportTickets(filters);
      return tickets;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to get support tickets');
    }
  }
);

export const suspendSchool = createAsyncThunk(
  'admin/suspendSchool',
  async (schoolId: number, { rejectWithValue }) => {
    try {
      const response = await adminApi.suspendSchool(schoolId);
      return { schoolId, message: response.message };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to suspend school');
    }
  }
);

export const activateSchool = createAsyncThunk(
  'admin/activateSchool',
  async (schoolId: number, { rejectWithValue }) => {
    try {
      const response = await adminApi.activateSchool(schoolId);
      return { schoolId, message: response.message };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to activate school');
    }
  }
);

// Slice
const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    logout: (state) => {
      state.admin = null;
      state.isAuthenticated = false;
      state.systemStats = null;
      state.schoolsSummary = [];
      state.supportTickets = [];
      removeAdminToken();
    },
    clearError: (state) => {
      state.error = null;
    },
    setCurrentPage: (state, action: PayloadAction<string>) => {
      state.currentPage = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(adminLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.admin = action.payload;
        state.error = null;
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get current admin
    builder
      .addCase(getCurrentAdmin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.admin = action.payload;
      })
      .addCase(getCurrentAdmin.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.admin = null;
      });

    // Get system stats
    builder
      .addCase(getSystemStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSystemStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.systemStats = action.payload;
      })
      .addCase(getSystemStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get schools summary
    builder
      .addCase(getSchoolsSummary.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSchoolsSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.schoolsSummary = action.payload;
      })
      .addCase(getSchoolsSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get support tickets
    builder
      .addCase(getSupportTickets.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSupportTickets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.supportTickets = action.payload;
      })
      .addCase(getSupportTickets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Suspend school
    builder
      .addCase(suspendSchool.fulfilled, (state, action) => {
        const schoolIndex = state.schoolsSummary.findIndex(s => s.id === action.payload.schoolId);
        if (schoolIndex !== -1) {
          state.schoolsSummary[schoolIndex].is_active = false;
        }
      });

    // Activate school
    builder
      .addCase(activateSchool.fulfilled, (state, action) => {
        const schoolIndex = state.schoolsSummary.findIndex(s => s.id === action.payload.schoolId);
        if (schoolIndex !== -1) {
          state.schoolsSummary[schoolIndex].is_active = true;
        }
      });
  },
});

export const { logout, clearError, setCurrentPage, toggleSidebar, setSidebarCollapsed } = adminSlice.actions;
export default adminSlice.reducer;
