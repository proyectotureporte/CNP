import { query, queryOne, buildInsert, buildUpdate, newId, pruneUndefined, nestedObj } from './pool';
import type { CrmUser, UserRole } from '@/lib/types';

const companyObj = nestedObj('co', { _id: 'co.id', name: 'co.name', type: 'co.type' });

// Campos seguros (sin password_hash) + empresa anidada.
const SAFE = `
  u.id AS "_id", 'crmUser' AS "_type", u.created_at AS "_createdAt", u.updated_at AS "_updatedAt",
  u.username, u.email, u.display_name AS "displayName", u.phone, u.role, u.active,
  u.avatar_url AS "avatarUrl", u.must_change_password AS "mustChangePassword",
  ${companyObj} AS "company"
`;

const WITH_HASH = `${SAFE}, u.password_hash AS "passwordHash"`;

const FROM = `FROM crm_user u LEFT JOIN company co ON co.id = u.company_id`;

/** Para login: incluye passwordHash. Solo usuarios activos. */
export async function getUserByUsername(username: string): Promise<CrmUser | null> {
  return queryOne<CrmUser>(
    `SELECT ${WITH_HASH} ${FROM} WHERE lower(u.username) = lower($1) AND u.active = TRUE`,
    [username],
  );
}

export async function getUserByEmail(email: string): Promise<CrmUser | null> {
  return queryOne<CrmUser>(
    `SELECT ${WITH_HASH} ${FROM} WHERE lower(u.email) = lower($1) AND u.active = TRUE`,
    [email],
  );
}

export async function getUserById(id: string): Promise<CrmUser | null> {
  return queryOne<CrmUser>(`SELECT ${SAFE} ${FROM} WHERE u.id = $1`, [id]);
}

/** Incluye passwordHash; usado al cambiar contraseña. */
export async function getUserByIdWithHash(id: string): Promise<CrmUser | null> {
  return queryOne<CrmUser>(`SELECT ${WITH_HASH} ${FROM} WHERE u.id = $1`, [id]);
}

export async function listUsers(): Promise<CrmUser[]> {
  return query<CrmUser>(`SELECT ${SAFE} ${FROM} ORDER BY u.created_at DESC`);
}

export async function listUsersByRole(role: UserRole): Promise<CrmUser[]> {
  return query<CrmUser>(
    `SELECT ${SAFE} ${FROM} WHERE u.role = $1::user_role AND u.active = TRUE ORDER BY u.display_name ASC`,
    [role],
  );
}

export async function countActiveUsers(): Promise<number> {
  const row = await queryOne<{ count: number }>('SELECT count(*)::int AS count FROM crm_user WHERE active = TRUE');
  return row?.count ?? 0;
}

export async function countUsersByRole(role: UserRole): Promise<number> {
  const row = await queryOne<{ count: number }>(
    'SELECT count(*)::int AS count FROM crm_user WHERE role = $1::user_role AND active = TRUE',
    [role],
  );
  return row?.count ?? 0;
}

export async function listAdminUserIds(): Promise<string[]> {
  const rows = await query<{ id: string }>(
    `SELECT id FROM crm_user WHERE role = 'admin' AND active = TRUE`,
  );
  return rows.map((r) => r.id);
}

export interface CrmUserInput {
  username?: string | null;
  email?: string | null;
  displayName?: string | null;
  phone?: string | null;
  passwordHash?: string | null;
  role?: UserRole;
  active?: boolean;
  mustChangePassword?: boolean;
  avatarUrl?: string | null;
  companyId?: string | null;
}

export async function createUser(input: CrmUserInput): Promise<CrmUser | null> {
  const id = newId();
  const { text, values } = buildInsert('crm_user', {
    id,
    username: input.username ?? null,
    email: input.email ?? null,
    display_name: input.displayName ?? null,
    phone: input.phone ?? null,
    password_hash: input.passwordHash ?? null,
    role: input.role ?? 'juridico',
    active: input.active ?? true,
    must_change_password: input.mustChangePassword ?? false,
    avatar_url: input.avatarUrl ?? null,
    company_id: input.companyId ?? null,
  });
  await query(text, values);
  return getUserById(id);
}

export async function updateUser(id: string, patch: Partial<CrmUserInput>): Promise<CrmUser | null> {
  const data = pruneUndefined({
    username: patch.username,
    email: patch.email,
    display_name: patch.displayName,
    phone: patch.phone,
    password_hash: patch.passwordHash,
    role: patch.role,
    active: patch.active,
    must_change_password: patch.mustChangePassword,
    avatar_url: patch.avatarUrl,
    company_id: patch.companyId,
  });
  const upd = buildUpdate('crm_user', id, data);
  if (upd) await query(upd.text, upd.values);
  return getUserById(id);
}

export async function setUserPassword(id: string, passwordHash: string, mustChange = false): Promise<void> {
  await query(
    'UPDATE crm_user SET password_hash = $1, must_change_password = $2 WHERE id = $3',
    [passwordHash, mustChange, id],
  );
}

export async function deleteUser(id: string): Promise<void> {
  await query('DELETE FROM crm_user WHERE id = $1', [id]);
}
