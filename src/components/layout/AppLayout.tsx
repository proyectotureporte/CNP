'use client';

import Image from 'next/image';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/lib/types';

interface AppLayoutProps {
  children: React.ReactNode;
  variant?: 'crm' | 'admin';
}

function LoadingSkeleton() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/images/favicon.png"
          alt="CNP"
          width={48}
          height={48}
          className="rounded-xl animate-pulse"
        />
        <div className="flex flex-col items-center gap-2">
          <div className="h-1.5 w-32 rounded-full bg-gray-200 overflow-hidden">
            <div className="h-full w-1/2 rounded-full animate-[loading_1.5s_ease-in-out_infinite]" style={{ background: 'linear-gradient(90deg, #2969b0, #1b5697)' }} />
          </div>
          <span className="text-sm text-muted-foreground">Cargando...</span>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout({ children, variant = 'crm' }: AppLayoutProps) {
  const { user, loading } = useAuth(variant);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar
        userRole={user.role as UserRole}
        userName={user.displayName}
        variant={variant}
      />
      <SidebarInset>
        <AppHeader userName={user.displayName} userRole={user.role as UserRole} />
        <main className="flex-1 overflow-auto p-6 bg-gray-50/50">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
