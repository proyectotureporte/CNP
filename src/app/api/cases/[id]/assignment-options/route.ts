import { NextRequest, NextResponse } from 'next/server';
import { cases, crmUser, expert } from '@/lib/db';
import { requireCaseAccess } from '@/lib/auth/caseAccess';
import { guardRole } from '@/lib/auth/guard';
import { canAssignExpert } from '@/lib/auth/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const stop = guardRole(request, canAssignExpert);
    if (stop) return stop;

    const { id } = await params;
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;

    const caseData = await cases.getCaseById(id);
    if (!caseData) {
      return NextResponse.json({ success: false, error: 'Caso no encontrado' }, { status: 404 });
    }

    const [users, externalExperts] = await Promise.all([
      crmUser.listActiveUsersBasic(),
      expert.listAvailableExpertsForDiscipline(caseData.discipline),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        internal: (['financiero', 'contable'].includes(caseData.discipline) ? users : [])
          .filter((user) => user.role === 'perito_interno')
          .map((user) => ({ userId: user._id, displayName: user.displayName })),
        external: externalExperts
          .filter((item) => Boolean(item.user?._id))
          .map((item) => ({
            userId: item.user!._id,
            displayName: item.user!.displayName,
            specialization: item.specialization || '',
            city: item.city || '',
            rating: item.rating || 0,
          })),
      },
    });
  } catch (error) {
    console.error('[assignment-options] GET error:', error);
    return NextResponse.json({ success: false, error: 'Error obteniendo peritos disponibles' }, { status: 500 });
  }
}
