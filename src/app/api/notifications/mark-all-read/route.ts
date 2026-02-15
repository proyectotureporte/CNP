import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId || userId === 'admin') {
      return NextResponse.json({ success: true });
    }

    const unread = await client.fetch<{ _id: string }[]>(
      `*[_type == "notification" && user._ref == $userId && isRead == false] { _id }`,
      { userId }
    );

    const now = new Date().toISOString();
    const transaction = writeClient.transaction();
    for (const n of unread) {
      transaction.patch(n._id, (p) => p.set({ isRead: true, readAt: now }));
    }
    await transaction.commit();

    return NextResponse.json({ success: true, data: { marked: unread.length } });
  } catch {
    return NextResponse.json({ success: false, error: 'Error marcando notificaciones' }, { status: 500 });
  }
}
