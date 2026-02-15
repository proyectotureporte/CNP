import { NextRequest, NextResponse } from 'next/server';
import { writeClient } from '@/lib/sanity/client';

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updated = await writeClient.patch(id).set({ isRead: true, readAt: new Date().toISOString() }).commit();
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error marcando notificacion' }, { status: 500 });
  }
}
