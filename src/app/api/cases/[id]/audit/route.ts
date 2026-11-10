import { NextRequest, NextResponse } from 'next/server';
import { auditLog } from '@/lib/db';
import { requireCaseAccess } from '@/lib/auth/caseAccess';

const AUDIT_ROLES = ['admin', 'comercial_juridico', 'junta'];

/**
 * Trazabilidad del expediente: usuario + fecha/hora + acción (documentos
 * cargados/aprobados/devueltos/eliminados, cambios de estado, actuaciones,
 * actualizaciones del caso). Solo personal interno.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;
    if (!access.actor.allRoles && !AUDIT_ROLES.includes(access.actor.role)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }
    const data = await auditLog.listAuditLogsByCase(id);
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo la trazabilidad' }, { status: 500 });
  }
}
