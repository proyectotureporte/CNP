import { NextRequest, NextResponse } from 'next/server';
import { crmUser } from '@/lib/db';
import { actorFromRequest } from '@/lib/auth/caseAccess';

export async function GET(request: NextRequest) {
  try {
    const actor = actorFromRequest(request);
    if (!actor || !['admin', 'juridico', 'administrativo'].includes(actor.role)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }
    const users = await crmUser.listActiveUsersBasic();
    return NextResponse.json({
      success: true,
      data: users.filter((user) => user.role !== 'cliente'),
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo usuarios' }, { status: 500 });
  }
}
