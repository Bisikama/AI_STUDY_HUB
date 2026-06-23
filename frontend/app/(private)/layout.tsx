'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/services/authApi';

/**
 * Layout guard cho tất cả các trang trong (private).
 * Gọi API verify profile để kiểm tra phiên đăng nhập Cookie.
 */
export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // null = đang kiểm tra, true = đã xác thực, false = chưa xác thực
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>(
    'checking',
  );

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        await authApi.getProfile();
        setAuthStatus('authenticated');
      } catch (err) {
        setAuthStatus('unauthenticated');
        localStorage.removeItem('user');
        router.replace('/login');
      }
    };
    verifyAuth();
  }, [router]);

  // Hiển thị spinner trong khi đang kiểm tra auth
  if (authStatus === 'checking' || authStatus === 'unauthenticated') {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <span className="material-symbols-outlined text-secondary animate-spin text-3xl">sync</span>
      </div>
    );
  }

  return <>{children}</>;
}
