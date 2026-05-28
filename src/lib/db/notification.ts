import { query, queryOne, buildInsert, newId } from './pool';
import type { AppNotification, NotificationType, NotificationPriority } from '@/lib/types';

const SELECT = `
  id AS "_id", created_at AS "_createdAt", type, priority, title, message,
  link_url AS "linkUrl", is_read AS "isRead", read_at AS "readAt"
`;

export async function listUserNotifications(
  userId: string,
  unreadOnly = false,
  limit = 20,
  offset = 0,
): Promise<AppNotification[]> {
  return query<AppNotification>(
    `SELECT ${SELECT} FROM notification
     WHERE user_id = $1 AND ($2 = FALSE OR is_read = FALSE)
     ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
    [userId, unreadOnly, limit, offset],
  );
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  const row = await queryOne<{ count: number }>(
    'SELECT count(*)::int AS count FROM notification WHERE user_id = $1 AND is_read = FALSE',
    [userId],
  );
  return row?.count ?? 0;
}

/** Títulos de notificaciones que empiezan por `prefix` creadas desde `since` (anti-duplicado de alertas). */
export async function listRecentAlertTitles(prefix: string, since: string): Promise<string[]> {
  const rows = await query<{ title: string }>(
    'SELECT title FROM notification WHERE title LIKE $1 || $2 AND created_at >= $3',
    [prefix, '%', since],
  );
  return rows.map((r) => r.title);
}

export interface NotificationInput {
  userId: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message?: string | null;
  linkUrl?: string | null;
}

export async function createNotification(input: NotificationInput): Promise<string> {
  const id = newId();
  const { text, values } = buildInsert('notification', {
    id,
    user_id: input.userId,
    type: input.type ?? 'info',
    priority: input.priority ?? 'normal',
    title: input.title,
    message: input.message ?? null,
    link_url: input.linkUrl ?? null,
  });
  await query(text, values);
  return id;
}

export async function markNotificationRead(id: string): Promise<void> {
  await query('UPDATE notification SET is_read = TRUE, read_at = now() WHERE id = $1', [id]);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await query(
    'UPDATE notification SET is_read = TRUE, read_at = now() WHERE user_id = $1 AND is_read = FALSE',
    [userId],
  );
}
