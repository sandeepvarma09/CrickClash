import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

interface User {
  username: string;
  email: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('cricclash_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch { /* corrupted data, ignore */ }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/users/login`, { email, password });
      const userData = res.data.data;
      setUser(userData);
      localStorage.setItem('cricclash_user', JSON.stringify(userData));
      localStorage.setItem('cricclash_username', userData.username);
      localStorage.setItem('cricclash_isAdmin', String(userData.isAdmin));
      // Dispatch custom event so same-tab components (like CreateChallengePage) update
      window.dispatchEvent(new Event('storage'));
      // Reload the page so all components pick up the new auth state
      setTimeout(() => window.location.reload(), 100);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      throw new Error(msg);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/users/register`, { username, email, password });
      const userData = res.data.data;
      setUser(userData);
      localStorage.setItem('cricclash_user', JSON.stringify(userData));
      localStorage.setItem('cricclash_username', userData.username);
      localStorage.setItem('cricclash_isAdmin', String(userData.isAdmin));
      window.dispatchEvent(new Event('storage'));
      // Reload the page so all components pick up the new auth state
      setTimeout(() => window.location.reload(), 100);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      throw new Error(msg);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cricclash_user');
    localStorage.removeItem('cricclash_username');
    localStorage.removeItem('cricclash_isAdmin');
    // Full page reload on logout to clear all state
    window.location.assign('/');
  };


  const resetPassword = async (email: string, newPassword: string) => {
    try {
      await axios.post(`${API_BASE_URL}/api/users/reset-password`, { email, newPassword });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Password reset failed';
      throw new Error(msg);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    resetPassword,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
