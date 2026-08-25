-- Los valores se confirman antes de utilizarlos en la migración de datos 011.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'comercial_juridico';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'junta';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'perito_interno';
