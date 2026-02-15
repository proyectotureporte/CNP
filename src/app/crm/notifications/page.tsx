'use client';

import { Info, AlertTriangle, CheckCircle, XCircle, Bell, CheckCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotifications } from '@/hooks/useNotifications';
import type { NotificationType, AppNotification } from '@/lib/types';

const TYPE_ICONS: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
};

const TYPE_STYLES: Record<NotificationType, { icon: string; badge: string; badgeBg: string }> = {
  info: {
    icon: 'text-blue-500',
    badge: 'text-blue-700',
    badgeBg: 'bg-blue-50',
  },
  warning: {
    icon: 'text-amber-500',
    badge: 'text-amber-700',
    badgeBg: 'bg-amber-50',
  },
  success: {
    icon: 'text-green-500',
    badge: 'text-green-700',
    badgeBg: 'bg-green-50',
  },
  error: {
    icon: 'text-red-500',
    badge: 'text-red-700',
    badgeBg: 'bg-red-50',
  },
};

const TYPE_LABELS: Record<NotificationType, string> = {
  info: 'Info',
  warning: 'Advertencia',
  success: 'Exito',
  error: 'Error',
};

function NotificationsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i}>
          <CardContent className="flex items-start gap-4 p-4">
            <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-full max-w-md" />
              <Skeleton className="h-3 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
}) {
  const style = TYPE_STYLES[notification.type];
  const Icon = TYPE_ICONS[notification.type];
  const dateStr = new Date(notification._createdAt).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card
      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
        !notification.isRead ? 'border-l-4 border-l-blue-500' : ''
      }`}
      onClick={() => {
        if (!notification.isRead) {
          onMarkRead(notification._id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${notification.isRead ? 'Leida' : 'No leida'}: ${notification.title}`}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !notification.isRead) {
          e.preventDefault();
          onMarkRead(notification._id);
        }
      }}
    >
      <CardContent className="flex items-start gap-4 p-4">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.icon}`} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${!notification.isRead ? 'font-semibold' : 'text-muted-foreground'}`}>
              {notification.title}
            </span>
            <Badge
              variant="outline"
              className={`${style.badgeBg} ${style.badge} border-0 text-[10px]`}
            >
              {TYPE_LABELS[notification.type]}
            </Badge>
            {!notification.isRead && (
              <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-blue-500" aria-label="No leida" />
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground/70">{dateStr}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, markAsRead, markAllRead } = useNotifications();

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2969b0]/10">
            <Bell className="h-5 w-5" style={{ color: '#2969b0' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1b5697' }}>Notificaciones</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} notificacion${unreadCount === 1 ? '' : 'es'} sin leer`
                : 'Todas las notificaciones leidas'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Marcar todas como leidas
          </Button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <NotificationsSkeleton />
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Bell className="mb-3 h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">No hay notificaciones</p>
        </div>
      ) : (
        <div className="space-y-3" role="list" aria-label="Lista de notificaciones">
          {notifications.map((notification) => (
            <div key={notification._id} role="listitem">
              <NotificationItem notification={notification} onMarkRead={markAsRead} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
