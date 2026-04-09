import { readFileSync } from 'fs';
import { createClient } from '@sanity/client';
import { Resend } from 'resend';
import bcrypt from 'bcryptjs';

// ── Load .env.local ──
const envContent = readFileSync('.env.local', 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  env[key] = val;
}

// ── Initialize Sanity ──
const sanityWrite = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: env.SANITY_API_TOKEN,
});

const sanityRead = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: false,
});

// ── Initialize Resend ──
const resend = new Resend(env.RESEND_API_KEY);
const emailFrom = env.EMAIL_FROM || 'CNP Portal <noreply@cnp.com.co>';
const replyTo = env.EMAIL_REPLY_TO || 'soporte@cnp.com.co';
const portalUrl = `${env.NEXT_PUBLIC_APP_URL || 'https://cnp.com.co'}/portal/login`;

// ── Client list ──
const clients = [
  { name: 'JUAN LUIS PALACIO', email: 'juanluispalacio@palacioabogados.com', company: '', status: 'prospecto' },
  { name: 'DANIEL', email: 'grupofinanciero938@gmail.com', company: '', status: 'prospecto' },
  { name: 'PAULINA LLERENA DE LA HOY', email: 'pllerena@expertiseplus.com.co', company: 'SERVITECMI', status: 'prospecto' },
  // CARLOS MARIO: sin email, omitido
  { name: 'JAVIER ORLANDO FONSECA', email: 'javfonch@hotmail.com', company: 'CONSTRUCTORA', status: 'prospecto' },
  { name: 'JHON FELIPE MENDOZA', email: 'jmendozarinconlegal@gmail.com', company: '', status: 'prospecto' },
  { name: 'JESSICA RENGIFO', email: 'orjuelapinilla201@gmail.com', company: 'TULIO', status: 'activo' },
  { name: 'SOCIEDAD GRUPO DE INVERSORES TRINIDAD S.A.S', email: 'asadosexquisitos@hotmail.com', company: 'RESTAURANTE ASADOS EXQUISITOS', status: 'activo' },
  { name: 'ANGEL CASTAÑEDA MANRIQUE', email: 'acastaneda@x100legal.co', company: 'GASES DE OCCIDENTE S.A.', status: 'prospecto' },
  { name: 'CLIENTE NUEVO REUNION', email: 'prueba@gmail.com', company: 'CARVAJAL', status: 'inactivo' },
  { name: 'Prueba Guardado', email: 'ferney@gmail.com', company: 'dsdsd', status: 'activo' },
];

// ── Helpers ──
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function sendEmail({ to, clientName, username, password }) {
  const { data, error } = await resend.emails.send({
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
    console.error(`  [EMAIL ERROR] ${to}:`, error);
    return null;
  }
  return data;
}

// ── Process one client ──
async function processClient(c) {
  console.log(`\n--- ${c.name} (${c.email}) ---`);
  const email = c.email.trim().toLowerCase();

  // 1. Check if crmClient exists
  const existingClient = await sanityRead.fetch(
    `*[_type == "crmClient" && email == $email][0]{ _id, name, email, status }`,
    { email }
  );

  let clientId;
  let clientAction;

  if (existingClient) {
    await sanityWrite.patch(existingClient._id).set({
      name: c.name,
      company: c.company || '',
      status: c.status,
    }).commit();
    clientId = existingClient._id;
    clientAction = 'actualizado';
    console.log(`  crmClient ACTUALIZADO: ${clientId}`);
  } else {
    const newClient = await sanityWrite.create({
      _type: 'crmClient',
      brand: 'CNP',
      name: c.name,
      email,
      phone: '',
      company: c.company || '',
      position: '',
      notes: '',
      status: c.status,
      createdBy: 'Sistema',
    });
    clientId = newClient._id;
    clientAction = 'creado';
    console.log(`  crmClient CREADO: ${clientId}`);
  }

  // 2. Check/create crmUser
  const existingUser = await sanityRead.fetch(
    `*[_type == "crmUser" && email == $email][0]{ _id }`,
    { email }
  );

  // Generate unique password
  const suffix = clientId.slice(-4);
  const timestamp = Date.now().toString(36).slice(-3);
  const password = `CNP${suffix}${timestamp}`;
  const passwordHash = await hashPassword(password);

  let userAction;
  if (existingUser) {
    await sanityWrite.patch(existingUser._id).set({
      passwordHash,
      mustChangePassword: true,
      displayName: c.name,
      active: true,
    }).commit();
    userAction = 'password reset';
    console.log(`  crmUser ACTUALIZADO: ${existingUser._id}`);
  } else {
    const newUser = await sanityWrite.create({
      _type: 'crmUser',
      username: email,
      email,
      displayName: c.name,
      phone: '',
      passwordHash,
      role: 'cliente',
      active: true,
      mustChangePassword: true,
    });
    userAction = 'creado';
    console.log(`  crmUser CREADO: ${newUser._id}`);
  }

  // 3. Send email
  console.log(`  Enviando email...`);
  const emailResult = await sendEmail({
    to: email,
    clientName: c.name,
    username: email,
    password,
  });

  const emailOk = !!emailResult;
  console.log(`  Email: ${emailOk ? 'OK' : 'FALLO'}`);

  return { name: c.name, email, clientAction, userAction, password, emailOk };
}

// ── Main ──
console.log('========================================');
console.log('  BULK WELCOME - Portal CNP');
console.log('========================================');
console.log(`Total clientes: ${clients.length}`);
console.log(`OMITIDO: CARLOS MARIO (sin email)\n`);

const results = [];

for (const c of clients) {
  try {
    const result = await processClient(c);
    results.push(result);
  } catch (err) {
    console.error(`  ERROR: ${err.message}`);
    results.push({ name: c.name, email: c.email, error: err.message });
  }
  // Delay 1.5s between clients to avoid Resend rate limits (free tier)
  await new Promise(r => setTimeout(r, 1500));
}

console.log('\n========================================');
console.log('  RESUMEN FINAL');
console.log('========================================\n');

for (const r of results) {
  if (r.error) {
    console.log(`X ${r.name} -> ERROR: ${r.error}`);
  } else {
    console.log(`OK ${r.name}`);
    console.log(`   Email: ${r.email} | Password: ${r.password}`);
    console.log(`   Cliente: ${r.clientAction} | Usuario: ${r.userAction} | Email enviado: ${r.emailOk ? 'SI' : 'NO'}`);
  }
}

console.log('\nDone.');
