/**
 * Migración de datos Sanity → PostgreSQL (Fase 4).
 *
 * Lee el NDJSON de un export de Sanity (`sanity dataset export production`,
 * descomprimir el .tar.gz → data.ndjson) e inserta las filas en PostgreSQL
 * respetando el orden topológico de claves foráneas.
 *
 *   Uso:  node --experimental-strip-types scripts/migrate-from-sanity.ts [ruta]
 *         npm run db:import-sanity -- ./sanity-export/data.ndjson
 *   (por defecto busca ./sanity-export/data.ndjson)
 *
 * Notas:
 *   - Los archivos NO se mueven: siguen en el CDN de Sanity. Solo se guardan
 *     file_url, file_asset_id, file_name, mime_type, file_size (resueltos
 *     desde los documentos sanity.fileAsset / sanity.imageAsset del export).
 *   - Idempotente: cada INSERT usa ON CONFLICT (id) DO NOTHING. Se puede
 *     re-ejecutar sin duplicar.
 *   - Se omiten los borradores (_id que empieza por "drafts.").
 *   - Las referencias a ids que no existen en el export se guardan como NULL
 *     (evita violar las FKs por referencias colgantes).
 */
import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import pg from 'pg';

const { Client } = pg;

// ── Cargar .env.local (mismo formato que el resto de scripts) ──
if (existsSync('.env.local')) {
  const envContent = readFileSync('.env.local', 'utf-8');
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
    if (!process.env[key]) process.env[key] = val;
  }
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL no está configurada (en .env.local o en el entorno).');
  process.exit(1);
}

// ── Resolver la ruta del NDJSON ──
let ndjsonPath = process.argv[2] || join(process.cwd(), 'sanity-export', 'data.ndjson');
if (existsSync(ndjsonPath) && statSync(ndjsonPath).isDirectory()) {
  ndjsonPath = join(ndjsonPath, 'data.ndjson');
}
if (!existsSync(ndjsonPath)) {
  console.error(`ERROR: no se encontró el NDJSON en "${ndjsonPath}".`);
  console.error('Genéralo con: sanity dataset export production, descomprime el .tar.gz y pasa la ruta a data.ndjson');
  process.exit(1);
}

// ── Tipos auxiliares ──
type Doc = Record<string, any>;
type AssetMeta = { url?: string; originalFilename?: string; mimeType?: string; size?: number };
type FileResolved = { url: string | null; assetId: string; name: string | null; mime: string | null; size: number | null };

// Tipos de documento Sanity → tabla destino (orden NO topológico aquí, solo el set conocido).
const KNOWN_TYPES = new Set([
  'company', 'crmClient', 'crmUser', 'case', 'registroPeritus', 'caseEvent', 'caseDocument',
  'quote', 'expert', 'workPlan', 'workPlanActivity', 'deliverable', 'evaluation', 'hearing',
  'payment', 'commission', 'notification', 'auditLog', 'systemSetting', 'adminConfig',
  'whatsappLead', 'whatsappMessage', 'webLead',
]);

// ── Lectura y primer pase ──
const assets = new Map<string, AssetMeta>();
const byType = new Map<string, Doc[]>();
const validIds = new Set<string>();
let totalLines = 0;
let drafts = 0;
let unknown = 0;

const raw = readFileSync(ndjsonPath, 'utf-8');
for (const line of raw.split('\n')) {
  const t = line.trim();
  if (!t) continue;
  totalLines++;
  let doc: Doc;
  try {
    doc = JSON.parse(t);
  } catch {
    continue;
  }
  const id: string = doc._id || '';
  const type: string = doc._type || '';

  if (type === 'sanity.fileAsset' || type === 'sanity.imageAsset') {
    assets.set(id, { url: doc.url, originalFilename: doc.originalFilename, mimeType: doc.mimeType, size: doc.size });
    continue;
  }
  if (id.startsWith('drafts.')) {
    drafts++;
    continue;
  }
  if (!KNOWN_TYPES.has(type)) {
    unknown++;
    continue;
  }
  if (!byType.has(type)) byType.set(type, []);
  byType.get(type)!.push(doc);
  validIds.add(id);
}

// ── Helpers ──
function ref(field: any): string | null {
  const r = field && field._ref ? String(field._ref) : null;
  if (!r) return null;
  const normalized = r.startsWith('drafts.') ? r.slice(7) : r;
  return validIds.has(normalized) ? normalized : null;
}

