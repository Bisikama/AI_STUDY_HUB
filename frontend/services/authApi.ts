// src/services/authApi.ts
import axiosClient from '../utils/axios';

// Định nghĩa các Interface để thay thế 'any'
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  fullName?: string;
  username?: string | null;
  phoneNumber?: string | null;
  role: string;
  avatarUrl?: string | null;
}

export const authApi = {
  // 1. Login sử dụng LoginCredentials
  login: async (credentials: LoginCredentials) => {
    return axiosClient.post('/auth/login', credentials);
  },

  // 2. Register sử dụng RegisterData
  register: async (userData: RegisterData) => {
    return axiosClient.post('/auth/register', userData);
  },

  // 3. Get profile trả về UserProfile
  getProfile: async (): Promise<UserProfile> => {
    const response = await axiosClient.get('/auth/profile');
    return response.data;
  },

  checkEmail: async (email: string) => {
    return axiosClient.post('/auth/check-email', { email });
  },

  checkPassword: async (email: string, password: string) => {
    return axiosClient.post('/auth/check-password', { email, password });
  },

  loginWithGoogle: async (idToken: string) => {
    return axiosClient.post('/auth/google', { idToken });
  },

  forgotPassword: async (email: string) => {
    return axiosClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (data: Record<string, unknown>) => {
    return axiosClient.post('/auth/reset-password', data);
  },
};
