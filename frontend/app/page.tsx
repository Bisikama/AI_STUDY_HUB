'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from '@/components/LandingPage';

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

  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="material-symbols-outlined animate-spin text-3xl text-secondary">
          sync
        </span>
      </div>
    );
  }

  return <LandingPage />;
}