import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { getCaseByIdQuery } from '@/lib/sanity/queries';
import { verifyClientOwnsCase } from '@/lib/auth/clientAccess';
import {
  CASE_STATUSES, CASE_DISCIPLINES, CASE_COMPLEXITIES, CASE_PRIORITIES,
  type CaseStatus, type CaseExpanded,
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
    const caseData = await client.fetch<CaseExpanded | null>(getCaseByIdQuery, { id });

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
      return NextResponse.json(
        { success: false, error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const existing = await client.fetch<CaseExpanded | null>(getCaseByIdQuery, { id });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Caso no encontrado' },
        { status: 404 }
      );
    }

    // Juridico cannot edit cases that are already gestionado (read-only unless returned)
    if (userRole === 'juridico' && existing.status !== 'creado') {
      return NextResponse.json(
        { success: false, error: 'No puede editar este caso. Solo puede editar casos en estado Creado.' },
        { status: 403 }
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
    if (body.hasHearing !== undefined) {
      updates.hasHearing = body.hasHearing;
      // When unchecked, clear hearing fields
      if (!body.hasHearing) {
        updates.hearingDate = '';
        updates.hearingLink = '';
      }
    }
    if (body.hearingDate !== undefined) updates.hearingDate = body.hearingDate;
    if (body.hearingLink !== undefined) updates.hearingLink = body.hearingLink;
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
    if (body.assignedFinancieroId !== undefined) {
      updates.assignedFinanciero = body.assignedFinancieroId ? { _type: 'reference', _ref: body.assignedFinancieroId } : undefined;
    }

    const updated = await writeClient.patch(id).set(updates).commit();
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
      return NextResponse.json(
        { success: false, error: 'Acceso denegado' },
        { status: 403 }
      );
    }

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
