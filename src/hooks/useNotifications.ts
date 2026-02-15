'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AppNotification } from '@/lib/types';

const POLL_INTERVAL = 30_000;

interface UseNotificationsReturn {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setNotifications(data.data);
      }
    } catch {
      // Network error — keep current state
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(true);

    intervalRef.current = setInterval(() => {
      fetchNotifications(false);
    }, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = useCallback(
    async (id: string) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );

      try {
        const res = await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
        if (!res.ok) {
          // Revert on failure
          await fetchNotifications(false);
        }
      } catch {
        await fetchNotifications(false);
      }
    },
    [fetchNotifications]
  );

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.isRead ? n : { ...n, isRead: true, readAt: now }))
    );

    try {
      const res = await fetch('/api/notifications/mark-all-read', { method: 'PUT' });
      if (!res.ok) {
        await fetchNotifications(false);
      }
    } catch {
      await fetchNotifications(false);
    }
  }, [fetchNotifications]);

  return { notifications, unreadCount, loading, markAsRead, markAllRead };
}
