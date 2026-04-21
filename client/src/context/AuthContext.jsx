// ============================================================
// context/AuthContext.jsx — Global authentication state
// ============================================================

import { createContext, useContext, useState, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Token is persisted in localStorage so sessions survive refresh
  const [token, setToken]   = useState(() => localStorage.getItem('token'));
  const [userId, setUserId] = useState(() => localStorage.getItem('userId'));

  const login = useCallback(async (email, password) => {
    const data = await authAPI.login({ email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.userId);
    setToken(data.token);
    setUserId(data.userId);
  }, []);

  const register = useCallback(async (email, password) => {
    const data = await authAPI.register({ email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.userId);
    setToken(data.token);
    setUserId(data.userId);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setToken(null);
    setUserId(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, userId, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook with guard
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}