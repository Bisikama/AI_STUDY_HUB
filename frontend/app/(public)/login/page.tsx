'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Script from 'next/script';

interface CustomWindow extends Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string;
          callback: (response: { credential: string }) => void;
        }) => void;
        renderButton: (
          element: HTMLElement | null,
          options: { theme: string; size: string; width: number },
        ) => void;
      };
    };
  };
}

// 1. ĐỊNH NGHĨA ZOD SCHEMA CHO LOGIN
const loginSchema = z.object({
  email: z.string().min(1, 'Email không được để trống').email('Email không đúng định dạng'),
  password: z.string().min(6, 'Mật khẩu không được để trống'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();

  // Lấy hàm login và state báo lỗi từ custom hook
  const { login, isLoading, error: apiError, loginWithGoogle } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  // 2. KHỞI TẠO REACT-HOOK-FORM
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  // 3. HÀM SUBMIT
  const onSubmit = async (data: LoginFormValues) => {
    try {
      const user = await login({ email: data.email, password: data.password });
      // Sau khi login thành công → phân quyền dựa trên role
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err) {
      // Lỗi API (sai email, sai pass) sẽ tự hiện ở biến apiError
    }
  };

  const handleGoogleResponse = async (response: { credential: string }) => {
    try {
      await loginWithGoogle(response.credential);
      router.push('/dashboard');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Google login failed', err);
    }
  };

  const handleGoogleScriptLoad = () => {
    const google = (window as unknown as CustomWindow).google;
    if (google) {
      google.accounts.id.initialize({
        client_id:
          process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
          '1047712398436-yourclientidplaceholder.apps.googleusercontent.com',
        callback: handleGoogleResponse,
      });
      google.accounts.id.renderButton(document.getElementById('google-signin-btn'), {
        theme: 'outline',
        size: 'large',
        width: 340,
      });
    }
  };

  useEffect(() => {
    if ((window as unknown as CustomWindow).google) {
      handleGoogleScriptLoad();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-white font-sans text-gray-900">
      {/* ================= CỘT TRÁI: FORM ================= */}
      <div className="flex w-full flex-col justify-center px-6 sm:px-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-[340px]">
          {/* Logo */}
          <div className="mb-10 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-[#0F172A] text-white">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-950">ScholarHub</span>
          </div>

          {/* Tiêu đề */}
          <div className="mb-8">
            <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-gray-950">Welcome Back</h1>
            <p className="text-[13px] leading-relaxed text-gray-500">
              Continue your academic journey and manage your research docs.
            </p>
          </div>

          {/* Hiển thị lỗi từ Backend (Sai mật khẩu, tài khoản ko tồn tại...) */}
          {apiError && (
            <div className="mb-5 flex items-center gap-2 rounded-md border border-red-100 bg-red-50 p-3 text-[12px] font-medium text-red-600">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Input Email */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-gray-700">Email Address</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-gray-400">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <input
                  {...register('email')}
                  autoFocus
                  className={`w-full rounded-lg border bg-[#F5F6F8] py-2.5 pr-3 pl-9 text-[13px] text-gray-900 placeholder-gray-400 transition-all outline-none focus:bg-white ${errors.email ? 'border-red-400 focus:border-red-400' : 'border-transparent focus:border-gray-200'}`}
                  placeholder="name@university.edu"
                />
              </div>
              {/* Báo chữ đỏ nếu để trống hoặc sai định dạng */}
              {errors.email && (
                <p className="pl-1 text-[10px] text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-semibold text-gray-700">Password</label>
                <a
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-gray-900 hover:underline"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-gray-400">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full rounded-lg border bg-[#F5F6F8] py-2.5 pr-9 pl-9 text-[13px] text-gray-900 placeholder-gray-400 transition-all outline-none focus:bg-white ${errors.password ? 'border-red-400 focus:border-red-400' : 'border-transparent focus:border-gray-200'}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-gray-400 hover:text-gray-600"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    {showPassword ? (
                      <>
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                        <path d="m3 3 18 18" />
                      </>
                    ) : (
                      <>
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
              {/* Báo chữ đỏ nếu để trống password */}
              {errors.password && (
                <p className="pl-1 text-[10px] text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Nút Submit */}
            <button
              disabled={isLoading}
              type="submit"
              className="mt-6 w-full rounded-lg bg-[#111827] py-2.5 text-[13px] font-medium text-white transition-all hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Google Login Button */}
          <div className="mt-4 flex flex-col items-center justify-center">
            <div id="google-signin-btn" className="w-full max-w-[340px]"></div>
          </div>

          <Script
            src="https://accounts.google.com/gsi/client"
            onLoad={handleGoogleScriptLoad}
            strategy="afterInteractive"
          />

          {/* Divider */}
          <div className="my-6 flex items-center justify-center gap-3">
            <div className="h-px flex-1 bg-gray-100"></div>
            <span className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
              OR
            </span>
            <div className="h-px flex-1 bg-gray-100"></div>
          </div>

          <p className="text-center text-[12px] text-gray-500">
            Don&apos;t have an account?{' '}
            <a href="/register" className="font-semibold text-gray-900 hover:underline">
              Register here
            </a>
          </p>

          <div className="mt-8 border-t border-gray-100 pt-5 text-center">
            <button
              onClick={() => router.push('/')}
              className="inline-flex cursor-pointer items-center gap-1.5 text-[12px] font-semibold text-gray-500 transition-colors hover:text-gray-900"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Quay lại trang chủ
            </button>
          </div>
        </div>
      </div>

      {/* ================= CỘT PHẢI: ILLUSTRATION ================= */}
      <div className="hidden w-1/2 flex-col items-center justify-center bg-[#F8F9FA] lg:flex">
        <div className="relative flex w-full max-w-[460px] flex-col items-center justify-center rounded-[24px] border border-gray-100 bg-white p-14 shadow-sm">
          <div className="mb-8 flex h-[180px] w-full justify-center opacity-80">
            <svg
              className="h-full text-slate-800"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
            >
              <path
                d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H12v20H6.5a2.5 2.5 0 0 1-2.5-2.5z"
                fill="#fff"
                strokeWidth="1"
              />
              <path
                d="M20 19.5v-15A2.5 2.5 0 0 0 17.5 2H12v20h5.5a2.5 2.5 0 0 0 2.5-2.5z"
                fill="#fff"
                strokeWidth="1"
              />
              <path
                d="M12 2v20 M14 6h4 M14 10h4 M14 14h2 M18 10h.01 M20 8h.01 M22 12h.01"
                strokeWidth="1"
                strokeLinecap="round"
              />
              <circle cx="18" cy="6" r="1" />
              <circle cx="21" cy="10" r="1" />
              <circle cx="19" cy="14" r="1" />
              <path d="M14 6l4-4 M18 6l3 4 M14 10l4-4 M19 14l2-4" strokeWidth="0.5" />
            </svg>
          </div>

          <p className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase">
            Academic Knowledge & Technology
          </p>
        </div>
      </div>
    </div>
  );
}
