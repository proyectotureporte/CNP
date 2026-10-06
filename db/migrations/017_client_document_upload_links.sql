-- ============================================================================
-- CNP | PERITUS — enlaces seguros de carga documental por caso
--
-- El secreto nunca se persiste en claro: la aplicación guarda únicamente su
-- SHA-256. Cada caso conserva como máximo un enlace vigente (los anteriores se
-- revocan al generar uno nuevo).
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS client_document_upload_link (
  id             TEXT PRIMARY KEY,
  case_id        TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  client_id      TEXT NOT NULL REFERENCES crm_client(id) ON DELETE CASCADE,
  token_hash     TEXT NOT NULL UNIQUE,
  created_by_id  TEXT REFERENCES crm_user(id) ON DELETE SET NULL,
  expires_at     TIMESTAMPTZ NOT NULL,
  revoked_at     TIMESTAMPTZ,
  last_used_at   TIMESTAMPTZ,
  upload_count   INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT client_document_upload_link_expiry_check CHECK (expires_at > created_at),
  CONSTRAINT client_document_upload_link_count_check CHECK (upload_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_client_document_upload_link_case
  ON client_document_upload_link (case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_document_upload_link_client
  ON client_document_upload_link (client_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_document_upload_link_active_case
  ON client_document_upload_link (case_id) WHERE revoked_at IS NULL;

ALTER TABLE case_document
  ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS upload_link_id TEXT REFERENCES client_document_upload_link(id) ON DELETE SET NULL;

UPDATE case_document
SET uploaded_at = created_at
WHERE file_url IS NOT NULL AND uploaded_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_case_document_upload_link
  ON case_document (upload_link_id) WHERE upload_link_id IS NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_client_document_upload_link_updated_at'
  ) THEN
    CREATE TRIGGER trg_client_document_upload_link_updated_at
      BEFORE UPDATE ON client_document_upload_link
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

COMMIT;
