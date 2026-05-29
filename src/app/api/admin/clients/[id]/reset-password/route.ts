import { NextRequest, NextResponse } from 'next/server';
import { queryOne, crmUser } from '@/lib/db';
import { hashPassword } from '@/lib/auth/passwords';
import { sendCredentialsEmail } from '@/lib/email';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const clientRow = await queryOne<{ id: string; name: string; email: string | null }>(
      'SELECT id, name, email FROM crm_client WHERE id = $1',
      [id]
    );

    if (!clientRow) {
      return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });
    }
    if (!clientRow.email) {
      return NextResponse.json({ success: false, error: 'El cliente no tiene email registrado' }, { status: 400 });
    }

    const portalUser = await queryOne<{ id: string }>(
      `SELECT id FROM crm_user WHERE lower(email) = lower($1) AND role = 'cliente' AND active = TRUE LIMIT 1`,
      [clientRow.email]
    );

    if (!portalUser) {
      return NextResponse.json({ success: false, error: 'No existe usuario portal para este cliente' }, { status: 404 });
    }

    const suffix = clientRow.id.slice(-4);
    const timestamp = Date.now().toString(36).slice(-3);
    const newPassword = `CNP${suffix}${timestamp}`;
    const passwordHash = await hashPassword(newPassword);

    await crmUser.setUserPassword(portalUser.id, passwordHash, true);

    sendCredentialsEmail({
      to: clientRow.email,
      clientName: clientRow.name,
      username: clientRow.email,
      password: newPassword,
    }).catch((err) => console.error('[reset-password] Email send failed:', err));

    return NextResponse.json({
      success: true,
      data: { message: 'Contraseña reseteada exitosamente', password: newPassword },
    });
  } catch (err) {
    console.error('[reset-password] Error:', err);
    return NextResponse.json({ success: false, error: 'Error reseteando contraseña' }, { status: 500 });
  }
}
