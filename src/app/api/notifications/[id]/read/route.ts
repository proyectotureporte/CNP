import { NextRequest, NextResponse } from 'next/server';
import { notification } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await notification.markNotificationRead(id);

    triggerEvent('notification:read', { id });

    return NextResponse.json({ success: true, data: { _id: id } });
  } catch {
    return NextResponse.json({ success: false, error: 'Error marcando notificacion' }, { status: 500 });
  }
}
