import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getCaseByIdQuery } from '@/lib/sanity/queries';
import {
  CASE_STATUSES, CASE_DISCIPLINES, CASE_COMPLEXITIES, CASE_PRIORITIES,
  type CaseStatus, type CaseExpanded,
} from '@/lib/types';

// Valid state transitions map
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const caseData = await client.fetch<CaseExpanded | null>(getCaseByIdQuery, { id });

    if (!caseData) {
      return NextResponse.json(
        { success: false, error: 'Caso no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: caseData });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error obteniendo caso' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await client.fetch<CaseExpanded | null>(getCaseByIdQuery, { id });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Caso no encontrado' },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {};

    // Simple fields
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.city !== undefined) updates.city = body.city;
    if (body.courtName !== undefined) updates.courtName = body.courtName;
    if (body.caseNumber !== undefined) updates.caseNumber = body.caseNumber;
    if (body.estimatedAmount !== undefined) updates.estimatedAmount = body.estimatedAmount;
    if (body.hearingDate !== undefined) updates.hearingDate = body.hearingDate;
    if (body.deadlineDate !== undefined) updates.deadlineDate = body.deadlineDate;
    if (body.riskScore !== undefined) updates.riskScore = body.riskScore;

    // Enum fields with validation
    if (body.discipline !== undefined) {
      if (!CASE_DISCIPLINES.includes(body.discipline)) {
        return NextResponse.json({ success: false, error: 'Disciplina no valida' }, { status: 400 });
      }
      updates.discipline = body.discipline;
    }

    if (body.complexity !== undefined) {
      if (!CASE_COMPLEXITIES.includes(body.complexity)) {
        return NextResponse.json({ success: false, error: 'Complejidad no valida' }, { status: 400 });
      }
      updates.complexity = body.complexity;
    }

    if (body.priority !== undefined) {
      if (!CASE_PRIORITIES.includes(body.priority)) {
        return NextResponse.json({ success: false, error: 'Prioridad no valida' }, { status: 400 });
      }
      updates.priority = body.priority;
    }

    // Status transition with validation
    if (body.status !== undefined) {
      if (!CASE_STATUSES.includes(body.status)) {
        return NextResponse.json({ success: false, error: 'Estado no valido' }, { status: 400 });
      }
      const validNextStates = VALID_TRANSITIONS[existing.status];
      if (!validNextStates.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: `Transicion no permitida de "${existing.status}" a "${body.status}"` },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }

    // Reference fields
    if (body.clientId !== undefined) {
      updates.client = body.clientId ? { _type: 'reference', _ref: body.clientId } : undefined;
    }
    if (body.commercialId !== undefined) {
      updates.commercial = body.commercialId ? { _type: 'reference', _ref: body.commercialId } : undefined;
    }
    if (body.technicalAnalystId !== undefined) {
      updates.technicalAnalyst = body.technicalAnalystId ? { _type: 'reference', _ref: body.technicalAnalystId } : undefined;
    }
    if (body.assignedExpertId !== undefined) {
      updates.assignedExpert = body.assignedExpertId ? { _type: 'reference', _ref: body.assignedExpertId } : undefined;
    }

    const updated = await writeClient.patch(id).set(updates).commit();
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error actualizando caso' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await client.fetch<CaseExpanded | null>(getCaseByIdQuery, { id });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Caso no encontrado' },
        { status: 404 }
      );
    }

    // Soft delete: move to archivado
    await writeClient.patch(id).set({ status: 'archivado' }).commit();
    return NextResponse.json({ success: true, data: { message: 'Caso archivado' } });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error archivando caso' },
      { status: 500 }
    );
  }
}
