'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/pages/admin/AdminSidebar';

/**
 * Layout dùng chung cho toàn bộ các trang trong khu vực /admin.
 *
 * Guard logic:
 *   1. Kiểm tra token (đã đăng nhập chưa?) → không có → /login
 *   2. Kiểm tra role === 'ADMIN'            → không phải → / (trang chủ)
 *   3. Pass → render AdminSidebar + nội dung trang
 *
 * Thứ tự layout lồng nhau:
 *   RootLayout
 *     → PrivateLayout   (check token)
 *       → AdminLayout   (check role ADMIN) ← file này
 *           → page.tsx
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'authorized' | 'unauthorized'>('checking');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');

    // 1. Chưa đăng nhập → về trang login
    if (!token || !userRaw) {
      router.replace('/login');
      return;
    }

    try {
      const user = JSON.parse(userRaw) as { role: string };

      // 2. Đã đăng nhập nhưng không phải ADMIN → về trang chủ
      if (user.role !== 'ADMIN') {
        router.replace('/');
        return;
      }

      // 3. ADMIN → cho vào
      setStatus('authorized');
    } catch {
      // JSON.parse lỗi → xóa data hỏng và đá về login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.replace('/login');
    }
  }, [router]);

  // Hiển thị spinner trong khi đang kiểm tra
  if (status !== 'authorized') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <svg
          className="h-6 w-6 animate-spin text-blue-600"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar cố định bên trái — chỉ xuất hiện với ADMIN */}
      <AdminSidebar />

      {/* Vùng nội dung chính — cuộn độc lập với sidebar */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
