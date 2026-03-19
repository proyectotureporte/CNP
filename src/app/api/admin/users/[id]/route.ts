import { NextRequest, NextResponse } from 'next/server';
import { writeClient } from '@/lib/sanity/client';
import { triggerEvent } from '@/lib/pusher/server';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await writeClient.patch(id).set({ active: false }).commit();

    triggerEvent('user:updated', { id });

    return NextResponse.json({
      success: true,
      data: { message: 'Usuario desactivado' },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error desactivando usuario' },
      { status: 500 }
    );
  }
}
