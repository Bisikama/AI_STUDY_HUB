'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';

// 1. Zod validation schema (English)
const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    console.log('Submitted data:', data);

    try {
      // Gọi API thực tế xuống cổng 3000
      const apiUrl = 'http://localhost:3000/api/auth/register';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Đăng ký thành công! Báo Leader check DB thôi!');
        // TODO: Chuyển hướng sang trang /login
      } else {
        alert(`Lỗi rùi: ${result.message}`);
      }
    } catch (error) {
      console.error('Lỗi khi gọi API:', error);
      alert('Không kết nối được với Server Backend!');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4">
      {/* Container có hiệu ứng trượt và mờ dần */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
      >
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Create an Account
          </h2>
          <p className="mt-2 text-sm font-medium text-gray-500">
            Join AI_STUDY_HUB to boost your learning
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Input Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Full Name</label>
            <input
              {...form.register('name')}
              placeholder="John Doe"
              className={`w-full rounded-xl border bg-gray-50 px-4 py-3.5 text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none focus:border-transparent focus:bg-white focus:ring-2 ${
                form.formState.errors.name
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-200 focus:ring-blue-500'
              }`}
            />
            {form.formState.errors.name && (
              <p className="mt-1 text-sm font-medium text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Input Email */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Email Address</label>
            <input
              {...form.register('email')}
              placeholder="you@example.com"
              className={`w-full rounded-xl border bg-gray-50 px-4 py-3.5 text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none focus:border-transparent focus:bg-white focus:ring-2 ${
                form.formState.errors.email
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-200 focus:ring-blue-500'
              }`}
            />
            {form.formState.errors.email && (
              <p className="mt-1 text-sm font-medium text-red-500">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Input Password */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Password</label>
            <input
              type="password"
              {...form.register('password')}
              placeholder="••••••••"
              className={`w-full rounded-xl border bg-gray-50 px-4 py-3.5 text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none focus:border-transparent focus:bg-white focus:ring-2 ${
                form.formState.errors.password
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-200 focus:ring-blue-500'
              }`}
            />
            {form.formState.errors.password && (
              <p className="mt-1 text-sm font-medium text-red-500">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {/* Submit Button có hiệu ứng */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="mt-6 w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-lg shadow-blue-200/50 transition-colors duration-200 hover:bg-blue-700"
          >
            Register
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
