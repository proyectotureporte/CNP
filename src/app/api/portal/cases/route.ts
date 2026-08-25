import { NextRequest, NextResponse } from 'next/server';
import { cases } from '@/lib/db';
import { actorFromRequest, sanitizeCaseForRole } from '@/lib/auth/caseAccess';
import { getClientIdForUser } from '@/lib/auth/clientAccess';

export async function GET(request: NextRequest) {
  try {
    const actor = actorFromRequest(request);
    if (!actor || actor.role !== 'cliente') {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }

    const clientId = await getClientIdForUser(actor.userId);
    if (!clientId) return NextResponse.json({ success: true, data: [] });

    const data = (await cases.listCasesForClient(clientId))
      .map((item) => sanitizeCaseForRole(item, 'cliente'));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[portal/cases] GET error:', error);
    return NextResponse.json({ success: false, error: 'Error obteniendo los casos del cliente' }, { status: 500 });
  }
}
