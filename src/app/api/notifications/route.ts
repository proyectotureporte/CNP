import { NextRequest, NextResponse } from 'next/server';
import { notification } from '@/lib/db';

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
    const offset = (page - 1) * limit;

    const [notifications, unreadCount] = await Promise.all([
      notification.listUserNotifications(userId, unreadOnly, limit, offset),
      notification.countUnreadNotifications(userId),
    ]);

    return NextResponse.json({ success: true, data: notifications, unreadCount });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo notificaciones' }, { status: 500 });
  }
}
