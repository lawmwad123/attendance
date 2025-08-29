import { useAppSelector, useAppDispatch } from './redux';
import { logout as logoutAction } from '../store/slices/authSlice';
import { api } from '../lib/api';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  const logout = async () => {
    try {
      // Call logout API if needed
      await api.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear local state
      dispatch(logoutAction());
    }
  };

  const refreshToken = async () => {
    try {
      const response = await api.refreshToken();
      return response;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
    refreshToken,
  };
};
