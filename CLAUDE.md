# CNP | Peritus — contexto permanente

## Qué es
CRM de peritajes judiciales (Colombia) para CNP: gestión de casos, clientes, peritos, cotizaciones, planes de trabajo, entregables, pagos y leads de WhatsApp, con portal de clientes y landings públicas.
Dominio: **cnp.com.co** · VPS: `ssh restaurar` (82.223.109.156) · Carpeta: `/var/www/cnp` · PM2: `cnp` (fork, 1 instancia — el hub WS vive en memoria) · Puerto: 3000 (Nginx con TLS) · DB: PostgreSQL local `cnp` (user `cnp_user`)

## Stack
Next.js 16.1.6 (App Router, TS estricto) + React 19 + Tailwind 4 + shadcn/ui · PostgreSQL vía `pg` con **SQL crudo, sin ORM** (`src/lib/db/`) · Auth JWT custom con `jose` + bcryptjs (NO NextAuth) · WebSockets nativos `ws` en `/ws` (server.js custom, NO Pusher) · Sanity SOLO para assets (archivos) · Resend (email) · Evolution API + n8n (WhatsApp) · npm.

## Comandos
dev: `node server.js` · build: `npm run build` · typecheck: `npx tsc --noEmit` · migraciones: `npm run db:migrate` · deploy: push a main + en VPS `git pull && npm install && npm run build && pm2 reload cnp`

## Estructura esencial
- Páginas: `src/app/` → públicas (`/`, `/abogados`, `/empresas`, `/jueces`, `/privacy`), `/crm/*`, `/admin/*`, `/portal/*`
- API: `src/app/api/` (≈88 routes) · Capa de datos: `src/lib/db/` (barrel namespaced)
- Auth: `src/lib/auth/` (jwt, passwords, permissions) + `src/middleware.ts`
- Realtime: `server.js` (hub WS) + `src/lib/realtime/{server,client}.ts` + hook `usePusher` (reimplementado sobre WS nativo)
- Esquema DB: `db/migrations/*.sql` · Mapa profundo: `docs/PROJECT-MAP.md`

## Reglas de ESTE proyecto
- Verificación antes de push: `npx tsc --noEmit && npm run build`
- 7 roles: admin, juridico, financiero, administrativo, mercadeo, postventa, cliente. Permisos en `src/lib/types.ts` (ROLE_PERMISSIONS, ROLE_CASE_TABS) + `src/lib/auth/permissions.ts` (helpers `canX`). Enforcement en servidor: `guardRole(request, canX)` de `src/lib/auth/permissions` vía `src/lib/auth/guard.ts` (lee `x-user-role`); la UI usa los MISMOS helpers. Al tocar permisos, cambiar SIEMPRE en los helpers (fuente única), no a mano en componentes/rutas
- Cookies: `crm-token` (CRM y portal) y `admin-token` (superadmin sub:'admin', login solo con contraseña maestra)
- Headers de seguridad en `server.js`, NO en next.config (no corre `headers()` con servidor custom). `output:'standalone'` PROHIBIDO (mataría el hub WS)
- IDs TEXT (UUID o `_id` heredado de Sanity). Tabla de casos se llama `cases` (palabra reservada)
- Peritos (`expert`): `seniority` (junior/senior/master) + `category` (7 macro-categorías) + ciclo de vida en `validation_status` = candidato → en_evaluacion → activado (+ rechazado), NO pendiente/aprobado (migración 003 migró los datos). Formación: pregrado/num_especializaciones/num_maestrias/doctorado. Clasificación automática: `src/lib/peritos/clasificacion.ts`. ALTER de `expert` se aplica como `postgres` (la tabla es de cnp_user), no con `db:migrate`
- Gotchas: PM2 SIEMPRE fork 1 instancia; Nginx debe proxyear upgrade WS en `/ws`; las `NEXT_PUBLIC_` requieren rebuild
