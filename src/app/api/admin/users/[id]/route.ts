import { NextRequest, NextResponse } from 'next/server';
import { crmUser } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await crmUser.updateUser(id, { active: false });

    triggerEvent('user:updated', { id });

    return NextResponse.json({ success: true, data: { message: 'Usuario desactivado' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Error desactivando usuario' }, { status: 500 });
  }
}
