// scripts/import-dictamenes.js
// Importa los 54 dictámenes del Excel al CRM (Sanity)
// Uso: node scripts/import-dictamenes.js

const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── CONFIG ────────────────────────────────────────────────────────────────
const PROJECT_ID = 'fbva5pcb';
const DATASET = 'production';
const TOKEN = 'sk1DIBEb2MyE8DV54GQqpO2GWM7pneExkxMYI4x3PkEsCaEqgKXLI5gMJdy8YvnYWUaQVRPmDPSkhDeQHSNPRWoqpXeC9udhvUP0JmfmdmK2fYREOquWo48NPjUovat9W0VOyV6WaAbKAB58CEmPIj7yVYXZL2S1WgbsTqZZpHl4sIjcqWYS';
const API_VERSION = '2024-01-01';
const BRAND = 'CNP';

// ─── HELPERS HTTP ──────────────────────────────────────────────────────────
function sanityRequest(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/${endpoint}`);
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          else resolve(parsed);
        } catch { reject(new Error(`Parse error: ${raw}`)); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function groqQuery(query, params = {}) {
  const qs = new URLSearchParams({ query, ...Object.fromEntries(Object.entries(params).map(([k, v]) => [`$${k}`, JSON.stringify(v)])) });
  return sanityRequest('GET', `data/query/${DATASET}?${qs}`).then(r => r.result);
}

function mutate(mutations) {
  return sanityRequest('POST', `data/mutate/${DATASET}?returnIds=true`, { mutations });
}

// ─── MAPEOS ────────────────────────────────────────────────────────────────
function mapDiscipline(asesoria) {
  const a = (asesoria || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (a.includes('inform') ) return 'informatico';
  if (a.includes('contable')) return 'contable';
  if (a.includes('ingenier')) return 'ingenieria';
  if (a.includes('financiero') || a.includes('pericial') || a.includes('perjuicio') || a.includes('dictamen')) return 'financiero';
  return 'otro';
}

function mapComplexity(categoria) {
  const c = (categoria || '').toUpperCase().trim();
  if (c === 'JUNIOR') return 'baja';
  if (c === 'SENIOR') return 'alta';
  if (c === 'MAGISTER') return 'critica';
  return 'media';
}

function mapStatus(estado) {
  const e = (estado || '').toUpperCase().trim();
  if (e.includes('ENTREGADO') || e.includes('TERMINADO') || e.includes('CONCILIO') || e.includes('ASISTIO') || e.includes('REALIZADO')) return 'gestionado';
  if (e.includes('CANCEL')) return 'cancelado';
  return 'creado';
}

function parseAmount(valor) {
  if (!valor || valor === 'ND' || typeof valor === 'string' && valor.startsWith('=')) return 0;
  if (typeof valor === 'number') return valor;
  const n = parseFloat(String(valor).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

function extractCity(juzgado) {
  if (!juzgado || juzgado === 'ND' || juzgado === 'No se presenta información') return '';
  const j = juzgado.toUpperCase();
  if (j.includes('CALI')) return 'Cali';
  if (j.includes('BOGOT') || j.includes('BOGOTA')) return 'Bogotá';
  if (j.includes('MEDELLIN') || j.includes('MEDELLÍN')) return 'Medellín';
  if (j.includes('MONTERIA') || j.includes('MONTERÍA')) return 'Montería';
  if (j.includes('CUCUTA') || j.includes('CÚCUTA')) return 'Cúcuta';
  if (j.includes('PALMIRA')) return 'Palmira';
  if (j.includes('VALLE')) return 'Valle';
  return '';
}

function cleanString(s) {
  if (!s || s === 'ND' || s === 'No se presenta información') return '';
  return String(s).trim().replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ');
}

// ─── DATOS DEL EXCEL (extraídos) ───────────────────────────────────────────
const DICTAMENES = [
  { num: 1, fecha: "18/04/2024", cliente: "INFOMEDICAL DE COLOMBIA S.A.S", demandado: "JOHNSON & TAYLOS DE COLOMBIA SAS", abogado: "XIMENA MARTIN", asesoria: "DICTAMEN PERICIAL", objetivo: "Verificar la existencia de obligaciones en la contabilidad de la entidad demandante", categoria: "SENIOR", valor: 4000000, estado: "ENTREGADO", identificacion: "900717614-5", juzgado: "08 CIVIL CIRCUITO CALI", tipo_proceso: "EJECUTIVO de mayor cuantía", radicado: "760013103008-2023-00027-00" },
  { num: 2, fecha: "27/01/2025", cliente: "BANCOLOMBIA S.A.", demandado: "INVERSIONES CH &D LTDA", abogado: "SANDRA OÑATE", asesoria: "DICTAMEN PERICIAL-FINANCIERO", objetivo: "Controbertir la prueba presentada por la parte demandada", categoria: "SENIOR", valor: 8541000, estado: "ENTREGADO, TERMINADO EN AUDIENCIA", identificacion: "890.903.938-8", juzgado: "01 CIVIL CIRCUITO MONTERIA", tipo_proceso: "RESTITUCIÓN DE TENENCIA(EJECUTIVO)", radicado: "230013103001-2020-00035-00" },
  { num: 3, fecha: "02/12/2021", cliente: "BANCO FALABELLA S.A.", demandado: "PEDRO NELL JARAMILLO", abogado: "JAIME SUAREZ ESCAMILLA", asesoria: "DICTAMEN PERICIAL-FINANCIERO", objetivo: "Analizar el dictamen pericial presentado por la parte demandante", categoria: "JUNIOR", valor: 2000000, estado: "ENTREGADO, SE CONCILIO EN AUDIENCIA", identificacion: "900.047.981-8", juzgado: "11 CIVIL CIRCUITO CALI", tipo_proceso: "DECLARACIÓN", radicado: "" },
  { num: 4, fecha: "", cliente: "JORGE IGNACIO SANCHEZ", demandado: "TULIA AIDA FRANCO", abogado: "", asesoria: "DICTAMEN PERICIAL-FINANCIERO", objetivo: "Dictamen de controversia y determinar las cifras, dentro del proceso de sucesión.", categoria: "JUNIOR", valor: 0, estado: "ENTREGADO", identificacion: "", juzgado: "Juzgado 15 civil Municipal", tipo_proceso: "", radicado: "" },
  { num: 5, fecha: "", cliente: "WILSON STEVEN GARCIA TABARES", demandado: "CLINICA REY DAVID", abogado: "TULIO ORJUELA", asesoria: "DICTAMEN PERICIAL-FINANCIERO", objetivo: "Determinar perjuicios sufridos por la familia.", categoria: "JUNIOR", valor: 3000000, estado: "ENTREGADO", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: 6, fecha: "23/06/2022", cliente: "ENERGÉTICOS SA ESP", demandado: "MARISOL SEGURA DIAZ Y OTROS", abogado: "VLADIMIR JIMENEZ PUERTA", asesoria: "DICTAMEN PERICIAL - FINANCIERO", objetivo: "Analizar el dictamen que acompaña la demanda, determinando la existencia de los perjuicios alegados por la parte demandante", categoria: "SENIOR", valor: 8000000, estado: "ENTREGADO, Y TERMINADO EN AUDIENCIA", identificacion: "830.092965-7", juzgado: "", tipo_proceso: "DECLARACIÓN", radicado: "" },
  { num: 7, fecha: "14/09/2020", cliente: "GIL MÉDICA S.A", demandado: "E.S.E. ANTONIO NARIÑO Y OTROS", abogado: "", asesoria: "DICTAMEN FINANCIERO", objetivo: "Evidenciar los daños y perjuicios en la modalidad de daño emergente y lucro cesante", categoria: "MAGISTER", valor: 7500000, estado: "ENTREGADO", identificacion: "890.317.417-9", juzgado: "TRIBUNAL CONTENCIOSO ADMINISTRATIVO DEL VALLE", tipo_proceso: "REPARACION DIRECTA", radicado: "76001233100020100206000" },
  { num: 8, fecha: "01/06/2023", cliente: "PEDRO NEL JARAMILLO", demandado: "BANCO COLPATRIA", abogado: "PEDRO NEL JARAMILLO", asesoria: "DICTAMEN FINANCIERO", objetivo: "Determinar la incurrencia en anatocismo y capitalización de intereses en el otorgamiento de crédito", categoria: "JUNIOR", valor: 3000000, estado: "ENTREGADO", identificacion: "16.599.293", juzgado: "04 CIVIL CIRCUITO CALI", tipo_proceso: "DECLARACIÓN", radicado: "76001-31-03-004-2021-00175-00" },
  { num: 9, fecha: "31/02/2022", cliente: "FORTOX S.A", demandado: "SINDICATO DE TRABAJADORES", abogado: "", asesoria: "DICTAMEN PERICIAL-CÁLCULO DE PERJUICIOS", objetivo: "Tasación, cuantificación de perjuicios morales y materiales ocasionados", categoria: "JUNIOR", valor: 3000000, estado: "ENTREGADO", identificacion: "860.046.201-2", juzgado: "", tipo_proceso: "EJECUTIVO", radicado: "" },
  { num: 10, fecha: "09/10/2023", cliente: "UNIVALLE", demandado: "EL MUNICIPIO DE PALMIRA", abogado: "CAMILO IROCHI", asesoria: "DICTAMEN PERICIAL", objetivo: "Determinar si existe faltante de dinero en la contabilidad de la compañía Industrias Wescold s.a.s", categoria: "MAGISTER", valor: 25000000, estado: "ENTREGADO, PENDIENTE AUDIENCIA", identificacion: "37339044", juzgado: "18 CIVIL CIRCUITO CALI", tipo_proceso: "EJECUTIVO", radicado: "760013103018-2022-00037-00" },
  { num: 11, fecha: "15/08/2022", cliente: "CAFÉ DEL EJE S.A.S", demandado: "DIPROYCO S.A.S", abogado: "DIEGO MAURICIO TORRES", asesoria: "DICTAMEN FINANCIERO", objetivo: "Análisis financiero y determinación de perjuicios", categoria: "JUNIOR", valor: 4000000, estado: "ENTREGADO, SE ASISTIO A AUDIENCIA", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: 12, fecha: "", cliente: "INMAC S.A.S", demandado: "ELÉCTRICAS DE MEDELLÍN", abogado: "", asesoria: "DICTAMEN FINANCIERO", objetivo: "Análisis financiero de las obligaciones entre las partes", categoria: "SENIOR", valor: 5355000, estado: "ENTREGADO", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: 13, fecha: "", cliente: "MOHAMAD KAMEL SALEH", demandado: "SOCIEDAD DE ACTIVOS ESPECIALES S.A.S", abogado: "", asesoria: "DICTAMEN PERICIAL-CÁLCULO DE PERJUICIOS", objetivo: "Cálculo y cuantificación de perjuicios", categoria: "JUNIOR", valor: 3500000, estado: "ENTREGADO", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: 14, fecha: "", cliente: "ALVARO HURTADO - CONSTRUCTORA ALPES S.A", demandado: "ALIANZA FIDUCIARIA S.A. / CONSTRUCTORA ALPES S.A", abogado: "ALVARO HURTADO", asesoria: "DICTAMEN PERICIAL-CÁLCULO DE PERJUICIOS", objetivo: "Cálculo de perjuicios en proceso constructivo", categoria: "JUNIOR", valor: 5000000, estado: "ENTREGADO", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: 15, fecha: "", cliente: "ACOSTAS & CIA S. EN C.S. EN LIQUIDACIÓN", demandado: "REVISIÓN INTERNA", abogado: "", asesoria: "DICTAMEN FINANCIERO-CONTABLE", objetivo: "Revisión y dictamen contable en proceso de liquidación", categoria: "MAGISTER", valor: 45000000, estado: "ENTREGADO, 2 DICTAMENES", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: 16, fecha: "", cliente: "MERCEDES BASTIDAS DAZA Y OTROS", demandado: "SANCHEZ RADIOLOGOS SAS Y OTROS", abogado: "", asesoria: "DICTAMEN FINANCIERO", objetivo: "Determinación de perjuicios en proceso médico", categoria: "JUNIOR", valor: 3000000, estado: "ENTREGADO", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: 17, fecha: "", cliente: "TRIBUNAL ARBITRAMIENTO CÚCUTA", demandado: "MUNICIPIO DE SAN JOSÉ DE CÚCUTA", abogado: "LIBARDO SANCHEZ", asesoria: "SOLICITUD ACLARACIÓN DICTAMEN", objetivo: "Aclaración de dictamen pericial ante tribunal de arbitramento", categoria: "MAGISTER", valor: 15000000, estado: "ENTREGADO, TERMINADO EN AUDIENCIA", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: 18, fecha: "", cliente: "DAVID CUENCA VELEZ - DR FACE S.A.S", demandado: "BANCOLOMBIA", abogado: "DAVID CUENCA", asesoria: "DICTAMEN FINANCIERO-CALCULO DE PERJUICIOS", objetivo: "Cálculo de perjuicios financieros para demanda", categoria: "JUNIOR", valor: 3000000, estado: "ENTREGADO, ACTUALIZAR PARA DEMANDA", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: 19, fecha: "", cliente: "CARLOS ARTURO BENAVIDES GARZÓN", demandado: "BANCO DAVIVIENDA S.A.", abogado: "CECILIA GARZON", asesoria: "DICTAMEN FINANCIERO", objetivo: "Análisis financiero de obligaciones bancarias", categoria: "JUNIOR", valor: 3500000, estado: "ENTREGADO, PENDIENTE AUDIENCIA", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: 20, fecha: "", cliente: "COLEGIO NACIONAL DE ECÓLOGOS", demandado: "", abogado: "", asesoria: "DICTAMEN FINANCIERO", objetivo: "Dictamen financiero-contable institucional", categoria: "JUNIOR", valor: 3000000, estado: "ENTREGADO", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: 21, fecha: "", cliente: "SANIN TRUJILLO S.A.S", demandado: "", abogado: "", asesoria: "otro", objetivo: "Asesoría financiera", categoria: "SENIOR", valor: 0, estado: "ENTREGADO", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: 22, fecha: "", cliente: "HAMBURGO CAPITAL", demandado: "FIDUCIA", abogado: "", asesoria: "DICTAMEN FINANCIERO", objetivo: "Dictamen financiero en proceso fiduciario", categoria: "JUNIOR", valor: 2700000, estado: "ENTREGADO, PENDIENTE AUDIENCIA Y COBRO DEL 15%", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: 23, fecha: "", cliente: "MÓNICA JARAMILLO GOMEZ", demandado: "MANUFACETURAS ANAELL S.A.S.", abogado: "", asesoria: "DICTAMEN PERICIAL", objetivo: "Dictamen pericial en proceso judicial", categoria: "JUNIOR", valor: 2500000, estado: "ENTREGADO", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: 24, fecha: "", cliente: "PROMOTARA DICASA S.A.S - ALMADIA INGENIEROS CONSTRUCTORES S.A.S", demandado: "G3 SOLUCIÓN INTEGRAL INMOVILIARIA S.A.S.", abogado: "", asesoria: "DICTAMEN FINANCIERO", objetivo: "Dictamen financiero en proceso constructivo", categoria: "MEDIA", valor: 0, estado: "ND", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: 25, fecha: "", cliente: "ESTRATEGIAS EFECTIVAS", demandado: "ACCCION FIDUCIARIA SA", abogado: "", asesoria: "DICTAMEN FINANCIERO", objetivo: "Dictamen financiero en proceso fiduciario", categoria: "JUNIOR", valor: 0, estado: "ENTREGADO", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: 26, fecha: "", cliente: "REPRESENTACIONES GARCIA POLO", demandado: "ROXCEL", abogado: "", asesoria: "DICTAMEN FINANCIERO", objetivo: "Dictamen financiero comercial", categoria: "JUNIOR", valor: 4000000, estado: "ENTREGADO", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: 27, fecha: "", cliente: "EL SURTIDOR-RODAMIENTOS", demandado: "EL ESTADO", abogado: "", asesoria: "DICTAMEN FINANCIERO", objetivo: "Dictamen financiero contra el Estado", categoria: "JUNIOR", valor: 4000000, estado: "ENTREGADO", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: 28, fecha: "", cliente: "DICEL S.A. E.S.P", demandado: "MINISTERIO DE MINAS Y ENERGIA", abogado: "", asesoria: "DICTAMEN FINANCIERO", objetivo: "Dictamen financiero en proceso regulatorio energético", categoria: "MAGISTER", valor: 50000000, estado: "ENTREGADO", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: 29, fecha: "", cliente: "HIDROPURA LTDA", demandado: "EL ESTADO", abogado: "", asesoria: "DICTAMEN FINANCIERO", objetivo: "Dictamen financiero en proceso contencioso administrativo", categoria: "SENIOR", valor: 5000000, estado: "ENTREGADO", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: 30, fecha: "", cliente: "TROVINA", demandado: "PERSONAL DE LA EMPRESA", abogado: "", asesoria: "DICTAMEN FINANCIERO", objetivo: "Dictamen financiero en proceso laboral interno", categoria: "SENIOR", valor: 15000000, estado: "ENTREGADO, PENDIENTE AUDIENCIA", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: 31, fecha: "", cliente: "JESUS ALFONSO CARDONA", demandado: "NERY ONEIDA ROJAS Y OTROS", abogado: "", asesoria: "DICTAMEN FINANCIERO", objetivo: "Dictamen financiero en proceso civil", categoria: "JUNIOR", valor: 3000000, estado: "ENTREGADO, PENDIENTE AUDIENCIA", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: null, fecha: "", cliente: "DR. OMAR MISNAZA", demandado: "", abogado: "", asesoria: "DICTAMEN FINANCIERO", objetivo: "Dictamen financiero", categoria: "MEDIA", valor: 0, estado: "ND", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: null, fecha: "", cliente: "JUAN CAMILO DONCEL", demandado: "GRUPO JAGUAR S.A.S", abogado: "", asesoria: "otro", objetivo: "Asesoría", categoria: "MEDIA", valor: 9000000, estado: "ND", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: null, fecha: "", cliente: "EDGARDO LONDOÑO", demandado: "", abogado: "", asesoria: "otro", objetivo: "Dictamen pendiente de realizar", categoria: "MEDIA", valor: 0, estado: "POR HACER", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: null, fecha: "", cliente: "JARAMILLO MORA", demandado: "", abogado: "", asesoria: "DICTAMEN INFORMATICO", objetivo: "Dictamen informático", categoria: "JUNIOR", valor: 4500000, estado: "ENTREGADO, NO INCLUYE AUDIENCIA", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: null, fecha: "", cliente: "AROPECUARIA ARIAS", demandado: "", abogado: "", asesoria: "otro", objetivo: "Dictamen pendiente de realizar", categoria: "JUNIOR", valor: 20000000, estado: "PENDIENTE REALIZAR", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: null, fecha: "", cliente: "DUE DILIGENCE", demandado: "", abogado: "", asesoria: "otro", objetivo: "Due Diligence", categoria: "SENIOR", valor: 55000000, estado: "COTIZACION", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: null, fecha: "", cliente: "RUTA N", demandado: "", abogado: "", asesoria: "otro", objetivo: "Dictamen pendiente de revisión", categoria: "SENIOR", valor: 25000000, estado: "PENDIENTE REVISIÓN", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: null, fecha: "", cliente: "SEGUROS BOLIVAR", demandado: "", abogado: "", asesoria: "otro", objetivo: "Dictamen en revisión", categoria: "MEDIA", valor: 4000000, estado: "PENDIENTE REVISIÓN", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: null, fecha: "", cliente: "MARCAS EMPRESARIAL", demandado: "", abogado: "", asesoria: "otro", objetivo: "Dictamen empresarial", categoria: "MEDIA", valor: 5500000, estado: "ENTREGADO", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: null, fecha: "", cliente: "COLBOLETOS", demandado: "PLAZA DE TOROS", abogado: "", asesoria: "otro", objetivo: "Dictamen pendiente de revisión", categoria: "MEDIA", valor: 25000000, estado: "PENDIENTE DE REVISIÓN", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: null, fecha: "", cliente: "DEBIA DILIGENCIA", demandado: "", abogado: "", asesoria: "otro", objetivo: "Asesoría", categoria: "MEDIA", valor: 0, estado: "ND", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: null, fecha: "", cliente: "MEDICO TRASTOMIA", demandado: "", abogado: "", asesoria: "DICTAMEN FINANCIERO", objetivo: "Dictamen médico-financiero", categoria: "MEDIA", valor: 0, estado: "ND", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: null, fecha: "", cliente: "JUAN SEBASTIAN FERNANDEZ DIAZ", demandado: "", abogado: "", asesoria: "otro", objetivo: "Asesoría", categoria: "MEDIA", valor: 0, estado: "ND", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: null, fecha: "", cliente: "MEGAPROYECTOS", demandado: "EMCALI", abogado: "", asesoria: "DICTAMEN FINANCIERO", objetivo: "Dictamen financiero - Pendiente valor (Marcel)", categoria: "MEDIA", valor: 0, estado: "ENTREGADO", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: null, fecha: "", cliente: "ELECTROMILLONARIA, FRATELLI, KEEWAY", demandado: "", abogado: "", asesoria: "DICTAMEN FINANCIERO", objetivo: "Dictamen financiero - Pendiente valor (Marcel)", categoria: "MEDIA", valor: 0, estado: "ENTREGADO", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: null, fecha: "", cliente: "SUPERMERCADOS LA GRAN COLOMBIA", demandado: "VENTANILLA VERDE", abogado: "", asesoria: "DICTAMEN FINANCIERO", objetivo: "Dictamen financiero en revisión", categoria: "MEDIA", valor: 0, estado: "POR REVISIÓN", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: null, fecha: "", cliente: "ASADOS EXQUISITOS", demandado: "MUNICIPIO", abogado: "", asesoria: "DICTAMEN FINANCIERO", objetivo: "Dictamen financiero en realización", categoria: "MEDIA", valor: 18000000, estado: "EN REALIZACIÓN", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: null, fecha: "", cliente: "TULIO ORJUELA - CASO SALUD", demandado: "CLINICA AMIGA O VALLE DE LILI", abogado: "", asesoria: "DICTAMEN FINANCIERO", objetivo: "Dictamen financiero en proceso de salud", categoria: "MEDIA", valor: 3000000, estado: "PARA INICIAR", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: null, fecha: "", cliente: "GASES DE OCCIDENTE", demandado: "SUPERINTENDENCIA", abogado: "", asesoria: "DICTAMEN CON INGENIEROS", objetivo: "Dictamen con ingenieros - prospecto", categoria: "MEDIA", valor: 0, estado: "PROSPECTO", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: null, fecha: "", cliente: "LEASING", demandado: "", abogado: "", asesoria: "otro", objetivo: "Asesoría en cotización", categoria: "MEDIA", valor: 0, estado: "EN COTIZACIÓN", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: null, fecha: "", cliente: "AMPARA", demandado: "", abogado: "", asesoria: "otro", objetivo: "Asesoría", categoria: "MEDIA", valor: 0, estado: "ND", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: null, fecha: "", cliente: "CARRETERAS CONSORCIO UNICA", demandado: "", abogado: "", asesoria: "otro", objetivo: "Asesoría - prospecto", categoria: "MEDIA", valor: 0, estado: "PROSPECTO", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
  { num: null, fecha: "", cliente: "PAULINA LLERENA", demandado: "C.I. PRODECO S.A", abogado: "", asesoria: "DICTAMEN PERICIAL", objetivo: "Dictamen pericial en cotización", categoria: "MEDIA", valor: 0, estado: "EN COTIZACIÓN", identificacion: "", juzgado: "", tipo_proceso: "", radicado: "" },
];

// ─── MAIN ──────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n📋 Importando ${DICTAMENES.length} dictámenes al CRM...\n`);

  // 1. Cargar todos los clientes existentes
  console.log('🔍 Cargando clientes existentes...');
  const existingClients = await groqQuery(
    `*[_type == "crmClient" && brand == $brand]{ _id, name }`,
    { brand: BRAND }
  );
  console.log(`   → ${existingClients.length} clientes encontrados en Sanity\n`);

  // Mapa nombre → id (normalizado a uppercase sin espacios extra)
  const clientMap = {};
  for (const c of existingClients) {
    clientMap[c.name.toUpperCase().trim()] = c._id;
  }

  // 2. Obtener último código de caso CNP para el año actual
  const year = new Date().getFullYear();
  const prefix = `CNP-${year}-`;
  const latestCase = await groqQuery(
    `*[_type == "case" && brand == $brand && caseCode match $prefix + "*"]|order(caseCode desc)[0]{ caseCode }`,
    { brand: BRAND, prefix }
  );
  let caseCounter = 0;
  if (latestCase?.caseCode) {
    const numStr = latestCase.caseCode.replace(prefix, '');
    caseCounter = parseInt(numStr, 10);
  }

  function nextCaseCode() {
    caseCounter++;
    return `${prefix}${String(caseCounter).padStart(4, '0')}`;
  }

  // 3. Procesar cada dictamen
  let created = 0, skipped = 0, errors = 0;
  const results = [];

  for (const d of DICTAMENES) {
    const clientName = cleanString(d.cliente);
    if (!clientName) { skipped++; continue; }

    try {
      // 3a. Buscar o crear cliente
      const clientKey = clientName.toUpperCase();
      let clientId = clientMap[clientKey];

      if (!clientId) {
        console.log(`  ➕ Creando cliente: ${clientName}`);
        const notes = d.identificacion
          ? `NIT/CC: ${d.identificacion}`
          : '';
        const res = await mutate([{
          create: {
            _type: 'crmClient',
            brand: BRAND,
            name: clientName,
            email: '',
            phone: '',
            company: clientName,
            position: '',
            notes,
            status: 'activo',
            createdBy: 'Importación Excel DICTAMENES-2025',
          }
        }]);
        clientId = res.results?.[0]?.id;
        clientMap[clientKey] = clientId;
        console.log(`     → Creado con ID: ${clientId}`);
      } else {
        console.log(`  ✅ Cliente existente: ${clientName} (${clientId})`);
      }

      if (!clientId) {
        console.error(`  ❌ No se pudo obtener/crear ID para cliente: ${clientName}`);
        errors++;
        continue;
      }

      // 3b. Construir título del caso
      const asesoriaClean = cleanString(d.asesoria);
      const title = asesoriaClean && asesoriaClean !== 'otro'
        ? `${asesoriaClean} - ${clientName}`
        : `Asesoría Pericial - ${clientName}`;

      // 3c. Construir descripción
      const parts = [];
      if (d.objetivo) parts.push(`Objetivo: ${cleanString(d.objetivo)}`);
      if (d.demandado) parts.push(`Parte demandada: ${cleanString(d.demandado)}`);
      if (d.abogado && d.abogado !== 'ND') parts.push(`Abogado contacto: ${cleanString(d.abogado)}`);
      if (d.tipo_proceso && d.tipo_proceso !== 'ND') parts.push(`Tipo de proceso: ${cleanString(d.tipo_proceso)}`);
      if (d.estado) parts.push(`Estado dictamen: ${cleanString(d.estado)}`);
      const description = parts.join('\n');

      // 3d. Mapeos
      const discipline = mapDiscipline(d.asesoria);
      const complexity = mapComplexity(d.categoria);
      const status = mapStatus(d.estado);
      const estimatedAmount = parseAmount(d.valor);
      const courtName = cleanString(d.juzgado) === 'No se presenta información' ? '' : cleanString(d.juzgado);
      const caseNumber = cleanString(d.radicado) === 'No se presenta información' || cleanString(d.radicado) === 'ND' ? '' : cleanString(d.radicado);
      const city = extractCity(d.juzgado);
      const caseCode = nextCaseCode();

      // 3e. Crear caso
      console.log(`  📁 Creando caso [${caseCode}]: ${title.substring(0, 60)}...`);
      const caseRes = await mutate([{
        create: {
          _type: 'case',
          brand: BRAND,
          caseCode,
          title,
          description,
          discipline,
          status,
          complexity,
          priority: 'normal',
          estimatedAmount,
          hasHearing: false,
          city,
          courtName,
          caseNumber,
          riskScore: 0,
          client: { _type: 'reference', _ref: clientId },
        }
      }]);

      const caseId = caseRes.results?.[0]?.id;
      console.log(`     → Caso creado: ${caseId}`);
      results.push({ num: d.num, clientName, caseCode, caseId, status });
      created++;

      // Pequeña pausa para no saturar la API
      await new Promise(r => setTimeout(r, 150));

    } catch (err) {
      console.error(`  ❌ Error en [${d.num || 'sin num'}] ${d.cliente}: ${err.message}`);
      errors++;
    }
  }

  // 4. Resumen
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESUMEN DE IMPORTACIÓN');
  console.log('═'.repeat(60));
  console.log(`  ✅ Casos creados:  ${created}`);
  console.log(`  ⏭  Omitidos:       ${skipped}`);
  console.log(`  ❌ Errores:        ${errors}`);
  console.log('═'.repeat(60));

  // Guardar log
  const logPath = path.join(__dirname, 'import-results.json');
  fs.writeFileSync(logPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Log guardado en: ${logPath}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
