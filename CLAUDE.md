# CNP | Peritus — contexto permanente

## Qué es
CRM de peritajes judiciales (Colombia) para CNP: gestión de casos, clientes, peritos, cotizaciones, planes de trabajo, entregables, pagos y leads de WhatsApp, con portal de clientes y landings públicas.
Dominio: **cnp.com.co** · VPS: `ssh restaurar` (82.223.109.156) · Carpeta: `/var/www/cnp` · PM2: `cnp` (fork, 1 instancia — el hub WS vive en memoria) · Puerto: 3000 (Nginx con TLS) · DB: PostgreSQL local `cnp` (user `cnp_user`)

## Stack
Next.js 16.1.6 (App Router, TS estricto) + React 19 + Tailwind 4 + shadcn/ui · PostgreSQL vía `pg` con **SQL crudo, sin ORM** (`src/lib/db/`) · Auth JWT custom con `jose` + bcryptjs (NO NextAuth) · WebSockets nativos `ws` en `/ws` (server.js custom, NO Pusher) · Sanity SOLO para assets (archivos) · Resend (email) · Evolution API + n8n (WhatsApp) · npm.

## Comandos
dev: `node server.js` · build: `npm run build` · typecheck: `npx tsc --noEmit` · migraciones: `npm run db:migrate` · deploy: push a `main` activa `.github/workflows/deploy-production.yml`; no desplegar manualmente fuera de ese flujo

## Estructura esencial
- Páginas: `src/app/` → públicas (`/`, `/abogados`, `/empresas`, `/jueces`, `/privacy`), `/crm/*`, `/admin/*`, `/portal/*`
- API: `src/app/api/` (≈88 routes) · Capa de datos: `src/lib/db/` (barrel namespaced)
- Auth: `src/lib/auth/` (jwt, passwords, permissions) + `src/middleware.ts`
- Realtime: `server.js` (hub WS) + `src/lib/realtime/{server,client}.ts` + hook `usePusher` (reimplementado sobre WS nativo)
- Esquema DB: `db/migrations/*.sql` · Mapa profundo: `docs/PROJECT-MAP.md`

## Reglas de ESTE proyecto
- Verificación antes de push: `npx tsc --noEmit && npm run build`
- 7 roles definitivos: admin, comercial_juridico, junta, perito_interno, perito, cliente y abogado (migración 019; el abogado entra por /portal con `case_lawyer`, solo lectura + aporte de documentos, nunca ve peritos ni cifras). Todo usuario con rol **admin** (y `ferneyolicas@gmail.com`) recibe la bandera JWT `allRoles` = acceso total a todo el sistema (se deriva también en `verifyToken`, no es un séptimo rol). Permisos en `src/lib/types.ts` (ROLE_PERMISSIONS, ROLE_CASE_TABS) + `src/lib/auth/permissions.ts` (helpers `canX`). Enforcement en servidor: `guardRole(request, canX)` vía `src/lib/auth/guard.ts`; la UI usa los MISMOS helpers. Al tocar permisos, cambiar SIEMPRE en los helpers, no a mano en componentes/rutas
- Cookies: `crm-token` (CRM y portal) y `admin-token` (superadmin sub:'admin', login solo con contraseña maestra)
- Headers de seguridad en `server.js`, NO en next.config (no corre `headers()` con servidor custom). `output:'standalone'` PROHIBIDO (mataría el hub WS)
- Inter es la tipografía de toda la aplicación operativa (`/crm`, `/admin`, `/portal`, `/perito`) mediante `src/components/layout/InterAppScope.tsx`; las landings públicas conservan sus fuentes de marca
- IDs TEXT (UUID o `_id` heredado de Sanity). Tabla de casos se llama `cases` (palabra reservada)
- Expediente documental: las 12 categorías ordenadas viven en `DOCUMENT_CATEGORIES`; los binarios nunca exponen la URL de Sanity y se consultan/descargan por `/api/documents/[id]/download` (vista previa con `?inline=1`). Las cotizaciones nuevas usan tres cuotas fijas 50/25/25; `payment_date` es la fecha real del pago y `receipt_uploaded_at` la carga del comprobante. `cases.assigned_expert_id` es el perito líder y `case_associated_expert` contiene asociados de cualquier disciplina habilitada; ambos acceden por `caseAccess.ts` sin perder el aislamiento frente al cliente.
- Revisión documental y versiones (migración 018): `case_document.review_status` (`pendiente_revision`/`aprobado`/`requiere_correccion`) con observación y revisor; una versión nueva crea otra fila (`supersedes_document_id`, `superseded_at` en la anterior) y nunca sobrescribe. Lo del equipo nace aprobado; lo del cliente/perito, pendiente. `case_event` tiene `title`, `event_date`, `is_visible_to_client` y `document_id`: el cliente solo ve actuaciones visibles (`CLIENT_VISIBLE_EVENT_TYPES` fija el defecto por tipo). `audit_log.case_id` da la trazabilidad por expediente (`GET /api/cases/[id]/audit`). Los avisos al cliente (in-app + correo + WhatsApp por Evolution, y a los abogados del caso) salen SIEMPRE por `src/lib/notifyClient.ts`, nunca mencionan peritos. Vista previa de Word/Excel: LibreOffice headless en el VPS vía `src/lib/files/officePreview.ts` (`?inline=1`). Formatos admitidos y límites en `src/lib/files/uploadLimits.ts` (validar en cliente y servidor).
- Carga documental por enlace: `client_document_upload_link` (migración 017) guarda solo el hash del token y lo ata simultáneamente al caso y cliente; `/cargar-documentos/acceso/[token]` lo canjea por cookie HttpOnly y redirige a `/cargar-documentos`. La API pública solo muestra requeridos `is_visible_to_client`, revalida token/caso/cliente en cada llamada y escribe directamente en `case_document`. `server.js` debe mantener `Referrer-Policy: no-referrer` en `/cargar-documentos*` para que el bearer de entrada nunca llegue a GTM por referrer.
- Peritos (`expert`): `seniority` (junior/senior/master) + `category` (7 macro-categorías) + ciclo de vida en `validation_status` = candidato → en_evaluacion → activado (+ rechazado), NO pendiente/aprobado (migración 003 migró los datos). Formación: pregrado/num_especializaciones/num_maestrias/doctorado. Clasificación automática: `src/lib/peritos/clasificacion.ts`. Documentación del perito (cédula/certificacion/soporte_academico/otro, varios archivos, 50 MB c/u, en Sanity) en `expert_certification_file.doc_type` vía `src/lib/peritos/documentos.ts`; la hoja de vida sigue en `expert.cv_file_*`. ALTER de `expert` se aplica como `postgres` (la tabla es de cnp_user), no con `db:migrate`
- Gotchas: PM2 SIEMPRE fork 1 instancia; Nginx debe proxyear upgrade WS en `/ws`; las `NEXT_PUBLIC_` requieren rebuild
