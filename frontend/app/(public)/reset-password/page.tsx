'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authApi } from '@/services/authApi';

const resetPasswordSchema = z.object({
  email: z.string().min(1, 'Email không được để trống').email('Email không đúng định dạng'),
  otp: z.string().length(6, 'Mã OTP phải có đúng 6 chữ số'),
  password: z.string().min(6, 'Mật khẩu mới phải từ 6 ký tự trở lên'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp!',
  path: ['confirmPassword'],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: emailParam,
      otp: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    setApiError(null);
    try {
      await authApi.resetPassword({
        email: data.email,
        otp: data.otp,
        password: data.password,
      });
      alert('Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.');
      router.push('/login');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Đã có lỗi xảy ra!';
      setApiError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white font-sans text-gray-900">
      {/* ================= CỘT TRÁI: FORM ================= */}
      <div className="flex w-full flex-col justify-center px-6 sm:px-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-[340px]">
          {/* Logo */}
          <div className="mb-10 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-[#0F172A] text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-950">ScholarHub</span>
          </div>

          {/* Tiêu đề */}
          <div className="mb-8">
            <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-gray-950">Reset Password</h1>
            <p className="text-[13px] leading-relaxed text-gray-500">
              Enter the 6-digit OTP code sent to your email and set your new password.
            </p>
          </div>

          {/* Lỗi API */}
          {apiError && (
            <div className="mb-5 rounded-md bg-red-50 p-3 text-[12px] font-medium text-red-600 border border-red-100 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Input Email */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-gray-700">Email Address</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-gray-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </div>
                <input
                  {...register('email')}
                  className={`w-full rounded-lg bg-[#F5F6F8] py-2.5 pl-9 pr-3 text-[13px] text-gray-900 placeholder-gray-400 outline-none focus:bg-white border transition-all ${errors.email ? 'border-red-400 focus:border-red-400' : 'border-transparent focus:border-gray-200'}`}
                  placeholder="name@university.edu"
                />
              </div>
              {errors.email && <p className="text-[10px] text-red-500 pl-1">{errors.email.message}</p>}
            </div>

            {/* Input OTP */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-gray-700">OTP Code (6 digits)</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-gray-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <input
                  {...register('otp')}
                  maxLength={6}
                  className={`w-full rounded-lg bg-[#F5F6F8] py-2.5 pl-9 pr-3 text-[13px] text-gray-900 placeholder-gray-400 outline-none focus:bg-white border transition-all ${errors.otp ? 'border-red-400 focus:border-red-400' : 'border-transparent focus:border-gray-200'}`}
                  placeholder="123456"
                />
              </div>
              {errors.otp && <p className="text-[10px] text-red-500 pl-1">{errors.otp.message}</p>}
            </div>

            {/* Input New Password */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-gray-700">New Password</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-gray-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full rounded-lg bg-[#F5F6F8] py-2.5 pl-9 pr-9 text-[13px] text-gray-900 placeholder-gray-400 outline-none focus:bg-white border transition-all ${errors.password ? 'border-red-400 focus:border-red-400' : 'border-transparent focus:border-gray-200'}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-gray-400 hover:text-gray-600"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">{showPassword ? <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/><path d="m3 3 18 18"/></> : <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>}</svg>
                </button>
              </div>
              {errors.password && <p className="text-[10px] text-red-500 pl-1">{errors.password.message}</p>}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-gray-700">Confirm New Password</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-gray-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <input
                  {...register('confirmPassword')}
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full rounded-lg bg-[#F5F6F8] py-2.5 pl-9 pr-3 text-[13px] text-gray-900 placeholder-gray-400 outline-none focus:bg-white border transition-all ${errors.confirmPassword ? 'border-red-400 focus:border-red-400' : 'border-transparent focus:border-gray-200'}`}
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && <p className="text-[10px] text-red-500 pl-1">{errors.confirmPassword.message}</p>}
            </div>

            {/* Nút Submit */}
            <button
              disabled={isLoading}
              type="submit"
              className="mt-6 w-full rounded-lg bg-[#111827] py-2.5 text-[13px] font-medium text-white transition-all hover:bg-black disabled:opacity-40"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <p className="mt-8 text-center text-[12px] text-gray-500">
            Remembered your password? <a href="/login" className="font-semibold text-gray-900 hover:underline">Login here</a>
          </p>
        </div>
      </div>

      {/* ================= CỘT PHẢI: ILLUSTRATION ================= */}
      <div className="hidden w-1/2 flex-col items-center justify-center bg-[#F8F9FA] lg:flex">
        <div className="relative flex w-full max-w-[460px] flex-col items-center justify-center rounded-[24px] bg-white p-14 shadow-sm border border-gray-100">
          <div className="mb-8 w-full h-[180px] flex justify-center opacity-80">
            <svg className="h-full text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H12v20H6.5a2.5 2.5 0 0 1-2.5-2.5z" fill="#fff" strokeWidth="1"/>
              <path d="M20 19.5v-15A2.5 2.5 0 0 0 17.5 2H12v20h5.5a2.5 2.5 0 0 0 2.5-2.5z" fill="#fff" strokeWidth="1"/>
              <path d="M12 2v20 M14 6h4 M14 10h4 M14 14h2 M18 10h.01 M20 8h.01 M22 12h.01" strokeWidth="1" strokeLinecap="round"/>
              <circle cx="18" cy="6" r="1"/><circle cx="21" cy="10" r="1"/><circle cx="19" cy="14" r="1"/>
            </svg>
          </div>
          <p className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase">
            Recover Access to ScholarHub
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <span className="material-symbols-outlined animate-spin text-3xl text-gray-500">sync</span>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
