import { NextRequest, NextResponse } from 'next/server';
import { cases, crmUser, expert } from '@/lib/db';
import { requireCaseAccess, sanitizeCaseForRole } from '@/lib/auth/caseAccess';
import {
  CASE_STATUSES, CASE_DISCIPLINES, CASE_COMPLEXITIES, CASE_PRIORITIES, CASE_CHANNELS,
  type CaseStatus,
} from '@/lib/types';
import { VALID_TRANSITIONS } from '@/lib/cases/stateMachine';
import { triggerEvent } from '@/lib/realtime/server';
import { auditEntityChange } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await requireCaseAccess(request, id);
    if (access.response) return access.response;
    const caseData = await cases.getCaseById(id);

    if (!caseData) {
      return NextResponse.json(
        { success: false, error: 'Caso no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: sanitizeCaseForRole(caseData, access.actor.role),
    });
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

    // Las actualizaciones técnicas del perito tienen endpoints acotados; el
    // CRUD general del caso queda únicamente en manos de admin/jurídico.
    if (!['admin', 'juridico'].includes(userRole)) {
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
    if (body.channel !== undefined) {
      if (!CASE_CHANNELS.includes(body.channel)) {
        return NextResponse.json({ success: false, error: 'Canal de origen no valido' }, { status: 400 });
      }
      patch.channel = body.channel;
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

    // Reference fields (vacío => limpiar). Las asignaciones que involucren a
    // un perito repiten aquí la validación del endpoint /assign para que ningún
    // flujo alternativo pueda saltarse el bloqueo bancario de G-01.
    if (body.assignedExpertId) {
      const assignedUser = await crmUser.getUserById(body.assignedExpertId);
      if (!assignedUser || assignedUser.role !== 'perito') {
        return NextResponse.json({ success: false, error: 'El usuario asignado debe tener rol perito' }, { status: 400 });
      }
      const profile = await expert.getExpertByUserId(body.assignedExpertId);
      if (profile?.validationStatus !== 'activado') {
        return NextResponse.json(
          { success: false, error: 'No se puede asignar el caso: el perfil del perito debe estar activado y categorizado.' },
          { status: 409 },
        );
      }
      if (!profile.bankName?.trim()
        || !profile.bankAccountType?.trim()
        || !profile.bankAccountNumber?.trim()
        || !profile.bankAccountHolder?.trim()
        || !profile.bankHolderDocument?.trim()) {
        return NextResponse.json(
          { success: false, error: 'No se puede asignar el caso: el perito debe completar sus datos bancarios.' },
          { status: 409 },
        );
      }
    }
    if (body.assignedFinancieroId) {
      const assignedUser = await crmUser.getUserById(body.assignedFinancieroId);
      if (!assignedUser || !['financiero', 'perito'].includes(assignedUser.role)) {
        return NextResponse.json({ success: false, error: 'El responsable financiero no tiene un rol válido' }, { status: 400 });
      }
      if (assignedUser.role === 'perito') {
        const profile = await expert.getExpertByUserId(body.assignedFinancieroId);
        if (profile?.validationStatus !== 'activado') {
          return NextResponse.json(
            { success: false, error: 'No se puede asignar el caso: el perfil del perito debe estar activado y categorizado.' },
            { status: 409 },
          );
        }
        if (!profile.bankName?.trim()
          || !profile.bankAccountType?.trim()
          || !profile.bankAccountNumber?.trim()
          || !profile.bankAccountHolder?.trim()
          || !profile.bankHolderDocument?.trim()) {
          return NextResponse.json(
            { success: false, error: 'No se puede asignar el caso: el perito debe completar sus datos bancarios.' },
            { status: 409 },
          );
        }
      }
    }
    if (body.assignedJuridicoId) {
      const assignedUser = await crmUser.getUserById(body.assignedJuridicoId);
      if (!assignedUser || assignedUser.role !== 'juridico') {
        return NextResponse.json({ success: false, error: 'El interlocutor debe tener rol jurídico' }, { status: 400 });
      }
    }

    if (body.clientId !== undefined) patch.clientId = body.clientId || null;
    if (body.commercialId !== undefined) patch.commercialId = body.commercialId || null;
    if (body.technicalAnalystId !== undefined) patch.technicalAnalystId = body.technicalAnalystId || null;
    if (body.assignedExpertId !== undefined) patch.assignedExpertId = body.assignedExpertId || null;
    if (body.assignedFinancieroId !== undefined) patch.assignedFinancieroId = body.assignedFinancieroId || null;
    if (body.assignedJuridicoId !== undefined) patch.assignedJuridicoId = body.assignedJuridicoId || null;

    const updated = await cases.updateCase(id, patch);

    // Item 19: auditoría campo a campo de la edición.
    if (updated) {
      const snapshot = (c: typeof existing) => ({
        title: c.title,
        description: c.description ?? null,
        discipline: c.discipline ?? null,
        status: c.status,
        complexity: c.complexity,
        priority: c.priority,
        channel: c.channel ?? null,
        estimatedAmount: c.estimatedAmount ?? null,
        hasHearing: c.hasHearing ?? false,
        hearingDate: c.hearingDate ?? null,
        deadlineDate: c.deadlineDate ?? null,
        city: c.city ?? null,
        courtName: c.courtName ?? null,
        caseNumber: c.caseNumber ?? null,
        clientId: c.client?._id ?? null,
        commercialId: c.commercial?._id ?? null,
        technicalAnalystId: c.technicalAnalyst?._id ?? null,
        assignedExpertId: c.assignedExpert?._id ?? null,
        assignedFinancieroId: c.assignedFinanciero?._id ?? null,
      });
      auditEntityChange({
        request,
        action: 'update',
        entityType: 'case',
        entityId: id,
        before: snapshot(existing),
        after: snapshot(updated),
      });
    }

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

    if (!['admin', 'juridico'].includes(userRole)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }

    const existing = await cases.getCaseById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Caso no encontrado' }, { status: 404 });
    }

    // Soft delete: move to archivado
    await cases.updateCase(id, { status: 'archivado' });
    auditEntityChange({
      request,
      action: 'delete',
      entityType: 'case',
      entityId: id,
      before: { status: existing.status, caseCode: existing.caseCode, title: existing.title },
      after: { status: 'archivado' },
    });
    return NextResponse.json({ success: true, data: { message: 'Caso archivado' } });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error archivando caso' },
      { status: 500 }
    );
  }
}