function resolveFile(field: any): FileResolved | null {
  const r = field && field.asset && field.asset._ref ? String(field.asset._ref) : null;
  if (!r) return null;
  const a = assets.get(r) || {};
  return {
    url: a.url ?? null,
    assetId: r,
    name: a.originalFilename ?? null,
    mime: a.mimeType ?? null,
    size: a.size ?? null,
  };
}

function base(doc: Doc): Doc {
  return { id: doc._id, created_at: doc._createdAt ?? null, updated_at: doc._updatedAt ?? null };
}

// ── Mapeo por tipo: devuelve filas para la(s) tabla(s) destino ──
function mapCompany(d: Doc): Doc {
  return {
    ...base(d),
    name: d.name, nit: d.nit, type: d.type, address: d.address, city: d.city,
    country: d.country, phone: d.phone, website: d.website, billing_email: d.billingEmail,
    logo_url: d.logoUrl, is_active: d.isActive,
  };
}

function mapCrmClient(d: Doc): Doc {
  return {
    ...base(d),
    brand: d.brand, name: d.name, email: d.email, phone: d.phone, company: d.company,
    position: d.position, notes: d.notes, status: d.status, created_by: d.createdBy,
  };
}

function mapCrmUser(d: Doc): Doc {
  return {
    ...base(d),
    username: d.username, email: d.email, display_name: d.displayName, phone: d.phone,
    password_hash: d.passwordHash, role: d.role, active: d.active,
    must_change_password: d.mustChangePassword, avatar_url: d.avatarUrl,
    company_id: ref(d.companyRef),
  };
}

function mapCase(d: Doc): Doc {
  return {
    ...base(d),
    brand: d.brand, case_code: d.caseCode, title: d.title, description: d.description,
    client_id: ref(d.client), commercial_id: ref(d.commercial),
    technical_analyst_id: ref(d.technicalAnalyst), assigned_expert_id: ref(d.assignedExpert),
    assigned_financiero_id: ref(d.assignedFinanciero), discipline: d.discipline, status: d.status,
    status_changed_by_role: d.statusChangedByRole, complexity: d.complexity, priority: d.priority,
    estimated_amount: d.estimatedAmount, has_hearing: d.hasHearing, hearing_date: d.hearingDate,
    hearing_link: d.hearingLink, deadline_date: d.deadlineDate, city: d.city,
    court_name: d.courtName, case_number: d.caseNumber, risk_score: d.riskScore,
    created_by_id: ref(d.createdBy),
  };
}

function mapRegistroPeritus(d: Doc): Doc {
  const f = resolveFile(d.hojaDeVida);
  return {
    ...base(d),
    peritus_id: d.peritusId, nombre_apellido: d.nombreApellido, cedula: d.cedula, correo: d.correo,
    celular: d.celular, ciudad: d.ciudad, profesion_oficio: d.profesionOficio, cargo: d.cargo,
    experiencia: d.experiencia, especialidad: d.especialidad, edad: d.edad,
    file_url: f?.url, file_asset_id: f?.assetId, file_name: f?.name, mime_type: f?.mime, file_size: f?.size,
    client_id: ref(d.clientRef), fecha_registro: d.fechaRegistro,
    estado_documentacion: d.estadoDocumentacion, notas_validacion: d.notasValidacion,
    activo: d.activo, contrasena_hash: d.contrasenaHash,
  };
}

function mapCaseEvent(d: Doc): Doc {
  return {
    ...base(d),
    case_id: ref(d.case), event_type: d.eventType, description: d.description,
    created_by_id: ref(d.createdBy), created_by_name: d.createdByName, metadata: d.metadata,
  };
}

function mapCaseDocument(d: Doc): Doc {
  const f = resolveFile(d.file);
  return {
    ...base(d),
    case_id: ref(d.case), uploaded_by_id: ref(d.uploadedBy), uploaded_by_name: d.uploadedByName,
    category: d.category,
    file_url: f?.url, file_asset_id: f?.assetId,
    file_name: d.fileName ?? f?.name, mime_type: d.mimeType ?? f?.mime, file_size: d.fileSize ?? f?.size,
    version: d.version, is_visible_to_client: d.isVisibleToClient, description: d.description,
  };
}

function mapQuote(d: Doc): Doc {
  const f = resolveFile(d.quoteDocument);
  return {
    ...base(d),
    case_id: ref(d.case), version: d.version, total_price: d.totalPrice,
    discount_percentage: d.discountPercentage, final_value: d.finalValue, status: d.status,
    valid_until: d.validUntil, sent_at: d.sentAt, approved_at: d.approvedAt,
    approved_by_id: ref(d.approvedBy), rejection_reason: d.rejectionReason, notes: d.notes,
    created_by_id: ref(d.createdBy),
    file_url: f?.url, file_asset_id: f?.assetId, file_name: f?.name, mime_type: f?.mime, file_size: f?.size,
    first_payment_date: d.firstPaymentDate, last_payment_date: d.lastPaymentDate,
    first_payment_percentage: d.firstPaymentPercentage, custom_split: d.customSplit,
  };
}

