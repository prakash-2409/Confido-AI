/**
 * Secure API Client Configuration
 * 
 * SECURITY PRINCIPLES:
 * - Never store tokens in localStorage or sessionStorage
 * - Use HttpOnly cookies for JWT tokens (managed by backend)
 * - Include credentials with every request
 * - Centralized error handling with automatic logout on 401/403
 * - CSRF token validation for mutating requests
 * - Rate limiting on UI-triggered requests
 */

import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// API base URL - proxied through Next.js to hide backend URL
const API_URL = '/api/v1';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 1000; // 1 second
const RATE_LIMIT_MAX_REQUESTS = 10;
const requestTimestamps: number[] = [];

// CSRF token storage (in memory only - refreshed from server)
let csrfToken: string | null = null;

/**
 * Check rate limit before making request
 */
const checkRateLimit = (): boolean => {
  const now = Date.now();
  // Remove old timestamps outside the window
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - RATE_LIMIT_WINDOW) {
    requestTimestamps.shift();
  }
  
  if (requestTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false; // Rate limited
  }
  
  requestTimestamps.push(now);
  return true;
};

/**
 * Create secure axios instance
 */
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // CRITICAL: Send HttpOnly cookies with every request
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

/**
 * Set CSRF token (retrieved from server)
 */
export const setCsrfToken = (token: string | null) => {
  csrfToken = token;
};

/**
 * Get current CSRF token
 */
export const getCsrfToken = () => csrfToken;

/**
 * Request interceptor
 * - Add CSRF token for mutating requests
 * - Rate limit protection
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Rate limiting check
    if (!checkRateLimit()) {
      return Promise.reject(new Error('Rate limit exceeded. Please wait a moment.'));
    }

    // Add CSRF token for mutating requests (POST, PUT, DELETE, PATCH)
    if (csrfToken && config.method && ['post', 'put', 'delete', 'patch'].includes(config.method.toLowerCase())) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor
 * - Handle authentication errors
 * - Extract CSRF token from response headers
 * - Centralized error handling
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Extract CSRF token from response header if present
    const newCsrfToken = response.headers['x-csrf-token'];
    if (newCsrfToken) {
      setCsrfToken(newCsrfToken);
    }
    return response;
  },
  async (error: AxiosError) => {
    const status = error.response?.status;

    // Handle authentication errors
    if (status === 401 || status === 403) {
      // Clear CSRF token
      setCsrfToken(null);
      
      // Don't redirect if already on auth pages
      if (typeof window !== 'undefined' && 
          !window.location.pathname.startsWith('/login') && 
          !window.location.pathname.startsWith('/register')) {
        // Dispatch custom event for auth context to handle
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }

    // Handle rate limiting from server
    if (status === 429) {
      const retryAfter = error.response?.headers['retry-after'];
      console.warn(`Rate limited. Retry after: ${retryAfter || 'unknown'} seconds`);
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface User {
  id: string;
  _id?: string;
  email: string;
  name: string;
  phone?: string;
  currentRole?: string | null;
  targetRole?: string | null;
  experienceYears?: number;
  isEmailVerified?: boolean;
  profileCompleteness: number;
  hasUploadedResume?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Resume {
  _id: string;
  user: string;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  status: 'uploaded' | 'processing' | 'analyzed' | 'error';
  extractedText?: string;
  skills: string[];
  atsScore?: number;
  missingKeywords?: string[];
  analysisResults?: ATSAnalysis;
  createdAt: string;
  updatedAt: string;
}

export interface ATSAnalysis {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  summary?: string;
  recommendations?: string[];
  categoryScores?: {
    category: string;
    score: number;
    feedback: string;
  }[];
}

export interface Interview {
  _id: string;
  user: string;
  title: string;
  targetRole: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'not_started' | 'in_progress' | 'completed';
  questions: InterviewQuestion[];
  overallScore?: number;
  totalQuestions?: number;
  answeredQuestions?: number;
  categoryScores?: CategoryScore[];
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
}

export interface InterviewQuestion {
  _id: string;
  questionText: string;
  category: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  userAnswer?: string;
  score?: number;
  feedback?: string;
  answeredAt?: string;
}

export interface CategoryScore {
  category: string;
  score: number;
  totalQuestions: number;
  answeredQuestions: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// API Error response
export interface ApiError {
  success: false;
  message: string;
  error?: string;
  statusCode?: number;
}

// ============================================================================
// AUTH API - Secure cookie-based authentication
// ============================================================================

export const authApi = {
  /**
   * Register new user
   * Backend should set HttpOnly cookies on success
   */
  register: (data: { name: string; email: string; password: string }) =>
    api.post<ApiResponse<{ user: User }>>('/auth/register', data),

  /**
   * Login user
   * Backend should set HttpOnly cookies on success
   */
  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ user: User }>>('/auth/login', data),

  /**
   * Logout user
   * Backend should clear HttpOnly cookies
   */
  logout: () => api.post<ApiResponse<null>>('/auth/logout'),

  /**
   * Refresh authentication
   * Uses HttpOnly refresh token cookie
   */
  refresh: () => api.post<ApiResponse<{ user: User }>>('/auth/refresh'),

  /**
   * Get current user profile
   * Uses HttpOnly access token cookie
   */
  getProfile: () => api.get<ApiResponse<{ user: User }>>('/auth/me'),

  /**
   * Update user profile
   */
  updateProfile: (data: Partial<User>) =>
    api.put<ApiResponse<{ user: User }>>('/auth/profile', data),

  /**
   * Get CSRF token
   */
  getCsrfToken: () => api.get<ApiResponse<{ token: string }>>('/auth/csrf'),

  /**
   * Request password reset email
   */
  forgotPassword: (data: { email: string }) =>
    api.post<ApiResponse<null>>('/auth/forgot-password', data),

  /**
   * Reset password with token
   */
  resetPassword: (data: { token: string; password: string }) =>
    api.post<ApiResponse<null>>('/auth/reset-password', data),
};

