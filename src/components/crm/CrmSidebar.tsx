'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface CrmSidebarProps {
  active: string;
  userName: string;
}

interface NavItem {
  label: string;
  href: string;
  key: string;
  icon: React.ReactNode;
}

/* Grid / Dashboard icon */
function IconGrid({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

/* Users icon */
function IconUsers({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

/* Plus-circle icon */
function IconPlusCircle({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

/* User / Profile icon */
function IconUser({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

/* Logout / arrow-right-from-bracket icon */
function IconLogout({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/crm', key: 'dashboard', icon: <IconGrid /> },
  { label: 'Clientes', href: '/crm/clients', key: 'clients', icon: <IconUsers /> },
  { label: 'Nuevo Cliente', href: '/crm/clients/new', key: 'new-client', icon: <IconPlusCircle /> },
  { label: 'Mi Perfil', href: '/crm/profile', key: 'profile', icon: <IconUser /> },
];

export default function CrmSidebar({ active, userName }: CrmSidebarProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const userInitial = userName?.charAt(0)?.toUpperCase() || 'U';

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout?type=crm', { method: 'POST' });
      router.push('/crm/login');
    } catch {
      setLoggingOut(false);
    }
  }

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col bg-gray-900">
      {/* Logo Section */}
      <div className="border-b border-gray-800 px-6 py-5">
        <div className="flex items-baseline gap-2">
          <span className="bg-clip-text text-2xl font-bold tracking-tight text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #2969b0, #1b5697)' }}>
            CNP
          </span>
          <span className="text-sm font-medium text-gray-400">CRM</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navegacion principal">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = active === item.key;
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'border-l-[3px] border-[#2969b0] bg-white/10 pl-[9px] text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span
                    className={`transition-colors duration-200 ${
                      isActive ? 'text-sky-400' : 'text-gray-500 group-hover:text-gray-300'
                    }`}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-800 px-3 py-4">
        <div className="mb-3 flex items-center gap-3 px-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #2969b0, #1b5697)' }}>
            {userInitial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{userName}</p>
            <p className="text-xs text-gray-500">Usuario CRM</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-60"
        >
          <IconLogout className="text-gray-500" />
          {loggingOut ? 'Cerrando...' : 'Cerrar Sesion'}
        </button>
      </div>
    </aside>
  );
}
