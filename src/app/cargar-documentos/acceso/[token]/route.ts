import { NextRequest, NextResponse } from 'next/server';
import { documentUploadLink } from '@/lib/db';
import {
  DOCUMENT_UPLOAD_COOKIE,
  parseDocumentUploadCredential,
} from '@/lib/files/documentUploadToken';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const parsed = parseDocumentUploadCredential(token);
  const link = parsed
    ? await documentUploadLink.getValidLink(parsed.id, parsed.tokenHash)
    : null;

  const destination = new URL('/cargar-documentos', request.url);
  if (!link) destination.searchParams.set('estado', 'invalido');
  const response = NextResponse.redirect(destination);
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');

  if (link) {
    const remainingSeconds = Math.max(
      1,
      Math.floor((new Date(link.expiresAt).getTime() - Date.now()) / 1000),
    );
    response.cookies.set(DOCUMENT_UPLOAD_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: remainingSeconds,
    });
  } else {
    response.cookies.delete(DOCUMENT_UPLOAD_COOKIE);
  }

  return response;
}
