'use client';

import { useEffect } from 'react';
import { Inter } from 'next/font/google';
import styles from './inter-app-scope.module.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-app-inter',
});

/** Mantiene Inter en toda la aplicación operativa y también en portales Radix. */
export default function InterAppScope({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.classList.add('app-font-inter', inter.className, inter.variable);

    return () => {
      document.body.classList.remove('app-font-inter', inter.className, inter.variable);
    };
  }, []);

  return (
    <div className={`${inter.className} ${inter.variable} ${styles.root}`}>
      {children}
    </div>
  );
}
