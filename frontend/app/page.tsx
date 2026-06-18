'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from '@/components/LandingPage';

function DashboardSkeleton() {
  return (
    <div className="bg-background text-on-background min-h-screen flex font-sans animate-pulse w-full">
      {/* Sidebar Skeleton */}
      <div className="hidden md:flex flex-col p-4 border-r border-outline-variant bg-surface-container-lowest w-64 h-screen">
        <div className="h-8 bg-surface-container-high rounded mb-8 w-3/4"></div>
        <div className="h-10 bg-surface-container-high rounded mb-6"></div>
        <div className="space-y-4">
          <div className="h-6 bg-surface-container-low rounded w-1/2 animate-pulse"></div>
          <div className="h-6 bg-surface-container-low rounded w-2/3 animate-pulse"></div>
          <div className="h-6 bg-surface-container-low rounded w-1/3 animate-pulse"></div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="flex-grow flex flex-col h-screen">
        {/* Header Skeleton */}
        <div className="h-16 bg-surface-container-lowest border-b border-outline-variant px-6 flex items-center justify-between">
          <div className="h-8 bg-surface-container-high rounded w-96 animate-pulse"></div>
          <div className="h-8 bg-surface-container-high rounded-full w-8 animate-pulse"></div>
        </div>
        
        {/* Body Skeleton */}
        <div className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto">
          <div className="h-12 bg-surface-container-high rounded w-1/2 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-surface-container-low rounded-xl col-span-2 animate-pulse"></div>
            <div className="h-32 bg-surface-container-low rounded-xl animate-pulse"></div>
          </div>
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-surface-container-high rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-40 bg-surface-container-lowest border border-outline-variant rounded-xl"></div>
              <div className="h-40 bg-surface-container-lowest border border-outline-variant rounded-xl"></div>
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
    const token = localStorage.getItem('token');
    if (token) {
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