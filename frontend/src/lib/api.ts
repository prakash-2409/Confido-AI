/**
 * API Client Configuration
 * 
 * Axios instance with interceptors for JWT token handling
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token storage
let accessToken: string | null = null;
let refreshToken: string | null = null;

// On init, try to get refresh token from localStorage (if available)
if (typeof window !== 'undefined') {
  refreshToken = localStorage.getItem('refreshToken');
}

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const setRefreshToken = (token: string | null) => {
  refreshToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('refreshToken', token);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }
};

export const getAccessToken = () => accessToken;
export const getRefreshToken = () => refreshToken;

// Request interceptor - add access token to headers
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // If 401 and not already retrying, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
      originalRequest._retry = true;
      
      try {
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        );
        
        const { tokens } = response.data.data;
        setAccessToken(tokens.accessToken);
        setRefreshToken(tokens.refreshToken);
        
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
        
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        setAccessToken(null);
        setRefreshToken(null);
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// API Types
export interface User {
  id?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface ATSAnalysis {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  summary?: string;
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
  createdAt: string;
}

export interface InterviewQuestion {
  _id: string;
  questionText: string;
  category: string;
  userAnswer?: string;
  score?: number;
  feedback?: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Auth response types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RefreshResponse {
  tokens: AuthTokens;
}

// Auth API
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<ApiResponse<LoginResponse>>('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', data),
  
  logout: (token?: string) => 
    api.post<ApiResponse<null>>('/auth/logout', { refreshToken: token || refreshToken }),
  
  refresh: () => 
    api.post<ApiResponse<RefreshResponse>>('/auth/refresh', { refreshToken }),
  
  getProfile: () => api.get<ApiResponse<{ user: User }>>('/auth/me'),
  
  updateProfile: (data: Partial<User>) =>
    api.put<ApiResponse<{ user: User }>>('/auth/profile', data),
};

// Resume API
export const resumeApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.post<ApiResponse<{ resume: Resume }>>('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  getAll: () => api.get<ApiResponse<{ resumes: Resume[] }>>('/resume'),
  
  getById: (id: string) => api.get<ApiResponse<{ resume: Resume }>>(`/resume/${id}`),
  
  analyze: (id: string, jobDescription: string) =>
    api.post<ApiResponse<ATSAnalysis>>(`/resume/${id}/analyze`, { jobDescription }),
  
  delete: (id: string) => api.delete<ApiResponse<null>>(`/resume/${id}`),
};

// Interview API
export const interviewApi = {
  create: (data: { targetRole: string; difficulty?: string }) =>
    api.post<ApiResponse<{ interview: Interview }>>('/interview', data),
  
  getAll: () => api.get<ApiResponse<{ interviews: Interview[] }>>('/interview'),
  
  getById: (id: string) => api.get<ApiResponse<{ interview: Interview }>>(`/interview/${id}`),
  
  submitAnswer: (interviewId: string, questionId: string, answer: string) =>
    api.post<ApiResponse<{ question: InterviewQuestion }>>(`/interview/${interviewId}/answer`, {
      questionId,
      answer,
    }),
  
  complete: (id: string) =>
    api.post<ApiResponse<{ interview: Interview }>>(`/interview/${id}/complete`),
};

export default api;
