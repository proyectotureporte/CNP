import { NextRequest, NextResponse } from 'next/server';
import { caseDocument } from '@/lib/db';
import { requireCaseAccess } from '@/lib/auth/caseAccess';
import type { CaseDocument } from '@/lib/types';

/** Historial de versiones anteriores de un documento (conservadas al devolver y reemplazar). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const caseId = await caseDocument.getCaseDocumentCaseId(id);
    if (!caseId) return NextResponse.json({ success: false, error: 'Documento no encontrado' }, { status: 404 });
    const access = await requireCaseAccess(request, caseId);
    if (access.response) return access.response;

    const current = await caseDocument.getCaseDocumentById(id);
    if (!current) return NextResponse.json({ success: false, error: 'Documento no encontrado' }, { status: 404 });
    const isClient = access.actor.role === 'cliente';
    const isExpert = access.actor.role === 'perito' || access.actor.role === 'perito_interno';
    if (isClient && (!current.isVisibleToClient || current.category === 'dictamen')) {
      return NextResponse.json({ success: false, error: 'Documento no encontrado' }, { status: 404 });
    }
    if (isExpert && current.category === 'comprobantes_pago') {
      return NextResponse.json({ success: false, error: 'Documento no encontrado' }, { status: 404 });
    }

    const versions = (await caseDocument.listPreviousVersions(id)).map((item) => {
      const safe: CaseDocument = { ...item };
      delete safe.fileUrl;
      if (item.fileName) {
        safe.downloadUrl = `/api/documents/${item._id}/download`;
        safe.viewUrl = `/api/documents/${item._id}/download?inline=1`;
      }
      if (isClient || isExpert) {
        delete safe.uploadedBy;
        delete safe.uploadedByName;
      }
      return safe;
    });
    return NextResponse.json({ success: true, data: versions });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo versiones' }, { status: 500 });
  }
}