// ============================================================================
// RESUME API
// ============================================================================

export const resumeApi = {
  /**
   * Upload resume file
   */
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.post<ApiResponse<{ resume: Resume }>>('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // 60 second timeout for uploads
    });
  },

  /**
   * Get all resumes for current user
   */
  getAll: () => api.get<ApiResponse<{ resumes: Resume[] }>>('/resume'),

  /**
   * Get single resume by ID
   */
  getById: (id: string) => api.get<ApiResponse<{ resume: Resume }>>(`/resume/${id}`),

  /**
   * Analyze resume against job description
   */
  analyze: (id: string, jobDescription: string) =>
    api.post<ApiResponse<{ analysis: ATSAnalysis }>>(`/resume/${id}/analyze`, { jobDescription }),

  /**
   * Delete resume
   */
  delete: (id: string) => api.delete<ApiResponse<null>>(`/resume/${id}`),
};

// ============================================================================
// INTERVIEW API
// ============================================================================

export const interviewApi = {
  /**
   * Start new interview session
   */
  start: (data: { targetRole: string; difficulty?: string; resumeId?: string }) =>
    api.post<ApiResponse<{ interview: Interview }>>('/interview/start', data),

  /**
   * Create interview (alias for start)
   */
  create: (data: { targetRole: string; difficulty?: string }) =>
    api.post<ApiResponse<{ interview: Interview }>>('/interview', data),

  /**
   * Get all interviews for current user
   */
  getAll: () => api.get<ApiResponse<{ interviews: Interview[] }>>('/interview'),

  /**
   * Get interview history
   */
  getHistory: () => api.get<ApiResponse<{ interviews: Interview[] }>>('/interview/history'),

  /**
   * Get single interview by ID
   */
  getById: (id: string) => api.get<ApiResponse<{ interview: Interview }>>(`/interview/${id}`),

  /**
   * Submit answer for a question
   */
  submitAnswer: (interviewId: string, questionId: string, answer: string) =>
    api.post<ApiResponse<{ question: InterviewQuestion; interview: Interview }>>(
      `/interview/${interviewId}/answer`,
      { questionId, answer }
    ),

  /**
   * Complete interview and get final results
   */
  complete: (id: string) =>
    api.post<ApiResponse<{ interview: Interview }>>(`/interview/${id}/complete`),

  /**
   * Get interview summary/results
   */
  getSummary: (id: string) =>
    api.get<ApiResponse<{ interview: Interview }>>(`/interview/${id}/summary`),
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract error message from API error response
 */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    return axiosError.response?.data?.message || 
           axiosError.message || 
           'An unexpected error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error: unknown): boolean => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    return status === 401 || status === 403;
  }
  return false;
};

export default api;
