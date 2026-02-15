import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity/client';
import { listUserNotificationsQuery, countUnreadNotificationsQuery } from '@/lib/sanity/queries';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId || userId === 'admin') {
      return NextResponse.json({ success: true, data: [], unreadCount: 0 });
    }
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const start = (page - 1) * limit;
    const end = start + limit;

    const [notifications, unreadCount] = await Promise.all([
      client.fetch(listUserNotificationsQuery, { userId, unreadOnly, start, end }),
      client.fetch(countUnreadNotificationsQuery, { userId }),
    ]);

    return NextResponse.json({ success: true, data: notifications, unreadCount });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo notificaciones' }, { status: 500 });
  }
}
