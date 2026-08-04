import { NextResponse } from 'next/server';
import { getClientIdForUser } from '@/lib/auth/clientAccess';
import { queryOne } from '@/lib/db';
import type {
  CaseExpanded,
  CaseMessageAudience,
  UserRole,
  WorkPlanActivity,
} from '@/lib/types';

export interface RequestActor {
  userId: string;
  role: UserRole;
  displayName: string;
}

export interface CaseAccessRow {
  caseId: string;
  clientId: string | null;
  assignedExpertId: string | null;
  assignedFinancieroId: string | null;
  assignedJuridicoId: string | null;
  brand: 'CNP' | 'Peritus';
}

export function actorFromRequest(request: Request): RequestActor | null {
  const userId = request.headers.get('x-user-id');
  const role = request.headers.get('x-user-role') as UserRole | null;
  if (!userId || !role) return null;
  return {
    userId,
    role,
    displayName: request.headers.get('x-user-name') || 'Usuario',
  };
}

/** El acceso maestro usa `admin` como sujeto JWT, no como FK de crm_user. */
export function actorUserReference(actor: RequestActor): string | null {
  return actor.userId === 'admin' ? null : actor.userId;
}

export async function getCaseAccessRow(caseId: string): Promise<CaseAccessRow | null> {
  return queryOne<CaseAccessRow>(
    `SELECT id AS "caseId", client_id AS "clientId",
       assigned_expert_id AS "assignedExpertId",
       assigned_financiero_id AS "assignedFinancieroId",
       assigned_juridico_id AS "assignedJuridicoId", brand
     FROM cases WHERE id = $1`,
    [caseId],
  );
}

const INTERNAL_CASE_ROLES: UserRole[] = [
  'admin', 'juridico', 'administrativo', 'mercadeo', 'postventa',
];

export async function canActorAccessCase(
  actor: RequestActor,
  row: CaseAccessRow,
): Promise<boolean> {
  if (INTERNAL_CASE_ROLES.includes(actor.role)) return true;
  if (actor.role === 'financiero') return row.assignedFinancieroId === actor.userId;
  if (actor.role === 'perito') {
    return row.assignedExpertId === actor.userId || row.assignedFinancieroId === actor.userId;
  }
  if (actor.role === 'cliente') {
    const clientId = await getClientIdForUser(actor.userId);
    return Boolean(clientId && row.clientId === clientId);
  }
  return false;
}

export type CaseAccessResult =
  | { actor: RequestActor; row: CaseAccessRow; response: null }
  | { actor: null; row: null; response: NextResponse };

/**
 * Comprobación central de pertenencia a un caso. Devuelve 404 cuando el caso no
 * pertenece al actor para no confirmar la existencia de identificadores ajenos.
 */
export async function requireCaseAccess(
  request: Request,
  caseId: string,
): Promise<CaseAccessResult> {
  const actor = actorFromRequest(request);
  if (!actor) {
    return {
      actor: null,
      row: null,
      response: NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 }),
    };
  }
  const row = await getCaseAccessRow(caseId);
  if (!row || !(await canActorAccessCase(actor, row))) {
    return {
      actor: null,
      row: null,
      response: NextResponse.json({ success: false, error: 'Caso no encontrado' }, { status: 404 }),
    };
  }
  return { actor, row, response: null };
}

export function canUseMessageAudience(
  actor: RequestActor,
  audience: CaseMessageAudience,
): boolean {
  if (actor.role === 'admin' || actor.role === 'juridico') return true;
  if (actor.role === 'perito') return audience === 'juridico_perito';
  if (actor.role === 'cliente') return audience === 'juridico_cliente';
  return false;
}

/**
 * Defensa en profundidad del contrato de salida: aunque una consulta interna
 * cargue relaciones de más, nunca se serializan a la contraparte aislada.
 */
export function sanitizeCaseForRole(
  caseItem: CaseExpanded,
  role: UserRole,
): CaseExpanded {
  const safe = { ...caseItem } as CaseExpanded & Record<string, unknown>;

  if (role === 'perito') {
    delete safe.client;
    delete safe.commercial;
    delete safe.technicalAnalyst;
    delete safe.assignedFinanciero;
    delete safe.createdBy;
  }

  if (role === 'cliente') {
    delete safe.assignedExpert;
    delete safe.assignedFinanciero;
    delete safe.technicalAnalyst;
    delete safe.commercial;
    delete safe.createdBy;
  }

  return safe;
}

/** Evita que una asignación histórica mal configurada revele un cliente. */
export function sanitizeActivityForRole(
  activity: WorkPlanActivity,
  role: UserRole,
): WorkPlanActivity {
  const safe = { ...activity };
  delete safe.fileUrl;
  if (activity.fileName) safe.downloadUrl = `/api/activities/${activity._id}/download`;
  if (role === 'perito' && activity.assignedTo?.role === 'cliente') {
    delete safe.assignedTo;
  }
  return safe;
}
