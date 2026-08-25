'use client';

import type { FocusEvent } from 'react';
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
  useSidebar,
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
  allRoles?: boolean;
  variant?: 'crm' | 'admin';
}

export default function AppSidebar({ userRole, userName, allRoles = false, variant = 'crm' }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpen, setOpenMobile } = useSidebar();
  const isHoverSidebar = variant === 'crm';

  const items = variant === 'admin' ? adminNavItems : navItems;
  const filteredItems = items.filter((item) => hasPermission(userRole, item.permission, allRoles));

  const userInitial = userName?.charAt(0)?.toUpperCase() || 'U';

  async function handleLogout() {
    const type = variant === 'admin' ? 'admin' : 'crm';
    await fetch(`/api/auth/logout?type=${type}`, { method: 'POST' });
    router.push(variant === 'admin' ? '/admin/login' : userRole === 'perito' ? '/perito/login' : '/crm/login');
  }

  function closeMobileMenu() {
    if (isMobile) setOpenMobile(false);
  }

  function handleMouseEnter() {
    if (isHoverSidebar && !isMobile) setOpen(true);
  }

  function handleMouseLeave() {
    if (isHoverSidebar && !isMobile) setOpen(false);
  }

  function handleFocus() {
    if (isHoverSidebar && !isMobile) setOpen(true);
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (isHoverSidebar && !isMobile && !event.currentTarget.contains(event.relatedTarget)) {
      setOpen(false);
    }
  }

  return (
    <Sidebar
      collapsible={isHoverSidebar ? 'icon' : 'offcanvas'}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocusCapture={handleFocus}
      onBlurCapture={handleBlur}
      className={isHoverSidebar ? 'transition-[left,right,width] duration-300 ease-out motion-reduce:transition-none' : undefined}
    >
      <SidebarHeader className={isHoverSidebar
        ? 'h-20 justify-center overflow-hidden border-b border-sidebar-border px-3 py-4 group-data-[collapsible=icon]:px-3'
        : 'border-b border-sidebar-border px-4 py-5'}>
        <Link
          href={variant === 'admin' ? '/admin' : '/crm'}
          onClick={closeMobileMenu}
          aria-label="Ir al dashboard"
          className={isHoverSidebar
            ? 'flex min-w-0 items-center gap-3 rounded-lg outline-none ring-sidebar-ring focus-visible:ring-2'
            : 'flex items-center gap-3'}
        >
          <Image
            src="/images/favicon.png"
            alt="CNP"
            width={36}
            height={36}
            className={isHoverSidebar ? 'size-9 shrink-0 rounded-lg object-contain' : 'rounded-lg'}
          />
          <div className={isHoverSidebar
            ? 'flex min-w-0 flex-col whitespace-nowrap transition-[opacity,transform] duration-200 ease-out group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:translate-x-2 group-data-[collapsible=icon]:opacity-0 motion-reduce:transition-none'
            : 'flex flex-col'}>
            <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
              CNP | PERITUS
            </span>
            <span className="text-[11px] text-sidebar-foreground/60">
              {variant === 'admin' ? 'Panel Administrativo' : 'Sistema de Gestion'}
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className={isHoverSidebar
        ? 'py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
        : undefined}>
        <SidebarGroup className={isHoverSidebar ? 'px-3 py-2 group-data-[collapsible=icon]:px-3' : undefined}>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-wider font-semibold">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className={isHoverSidebar ? 'gap-1.5' : undefined}>
              {filteredItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/crm' && item.href !== '/admin' && pathname.startsWith(item.href));
                const label = userRole === 'perito' && item.href === '/crm/cases'
                  ? 'Mis casos'
                  : userRole === 'perito' && item.href === '/crm/commissions'
                    ? 'Mis pagos'
                    : item.label;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={label}
                      className={isHoverSidebar
                        ? 'h-10 gap-3 rounded-lg px-2.5 text-sidebar-foreground/80 transition-[background-color,color,width,padding] duration-200 hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-2.5! motion-reduce:transition-none'
                        : undefined}
                    >
                      <Link href={item.href} onClick={closeMobileMenu}>
                        <item.icon className={isHoverSidebar ? 'size-5!' : 'h-4 w-4'} />
                        <span className={isHoverSidebar
                          ? 'whitespace-nowrap transition-[opacity,transform] duration-200 ease-out group-data-[collapsible=icon]:translate-x-2 group-data-[collapsible=icon]:opacity-0 motion-reduce:transition-none'
                          : undefined}>{label}</span>
                        {isActive && <ChevronRight className={isHoverSidebar
                          ? 'ml-auto size-3.5! opacity-60 group-data-[collapsible=icon]:hidden'
                          : 'ml-auto h-3 w-3 opacity-60'} />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {variant === 'crm' && userRole === 'admin' && (
          <SidebarGroup className="px-3 py-2 group-data-[collapsible=icon]:px-3">
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-wider font-semibold">
              Administracion
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {adminNavItems.filter((item) => hasPermission(userRole, item.permission, allRoles)).map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                        className="h-10 gap-3 rounded-lg px-2.5 text-sidebar-foreground/80 transition-[background-color,color,width,padding] duration-200 hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-2.5! motion-reduce:transition-none"
                      >
                        <Link href={item.href} onClick={closeMobileMenu}>
                          <item.icon className="size-5!" />
                          <span className="whitespace-nowrap transition-[opacity,transform] duration-200 ease-out group-data-[collapsible=icon]:translate-x-2 group-data-[collapsible=icon]:opacity-0 motion-reduce:transition-none">{item.label}</span>
                          {isActive && <ChevronRight className="ml-auto size-3.5! opacity-60 group-data-[collapsible=icon]:hidden" />}
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

      <SidebarFooter className={isHoverSidebar
        ? 'overflow-hidden border-t border-sidebar-border p-3 group-data-[collapsible=icon]:p-3'
        : 'border-t border-sidebar-border p-4'}>
        <Link
          href="/crm/profile"
          onClick={closeMobileMenu}
          className={isHoverSidebar
            ? 'flex h-11 min-w-0 items-center gap-3 rounded-lg px-0.5 outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:hover:bg-transparent'
            : 'flex items-center gap-3 rounded-md p-1 -m-1 transition-colors hover:bg-sidebar-accent'}
        >
          <Avatar className={isHoverSidebar ? 'size-9 shrink-0' : 'h-9 w-9'}>
            <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-xs font-bold">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <div className={isHoverSidebar
            ? 'flex min-w-0 flex-1 flex-col whitespace-nowrap transition-[opacity,transform] duration-200 ease-out group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:translate-x-2 group-data-[collapsible=icon]:opacity-0 motion-reduce:transition-none'
            : 'flex min-w-0 flex-1 flex-col'}>
            <span className="truncate text-sm font-medium text-sidebar-foreground">{userName}</span>
            <Badge variant="secondary" className="w-fit text-[10px] px-1.5 py-0 bg-sidebar-accent text-sidebar-accent-foreground border-0">
              {allRoles ? 'Acceso total' : ROLE_LABELS[userRole] || userRole}
            </Badge>
          </div>
        </Link>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Cerrar Sesion"
              className={isHoverSidebar
                ? 'h-10 gap-3 rounded-lg px-2.5 text-sidebar-foreground/70 hover:text-sidebar-foreground group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-2.5!'
                : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'}
            >
              <LogOut className={isHoverSidebar ? 'size-5!' : 'h-4 w-4'} />
              <span className={isHoverSidebar
                ? 'whitespace-nowrap transition-[opacity,transform] duration-200 ease-out group-data-[collapsible=icon]:translate-x-2 group-data-[collapsible=icon]:opacity-0 motion-reduce:transition-none'
                : undefined}>Cerrar Sesion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
