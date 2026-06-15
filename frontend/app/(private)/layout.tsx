'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Layout guard cho tất cả các trang trong (private).
 * Kiểm tra token trong localStorage, nếu không có → redirect về /login.
 * 
 * Khi tích hợp Backend thật:
 * - Thay localStorage.getItem("token") bằng call API verify token
 * - Hoặc dùng NextAuth / middleware.ts để xử lý ở server-side
 */
export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // null = đang kiểm tra, true = đã xác thực, false = chưa xác thực
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthStatus('unauthenticated');
      router.replace('/login');
    } else {
      setAuthStatus('authenticated');
    }
  }, [router]);

  // Hiển thị spinner trong khi đang kiểm tra auth
  if (authStatus === 'checking' || authStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="material-symbols-outlined animate-spin text-3xl text-secondary">sync</span>
      </div>
    );
  }

  return <>{children}</>;
}
