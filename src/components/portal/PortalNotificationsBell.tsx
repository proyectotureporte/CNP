'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications } from '@/hooks/useNotifications';

/** Centro de notificaciones del portal del cliente (mismas notificaciones in-app del CRM). */
export default function PortalNotificationsBell() {
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const recent = notifications.slice(0, 10);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8" aria-label="Notificaciones">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2969b0] p-0 text-[10px]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="text-sm font-semibold">Notificaciones</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground" onClick={() => markAllRead()}>
              <Check className="mr-1 h-3 w-3" /> Marcar todas
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Sin notificaciones</p>
          ) : (
            recent.map((n) => (
              <button
                key={n._id}
                type="button"
                className={`block w-full border-b px-4 py-3 text-left text-sm transition-colors hover:bg-accent/50 ${!n.isRead ? 'bg-[#2969b0]/5' : ''}`}
                onClick={() => {
                  if (!n.isRead) markAsRead(n._id);
                  setOpen(false);
                  if (n.linkUrl) router.push(n.linkUrl);
                }}
              >
                <p className={!n.isRead ? 'font-medium' : ''}>{n.title}</p>
                {n.message && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(n._createdAt).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
