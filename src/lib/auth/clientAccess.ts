import { client } from '@/lib/sanity/client';

/**
 * Gets the crmClient._id for a portal user by matching email
 * between crmUser and crmClient records.
 */
export async function getClientIdForUser(userId: string): Promise<string | null> {
  const result = await client.fetch<{ email: string } | null>(
    `*[_type == "crmUser" && _id == $userId][0]{ email }`,
    { userId }
  );

  if (!result?.email) return null;

  const crmClient = await client.fetch<{ _id: string } | null>(
    `*[_type == "crmClient" && email == $email][0]{ _id }`,
    { email: result.email }
  );

  return crmClient?._id || null;
}

/**
 * Verifies that the portal user owns the case (case.client._ref matches their clientId).
 */
export async function verifyClientOwnsCase(
  userId: string,
  caseId: string
): Promise<{ owns: boolean; clientId: string | null }> {
  const clientId = await getClientIdForUser(userId);
  if (!clientId) return { owns: false, clientId: null };

  const caseData = await client.fetch<{ clientRef: string } | null>(
    `*[_type == "case" && _id == $caseId][0]{ "clientRef": client._ref }`,
    { caseId }
  );

  return {
    owns: caseData?.clientRef === clientId,
    clientId,
  };
}
