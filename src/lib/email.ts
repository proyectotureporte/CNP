import { Resend } from 'resend';

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY || '');
  return _resend;
}

export async function sendCredentialsEmail({
  to,
  clientName,
  username,
  password,
}: {
  to: string;
  clientName: string;
  username: string;
  password: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not configured, skipping email');
    return null;
  }

  const emailFrom = process.env.EMAIL_FROM || 'CNP Portal <noresponder@cnp.com.co>';
  const { data, error } = await getResend().emails.send({
    from: emailFrom,
    to,
    subject: 'Tus credenciales de acceso al Portal CNP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a;">Bienvenido al Portal CNP</h2>
        <p>Hola <strong>${clientName}</strong>,</p>
        <p>Se ha creado tu cuenta de acceso al portal de clientes. A continuación encontrarás tus credenciales:</p>
        <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Usuario:</strong> ${username}</p>
          <p style="margin: 4px 0;"><strong>Contraseña:</strong> ${password}</p>
        </div>
        <p>Puedes acceder al portal en: <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://cnp.com.co'}/portal/login">Iniciar Sesión</a></p>
        <p style="color: #666; font-size: 14px;">Te recomendamos cambiar tu contraseña después del primer inicio de sesión.</p>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">Este es un correo automático del sistema CNP | Peritus. No responder a este correo.</p>
      </div>
    `,
  });

  if (error) {
    console.error('[email] Error sending credentials email:', error);
    return null;
  }

  return data;
}
