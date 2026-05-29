import { NextRequest, NextResponse } from 'next/server';
import { notification } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId || userId === 'admin') {
      return NextResponse.json({ success: true });
    }

    await notification.markAllNotificationsRead(userId);

    triggerEvent('notification:read', { all: true });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Error marcando notificaciones' }, { status: 500 });
  }
}