function mapExpert(d: Doc): Doc {
  const cv = resolveFile(d.cvFile);
  return {
    ...base(d),
    user_id: ref(d.user), disciplines: Array.isArray(d.disciplines) ? d.disciplines : undefined,
    specialization: d.specialization, experience_years: d.experienceYears,
    professional_card: d.professionalCard,
    cv_file_url: cv?.url, cv_file_asset_id: cv?.assetId, cv_file_name: cv?.name,
    cv_mime_type: cv?.mime, cv_file_size: cv?.size,
    city: d.city, region: d.region, base_fee: d.baseFee, fee_currency: d.feeCurrency,
    availability: d.availability, rating: d.rating, total_cases: d.totalCases,
    completed_cases: d.completedCases, validation_status: d.validationStatus,
    validated_by_id: ref(d.validatedBy), validation_notes: d.validationNotes,
    bank_name: d.bankName, bank_account_type: d.bankAccountType,
    bank_account_number: d.bankAccountNumber, tax_id: d.taxId,
  };
}

function mapExpertCertFiles(d: Doc): Doc[] {
  if (!Array.isArray(d.certificationFiles)) return [];
  const rows: Doc[] = [];
  d.certificationFiles.forEach((cf: any, i: number) => {
    const f = resolveFile(cf);
    if (!f) return;
    rows.push({
      id: `${d._id}__cert${i}`,
      expert_id: d._id,
      file_url: f.url, file_asset_id: f.assetId, file_name: f.name, mime_type: f.mime, file_size: f.size,
      sort_order: i,
      created_at: d._createdAt ?? null, updated_at: d._updatedAt ?? null,
    });
  });
  return rows;
}

function mapWorkPlan(d: Doc): Doc {
  return {
    ...base(d),
    case_id: ref(d.case), assigned_expert_id: ref(d.assignedExpert), methodology: d.methodology,
    objectives: d.objectives, start_date: d.startDate, end_date: d.endDate,
    estimated_days: d.estimatedDays, deliverables_description: d.deliverablesDescription,
    status: d.status, submitted_at: d.submittedAt, reviewed_by_id: ref(d.reviewedBy),
    committee_approved_by_id: ref(d.committeeApprovedBy), rejection_comments: d.rejectionComments,
    created_by_id: ref(d.createdBy),
  };
}

function mapWorkPlanActivity(d: Doc): Doc {
  const f = resolveFile(d.file);
  return {
    ...base(d),
    work_plan_id: ref(d.workPlan), case_id: ref(d.case), title: d.title, description: d.description,
    due_date: d.dueDate, status: d.status, assigned_to_id: ref(d.assignedTo),
    file_url: f?.url, file_asset_id: f?.assetId, file_name: f?.name, mime_type: f?.mime, file_size: f?.size,
    started_at: d.startedAt, completed_at: d.completedAt, created_by_id: ref(d.createdBy),
  };
}

function mapDeliverable(d: Doc): Doc {
  const f = resolveFile(d.file);
  return {
    ...base(d),
    case_id: ref(d.case), phase: d.phase, phase_number: d.phaseNumber,
    file_url: f?.url, file_asset_id: f?.assetId,
    file_name: d.fileName ?? f?.name, mime_type: f?.mime, file_size: f?.size,
    submitted_by_id: ref(d.submittedBy), status: d.status, reviewed_by_id: ref(d.reviewedBy),
    approved_by_id: ref(d.approvedBy), comments: d.comments, rejection_reason: d.rejectionReason,
    version: d.version,
  };
}

function mapEvaluation(d: Doc): Doc {
  return {
    ...base(d),
    case_id: ref(d.case), expert_id: ref(d.expert), punctuality_score: d.punctualityScore,
    quality_score: d.qualityScore, service_score: d.serviceScore, final_score: d.finalScore,
    client_feedback: d.clientFeedback, technical_feedback: d.technicalFeedback,
    evaluated_by_id: ref(d.evaluatedBy),
  };
}

function mapHearing(d: Doc): Doc {
  return {
    ...base(d),
    case_id: ref(d.case), scheduled_date: d.scheduledDate, location: d.location,
    court_name: d.courtName, judge_name: d.judgeName, expert_attended: d.expertAttended,
    client_attended: d.clientAttended, duration_minutes: d.durationMinutes, result: d.result,
    notes: d.notes, follow_up_required: d.followUpRequired,
  };
}

