import { queryOne } from '@/lib/db';

/**
 * Obtiene el crmClient.id de un usuario del portal cruzando el email
 * entre crm_user y crm_client.
 */
export async function getClientIdForUser(userId: string): Promise<string | null> {
  const user = await queryOne<{ email: string | null }>(
    'SELECT email FROM crm_user WHERE id = $1',
    [userId],
  );
  if (!user?.email) return null;

  const client = await queryOne<{ id: string }>(
    'SELECT id FROM crm_client WHERE lower(email) = lower($1) ORDER BY created_at ASC LIMIT 1',
    [user.email],
  );
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
