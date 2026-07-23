import { queryOne } from '@/lib/db';

/**
 * Obtiene el crmClient.id de un usuario del portal. Usa la FK crm_user.client_id
 * (migración 007) y cae al cruce por email para cuentas antiguas sin vincular
 * (en ese caso deja la FK persistida para la próxima vez).
 */
export async function getClientIdForUser(userId: string): Promise<string | null> {
  const user = await queryOne<{ email: string | null; clientId: string | null }>(
    'SELECT email, client_id AS "clientId" FROM crm_user WHERE id = $1',
    [userId],
  );
  if (!user) return null;
  if (user.clientId) return user.clientId;
  if (!user.email) return null;

  const client = await queryOne<{ id: string }>(
    'SELECT id FROM crm_client WHERE lower(email) = lower($1) ORDER BY created_at ASC LIMIT 1',
    [user.email],
  );
  if (client?.id) {
    // Autoreparación: persistir el vínculo como FK para no depender más del email.
    queryOne('UPDATE crm_user SET client_id = $1 WHERE id = $2', [client.id, userId]).catch(() => {});
  }
  return client?.id ?? null;
}

/**
 * Verifica que el usuario del portal sea dueño del caso (cases.client_id == su clientId).
 */
export async function verifyClientOwnsCase(
  userId: string,
  caseId: string,
): Promise<{ owns: boolean; clientId: string | null }> {
  const clientId = await getClientIdForUser(userId);
  if (!clientId) return { owns: false, clientId: null };

  const caseRow = await queryOne<{ client_id: string | null }>(
    'SELECT client_id FROM cases WHERE id = $1',
    [caseId],
  );

  return {
    owns: caseRow?.client_id === clientId,
    clientId,
  };
}
