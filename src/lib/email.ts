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

  const emailFrom = process.env.EMAIL_FROM || 'CNP Portal <noreply@cnp.com.co>';
  const replyTo = process.env.EMAIL_REPLY_TO || 'soporte@cnp.com.co';
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://cnp.com.co'}/portal/login`;

  const { data, error } = await getResend().emails.send({
    from: emailFrom,
    to,
    replyTo,
    subject: 'Tus credenciales de acceso al Portal CNP',
    text: `Bienvenido al Portal CNP\n\nHola ${clientName},\n\nSe ha creado tu cuenta de acceso al portal de clientes.\n\nUsuario: ${username}\nContrasena: ${password}\n\nAccede al portal en: ${portalUrl}\n\nTe recomendamos cambiar tu contrasena despues del primer inicio de sesion.\n\nCNP | Peritus`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a;">Bienvenido al Portal CNP</h2>
        <p>Hola <strong>${clientName}</strong>,</p>
        <p>Se ha creado tu cuenta de acceso al portal de clientes. A continuaci&oacute;n encontrar&aacute;s tus credenciales:</p>
        <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Usuario:</strong> ${username}</p>
          <p style="margin: 4px 0;"><strong>Contrase&ntilde;a:</strong> <code style="background: #e4e4e7; padding: 2px 6px; border-radius: 4px;">${password}</code></p>
        </div>
        <p>Puedes acceder al portal en: <a href="${portalUrl}">Iniciar Sesi&oacute;n</a></p>
        <p style="color: #666; font-size: 14px;">Te recomendamos cambiar tu contrase&ntilde;a despu&eacute;s del primer inicio de sesi&oacute;n.</p>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">Este es un correo autom&aacute;tico del sistema CNP | Peritus.</p>
      </div>
    `,
  });

  if (error) {
    console.error('[email] Error sending credentials email:', error);
    return null;
  }

  return data;
}
