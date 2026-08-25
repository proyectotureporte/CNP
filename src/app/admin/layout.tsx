'use client';

import { usePathname } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import InterAppScope from '@/components/layout/InterAppScope';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const content = pathname === '/admin/login'
    ? children
    : <AppLayout variant="admin">{children}</AppLayout>;

  return <InterAppScope>{content}</InterAppScope>;
}
