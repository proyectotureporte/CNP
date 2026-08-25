'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import InterAppScope from '@/components/layout/InterAppScope';
import styles from './layout.module.css';

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    document.body.classList.add('crm-button-style');

    return () => {
      document.body.classList.remove('crm-button-style');
    };
  }, []);

  const content = pathname === '/crm/login' || pathname === '/crm/mensajes'
    ? children
    : <AppLayout variant="crm">{children}</AppLayout>;

  return (
    <InterAppScope>
      <div className={styles.root}>{content}</div>
    </InterAppScope>
  );
}
