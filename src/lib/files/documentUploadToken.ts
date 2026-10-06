import { createHash, randomBytes, randomUUID } from 'crypto';

export const DOCUMENT_UPLOAD_COOKIE = 'cnp-document-upload';

export function createDocumentUploadToken(): {
  id: string;
  credential: string;
  tokenHash: string;
} {
  const id = randomUUID();
  const secret = randomBytes(32).toString('base64url');
  return {
    id,
    credential: `${id}.${secret}`,
    tokenHash: hashDocumentUploadSecret(secret),
  };
}

export function parseDocumentUploadCredential(credential: string | undefined | null): {
  id: string;
  tokenHash: string;
} | null {
  if (!credential) return null;
  const separator = credential.indexOf('.');
  if (separator < 1) return null;
  const id = credential.slice(0, separator);
  const secret = credential.slice(separator + 1);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[A-Za-z0-9_-]{40,60}$/.test(secret)) return null;
  return { id, tokenHash: hashDocumentUploadSecret(secret) };
}

function hashDocumentUploadSecret(secret: string): string {
  return createHash('sha256').update(secret, 'utf8').digest('hex');
}
