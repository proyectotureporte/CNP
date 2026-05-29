-- ============================================================================
-- 002_fix_enums — agrega los roles 'perito' y 'tecnico' al enum user_role.
--
-- Motivo: los datos de Sanity contenían usuarios con role 'perito' y 'tecnico',
-- que no estaban en el enum inicial (001) y hacían fallar el import.
--
-- Nota: ALTER TYPE ... ADD VALUE no debe USAR el valor nuevo en la misma
-- transacción, pero aquí solo se agregan, por lo que es seguro en PostgreSQL
-- 12+. Por eso este archivo NO abre transacción explícita (BEGIN/COMMIT).
-- ============================================================================

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'perito';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'tecnico';
