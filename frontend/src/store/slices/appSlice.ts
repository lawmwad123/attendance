import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { School, SchoolStats } from '../../types';
import { api } from '../../lib/api';

interface AppState {
  school: School | null;
  schoolStats: SchoolStats | null;
  tenantId: string | null;
  sidebarOpen: boolean;
  loading: {
    school: boolean;
    stats: boolean;
    staffAttendance: boolean;
  };
  error: string | null;
  notifications: Notification[];
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const initialState: AppState = {
  school: null,
  schoolStats: null,
  tenantId: localStorage.getItem('tenant_id'),
  sidebarOpen: true,
  loading: {
    school: false,
    stats: false,
    staffAttendance: false,
  },
  error: null,
  notifications: [],
};

// Async thunks
export const fetchCurrentSchool = createAsyncThunk<School, void, { rejectValue: string }>(
  'app/fetchCurrentSchool',
  async (_, { rejectWithValue }) => {
    try {
      const school = await api.getCurrentSchool();
      return school;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch school');
    }
  }
);

export const fetchSchoolStats = createAsyncThunk<SchoolStats, void, { rejectValue: string }>(
  'app/fetchSchoolStats',
  async (_, { rejectWithValue }) => {
    try {
      const stats = await api.getSchoolStats();
      return stats;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch school stats');
    }
  }
);

export const updateSchool = createAsyncThunk<
  School,
  Partial<School>,
  { rejectValue: string }
>('app/updateSchool', async (schoolData, { rejectWithValue }) => {
  try {
    const school = await api.updateSchool(schoolData);
    return school;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to update school');
  }
});

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setTenantId: (state, action: PayloadAction<string>) => {
      state.tenantId = action.payload;
      localStorage.setItem('tenant_id', action.payload);
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        read: false,
      };
      state.notifications.unshift(notification);
      
      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    markAllNotificationsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch current school
      .addCase(fetchCurrentSchool.pending, (state) => {
        state.loading.school = true;
        state.error = null;
      })
      .addCase(fetchCurrentSchool.fulfilled, (state, action) => {
        state.loading.school = false;
        state.school = action.payload;
        state.error = null;
      })
      .addCase(fetchCurrentSchool.rejected, (state, action) => {
        state.loading.school = false;
        state.error = action.payload || 'Failed to fetch school';
      })
      // Fetch school stats
      .addCase(fetchSchoolStats.pending, (state) => {
        state.loading.stats = true;
      })
      .addCase(fetchSchoolStats.fulfilled, (state, action) => {
        state.loading.stats = false;
        state.schoolStats = action.payload;
      })
      .addCase(fetchSchoolStats.rejected, (state, action) => {
        state.loading.stats = false;
        state.error = action.payload || 'Failed to fetch school stats';
      })
      // Update school
      .addCase(updateSchool.pending, (state) => {
        state.loading.school = true;
        state.error = null;
      })
      .addCase(updateSchool.fulfilled, (state, action) => {
        state.loading.school = false;
        state.school = action.payload;
        state.error = null;
      })
      .addCase(updateSchool.rejected, (state, action) => {
        state.loading.school = false;
        state.error = action.payload || 'Failed to update school';
      });
  },
});

export const {
  setTenantId,
  toggleSidebar,
  setSidebarOpen,
  clearError,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
  clearNotifications,
} = appSlice.actions;

export default appSlice.reducer; 