function mapPayment(d: Doc): Doc {
  const f = resolveFile(d.receiptFile);
  return {
    ...base(d),
    case_id: ref(d.case), quote_id: ref(d.quote), payment_number: d.paymentNumber, amount: d.amount,
    percentage: d.percentage, due_date: d.dueDate, payment_date: d.paymentDate,
    payment_method: d.paymentMethod, status: d.status, transaction_reference: d.transactionReference,
    file_url: f?.url, file_asset_id: f?.assetId, file_name: f?.name, mime_type: f?.mime, file_size: f?.size,
    notes: d.notes, created_by_id: ref(d.createdBy),
  };
}

function mapCommission(d: Doc): Doc {
  return {
    ...base(d),
    expert_id: ref(d.expert), case_id: ref(d.case), base_amount: d.baseAmount,
    bonus_percentage: d.bonusPercentage, penalty_percentage: d.penaltyPercentage,
    final_amount: d.finalAmount, status: d.status, payment_date: d.paymentDate,
    payment_reference: d.paymentReference,
  };
}

function mapNotification(d: Doc): Doc {
  return {
    ...base(d),
    user_id: ref(d.user), type: d.type, priority: d.priority, title: d.title, message: d.message,
    link_url: d.linkUrl, is_read: d.isRead, read_at: d.readAt,
  };
}

function mapAuditLog(d: Doc): Doc {
  return {
    ...base(d),
    user_id: ref(d.user), action: d.action, entity_type: d.entityType, entity_id: d.entityId,
    old_values: d.oldValues, new_values: d.newValues, ip_address: d.ipAddress,
  };
}

function mapSystemSetting(d: Doc): Doc {
  return { ...base(d), key: d.key, value: d.value, data_type: d.dataType, description: d.description };
}

function mapAdminConfig(d: Doc): Doc {
  return {
    ...base(d),
    master_password_hash: d.masterPasswordHash, secondary_password_hash: d.secondaryPasswordHash,
  };
}

function mapWhatsappLead(d: Doc): Doc {
  return {
    ...base(d),
    phone: d.phone, name: d.name, city: d.city, motive: d.motive, brand: d.brand, status: d.status,
    ai_completed: d.aiCompleted, ai_summary: d.aiSummary, notes: d.notes,
    converted_client_id: ref(d.convertedClient), last_message_at: d.lastMessageAt,
    unread_count: d.unreadCount,
  };
}

function mapWhatsappLeadDocs(d: Doc): Doc[] {
  if (!Array.isArray(d.documents)) return [];
  const rows: Doc[] = [];
  d.documents.forEach((doc: any, i: number) => {
    const f = resolveFile(doc.file);
    rows.push({
      id: `${d._id}__doc${i}`,
      lead_id: d._id,
      file_url: f?.url, file_asset_id: f?.assetId,
      file_name: doc.fileName ?? f?.name, mime_type: doc.mimeType ?? f?.mime, file_size: f?.size,
      sort_order: i,
      created_at: d._createdAt ?? null, updated_at: d._updatedAt ?? null,
    });
  });
  return rows;
}

function mapWhatsappMessage(d: Doc): Doc {
  return {
    ...base(d),
    lead_id: ref(d.lead), direction: d.direction, content: d.content, sender: d.sender,
    agent_name: d.agentName, ts: d.timestamp, media_url: d.mediaUrl, media_type: d.mediaType,
    file_name: d.fileName,
  };
}

function mapWebLead(d: Doc): Doc {
  return {
    ...base(d),
    nombre: d.nombre, email: d.email, mensaje: d.mensaje, origen: d.origen, estado: d.estado, notas: d.notas,
  };
}

