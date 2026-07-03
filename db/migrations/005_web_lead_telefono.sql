-- ============================================================================
-- 005_web_lead_telefono — agrega la columna telefono a web_lead.
--
-- Motivo: el formulario público de leads ahora pide teléfono obligatorio
-- para que el equipo tenga cómo contactar a la persona; el CRM lo muestra
-- en /crm/formularios. Las filas históricas quedan con telefono NULL.
-- ============================================================================

ALTER TABLE web_lead ADD COLUMN IF NOT EXISTS telefono TEXT;
