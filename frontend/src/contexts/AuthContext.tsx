'use client';

/**
 * Auth Context Provider
 * 
 * Manages authentication state across the application
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, setAccessToken, setRefreshToken, getRefreshToken, User } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check authentication status on mount
  const checkAuth = useCallback(async () => {
    const storedRefreshToken = getRefreshToken();
    
    if (!storedRefreshToken) {
      setIsLoading(false);
      return;
    }

    try {
      // Try to refresh the token first
      const refreshResponse = await authApi.refresh();
      const { tokens } = refreshResponse.data.data;
      setAccessToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);
      
      // Then get user profile
      const profileResponse = await authApi.getProfile();
      setUser(profileResponse.data.data.user);
    } catch (error) {
      // Not authenticated
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    const { user: userData, tokens } = response.data.data;
    setAccessToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
    setUser(userData as any);
    router.push('/dashboard');
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await authApi.register({ name, email, password });
    const { user: userData, tokens } = response.data.data;
    setAccessToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
    setUser(userData as any);
    router.push('/dashboard');
  };

  const logout = async () => {
    const token = getRefreshToken();
    try {
      if (token) {
        await authApi.logout(token);
      }
    } catch (error) {
      // Ignore logout errors
    } finally {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      router.push('/login');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getProfile();
      setUser(response.data.data.user);
    } catch (error) {
      // Failed to refresh user
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
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
