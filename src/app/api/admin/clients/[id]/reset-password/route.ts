import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { hashPassword } from '@/lib/auth/passwords';
import { sendCredentialsEmail } from '@/lib/email';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the client data
    const crmClient = await client.fetch<{ _id: string; name: string; email: string } | null>(
      `*[_type == "crmClient" && _id == $id][0]{ _id, name, email }`,
      { id }
    );

    if (!crmClient) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    if (!crmClient.email) {
      return NextResponse.json(
        { success: false, error: 'El cliente no tiene email registrado' },
        { status: 400 }
      );
    }

    // Find the associated crmUser
    const crmUser = await client.fetch<{ _id: string } | null>(
      `*[_type == "crmUser" && email == $email && role == "cliente"][0]{ _id }`,
      { email: crmClient.email }
    );

    if (!crmUser) {
      return NextResponse.json(
        { success: false, error: 'No existe usuario portal para este cliente' },
        { status: 404 }
      );
    }

    // Generate new password
    const suffix = crmClient._id.slice(-4);
    const timestamp = Date.now().toString(36).slice(-3);
    const newPassword = `CNP${suffix}${timestamp}`;
    const passwordHash = await hashPassword(newPassword);

    // Update the user
    await writeClient.patch(crmUser._id).set({
      passwordHash,
      mustChangePassword: true,
    }).commit();

    // Fire-and-forget: send email
    sendCredentialsEmail({
      to: crmClient.email,
      clientName: crmClient.name,
      username: crmClient.email,
      password: newPassword,
    }).catch((err) => console.error('[reset-password] Email send failed:', err));

    return NextResponse.json({
      success: true,
      data: {
        message: 'Contraseña reseteada exitosamente',
        password: newPassword,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error reseteando contraseña' },
      { status: 500 }
    );
  }
}
