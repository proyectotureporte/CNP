import { NextRequest, NextResponse } from 'next/server';
import { notification } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    await notification.markNotificationRead(id, userId && userId !== 'admin' ? userId : null);

    triggerEvent('notification:read', { id });

    return NextResponse.json({ success: true, data: { _id: id } });
  } catch {
    return NextResponse.json({ success: false, error: 'Error marcando notificacion' }, { status: 500 });
  }
}
