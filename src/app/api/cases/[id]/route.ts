import { NextRequest, NextResponse } from 'next/server';
import { cases } from '@/lib/db';
import { verifyClientOwnsCase } from '@/lib/auth/clientAccess';
import {
  CASE_STATUSES, CASE_DISCIPLINES, CASE_COMPLEXITIES, CASE_PRIORITIES,
  type CaseStatus,
} from '@/lib/types';
import { triggerEvent } from '@/lib/pusher/server';

// Valid state transitions map
const VALID_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  creado: ['gestionado', 'cancelado'],
  gestionado: ['creado', 'cancelado'],
  cancelado: ['creado'],
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userRole = request.headers.get('x-user-role') || '';
    const userId = request.headers.get('x-user-id') || '';
    const caseData = await cases.getCaseById(id);

    if (!caseData) {
      return NextResponse.json(
        { success: false, error: 'Caso no encontrado' },
        { status: 404 }
      );
    }

    // Financiero users can only access cases assigned to them
    if (userRole === 'financiero' && caseData.assignedFinanciero?._id !== userId) {
      return NextResponse.json(
        { success: false, error: 'No tiene acceso a este caso' },
        { status: 403 }
      );
    }

    // Portal clients can only access their own cases
    if (userRole === 'cliente') {
      const { owns } = await verifyClientOwnsCase(userId, id);
      if (!owns) {
        return NextResponse.json(
          { success: false, error: 'No tiene acceso a este caso' },
          { status: 403 }
        );
      }
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
    const userRole = request.headers.get('x-user-role') || '';

    // Clients cannot edit cases
    if (userRole === 'cliente') {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();

    const existing = await cases.getCaseById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Caso no encontrado' }, { status: 404 });
    }

    // Juridico cannot edit cases that are already gestionado
    if (userRole === 'juridico' && existing.status !== 'creado') {
      return NextResponse.json(
        { success: false, error: 'No puede editar este caso. Solo puede editar casos en estado Creado.' },
        { status: 403 }
      );
    }

    const patch: Parameters<typeof cases.updateCase>[1] = {};

    if (body.title !== undefined) patch.title = body.title;
    if (body.description !== undefined) patch.description = body.description;
    if (body.city !== undefined) patch.city = body.city;
    if (body.courtName !== undefined) patch.courtName = body.courtName;
    if (body.caseNumber !== undefined) patch.caseNumber = body.caseNumber;
    if (body.estimatedAmount !== undefined) patch.estimatedAmount = body.estimatedAmount;
    if (body.hasHearing !== undefined) {
      patch.hasHearing = body.hasHearing;
      if (!body.hasHearing) {
        patch.hearingDate = null;
        patch.hearingLink = null;
      }
    }
    if (body.hearingDate !== undefined) patch.hearingDate = body.hearingDate || null;
    if (body.hearingLink !== undefined) patch.hearingLink = body.hearingLink;
    if (body.deadlineDate !== undefined) patch.deadlineDate = body.deadlineDate || null;
    if (body.riskScore !== undefined) patch.riskScore = body.riskScore;

    if (body.discipline !== undefined) {
      if (!CASE_DISCIPLINES.includes(body.discipline)) {
        return NextResponse.json({ success: false, error: 'Disciplina no valida' }, { status: 400 });
      }
      patch.discipline = body.discipline;
    }
    if (body.complexity !== undefined) {
      if (!CASE_COMPLEXITIES.includes(body.complexity)) {
        return NextResponse.json({ success: false, error: 'Complejidad no valida' }, { status: 400 });
      }
      patch.complexity = body.complexity;
    }
    if (body.priority !== undefined) {
      if (!CASE_PRIORITIES.includes(body.priority)) {
        return NextResponse.json({ success: false, error: 'Prioridad no valida' }, { status: 400 });
      }
      patch.priority = body.priority;
    }

    if (body.status !== undefined) {
      if (!CASE_STATUSES.includes(body.status)) {
        return NextResponse.json({ success: false, error: 'Estado no valido' }, { status: 400 });
      }
      const validNextStates = VALID_TRANSITIONS[existing.status as CaseStatus] || [];
      if (!validNextStates.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: `Transicion no permitida de "${existing.status}" a "${body.status}"` },
          { status: 400 }
        );
      }
      patch.status = body.status;
    }

    // Reference fields (vacío => limpiar)
    if (body.clientId !== undefined) patch.clientId = body.clientId || null;
    if (body.commercialId !== undefined) patch.commercialId = body.commercialId || null;
    if (body.technicalAnalystId !== undefined) patch.technicalAnalystId = body.technicalAnalystId || null;
    if (body.assignedExpertId !== undefined) patch.assignedExpertId = body.assignedExpertId || null;
    if (body.assignedFinancieroId !== undefined) patch.assignedFinancieroId = body.assignedFinancieroId || null;

    const updated = await cases.updateCase(id, patch);
    triggerEvent('case:updated', { id });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error actualizando caso' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userRole = request.headers.get('x-user-role') || '';

    // Clients cannot delete cases
    if (userRole === 'cliente') {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }

    const existing = await cases.getCaseById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Caso no encontrado' }, { status: 404 });
    }

    // Soft delete: move to archivado
    await cases.updateCase(id, { status: 'archivado' });
    return NextResponse.json({ success: true, data: { message: 'Caso archivado' } });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error archivando caso' },
      { status: 500 }
    );
  }
}
