'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authApi } from '@/services/authApi';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email không được để trống').email('Email không đúng định dạng'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = (await authApi.forgotPassword(data.email)) as unknown as { devOtp?: string };
      const devOtp = res?.devOtp;
      if (devOtp) {
        alert(`Yêu cầu thành công! (DEV MODE: Mã OTP của bạn là ${devOtp})`);
        router.push(
          `/reset-password?email=${encodeURIComponent(data.email)}&otp=${encodeURIComponent(devOtp)}`,
        );
      } else {
        alert('Yêu cầu thành công! Vui lòng kiểm tra mã OTP.');
        router.push(`/reset-password?email=${encodeURIComponent(data.email)}`);
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const errorMsg = axiosError.response?.data?.message || 'Đã có lỗi xảy ra!';
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

          {/* Tiêu đề */}
          <div className="mb-8">
            <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-gray-950">
              Forgot Password
            </h1>
            <p className="text-[13px] leading-relaxed text-gray-500">
              Enter your email address to receive a 6-digit OTP code to reset your password.
            </p>
          </div>

          {/* Lỗi API */}
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
              {errors.email && (
                <p className="pl-1 text-[10px] text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Nút Submit */}
            <button
              disabled={isLoading}
              type="submit"
              className="mt-6 w-full rounded-lg bg-[#111827] py-2.5 text-[13px] font-medium text-white transition-all hover:bg-black disabled:opacity-40"
            >
              {isLoading ? 'Sending OTP...' : 'Send OTP Code'}
            </button>
          </form>

          <p className="mt-8 text-center text-[12px] text-gray-500">
            Remembered your password?{' '}
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
            Recover Access to ScholarHub
          </p>
        </div>
      </div>
    </div>
  );
}
