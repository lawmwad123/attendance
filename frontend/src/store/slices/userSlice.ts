import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User, UserFilters, CreateUserForm, UpdateUserForm } from '../../types';
import { api } from '../../lib/api';

interface UserState {
  users: User[];
  selectedUser: User | null;
  teachers: User[];
  parents: User[];
  loading: {
    list: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    details: boolean;
  };
  error: string | null;
  filters: UserFilters;
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

const initialState: UserState = {
  users: [],
  selectedUser: null,
  teachers: [],
  parents: [],
  loading: {
    list: false,
    create: false,
    update: false,
    delete: false,
    details: false,
  },
  error: null,
  filters: {
    skip: 0,
    limit: 50,
  },
  pagination: {
    total: 0,
    page: 1,
    limit: 50,
  },
};

// Async thunks
export const fetchUsers = createAsyncThunk<User[], UserFilters | undefined, { rejectValue: string }>(
  'users/fetchUsers',
  async (filters, { rejectWithValue }) => {
    try {
      const users = await api.getUsers(filters);
      return users;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch users');
    }
  }
);

export const fetchUser = createAsyncThunk<User, number, { rejectValue: string }>(
  'users/fetchUser',
  async (userId, { rejectWithValue }) => {
    try {
      const user = await api.getUser(userId);
      return user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch user');
    }
  }
);

export const createUser = createAsyncThunk<User, CreateUserForm, { rejectValue: string }>(
  'users/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      const user = await api.createUser(userData);
      return user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to create user');
    }
  }
);

export const updateUser = createAsyncThunk<
  User,
  { userId: number; userData: UpdateUserForm },
  { rejectValue: string }
>('users/updateUser', async ({ userId, userData }, { rejectWithValue }) => {
  try {
    const user = await api.updateUser(userId, userData);
    return user;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to update user');
  }
});

export const deleteUser = createAsyncThunk<number, number, { rejectValue: string }>(
  'users/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      await api.deleteUser(userId);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete user');
    }
  }
);

export const fetchTeachers = createAsyncThunk<User[], void, { rejectValue: string }>(
  'users/fetchTeachers',
  async (_, { rejectWithValue }) => {
    try {
      const teachers = await api.getTeachers();
      return teachers;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch teachers');
    }
  }
);

export const fetchParents = createAsyncThunk<User[], void, { rejectValue: string }>(
  'users/fetchParents',
  async (_, { rejectWithValue }) => {
    try {
      const parents = await api.getParents();
      return parents;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch parents');
    }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Partial<UserFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        skip: 0,
        limit: 50,
      };
    },
    setSelectedUser: (state, action: PayloadAction<User | null>) => {
      state.selectedUser = action.payload;
    },
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
    updateUserInList: (state, action: PayloadAction<User>) => {
      const index = state.users.findIndex(u => u.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
    },
    removeUserFromList: (state, action: PayloadAction<number>) => {
      state.users = state.users.filter(u => u.id !== action.payload);
    },
    updateUserProfile: (state, action: PayloadAction<User>) => {
      // Update user in the list if it exists
      const index = state.users.findIndex(u => u.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
      // Update selected user if it matches
      if (state.selectedUser?.id === action.payload.id) {
        state.selectedUser = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading.list = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading.list = false;
        state.users = action.payload;
        state.error = null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading.list = false;
        state.error = action.payload || 'Failed to fetch users';
      })
      // Fetch user details
      .addCase(fetchUser.pending, (state) => {
        state.loading.details = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading.details = false;
        state.selectedUser = action.payload;
        state.error = null;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading.details = false;
        state.error = action.payload || 'Failed to fetch user';
      })
      // Create user
      .addCase(createUser.pending, (state) => {
        state.loading.create = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading.create = false;
        state.users.unshift(action.payload);
        state.error = null;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading.create = false;
        state.error = action.payload || 'Failed to create user';
      })
      // Update user
      .addCase(updateUser.pending, (state) => {
        state.loading.update = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading.update = false;
        const index = state.users.findIndex(u => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.selectedUser?.id === action.payload.id) {
          state.selectedUser = action.payload;
        }
        state.error = null;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.payload || 'Failed to update user';
      })
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.loading.delete = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading.delete = false;
        state.users = state.users.filter(u => u.id !== action.payload);
        if (state.selectedUser?.id === action.payload) {
          state.selectedUser = null;
        }
        state.error = null;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading.delete = false;
        state.error = action.payload || 'Failed to delete user';
      })
      // Fetch teachers
      .addCase(fetchTeachers.pending, (state) => {
        state.loading.list = true;
      })
      .addCase(fetchTeachers.fulfilled, (state, action) => {
        state.loading.list = false;
        state.teachers = action.payload;
      })
      .addCase(fetchTeachers.rejected, (state, action) => {
        state.loading.list = false;
        state.error = action.payload || 'Failed to fetch teachers';
      })
      // Fetch parents
      .addCase(fetchParents.pending, (state) => {
        state.loading.list = true;
      })
      .addCase(fetchParents.fulfilled, (state, action) => {
        state.loading.list = false;
        state.parents = action.payload;
      })
      .addCase(fetchParents.rejected, (state, action) => {
        state.loading.list = false;
        state.error = action.payload || 'Failed to fetch parents';
      });
  },
});

export const {
  clearError,
  setFilters,
  clearFilters,
  setSelectedUser,
  clearSelectedUser,
  updateUserInList,
  removeUserFromList,
  updateUserProfile,
} = userSlice.actions;

export default userSlice.reducer; 