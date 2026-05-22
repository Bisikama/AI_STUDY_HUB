"use client";

import { useState } from "react";
import { authApi } from "@/services/authApi";

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (credentials: any) => {
    setIsLoading(true);
    setError(null);

    try {
      // Gọi lên Layer 2
      const res: any = await authApi.login(credentials);
      
      // Giả lập lưu Token vào máy người dùng
      localStorage.setItem("token", res.data.token);
      
      return res.data.user; // Trả về thông tin user cho Component dùng
    } catch (err: any) {
      // Lấy message lỗi từ Layer 2 trả về
      const errorMsg = err.response?.data?.message || "Đã có lỗi xảy ra!";
      setError(errorMsg);
      throw errorMsg; // Quăng lỗi ra để Component biết mà xử lý (nếu cần)
    } finally {
      setIsLoading(false);
    }
  };

  

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };
// 1. Hàm kiểm tra Email (Gọi khi nhấn Tab ở ô Email)
  const checkEmail = async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Gọi lên Layer 2 (authApi)
      await authApi.checkEmail(email);
      return true; 
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Email không tồn tại!";
      setError(errorMsg);
      throw errorMsg; 
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Hàm kiểm tra Password (Gọi khi nhấn Tab ở ô Password)
  const checkPassword = async (credentials: any) => {
    setIsLoading(true);
    setError(null);
    try {
      // Gọi lên Layer 2 (authApi)
      await authApi.checkPassword(credentials.email, credentials.password);
      return true;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Mật khẩu không đúng!";
      setError(errorMsg);
      throw errorMsg;
    } finally {
      setIsLoading(false);
    }
  };
  return {
    login,
    logout,
    isLoading,
    error,
    checkEmail,
    checkPassword
  };
}; 