-- ============================================================================
-- 004_web_lead_masterclass — agrega 'masterclass' al enum web_lead_origin.
--
-- Motivo: la landing pública /masterclass captura reservas de cupo mediante
-- /api/web-form y el CRM (/crm/formularios) necesita distinguir ese origen.
--
-- Nota: igual que 002, ALTER TYPE ... ADD VALUE solo agrega el valor (no lo
-- usa en la misma transacción), por lo que es seguro en PostgreSQL 12+ sin
-- transacción explícita (BEGIN/COMMIT).
-- ============================================================================

ALTER TYPE web_lead_origin ADD VALUE IF NOT EXISTS 'masterclass';
