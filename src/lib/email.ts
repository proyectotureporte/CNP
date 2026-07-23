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
        <p style="color: #333333;">Hola <strong>${clientName}</strong>,</p>
        <p style="color: #333333;">Se ha creado tu cuenta de acceso al portal de clientes. A continuaci&oacute;n encontrar&aacute;s tus credenciales:</p>
        <!-- background-image (gradient) fija el navy: los clientes en modo oscuro
             (Gmail) invierten background-color pero no background-image, así las
             letras blancas siempre quedan sobre fondo oscuro. -->
        <div style="background-color: #0a2a6e; background-image: linear-gradient(#0a2a6e, #0a2a6e); border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0; color: #ffffff;"><strong>Usuario:</strong> ${username}</p>
          <p style="margin: 4px 0; color: #ffffff;"><strong>Contrase&ntilde;a:</strong> <code style="background-color: #132e5e; background-image: linear-gradient(#132e5e, #132e5e); color: #ffffff; padding: 2px 6px; border-radius: 4px;">${password}</code></p>
        </div>
        <p style="color: #333333;">Puedes acceder al portal en: <a href="${portalUrl}" style="color: #1b5697;">Iniciar Sesi&oacute;n</a></p>
        <p style="color: #666666; font-size: 14px;">Te recomendamos cambiar tu contrase&ntilde;a despu&eacute;s del primer inicio de sesi&oacute;n.</p>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
        <p style="color: #999999; font-size: 12px;">Este es un correo autom&aacute;tico del sistema CNP | Peritus.</p>
      </div>
    `,
  });

  if (error) {
    console.error('[email] Error sending credentials email:', error);
    return null;
  }

  return data;
}

/**
 * Correo genérico de alerta interna (RF-13 / item 17): se usa para los buzones
 * configurables (admin/comité/comunicaciones) y avisos a usuarios del CRM.
 */
export async function sendInternalAlertEmail({
  to,
  subject,
  message,
  linkUrl,
}: {
  to: string;
  subject: string;
  message: string;
  linkUrl?: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not configured, skipping email');
    return null;
  }

  const emailFrom = process.env.EMAIL_FROM || 'CNP Portal <noreply@cnp.com.co>';
  const replyTo = process.env.EMAIL_REPLY_TO || 'soporte@cnp.com.co';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cnp.com.co';
  const fullLink = linkUrl ? (linkUrl.startsWith('http') ? linkUrl : `${appUrl}${linkUrl}`) : null;

  const { data, error } = await getResend().emails.send({
    from: emailFrom,
    to,
    replyTo,
    subject,
    text: `${subject}\n\n${message}${fullLink ? `\n\nVer en el CRM: ${fullLink}` : ''}\n\nCNP | Peritus`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- background-image (gradient) fija el navy: los clientes en modo oscuro
             (Gmail) invierten background-color pero no background-image, así las
             letras blancas siempre quedan sobre fondo oscuro. -->
        <div style="background-color: #0a2a6e; background-image: linear-gradient(#0a2a6e, #0a2a6e); border-radius: 8px; padding: 18px 24px; margin-bottom: 20px;">
          <h2 style="color: #ffffff; margin: 0; font-size: 18px;">${escapeHtml(subject)}</h2>
        </div>
        <p style="color: #333333; white-space: pre-line;">${escapeHtml(message)}</p>
        ${fullLink ? `<p style="margin: 20px 0;"><a href="${fullLink}" style="background-color: #0a2a6e; background-image: linear-gradient(#0a2a6e, #0a2a6e); color: #ffffff; padding: 10px 18px; border-radius: 6px; text-decoration: none;">Ver en el CRM</a></p>` : ''}
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
        <p style="color: #999999; font-size: 12px;">Este es un correo autom&aacute;tico del sistema CNP | Peritus.</p>
      </div>
    `,
  });

  if (error) {
    console.error('[email] Error sending internal alert email:', error);
    return null;
  }
  return data;
}

/**
 * Aviso al cliente de que su cotización fue enviada (RF-09: canal email real).
 */
