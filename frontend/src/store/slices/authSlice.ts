import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User, LoginRequest, LoginResponse } from '../../types';
import { api, setAuthToken, removeAuthToken } from '../../lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('auth_token'),
  isAuthenticated: !!localStorage.getItem('auth_token'),
  isLoading: false,
  error: null,
};

// Async thunks
export const loginUser = createAsyncThunk<
  LoginResponse,
  LoginRequest,
  { rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await api.login(credentials);
    setAuthToken(response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));
    return response;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.detail || 'Login failed');
  }
});

export const logoutUser = createAsyncThunk<void, void>(
  'auth/logout',
  async () => {
    try {
      await api.logout();
    } catch (error: any) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      removeAuthToken();
    }
  }
);

export const getCurrentUser = createAsyncThunk<User, void, { rejectValue: string }>(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const user = await api.getCurrentUser();
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to get user');
    }
  }
);

export const changePassword = createAsyncThunk<
  void,
  { currentPassword: string; newPassword: string },
  { rejectValue: string }
>('auth/changePassword', async ({ currentPassword, newPassword }, { rejectWithValue }) => {
  try {
    await api.changePassword(currentPassword, newPassword);
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.detail || 'Password change failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    updateUser: (state, action: PayloadAction<User>) => {
      console.log('Updating user in auth slice:', action.payload);
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      removeAuthToken();
    },
    initializeAuth: (state) => {
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('user');
      
      console.log('Initializing auth:', { token: !!token, userStr: !!userStr });
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          console.log('Parsed user from localStorage:', user);
          state.token = token;
          state.user = user;
          state.isAuthenticated = true;
        } catch (error) {
          console.error('Error parsing user from localStorage:', error);
          // Clear invalid data
          removeAuthToken();
          state.isAuthenticated = false;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        console.log('Login fulfilled - updating state:', action.payload);
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.access_token;
        state.isAuthenticated = true;
        state.error = null;
        console.log('State updated - isAuthenticated:', state.isAuthenticated, 'user:', state.user);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Login failed';
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.isLoading = false;
        // Still clear auth state even if logout fails
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      // Get current user
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to get user';
        // Don't clear auth state here, let the user try again
      })
      // Change password
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Password change failed';
      });
  },
});

export const { clearError, setUser, updateUser, clearAuth, initializeAuth } = authSlice.actions;
export default authSlice.reducer; 