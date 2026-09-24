-- Documentación del perito: la tabla expert_certification_file (nunca usada
-- hasta ahora) pasa a guardar TODOS los documentos del perito por tipo.
-- La hoja de vida sigue en expert.cv_file_*.

ALTER TABLE expert_certification_file
  ADD COLUMN IF NOT EXISTS doc_type TEXT NOT NULL DEFAULT 'certificacion',
  ADD COLUMN IF NOT EXISTS uploaded_by_id TEXT REFERENCES crm_user(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expert_certification_file_doc_type_check'
  ) THEN
    ALTER TABLE expert_certification_file
      ADD CONSTRAINT expert_certification_file_doc_type_check
      CHECK (doc_type IN ('cedula', 'certificacion', 'soporte_academico', 'otro'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_expert_cert_type ON expert_certification_file (expert_id, doc_type, created_at);

COMMENT ON COLUMN expert_certification_file.doc_type IS
  'Tipo de documento del perito: cedula | certificacion | soporte_academico | otro.';
