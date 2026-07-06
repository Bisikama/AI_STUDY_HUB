'use client';

import { HeroUIProvider } from '@heroui/system';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      {children}
      <Toaster richColors closeButton position="top-right" />
    </HeroUIProvider>
  );
}
