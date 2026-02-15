'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bell, Check } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ROLE_LABELS } from '@/lib/types';
import type { UserRole } from '@/lib/types';
import { useNotifications } from '@/hooks/useNotifications';

interface AppHeaderProps {
  userName: string;
  userRole: UserRole;
}

export default function AppHeader({ userName, userRole }: AppHeaderProps) {
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const recent = notifications.slice(0, 8);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-white px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {/* Breadcrumb area with logo */}
      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/images/favicon.png"
            alt="CNP"
            width={24}
            height={24}
            className="rounded"
          />
          <span className="text-sm font-semibold" style={{ color: '#1b5697' }}>
            CNP | PERITUS
          </span>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-xs font-medium text-muted-foreground">
            {ROLE_LABELS[userRole] || userRole}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full p-0 text-[10px] flex items-center justify-center bg-[#2969b0]">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h4 className="text-sm font-semibold">Notificaciones</h4>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => markAllRead()}
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Marcar todas
                  </Button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {recent.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Sin notificaciones
                  </p>
                ) : (
                  recent.map((n) => (
                    <div
                      key={n._id}
                      className={`border-b px-4 py-3 text-sm cursor-pointer hover:bg-accent/50 transition-colors ${
                        !n.isRead ? 'bg-[#2969b0]/5' : ''
                      }`}
                      onClick={() => {
                        if (!n.isRead) markAsRead(n._id);
                        if (n.linkUrl) {
                          setOpen(false);
                          window.location.href = n.linkUrl;
                        }
                      }}
                    >
                      <p className={`${!n.isRead ? 'font-medium' : ''}`}>{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(n._createdAt).toLocaleDateString('es-CO', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="border-t p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    asChild
                  >
                    <Link href="/crm/notifications" onClick={() => setOpen(false)}>
                      Ver todas las notificaciones
                    </Link>
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
          <Separator orientation="vertical" className="h-4" />
          <Link href="/crm/profile" className="hidden text-sm font-medium sm:inline-block hover:underline">{userName}</Link>
        </div>
      </div>
    </header>
  );
}
