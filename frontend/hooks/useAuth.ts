'use client';

import { useState } from 'react';
import { authApi, LoginCredentials, RegisterData } from '@/services/authApi';

export interface User {
  id: string;
  email: string;
  name?: string;
  fullName?: string;
  username?: string | null;
  phoneNumber?: string | null;
  role: string;
  avatarUrl?: string | null;
}

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Hàm hỗ trợ xử lý lỗi tập trung để code gọn hơn
  const handleError = (err: unknown): string => {
    // Ép kiểu err để lấy message từ axios response
    const axiosError = err as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message || 'Đã có lỗi xảy ra!';
  };

  const login = async (credentials: LoginCredentials): Promise<User> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.login(credentials);
      // axiosClient interceptor đã giải nén response.data = response.data.data
      // nên res.data chính là { user, token }
      const payload = res.data as unknown as { user: User; token: string };
      localStorage.setItem('user', JSON.stringify(payload.user));
      return payload.user;
    } catch (err: unknown) {
      const errorMsg = handleError(err);
      setError(errorMsg);
      throw errorMsg;
    } finally {
      setIsLoading(false);
    }
  };

  // Thay Promise<any> bằng Promise<User> hoặc kiểu dữ liệu bạn mong đợi
  const register = async (userData: RegisterData): Promise<User> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.register(userData);
      // Giả sử API trả về user sau khi đăng ký thành công
      return res.data;
    } catch (err: unknown) {
      const errorMsg = handleError(err);
      setError(errorMsg);
      throw errorMsg;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  const checkEmail = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.checkEmail(email);
      return true;
    } catch (err: unknown) {
      const errorMsg = handleError(err);
      setError(errorMsg);
      throw errorMsg;
    } finally {
      setIsLoading(false);
    }
  };

  const checkPassword = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.checkPassword(credentials.email, credentials.password);
      return true;
    } catch (err: unknown) {
      const errorMsg = handleError(err);
      setError(errorMsg);
      throw errorMsg;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (idToken: string): Promise<User> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.loginWithGoogle(idToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      return res.data.user;
    } catch (err: unknown) {
      const errorMsg = handleError(err);
      setError(errorMsg);
      throw errorMsg;
    } finally {
      setIsLoading(false);
    }
  };

  const getProfile = async (): Promise<User> => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await authApi.getProfile();
      localStorage.setItem('user', JSON.stringify(profile));
      return profile;
    } catch (err: unknown) {
      const errorMsg = handleError(err);
      setError(errorMsg);
      throw errorMsg;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    register,
    logout,
    isLoading,
    error,
    checkEmail,
    checkPassword,
    loginWithGoogle,
    getProfile,
  };
};
