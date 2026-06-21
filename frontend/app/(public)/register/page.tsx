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

// 1. SCHEMA ZOD (Bắt lỗi khi bấm Submit)
const registerSchema = z
  .object({
    name: z.string().min(1, 'Vui lòng nhập họ tên'),
    email: z.string().min(1, 'Email không được để trống').email('Email không đúng định dạng'),
    password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp!',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading, error: apiError, loginWithGoogle } = useAuth();
  const [showPassword] = useState(false);

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

  // 2. KHỞI TẠO REACT-HOOK-FORM
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  // 3. HÀM SUBMIT
  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      alert('Đăng ký thành công! Hãy đăng nhập.');
      router.push('/login');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white font-sans text-gray-900">
      {/* ================= CỘT TRÁI: FORM ================= */}
      <div className="flex w-full flex-col justify-center px-6 sm:px-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-[340px]">
          <div className="mb-10 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-[#0F172A] text-white">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-950">ScholarHub</span>
          </div>

          <div className="mb-8">
            <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-gray-950">
              Join ScholarHub
            </h1>
            <p className="text-[13px] leading-relaxed text-gray-500">
              Start your academic journey and manage research like a pro.
            </p>
          </div>

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
            {/* Input Full Name */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-gray-700">Full Name</label>
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
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <input
                  {...register('name')}
                  className={`w-full rounded-lg border bg-[#F5F6F8] py-2.5 pr-3 pl-9 text-[13px] text-gray-900 placeholder-gray-400 transition-all outline-none focus:bg-white ${errors.name ? 'border-red-400 focus:border-red-400' : 'border-transparent focus:border-gray-200'}`}
                  placeholder="Full Name"
                />
              </div>
              {errors.name && (
                <p className="pl-1 text-[10px] text-red-500">{errors.name.message}</p>
              )}
            </div>

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
                  className={`w-full rounded-lg border bg-[#F5F6F8] py-2.5 pr-3 pl-9 text-[13px] text-gray-900 placeholder-gray-400 transition-all outline-none focus:bg-white ${errors.email ? 'border-red-400 focus:border-red-400' : 'border-transparent focus:border-gray-200'}`}
                  placeholder="Email Address"
                />
              </div>
              {errors.email && (
                <p className="pl-1 text-[10px] text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-gray-700">Password</label>
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
                  className={`w-full rounded-lg border bg-[#F5F6F8] py-2.5 pr-9 pl-9 text-[13px] text-gray-900 transition-all outline-none focus:bg-white ${errors.password ? 'border-red-400 focus:border-red-400' : 'border-transparent focus:border-gray-200'}`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="pl-1 text-[10px] text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-gray-700">Confirm Password</label>
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
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <input
                  {...register('confirmPassword')}
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full rounded-lg border bg-[#F5F6F8] py-2.5 pr-3 pl-9 text-[13px] text-gray-900 transition-all outline-none focus:bg-white ${errors.confirmPassword ? 'border-red-400 focus:border-red-400' : 'border-transparent focus:border-gray-200'}`}
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && (
                <p className="pl-1 text-[10px] text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              disabled={isLoading}
              type="submit"
              className="mt-6 w-full rounded-lg bg-[#111827] py-2.5 text-[13px] font-medium text-white transition-all hover:bg-black disabled:opacity-40"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center justify-center gap-3">
            <div className="h-px flex-1 bg-gray-100"></div>
            <span className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
              OR
            </span>
            <div className="h-px flex-1 bg-gray-100"></div>
          </div>

          {/* Google Login Button */}
          <div className="mt-4 flex flex-col items-center justify-center">
            <div id="google-signin-btn" className="w-full max-w-[340px]"></div>
          </div>

          <Script
            src="https://accounts.google.com/gsi/client"
            onLoad={handleGoogleScriptLoad}
            strategy="afterInteractive"
          />

          <p className="mt-6 text-center text-[12px] text-gray-500">
            Already have an account?{' '}
            <a href="/login" className="font-semibold text-gray-900 hover:underline">
              Login here
            </a>
          </p>
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
            </svg>
          </div>
          <p className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase">
            Join the Research Community
          </p>
        </div>
      </div>
    </div>
  );
}