export async function sendQuoteSentEmail({
  to,
  clientName,
  caseCode,
  caseTitle,
  finalValue,
  validUntil,
}: {
  to: string;
  clientName: string;
  caseCode: string;
  caseTitle: string;
  finalValue?: number | null;
  validUntil?: string | null;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not configured, skipping email');
    return null;
  }

  const emailFrom = process.env.EMAIL_FROM || 'CNP Portal <noreply@cnp.com.co>';
  const replyTo = process.env.EMAIL_REPLY_TO || 'soporte@cnp.com.co';
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://cnp.com.co'}/portal/login`;
  const valueLine = finalValue
    ? `Valor: $${Number(finalValue).toLocaleString('es-CO')} COP`
    : '';
  const validLine = validUntil
    ? `Válida hasta: ${new Date(validUntil).toLocaleDateString('es-CO')}`
    : '';

  const { data, error } = await getResend().emails.send({
    from: emailFrom,
    to,
    replyTo,
    subject: `Nueva propuesta para tu caso ${caseCode} — CNP | Peritus`,
    text: `Hola ${clientName},\n\nHemos preparado una propuesta para tu caso "${caseTitle}" (${caseCode}).\n${valueLine}\n${validLine}\n\nPuedes revisarla y aprobarla o rechazarla desde el portal de clientes: ${portalUrl}\n\nCNP | Peritus`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0a2a6e; background-image: linear-gradient(#0a2a6e, #0a2a6e); border-radius: 8px; padding: 18px 24px; margin-bottom: 20px;">
          <h2 style="color: #ffffff; margin: 0; font-size: 18px;">Nueva propuesta disponible</h2>
        </div>
        <p style="color: #333333;">Hola <strong>${escapeHtml(clientName)}</strong>,</p>
        <p style="color: #333333;">Hemos preparado una propuesta para tu caso <strong>${escapeHtml(caseTitle)}</strong> (${escapeHtml(caseCode)}).</p>
        <div style="background-color: #0a2a6e; background-image: linear-gradient(#0a2a6e, #0a2a6e); border-radius: 8px; padding: 16px; margin: 16px 0;">
          ${valueLine ? `<p style="margin: 4px 0; color: #ffffff;"><strong>${escapeHtml(valueLine)}</strong></p>` : ''}
          ${validLine ? `<p style="margin: 4px 0; color: #ffffff;">${escapeHtml(validLine)}</p>` : ''}
        </div>
        <p style="color: #333333;">Puedes revisarla y aprobarla o rechazarla desde el <a href="${portalUrl}" style="color: #1b5697;">portal de clientes</a>.</p>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
        <p style="color: #999999; font-size: 12px;">Este es un correo autom&aacute;tico del sistema CNP | Peritus.</p>
      </div>
    `,
  });

  if (error) {
    console.error('[email] Error sending quote sent email:', error);
    return null;
  }
  return data;
}

// El nombre viene de un formulario público: escapar antes de interpolarlo en el HTML.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendWebFormConfirmationEmail({
  to,
  nombre,
  origen,
}: {
  to: string;
  nombre?: string;
  origen: 'landing' | 'abogados' | 'empresas' | 'jueces' | 'masterclass';
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not configured, skipping email');
    return null;
  }

  const emailFrom = process.env.EMAIL_FROM || 'CNP Portal <noreply@cnp.com.co>';
  const replyTo = process.env.EMAIL_REPLY_TO || 'soporte@cnp.com.co';

  const esMasterclass = origen === 'masterclass';
  const saludo = nombre ? `Hola ${nombre.trim()},` : 'Hola,';
  const subject = esMasterclass
    ? 'Recibimos tu reserva de cupo — MasterClass CNP + Peritus'
    : 'Recibimos tu solicitud — Centro Nacional de Pruebas';
  const recibido = esMasterclass
    ? 'hemos recibido tu solicitud de reserva de cupo para la próxima MasterClass.'
    : 'hemos recibido tu solicitud a través de nuestro sitio web.';
  const whatsappUrl = 'https://wa.me/573164071992?text=quiero%20hablar%20con%20un%20agente%20de%20CNP';

  const { data, error } = await getResend().emails.send({
    from: emailFrom,
    to,
    replyTo,
    subject,
    text: `${saludo}\n\nGracias por escribirnos: ${recibido}\n\nUn miembro de nuestro equipo te contactara en un maximo de 24 horas.\n\nSi tu consulta es urgente, puedes escribirnos por WhatsApp: ${whatsappUrl}\n\nCNP | Peritus\nhttps://cnp.com.co`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- background-image (gradient) fija el navy: los clientes en modo oscuro
             (Gmail) invierten background-color pero no background-image, así las
             letras blancas siempre quedan sobre fondo oscuro. -->
        <div style="background-color: #0a2a6e; background-image: linear-gradient(#0a2a6e, #0a2a6e); border-radius: 8px; padding: 18px 24px; margin-bottom: 20px;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px;">${esMasterclass ? 'Reserva recibida' : 'Solicitud recibida'}</h2>
        </div>
        <p style="color: #333333;">${escapeHtml(saludo)}</p>
        <p style="color: #333333;">Gracias por escribirnos: ${recibido}</p>
        <div style="background-color: #0a2a6e; background-image: linear-gradient(#0a2a6e, #0a2a6e); border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #ffffff;"><strong>Un miembro de nuestro equipo te contactar&aacute; en un m&aacute;ximo de 24 horas.</strong></p>
        </div>
        <p style="color: #666666; font-size: 14px;">Si tu consulta es urgente, tambi&eacute;n puedes <a href="${whatsappUrl}" style="color: #1b5697;">escribirnos por WhatsApp</a>.</p>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
        <p style="color: #999999; font-size: 12px;">Este es un correo autom&aacute;tico del sistema CNP | Peritus. No es necesario responderlo.</p>
      </div>
    `,
  });

  if (error) {
    console.error('[email] Error sending web-form confirmation email:', error);
    return null;
  }

  return data;
}
