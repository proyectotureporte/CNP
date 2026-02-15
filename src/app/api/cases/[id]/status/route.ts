import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getCaseByIdQuery } from '@/lib/sanity/queries';
import { CASE_STATUSES, type CaseStatus, type CaseExpanded } from '@/lib/types';

const VALID_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  creado: ['en_cotizacion', 'rechazado', 'archivado'],
  en_cotizacion: ['pendiente_aprobacion', 'rechazado', 'archivado'],
  pendiente_aprobacion: ['aprobado', 'rechazado', 'en_cotizacion'],
  aprobado: ['en_asignacion', 'archivado'],
  en_asignacion: ['en_produccion', 'archivado'],
  en_produccion: ['en_revision', 'archivado'],
  en_revision: ['finalizado', 'en_produccion', 'archivado'],
  finalizado: ['archivado'],
  archivado: [],
  rechazado: ['creado'],
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body as { status: string };

    if (!status || !CASE_STATUSES.includes(status as CaseStatus)) {
      return NextResponse.json(
        { success: false, error: 'Estado no valido' },
        { status: 400 }
      );
    }

    const existing = await client.fetch<CaseExpanded | null>(getCaseByIdQuery, { id });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Caso no encontrado' },
        { status: 404 }
      );
    }

    const validNext = VALID_TRANSITIONS[existing.status];
    if (!validNext.includes(status as CaseStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Transicion no permitida de "${existing.status}" a "${status}"`,
          data: { currentStatus: existing.status, validTransitions: validNext },
        },
        { status: 400 }
      );
    }

    const updated = await writeClient.patch(id).set({ status }).commit();
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error cambiando estado del caso' },
      { status: 500 }
    );
  }
}
