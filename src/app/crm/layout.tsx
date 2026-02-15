'use client';

import { usePathname } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/crm/login') {
    return <>{children}</>;
  }

  return <AppLayout variant="crm">{children}</AppLayout>;
}
