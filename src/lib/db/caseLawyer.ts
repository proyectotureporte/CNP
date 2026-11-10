import { query } from './pool';

export interface CaseLawyer {
  _id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  addedAt: string;
}

/** Abogados con acceso de supervisión a un caso. */
export async function listCaseLawyers(caseId: string): Promise<CaseLawyer[]> {
  return query<CaseLawyer>(
    `SELECT u.id AS "_id", u.display_name AS "displayName", u.email, u.phone, u.active, cl.created_at AS "addedAt"
     FROM case_lawyer cl JOIN crm_user u ON u.id = cl.user_id
     WHERE cl.case_id = $1
     ORDER BY u.display_name`,
    [caseId],
  );
}

/** Usuarios con rol abogado (para el selector del CRM). */
export async function listLawyerUsers(): Promise<CaseLawyer[]> {
  return query<CaseLawyer>(
    `SELECT id AS "_id", display_name AS "displayName", email, phone, active, created_at AS "addedAt"
     FROM crm_user WHERE role = 'abogado' AND active = TRUE
     ORDER BY display_name`,
  );
}

export async function addCaseLawyer(caseId: string, userId: string, createdById: string | null): Promise<void> {
  await query(
    `INSERT INTO case_lawyer (case_id, user_id, created_by_id) VALUES ($1, $2, $3)
     ON CONFLICT (case_id, user_id) DO NOTHING`,
    [caseId, userId, createdById],
  );
}

export async function removeCaseLawyer(caseId: string, userId: string): Promise<void> {
  await query('DELETE FROM case_lawyer WHERE case_id = $1 AND user_id = $2', [caseId, userId]);
}
