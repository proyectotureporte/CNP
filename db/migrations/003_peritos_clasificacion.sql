-- ============================================================================
-- CNP | PERITUS — Migración 003_peritos_clasificacion
--
-- Estructura de Clasificación, Registro y Activación de Peritos.
--   * Niveles de seniority: junior / senior / master (clasificación por formación
--     académica + experiencia).
--   * Macro-categorías de perito (médicos, psicólogos, ingenieros/arquitectos,
--     tecnología e informática, forense documental, financieros/avaluadores, otros).
--   * Ciclo de vida del perito en el CRM: candidato -> en_evaluacion -> activado
--     (+ rechazado), que REEMPLAZA el uso de pendiente/aprobado del enum
--     expert_validation_status (se migran los datos existentes).
--   * Campos de formación académica para la clasificación automática.
--
-- BD compartida `cnp`. ADITIVA: solo añade valores de enum, tipos y columnas;
-- no borra nada. ADD VALUE no puede usarse en la misma transacción (como 002),
-- por eso esos statements van sueltos antes del bloque transaccional.
-- ============================================================================

-- (1) Valores nuevos del ciclo de vida (autocommit, no dentro de transacción).
ALTER TYPE expert_validation_status ADD VALUE IF NOT EXISTS 'candidato';
ALTER TYPE expert_validation_status ADD VALUE IF NOT EXISTS 'en_evaluacion';
ALTER TYPE expert_validation_status ADD VALUE IF NOT EXISTS 'activado';

-- (2) Resto en una transacción (ya puede USAR los valores agregados arriba).
BEGIN;

-- Enums nuevos (idempotentes)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expert_seniority') THEN
    CREATE TYPE expert_seniority AS ENUM ('junior','senior','master');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expert_category') THEN
    CREATE TYPE expert_category AS ENUM (
      'medicos','psicologos','ingenieros_arquitectos','tecnologia_informatica',
      'forense_documental','financieros_avaluadores','otros'
    );
  END IF;
END $$;

-- Columnas nuevas en expert
ALTER TABLE expert ADD COLUMN IF NOT EXISTS seniority             expert_seniority;
ALTER TABLE expert ADD COLUMN IF NOT EXISTS category              expert_category;
ALTER TABLE expert ADD COLUMN IF NOT EXISTS subespecialidad       TEXT;
ALTER TABLE expert ADD COLUMN IF NOT EXISTS pregrado              BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE expert ADD COLUMN IF NOT EXISTS num_especializaciones INTEGER NOT NULL DEFAULT 0;
ALTER TABLE expert ADD COLUMN IF NOT EXISTS num_maestrias         INTEGER NOT NULL DEFAULT 0;
ALTER TABLE expert ADD COLUMN IF NOT EXISTS doctorado             BOOLEAN NOT NULL DEFAULT FALSE;

-- Migrar el ciclo de vida existente (pendiente -> candidato, aprobado -> activado)
UPDATE expert SET validation_status = 'candidato' WHERE validation_status = 'pendiente';
UPDATE expert SET validation_status = 'activado'  WHERE validation_status = 'aprobado';

-- Nuevo default: todo perito entra como candidato
ALTER TABLE expert ALTER COLUMN validation_status SET DEFAULT 'candidato';

-- Índices para los nuevos filtros del CRM
CREATE INDEX IF NOT EXISTS idx_expert_seniority ON expert (seniority);
CREATE INDEX IF NOT EXISTS idx_expert_category  ON expert (category);

COMMIT;
