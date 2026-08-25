'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Briefcase, LogOut, UserCircle } from 'lucide-react';
import InterAppScope from '@/components/layout/InterAppScope';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const content = pathname === '/portal/login' || pathname === '/portal/change-password'
    ? children
    : <PortalAuthLayout pathname={pathname}>{children}</PortalAuthLayout>;

  return <InterAppScope>{content}</InterAppScope>;
}

function PortalAuthLayout({ children, pathname }: { children: React.ReactNode; pathname: string }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const authorized = !loading && user?.role === 'cliente' && !user.mustChangePassword;

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'cliente') {
      router.replace('/portal/login');
    } else if (user.mustChangePassword) {
      router.replace('/portal/change-password');
    }
  }, [user, loading, router]);

  if (!authorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Image src="/images/favicon.png" alt="CNP" width={48} height={48} className="rounded-xl animate-pulse" />
          <span className="text-sm text-muted-foreground">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-border/60 bg-white shadow-sm">
        <div className="mx-auto flex min-h-14 max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-2">
          <div className="flex items-center gap-3">
            <Image src="/images/favicon.png" alt="CNP" width={28} height={28} className="rounded" />
            <h1 className="text-lg font-bold tracking-tight" style={{ color: '#1b5697' }}>
              CNP | Portal Cliente
            </h1>
          </div>
          <nav className="order-3 flex w-full items-center gap-1 border-t pt-2 sm:order-none sm:w-auto sm:border-0 sm:pt-0" aria-label="Portal cliente">
            <ButtonLink href="/portal/cases" active={pathname.startsWith('/portal/cases')}><Briefcase className="h-4 w-4" />Mis casos</ButtonLink>
            <ButtonLink href="/portal/profile" active={pathname === '/portal/profile'}><UserCircle className="h-4 w-4" />Mi perfil</ButtonLink>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.displayName}</span>
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                router.replace('/portal/login');
              }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4 md:p-6">{children}</main>
    </div>
  );
}

function ButtonLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return <Link href={href} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${active ? 'bg-blue-50 font-medium text-[#1b5697]' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{children}</Link>;
}
