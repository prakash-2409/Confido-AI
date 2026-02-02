'use client';

/**
 * Secure Auth Context Provider
 * 
 * SECURITY PRINCIPLES:
 * - No tokens stored in localStorage or sessionStorage
 * - Authentication state determined by server-side HttpOnly cookies
 * - Automatic session validation on mount
 * - Graceful handling of auth errors with automatic logout
 * - CSRF token management for secure mutations
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authApi, User, getErrorMessage, setCsrfToken } from '@/lib/api';

// Auth state type
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

// Auth context type
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

// Initial state
const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register', '/', '/about', '/contact'];

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const router = useRouter();
  const pathname = usePathname();
  const initRef = useRef(false);

  /**
   * Update state helper
   */
  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Initialize CSRF token
   */
  const initCsrfToken = useCallback(async () => {
    try {
      const response = await authApi.getCsrfToken();
      if (response.data.data.token) {
        setCsrfToken(response.data.data.token);
      }
    } catch {
      // CSRF endpoint might not exist, continue without it
    }
  }, []);

  /**
   * Check authentication status by calling the profile endpoint
   * The backend validates the HttpOnly cookie
   */
  const checkAuth = useCallback(async () => {
    try {
      const response = await authApi.getProfile();
      const user = response.data.data.user;
      
      updateState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Redirect away from auth pages if logged in
      if (PUBLIC_ROUTES.slice(0, 3).includes(pathname)) {
        // Don't redirect from home page, but redirect from login/register
        if (pathname === '/login' || pathname === '/register') {
          router.replace('/dashboard');
        }
      }
    } catch {
      // Not authenticated - clear state
      updateState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, [updateState, pathname, router]);

  /**
   * Initialize auth on mount
   */
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      await initCsrfToken();
      await checkAuth();
    };
    
    init();
  }, [checkAuth, initCsrfToken]);

  /**
   * Listen for unauthorized events (from API interceptor)
   */
  useEffect(() => {
    const handleUnauthorized = () => {
      updateState({
        user: null,
        isAuthenticated: false,
        error: 'Session expired. Please log in again.',
      });
      router.push('/login');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [updateState, router]);

  /**
   * Login with email and password
   */
  const login = useCallback(async (email: string, password: string) => {
    updateState({ isLoading: true, error: null });

    try {
      const response = await authApi.login({ email, password });
      const user = response.data.data.user;

      updateState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Initialize CSRF token after login
      await initCsrfToken();

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      const message = getErrorMessage(error);
      updateState({
        isLoading: false,
        error: message,
      });
      throw new Error(message);
    }
  }, [updateState, router, initCsrfToken]);

  /**
   * Register new user
   */
  const register = useCallback(async (name: string, email: string, password: string) => {
    updateState({ isLoading: true, error: null });

    try {
      const response = await authApi.register({ name, email, password });
      const user = response.data.data.user;

      updateState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Initialize CSRF token after registration
      await initCsrfToken();

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      const message = getErrorMessage(error);
      updateState({
        isLoading: false,
        error: message,
      });
      throw new Error(message);
    }
  }, [updateState, router, initCsrfToken]);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    updateState({ isLoading: true });

    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors - we'll clear state anyway
    } finally {
      // Clear CSRF token
      setCsrfToken(null);

      // Clear state
      updateState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });

      // Redirect to login
      router.push('/login');
    }
  }, [updateState, router]);

  /**
   * Refresh user data
   */
  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getProfile();
      updateState({ user: response.data.data.user });
    } catch (error) {
      const message = getErrorMessage(error);
      updateState({ error: message });
    }
  }, [updateState]);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Context value
  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth hook
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * useRequireAuth hook - redirects to login if not authenticated
 */
export function useRequireAuth(): AuthContextType {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.push('/login');
    }
  }, [auth.isLoading, auth.isAuthenticated, router]);

  return auth;
}

export default AuthContext;
