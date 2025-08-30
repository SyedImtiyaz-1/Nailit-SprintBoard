'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthContextType } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    setIsAuthenticated(!!token);
  }, []);

  const login = async (email: string, password: string) => {
    if (!email.trim() || !password.trim()) {
      throw new Error('Email and password are required');
    }
    
    // Mock authentication - accept any non-empty credentials
    const token = `mock-token-${Date.now()}`;
    localStorage.setItem('auth-token', token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('auth-token');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

