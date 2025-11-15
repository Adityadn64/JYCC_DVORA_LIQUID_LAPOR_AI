import { useState, useEffect } from 'react';
import apiClient from '../services/api';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');

      if (token && userData) {
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));
        // Set auth header
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      setLoading(false);
    } catch (err: any) {
      setError('Auth check failed');
      setLoading(false);
    }
  };

  const login = async (credentials: any) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const token = response.data.token;
      const userData = response.data.user;

      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', JSON.stringify(userData));
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setIsAuthenticated(true);
      setUser(userData);
      return response.data;
    } catch (err) {
      setError('Login failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      delete apiClient.defaults.headers.common['Authorization'];
      setIsAuthenticated(false);
      setUser(null);
    } catch (err) {
      setError('Logout failed');
      throw err;
    }
  };

  return {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout,
    checkAuth
  };
}
