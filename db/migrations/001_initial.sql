-- ============================================================================
-- CNP | PERITUS — Esquema inicial PostgreSQL (migración desde Sanity)
-- Migración 001_initial
--
-- Convenciones:
--   * id TEXT PRIMARY KEY  → conserva el _id original de Sanity (migración 1:1).
--   * created_at / updated_at TIMESTAMPTZ con trigger de updated_at.
--   * Los archivos siguen en el CDN de Sanity. Solo se guardan, por fila con
--     adjunto: file_url, file_asset_id, file_name, mime_type, file_size.
--   * Las referencias (_ref de Sanity) se vuelven FKs reales:
--       - actores/usuarios → ON DELETE SET NULL (no borrar registros de negocio)
--       - hijos de un caso/lead → ON DELETE CASCADE
-- ============================================================================

BEGIN;

-- Extensión para búsquedas por prefijo/parcial (reemplaza `match "*"` de GROQ).
-- Requiere privilegio; si cnp_user no puede crearla, ejecutar como superusuario:
--   CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
CREATE TYPE user_role               AS ENUM ('admin','juridico','financiero','administrativo','mercadeo','postventa','cliente','perito','tecnico');
CREATE TYPE brand                   AS ENUM ('CNP','Peritus');
CREATE TYPE company_type            AS ENUM ('firma_abogados','empresa','particular');
CREATE TYPE client_status           AS ENUM ('activo','inactivo','prospecto');
CREATE TYPE case_discipline         AS ENUM ('financiero','medico','grafologia','ingenieria','arquitectura','contable','ambiental','informatico','valuacion','otro');
CREATE TYPE case_status             AS ENUM ('creado','gestionado','cancelado','archivado');
CREATE TYPE case_complexity         AS ENUM ('baja','media','alta','critica');
CREATE TYPE case_priority           AS ENUM ('baja','normal','alta','urgente');
CREATE TYPE case_event_type         AS ENUM ('case_created','status_changed','assignment','document_uploaded','quote_created','quote_approved','quote_rejected','deliverable_submitted','deliverable_approved','payment_recorded','comment','other');
CREATE TYPE document_category       AS ENUM ('demanda','soporte_tecnico','contrato','cotizacion','plan_trabajo','entrega_parcial','dictamen_final','audiencia','pago','otro');
CREATE TYPE quote_status            AS ENUM ('borrador','enviada','aprobada','rechazada','expirada');
CREATE TYPE expert_availability     AS ENUM ('disponible','ocupado','no_disponible');
CREATE TYPE expert_validation_status AS ENUM ('pendiente','aprobado','rechazado');
CREATE TYPE bank_account_type       AS ENUM ('ahorros','corriente');
CREATE TYPE work_plan_status        AS ENUM ('borrador','enviado','en_revision','aprobado','rechazado');
CREATE TYPE activity_status         AS ENUM ('pendiente','en_progreso','completada');
CREATE TYPE deliverable_phase       AS ENUM ('marco_conceptual','desarrollo_tecnico','dictamen_final');
CREATE TYPE deliverable_status      AS ENUM ('enviado','en_revision','aprobado','rechazado');
CREATE TYPE hearing_result          AS ENUM ('favorable','desfavorable','aplazada','pendiente');
CREATE TYPE payment_method          AS ENUM ('transferencia','cheque','efectivo','tarjeta','otro');
CREATE TYPE payment_status          AS ENUM ('pendiente','validado','anulado');
CREATE TYPE commission_status       AS ENUM ('pendiente','pagada','anulada');
CREATE TYPE notification_type       AS ENUM ('info','warning','success','error');
CREATE TYPE notification_priority   AS ENUM ('baja','normal','alta');
CREATE TYPE lead_status             AS ENUM ('nuevo','en_conversacion','completado','descartado','convertido');
CREATE TYPE message_direction       AS ENUM ('incoming','outgoing');
CREATE TYPE message_sender          AS ENUM ('client','ai','agent');
CREATE TYPE peritus_doc_status      AS ENUM ('pendiente','revision','aprobado','denegado');
CREATE TYPE web_lead_origin         AS ENUM ('landing','abogados','empresas','jueces');
CREATE TYPE web_lead_status         AS ENUM ('nuevo','en_gestion','convertido','descartado');

