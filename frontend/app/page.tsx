'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from '@/components/LandingPage';

function DashboardSkeleton() {
  return (
    <div className="bg-background text-on-background flex min-h-screen w-full animate-pulse font-sans">
      {/* Sidebar Skeleton */}
      <div className="border-outline-variant bg-surface-container-lowest hidden h-screen w-64 flex-col border-r p-4 md:flex">
        <div className="bg-surface-container-high mb-8 h-8 w-3/4 rounded"></div>
        <div className="bg-surface-container-high mb-6 h-10 rounded"></div>
        <div className="space-y-4">
          <div className="bg-surface-container-low h-6 w-1/2 animate-pulse rounded"></div>
          <div className="bg-surface-container-low h-6 w-2/3 animate-pulse rounded"></div>
          <div className="bg-surface-container-low h-6 w-1/3 animate-pulse rounded"></div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="flex h-screen flex-grow flex-col">
        {/* Header Skeleton */}
        <div className="bg-surface-container-lowest border-outline-variant flex h-16 items-center justify-between border-b px-6">
          <div className="bg-surface-container-high h-8 w-96 animate-pulse rounded"></div>
          <div className="bg-surface-container-high h-8 w-8 animate-pulse rounded-full"></div>
        </div>

        {/* Body Skeleton */}
        <div className="flex-1 space-y-8 overflow-y-auto p-6 md:p-8">
          <div className="bg-surface-container-high h-12 w-1/2 animate-pulse rounded"></div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="bg-surface-container-low col-span-2 h-32 animate-pulse rounded-xl"></div>
            <div className="bg-surface-container-low h-32 animate-pulse rounded-xl"></div>
          </div>
          <div className="animate-pulse space-y-4">
            <div className="bg-surface-container-high h-8 w-1/4 rounded"></div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="bg-surface-container-lowest border-outline-variant h-40 rounded-xl border"></div>
              <div className="bg-surface-container-lowest border-outline-variant h-40 rounded-xl border"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RootPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setIsLoggedIn(true);
      router.replace('/dashboard');
    } else {
      setIsLoggedIn(false);
    }
  }, [router]);

  if (isLoggedIn === null || isLoggedIn === true) {
    return <DashboardSkeleton />;
  }

  return <LandingPage />;
}
