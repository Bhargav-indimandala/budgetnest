import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('budgetnest-token'));
  const [loading, setLoading] = useState(true);

  // Set auth header
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('budgetnest-token', token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('budgetnest-token');
    }
  }, [token]);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
      } catch (error) {
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    toast.success(`Welcome back, ${data.user.name}!`);
    return data;
  }, []);

  // Does NOT log the user in — the account isn't usable until the emailed
  // OTP is confirmed via verifyEmail(). Callers should route to a
  // verification screen with the returned email.
  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    return data;
  }, []);

  const verifyEmail = useCallback(async (email, otp) => {
    const { data } = await api.post('/auth/verify-email', { email, otp });
    setToken(data.token);
    setUser(data.user);
    toast.success('Email verified — welcome to BudgetNest!');
    return data;
  }, []);

  const resendOtp = useCallback(async (email) => {
    const { data } = await api.post('/auth/resend-otp', { email });
    return data;
  }, []);

  const forgotPassword = useCallback(async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  }, []);

  const resetPassword = useCallback(async (email, otp, newPassword) => {
    const { data } = await api.post('/auth/reset-password', { email, otp, newPassword });
    setToken(data.token);
    setUser(data.user);
    toast.success('Password reset — you\'re logged in');
    return data;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('budgetnest-token');
    toast.success('Logged out successfully');
  }, []);

  // Invalidates every previously issued token (server bumps tokenVersion),
  // then swaps in the fresh token returned for this session so we don't
  // also log ourselves out.
  const logoutAllDevices = useCallback(async () => {
    const { data } = await api.post('/auth/logout-all');
    setToken(data.token);
    toast.success('Logged out of all other sessions');
    return data;
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user, token, loading, login, register, logout, logoutAllDevices, updateUser,
        verifyEmail, resendOtp, forgotPassword, resetPassword,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