-- ----------------------------------------------------------------------------
-- TRIGGER de updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLAS
-- ============================================================================

-- company --------------------------------------------------------------------
CREATE TABLE company (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  nit             TEXT,
  type            company_type,
  address         TEXT,
  city            TEXT,
  country         TEXT DEFAULT 'Colombia',
  phone           TEXT,
  website         TEXT,
  billing_email   TEXT,
  logo_url        TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_company_is_active ON company (is_active);
CREATE INDEX idx_company_name_trgm ON company USING gin (name gin_trgm_ops);
CREATE INDEX idx_company_nit_trgm  ON company USING gin (nit gin_trgm_ops);

-- crm_client -----------------------------------------------------------------
CREATE TABLE crm_client (
  id              TEXT PRIMARY KEY,
  brand           brand NOT NULL DEFAULT 'CNP',
  name            TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  company         TEXT,
  position        TEXT,
  notes           TEXT,
  status          client_status,
  created_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_crm_client_brand     ON crm_client (brand);
CREATE INDEX idx_crm_client_status    ON crm_client (status);
CREATE INDEX idx_crm_client_name_trgm  ON crm_client USING gin (name gin_trgm_ops);
CREATE INDEX idx_crm_client_email_trgm ON crm_client USING gin (email gin_trgm_ops);
CREATE INDEX idx_crm_client_company_trgm ON crm_client USING gin (company gin_trgm_ops);

-- crm_user -------------------------------------------------------------------
CREATE TABLE crm_user (
  id                    TEXT PRIMARY KEY,
  username              TEXT,
  email                 TEXT,
  display_name          TEXT,
  phone                 TEXT,
  password_hash         TEXT,
  role                  user_role NOT NULL DEFAULT 'juridico',
  active                BOOLEAN NOT NULL DEFAULT TRUE,
  must_change_password  BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_url            TEXT,
  company_id            TEXT REFERENCES company(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_crm_user_username ON crm_user (lower(username)) WHERE username IS NOT NULL;
CREATE INDEX idx_crm_user_email   ON crm_user (lower(email));
CREATE INDEX idx_crm_user_role    ON crm_user (role);
CREATE INDEX idx_crm_user_active  ON crm_user (active);
CREATE INDEX idx_crm_user_company ON crm_user (company_id);

-- cases (entidad "case"; nombre de tabla en plural por ser palabra reservada) -
CREATE TABLE cases (
  id                      TEXT PRIMARY KEY,
  brand                   brand NOT NULL DEFAULT 'CNP',
  case_code               TEXT,
  title                   TEXT NOT NULL,
  description             TEXT,
  client_id               TEXT REFERENCES crm_client(id) ON DELETE SET NULL,
  commercial_id           TEXT REFERENCES crm_user(id)   ON DELETE SET NULL,
  technical_analyst_id    TEXT REFERENCES crm_user(id)   ON DELETE SET NULL,
  assigned_expert_id      TEXT REFERENCES crm_user(id)   ON DELETE SET NULL,
  assigned_financiero_id  TEXT REFERENCES crm_user(id)   ON DELETE SET NULL,
  discipline              case_discipline,
  status                  case_status NOT NULL DEFAULT 'creado',
  status_changed_by_role  TEXT,
  complexity              case_complexity NOT NULL DEFAULT 'media',
  priority                case_priority NOT NULL DEFAULT 'normal',
  estimated_amount        NUMERIC(15,2),
  has_hearing             BOOLEAN NOT NULL DEFAULT FALSE,
  hearing_date            TIMESTAMPTZ,
  hearing_link            TEXT,
  deadline_date           TIMESTAMPTZ,
  city                    TEXT,
  court_name              TEXT,
  case_number             TEXT,
  risk_score              NUMERIC,
  created_by_id           TEXT REFERENCES crm_user(id)   ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_cases_case_code   ON cases (case_code) WHERE case_code IS NOT NULL;
CREATE INDEX idx_cases_status             ON cases (status);
CREATE INDEX idx_cases_brand              ON cases (brand);
CREATE INDEX idx_cases_discipline         ON cases (discipline);
CREATE INDEX idx_cases_deadline           ON cases (deadline_date);
CREATE INDEX idx_cases_client             ON cases (client_id);
CREATE INDEX idx_cases_commercial         ON cases (commercial_id);
CREATE INDEX idx_cases_technical_analyst  ON cases (technical_analyst_id);
CREATE INDEX idx_cases_assigned_expert    ON cases (assigned_expert_id);
CREATE INDEX idx_cases_assigned_financiero ON cases (assigned_financiero_id);
CREATE INDEX idx_cases_created_by         ON cases (created_by_id);
CREATE INDEX idx_cases_title_trgm         ON cases USING gin (title gin_trgm_ops);
CREATE INDEX idx_cases_case_code_trgm     ON cases USING gin (case_code gin_trgm_ops);
CREATE INDEX idx_cases_city_trgm          ON cases USING gin (city gin_trgm_ops);

-- registro_peritus -----------------------------------------------------------
CREATE TABLE registro_peritus (
  id                  TEXT PRIMARY KEY,
  peritus_id          TEXT,
  nombre_apellido     TEXT,
  cedula              TEXT,
  correo              TEXT,
  celular             TEXT,
  ciudad              TEXT,
  profesion_oficio    TEXT,
  cargo               TEXT,
  experiencia         TEXT,
  especialidad        TEXT,
  edad                TEXT,
  file_url            TEXT,
  file_asset_id       TEXT,
  file_name           TEXT,
  mime_type           TEXT,
  file_size           BIGINT,
  client_id           TEXT REFERENCES crm_client(id) ON DELETE SET NULL,
  fecha_registro      TIMESTAMPTZ,
  estado_documentacion peritus_doc_status NOT NULL DEFAULT 'pendiente',
  notas_validacion    TEXT,
  activo              BOOLEAN NOT NULL DEFAULT TRUE,
  contrasena_hash     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_registro_peritus_client ON registro_peritus (client_id);
CREATE INDEX idx_registro_peritus_estado ON registro_peritus (estado_documentacion);
CREATE UNIQUE INDEX idx_registro_peritus_peritus_id ON registro_peritus (peritus_id) WHERE peritus_id IS NOT NULL;

-- case_event -----------------------------------------------------------------
CREATE TABLE case_event (
  id              TEXT PRIMARY KEY,
  case_id         TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  event_type      case_event_type,
  description     TEXT,
  created_by_id   TEXT REFERENCES crm_user(id) ON DELETE SET NULL,
  created_by_name TEXT,
  metadata        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_case_event_case ON case_event (case_id, created_at DESC);

-- case_document --------------------------------------------------------------
CREATE TABLE case_document (
  id                  TEXT PRIMARY KEY,
  case_id             TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  uploaded_by_id      TEXT REFERENCES crm_user(id) ON DELETE SET NULL,
  uploaded_by_name    TEXT,
  category            document_category NOT NULL DEFAULT 'otro',
  file_url            TEXT,
  file_asset_id       TEXT,
  file_name           TEXT,
  mime_type           TEXT,
  file_size           BIGINT,
  version             INTEGER NOT NULL DEFAULT 1,
  is_visible_to_client BOOLEAN NOT NULL DEFAULT FALSE,
  description         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_case_document_case     ON case_document (case_id, created_at DESC);
CREATE INDEX idx_case_document_category ON case_document (category);

-- quote ----------------------------------------------------------------------
CREATE TABLE quote (
  id                        TEXT PRIMARY KEY,
  case_id                   TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  version                   INTEGER NOT NULL DEFAULT 1,
  total_price               NUMERIC(15,2),
  discount_percentage       NUMERIC(5,2) NOT NULL DEFAULT 0,
  final_value               NUMERIC(15,2),
  status                    quote_status NOT NULL DEFAULT 'borrador',
  valid_until               TIMESTAMPTZ,
  sent_at                   TIMESTAMPTZ,
  approved_at               TIMESTAMPTZ,
  approved_by_id            TEXT REFERENCES crm_user(id) ON DELETE SET NULL,
  rejection_reason          TEXT,
  notes                     TEXT,
  created_by_id             TEXT REFERENCES crm_user(id) ON DELETE SET NULL,
  file_url                  TEXT,
  file_asset_id             TEXT,
  file_name                 TEXT,
  mime_type                 TEXT,
  file_size                 BIGINT,
  first_payment_date        TIMESTAMPTZ,
  last_payment_date         TIMESTAMPTZ,
  first_payment_percentage  NUMERIC(5,2) NOT NULL DEFAULT 50,
  custom_split              BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_quote_case   ON quote (case_id, version DESC);
CREATE INDEX idx_quote_status ON quote (status);

-- expert ---------------------------------------------------------------------
CREATE TABLE expert (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT REFERENCES crm_user(id) ON DELETE SET NULL,
  disciplines         TEXT[] NOT NULL DEFAULT '{}',
  specialization      TEXT,
  experience_years    INTEGER,
  professional_card   TEXT,
  cv_file_url         TEXT,
  cv_file_asset_id    TEXT,
  cv_file_name        TEXT,
  cv_mime_type        TEXT,
  cv_file_size        BIGINT,
  city                TEXT,
  region              TEXT,
  base_fee            NUMERIC(15,2),
  fee_currency        TEXT NOT NULL DEFAULT 'COP',
  availability        expert_availability NOT NULL DEFAULT 'disponible',
  rating              NUMERIC(3,2) NOT NULL DEFAULT 0,
  total_cases         INTEGER NOT NULL DEFAULT 0,
  completed_cases     INTEGER NOT NULL DEFAULT 0,
  validation_status   expert_validation_status NOT NULL DEFAULT 'pendiente',
  validated_by_id     TEXT REFERENCES crm_user(id) ON DELETE SET NULL,
  validation_notes    TEXT,
  bank_name           TEXT,
  bank_account_type   bank_account_type,
  bank_account_number TEXT,
  tax_id              TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_expert_user        ON expert (user_id);
CREATE INDEX idx_expert_validation  ON expert (validation_status);
CREATE INDEX idx_expert_availability ON expert (availability);
CREATE INDEX idx_expert_rating      ON expert (rating DESC);
CREATE INDEX idx_expert_disciplines ON expert USING gin (disciplines);
CREATE INDEX idx_expert_city_trgm   ON expert USING gin (city gin_trgm_ops);
CREATE INDEX idx_expert_spec_trgm   ON expert USING gin (specialization gin_trgm_ops);
CREATE INDEX idx_expert_taxid_trgm  ON expert USING gin (tax_id gin_trgm_ops);

-- expert_certification_file (array certificationFiles[] de expert) -----------
CREATE TABLE expert_certification_file (
  id              TEXT PRIMARY KEY,
  expert_id       TEXT NOT NULL REFERENCES expert(id) ON DELETE CASCADE,
  file_url        TEXT,
  file_asset_id   TEXT,
  file_name       TEXT,
  mime_type       TEXT,
  file_size       BIGINT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_expert_cert_expert ON expert_certification_file (expert_id, sort_order);

-- work_plan ------------------------------------------------------------------
CREATE TABLE work_plan (
  id                        TEXT PRIMARY KEY,
  case_id                   TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  assigned_expert_id        TEXT REFERENCES crm_user(id) ON DELETE SET NULL,
  methodology               TEXT,
  objectives                TEXT,
  start_date                TIMESTAMPTZ,
  end_date                  TIMESTAMPTZ,
  estimated_days            INTEGER,
  deliverables_description  TEXT,
  status                    work_plan_status NOT NULL DEFAULT 'borrador',
  submitted_at              TIMESTAMPTZ,
  reviewed_by_id            TEXT REFERENCES crm_user(id) ON DELETE SET NULL,
  committee_approved_by_id  TEXT REFERENCES crm_user(id) ON DELETE SET NULL,
  rejection_comments        TEXT,
  created_by_id             TEXT REFERENCES crm_user(id) ON DELETE SET NULL,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_work_plan_case   ON work_plan (case_id, created_at DESC);
CREATE INDEX idx_work_plan_status ON work_plan (status);

-- work_plan_activity ---------------------------------------------------------
CREATE TABLE work_plan_activity (
  id              TEXT PRIMARY KEY,
  work_plan_id    TEXT REFERENCES work_plan(id) ON DELETE CASCADE,
  case_id         TEXT REFERENCES cases(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  due_date        TIMESTAMPTZ,
  status          activity_status NOT NULL DEFAULT 'pendiente',
  assigned_to_id  TEXT REFERENCES crm_user(id) ON DELETE SET NULL,
  file_url        TEXT,
  file_asset_id   TEXT,
  file_name       TEXT,
  mime_type       TEXT,
  file_size       BIGINT,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_by_id   TEXT REFERENCES crm_user(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_wpa_work_plan ON work_plan_activity (work_plan_id);
CREATE INDEX idx_wpa_case      ON work_plan_activity (case_id, created_at ASC);
CREATE INDEX idx_wpa_status    ON work_plan_activity (status);

-- deliverable ----------------------------------------------------------------
CREATE TABLE deliverable (
  id              TEXT PRIMARY KEY,
  case_id         TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  phase           deliverable_phase,
  phase_number    INTEGER,
  file_url        TEXT,
  file_asset_id   TEXT,
  file_name       TEXT,
  mime_type       TEXT,
  file_size       BIGINT,
  submitted_by_id TEXT REFERENCES crm_user(id) ON DELETE SET NULL,
  status          deliverable_status NOT NULL DEFAULT 'enviado',
  reviewed_by_id  TEXT REFERENCES crm_user(id) ON DELETE SET NULL,
  approved_by_id  TEXT REFERENCES crm_user(id) ON DELETE SET NULL,
  comments        TEXT,
  rejection_reason TEXT,
  version         INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_deliverable_case   ON deliverable (case_id, phase_number ASC, version DESC);
CREATE INDEX idx_deliverable_status ON deliverable (status);
CREATE INDEX idx_deliverable_phase  ON deliverable (phase);

-- evaluation -----------------------------------------------------------------
CREATE TABLE evaluation (
  id                  TEXT PRIMARY KEY,
  case_id             TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  expert_id           TEXT REFERENCES crm_user(id) ON DELETE SET NULL,
  punctuality_score   NUMERIC(3,2),
  quality_score       NUMERIC(3,2),
  service_score       NUMERIC(3,2),
  final_score         NUMERIC(3,2),
  client_feedback     TEXT,
  technical_feedback  TEXT,
  evaluated_by_id     TEXT REFERENCES crm_user(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_evaluation_case   ON evaluation (case_id);
CREATE INDEX idx_evaluation_expert ON evaluation (expert_id, created_at DESC);

-- hearing --------------------------------------------------------------------
CREATE TABLE hearing (
  id                  TEXT PRIMARY KEY,
  case_id             TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  scheduled_date      TIMESTAMPTZ,
  location            TEXT,
  court_name          TEXT,
  judge_name          TEXT,
  expert_attended     BOOLEAN NOT NULL DEFAULT FALSE,
  client_attended     BOOLEAN NOT NULL DEFAULT FALSE,
  duration_minutes    INTEGER,
  result              hearing_result NOT NULL DEFAULT 'pendiente',
  notes               TEXT,
  follow_up_required  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_hearing_case ON hearing (case_id, scheduled_date DESC);

-- payment --------------------------------------------------------------------
CREATE TABLE payment (
  id                    TEXT PRIMARY KEY,
  case_id               TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  quote_id              TEXT REFERENCES quote(id) ON DELETE SET NULL,
  payment_number        INTEGER,
  amount                NUMERIC(15,2),
  percentage            NUMERIC(5,2),
  due_date              TIMESTAMPTZ,
  payment_date          TIMESTAMPTZ,
  payment_method        payment_method,
  status                payment_status NOT NULL DEFAULT 'pendiente',
  transaction_reference TEXT,
  file_url              TEXT,
  file_asset_id         TEXT,
  file_name             TEXT,
  mime_type             TEXT,
  file_size             BIGINT,
  notes                 TEXT,
  created_by_id         TEXT REFERENCES crm_user(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payment_case   ON payment (case_id, payment_number ASC);
CREATE INDEX idx_payment_quote  ON payment (quote_id);
CREATE INDEX idx_payment_status ON payment (status);
CREATE INDEX idx_payment_due    ON payment (due_date);

-- commission -----------------------------------------------------------------
CREATE TABLE commission (
  id                  TEXT PRIMARY KEY,
  expert_id           TEXT REFERENCES crm_user(id) ON DELETE SET NULL,
  case_id             TEXT REFERENCES cases(id) ON DELETE CASCADE,
  base_amount         NUMERIC(15,2),
  bonus_percentage    NUMERIC(5,2) NOT NULL DEFAULT 0,
  penalty_percentage  NUMERIC(5,2) NOT NULL DEFAULT 0,
  final_amount        NUMERIC(15,2),
  status              commission_status NOT NULL DEFAULT 'pendiente',
  payment_date        TIMESTAMPTZ,
  payment_reference   TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_commission_expert ON commission (expert_id, created_at DESC);
CREATE INDEX idx_commission_case   ON commission (case_id);
CREATE INDEX idx_commission_status ON commission (status);

-- notification ---------------------------------------------------------------
CREATE TABLE notification (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES crm_user(id) ON DELETE CASCADE,
  type        notification_type NOT NULL DEFAULT 'info',
  priority    notification_priority NOT NULL DEFAULT 'normal',
  title       TEXT,
  message     TEXT,
  link_url    TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notification_user ON notification (user_id, created_at DESC);
CREATE INDEX idx_notification_unread ON notification (user_id) WHERE is_read = FALSE;
CREATE INDEX idx_notification_title_trgm ON notification USING gin (title gin_trgm_ops);

-- audit_log ------------------------------------------------------------------
CREATE TABLE audit_log (
  id          TEXT PRIMARY KEY,
  user_id     TEXT REFERENCES crm_user(id) ON DELETE SET NULL,
  action      TEXT,
  entity_type TEXT,
  entity_id   TEXT,
  old_values  TEXT,
  new_values  TEXT,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_log_created ON audit_log (created_at DESC);
CREATE INDEX idx_audit_log_user    ON audit_log (user_id);

-- system_setting -------------------------------------------------------------
CREATE TABLE system_setting (
  id          TEXT PRIMARY KEY,
  key         TEXT NOT NULL,
  value       TEXT,
  data_type   TEXT NOT NULL DEFAULT 'string',
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_system_setting_key ON system_setting (key);

-- admin_config (singleton) ---------------------------------------------------
CREATE TABLE admin_config (
  id                      TEXT PRIMARY KEY,
  master_password_hash    TEXT,
  secondary_password_hash TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- whatsapp_lead --------------------------------------------------------------
CREATE TABLE whatsapp_lead (
  id                  TEXT PRIMARY KEY,
  phone               TEXT,
  name                TEXT,
  city                TEXT,
  motive              TEXT,
  brand               brand NOT NULL DEFAULT 'Peritus',
  status              lead_status NOT NULL DEFAULT 'nuevo',
  ai_completed        BOOLEAN NOT NULL DEFAULT FALSE,
  ai_summary          TEXT,
  notes               TEXT,
  converted_client_id TEXT REFERENCES crm_client(id) ON DELETE SET NULL,
  last_message_at     TIMESTAMPTZ,
  unread_count        INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_whatsapp_lead_phone   ON whatsapp_lead (phone);
CREATE INDEX idx_whatsapp_lead_brand   ON whatsapp_lead (brand);
CREATE INDEX idx_whatsapp_lead_status  ON whatsapp_lead (status);
CREATE INDEX idx_whatsapp_lead_last_msg ON whatsapp_lead (last_message_at DESC);
CREATE INDEX idx_whatsapp_lead_name_trgm ON whatsapp_lead USING gin (name gin_trgm_ops);

-- whatsapp_lead_document (array documents[] de whatsapp_lead) ----------------
CREATE TABLE whatsapp_lead_document (
  id            TEXT PRIMARY KEY,
  lead_id       TEXT NOT NULL REFERENCES whatsapp_lead(id) ON DELETE CASCADE,
  file_url      TEXT,
  file_asset_id TEXT,
  file_name     TEXT,
  mime_type     TEXT,
  file_size     BIGINT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_whatsapp_lead_doc_lead ON whatsapp_lead_document (lead_id, sort_order);

-- whatsapp_message -----------------------------------------------------------
CREATE TABLE whatsapp_message (
  id          TEXT PRIMARY KEY,
  lead_id     TEXT NOT NULL REFERENCES whatsapp_lead(id) ON DELETE CASCADE,
  direction   message_direction,
  content     TEXT,
  sender      message_sender,
  agent_name  TEXT,
  ts          TIMESTAMPTZ,
  media_url   TEXT,
  media_type  TEXT,
  file_name   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_whatsapp_message_lead ON whatsapp_message (lead_id, ts ASC);

-- web_lead -------------------------------------------------------------------
CREATE TABLE web_lead (
  id          TEXT PRIMARY KEY,
  nombre      TEXT,
  email       TEXT,
  mensaje     TEXT,
  origen      web_lead_origin NOT NULL DEFAULT 'landing',
  estado      web_lead_status NOT NULL DEFAULT 'nuevo',
  notas       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_web_lead_estado ON web_lead (estado);
CREATE INDEX idx_web_lead_origen ON web_lead (origen);

-- ============================================================================
-- TRIGGERS de updated_at (uno por tabla)
-- ============================================================================
CREATE TRIGGER trg_company_updated_at            BEFORE UPDATE ON company            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_crm_client_updated_at         BEFORE UPDATE ON crm_client         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_crm_user_updated_at           BEFORE UPDATE ON crm_user           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_cases_updated_at              BEFORE UPDATE ON cases              FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_registro_peritus_updated_at   BEFORE UPDATE ON registro_peritus   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_case_event_updated_at         BEFORE UPDATE ON case_event         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_case_document_updated_at      BEFORE UPDATE ON case_document      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_quote_updated_at              BEFORE UPDATE ON quote              FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_expert_updated_at             BEFORE UPDATE ON expert             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_expert_cert_updated_at        BEFORE UPDATE ON expert_certification_file FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_work_plan_updated_at          BEFORE UPDATE ON work_plan          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_wpa_updated_at                BEFORE UPDATE ON work_plan_activity FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_deliverable_updated_at        BEFORE UPDATE ON deliverable        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_evaluation_updated_at         BEFORE UPDATE ON evaluation         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_hearing_updated_at            BEFORE UPDATE ON hearing            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_payment_updated_at            BEFORE UPDATE ON payment            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_commission_updated_at         BEFORE UPDATE ON commission         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_notification_updated_at       BEFORE UPDATE ON notification       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_audit_log_updated_at          BEFORE UPDATE ON audit_log          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_system_setting_updated_at     BEFORE UPDATE ON system_setting     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_admin_config_updated_at       BEFORE UPDATE ON admin_config       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_whatsapp_lead_updated_at      BEFORE UPDATE ON whatsapp_lead      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_whatsapp_lead_doc_updated_at  BEFORE UPDATE ON whatsapp_lead_document FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_whatsapp_message_updated_at   BEFORE UPDATE ON whatsapp_message   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_web_lead_updated_at           BEFORE UPDATE ON web_lead           FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
