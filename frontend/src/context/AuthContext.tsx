import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import client from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, role: 'user' | 'psychologist') => Promise<void>;
  register: (role: string, data: Record<string, string>) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const role = localStorage.getItem('role');
      if (role === 'psychologist') {
        const res = await client.get('/users/me');
        setUser({ ...res.data, role: 'psychologist' });
      } else {
        const res = await client.get('/users/me');
        setUser({ ...res.data, role: 'user' });
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      fetchMe().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [fetchMe]);

  const login = async (email: string, password: string, role: 'user' | 'psychologist') => {
    const res = await client.post('/auth/login', { email, password, role });
    const { access_token, role: returnedRole } = res.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('role', returnedRole);
    setToken(access_token);
    setUser({ id: '', name: '', email, role: returnedRole });
    await fetchMe();
  };

  const register = async (role: string, data: Record<string, string>) => {
    const res = await client.post('/auth/register', { role, data });
    const { access_token, role: returnedRole } = res.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('role', returnedRole);
    setToken(access_token);
    setUser({ id: '', name: data.name || '', email: data.email || '', role: returnedRole });
    try {
      await fetchMe();
    } catch (err) {
      console.error('Failed to fetch user profile after register:', err);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setUser(null);
  };

  const updateUser = (data: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
