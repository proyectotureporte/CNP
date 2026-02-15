'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, ChevronRight } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { hasPermission } from '@/lib/auth/permissions';
import { ROLE_LABELS } from '@/lib/types';
import type { UserRole } from '@/lib/types';
import { navItems, adminNavItems } from './nav-items';

interface AppSidebarProps {
  userRole: UserRole;
  userName: string;
  variant?: 'crm' | 'admin';
}

export default function AppSidebar({ userRole, userName, variant = 'crm' }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const items = variant === 'admin' ? adminNavItems : navItems;
  const filteredItems = items.filter((item) => hasPermission(userRole, item.permission));

  const userInitial = userName?.charAt(0)?.toUpperCase() || 'U';

  async function handleLogout() {
    const type = variant === 'admin' ? 'admin' : 'crm';
    await fetch(`/api/auth/logout?type=${type}`, { method: 'POST' });
    router.push(variant === 'admin' ? '/admin/login' : '/crm/login');
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
        <Link href={variant === 'admin' ? '/admin' : '/crm'} className="flex items-center gap-3">
          <Image
            src="/images/favicon.png"
            alt="CNP"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
              CNP | PERITUS
            </span>
            <span className="text-[11px] text-sidebar-foreground/60">
              {variant === 'admin' ? 'Panel Administrativo' : 'Sistema de Gestion'}
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-wider font-semibold">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/crm' && item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                        {isActive && <ChevronRight className="ml-auto h-3 w-3 opacity-60" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {variant === 'crm' && userRole === 'admin' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-wider font-semibold">
              Administracion
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                          {isActive && <ChevronRight className="ml-auto h-3 w-3 opacity-60" />}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <Link href="/crm/profile" className="flex items-center gap-3 rounded-md p-1 -m-1 transition-colors hover:bg-sidebar-accent">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-xs font-bold">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-sidebar-foreground">{userName}</span>
            <Badge variant="secondary" className="w-fit text-[10px] px-1.5 py-0 bg-sidebar-accent text-sidebar-accent-foreground border-0">
              {ROLE_LABELS[userRole] || userRole}
            </Badge>
          </div>
        </Link>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Cerrar Sesion" className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
