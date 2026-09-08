'use client';
import { BusinessProvider } from '@/context/BusinessContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return <BusinessProvider>{children}</BusinessProvider>;
}