// ── Orden topológico de carga ──
const PIPELINE: Array<{ table: string; type: string; map: (d: Doc) => Doc; children?: (d: Doc) => Doc[]; childTable?: string }> = [
  { table: 'company', type: 'company', map: mapCompany },
  { table: 'crm_client', type: 'crmClient', map: mapCrmClient },
  { table: 'crm_user', type: 'crmUser', map: mapCrmUser },
  { table: 'cases', type: 'case', map: mapCase },
  { table: 'registro_peritus', type: 'registroPeritus', map: mapRegistroPeritus },
  { table: 'case_event', type: 'caseEvent', map: mapCaseEvent },
  { table: 'case_document', type: 'caseDocument', map: mapCaseDocument },
  { table: 'quote', type: 'quote', map: mapQuote },
  { table: 'expert', type: 'expert', map: mapExpert, children: mapExpertCertFiles, childTable: 'expert_certification_file' },
  { table: 'work_plan', type: 'workPlan', map: mapWorkPlan },
  { table: 'work_plan_activity', type: 'workPlanActivity', map: mapWorkPlanActivity },
  { table: 'deliverable', type: 'deliverable', map: mapDeliverable },
  { table: 'evaluation', type: 'evaluation', map: mapEvaluation },
  { table: 'hearing', type: 'hearing', map: mapHearing },
  { table: 'payment', type: 'payment', map: mapPayment },
  { table: 'commission', type: 'commission', map: mapCommission },
  { table: 'notification', type: 'notification', map: mapNotification },
  { table: 'audit_log', type: 'auditLog', map: mapAuditLog },
  { table: 'system_setting', type: 'systemSetting', map: mapSystemSetting },
  { table: 'admin_config', type: 'adminConfig', map: mapAdminConfig },
  { table: 'whatsapp_lead', type: 'whatsappLead', map: mapWhatsappLead, children: mapWhatsappLeadDocs, childTable: 'whatsapp_lead_document' },
  { table: 'whatsapp_message', type: 'whatsappMessage', map: mapWhatsappMessage },
  { table: 'web_lead', type: 'webLead', map: mapWebLead },
];

const client = new Client({ connectionString });

// Columnas timestamptz: un string vacío "" de Sanity debe ir como NULL,
// no como '' (que rompería el INSERT por tipo de dato).
const DATE_COLS = new Set([
  'created_at', 'updated_at', 'hearing_date', 'deadline_date', 'fecha_registro', 'valid_until',
  'sent_at', 'approved_at', 'first_payment_date', 'last_payment_date', 'start_date', 'end_date',
  'submitted_at', 'due_date', 'started_at', 'completed_at', 'scheduled_date', 'payment_date',
  'read_at', 'last_message_at', 'ts',
]);

async function insertRow(table: string, row: Doc): Promise<number> {
  const cols: string[] = [];
  const params: unknown[] = [];
  for (const [k, v] of Object.entries(row)) {
    let val: unknown = v;
    if (typeof val === 'string' && val.trim() === '' && DATE_COLS.has(k)) val = null;
    if (val === undefined || val === null) continue;
    cols.push(k);
    params.push(val);
  }
  const ph = cols.map((_, i) => `$${i + 1}`);
  const sql = `INSERT INTO ${table} (${cols.map((c) => `"${c}"`).join(', ')}) VALUES (${ph.join(', ')}) ON CONFLICT (id) DO NOTHING`;
  const res = await client.query(sql, params);
  return res.rowCount ?? 0;
}

async function loadTable(
  table: string,
  docs: Doc[],
  map: (d: Doc) => Doc,
  children?: (d: Doc) => Doc[],
  childTable?: string,
): Promise<void> {
  let inserted = 0;
  let skipped = 0;
  let failed = 0;
  let childInserted = 0;
  const errors: string[] = [];

  for (const d of docs) {
    try {
      const n = await insertRow(table, map(d));
      if (n > 0) inserted++;
      else skipped++;
    } catch (err: any) {
      failed++;
      if (errors.length < 5) errors.push(`${d._id}: ${err.message}`);
      continue; // sin fila padre no insertamos sus hijos
    }
    if (children && childTable) {
      for (const childRow of children(d)) {
        try {
          const n = await insertRow(childTable, childRow);
          if (n > 0) childInserted++;
        } catch (err: any) {
          if (errors.length < 5) errors.push(`${childRow.id}: ${err.message}`);
        }
      }
    }
  }

  const childMsg = childTable ? ` | ${childTable}: +${childInserted}` : '';
  console.log(`✔ ${table.padEnd(26)} insertadas=${inserted} ya_existían=${skipped} fallidas=${failed}${childMsg}`);
  for (const e of errors) console.log(`    ⚠ ${e}`);
}

async function main(): Promise<void> {
  console.log(`Leídas ${totalLines} líneas | assets=${assets.size} | borradores omitidos=${drafts} | tipos desconocidos=${unknown}`);
  await client.connect();
  try {
    for (const step of PIPELINE) {
      const docs = byType.get(step.type) ?? [];
      if (docs.length === 0) {
        console.log(`· ${step.table.padEnd(26)} (sin documentos)`);
        continue;
      }
      await loadTable(step.table, docs, step.map, step.children, step.childTable);
    }
    console.log('\nMigración de datos completada.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Falló la migración de datos:', err);
  process.exit(1);
});
