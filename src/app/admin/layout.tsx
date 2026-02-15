'use client';

import { usePathname } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return <AppLayout variant="admin">{children}</AppLayout>;
}
