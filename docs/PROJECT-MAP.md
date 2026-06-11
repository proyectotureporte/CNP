# PROJECT-MAP — CNP | Peritus

Actualizado: 2026-06-11 · Commit: 9819874

## Identidad y stack
CRM de peritajes judiciales para CNP (Colombia) + marca Peritus. Producción real en `https://cnp.com.co`, autoalojado en VPS `restaurar` (82.223.109.156): PM2 (`cnp`, fork ×1) + Nginx (TLS, proxy a :3000 con upgrade WS en `/ws`) + PostgreSQL 17 local (BD `cnp`, user `cnp_user`).

- Next.js 16.1.6 App Router + React 19.2.3 + TypeScript estricto + Tailwind 4 + shadcn/ui (new-york)
- Datos: `pg` con SQL crudo (sin ORM) — `src/lib/db/` (23 módulos + stats, barrel `index.ts` namespaced)
- Auth: JWT custom HS256 (`jose` al firmar, verificación manual `crypto` en server.js) + bcryptjs
- Realtime: WebSockets nativos (`ws`) — hub en `server.js` compartido vía `globalThis.__cnpRealtimeHub`
- Archivos: Sanity CDN (`@sanity/client`, solo `assets.upload`) — en PG solo `file_url/file_asset_id/...`
- Email: Resend (`src/lib/email.ts`, FROM `noresponder@cnp.com.co`) · WhatsApp: Evolution API + n8n
- Cron: systemd timer `cnp-check-alerts` 3×/día → `GET /api/cron/check-alerts` con `x-cron-secret`

## Mapa de rutas (páginas)
| Ruta | Auth | Qué muestra |
|---|---|---|
| `/`, `/abogados`, `/empresas`, `/jueces`, `/privacy` | pública | Landings por audiencia + formulario de contacto (POST `/api/web-form`) |
| `/crm/login` | pública | Login CRM (email+password, type:'crm') |
| `/crm` y `/crm/dashboard` | crm-token | Dashboard con stats |
| `/crm/cases` (+`/new`, `/[id]`, `/[id]/edit`) | crm-token | Ciclo completo del caso |
| `/crm/clients`, `/crm/experts` (+new/[id]/edit) | crm-token | CRUD clientes y peritos |
| `/crm/quotes`, `/crm/payments`, `/crm/commissions`, `/crm/cartera`* | crm-token (financiero/admin) | Cotizaciones, pagos, comisiones |
| `/crm/work-plans`, `/crm/deliverables`, `/crm/evaluations` | crm-token | Planes, entregables, evaluaciones |
| `/crm/reports` | crm-token (admin) | Reportes (casos, revenue, performance peritos) |
| `/crm/mensajes` | **EXENTA en middleware** (¿bug?) | Inbox WhatsApp leads |
| `/crm/formularios` | crm-token (juridico/admin) | Leads del formulario web |
| `/crm/notifications`, `/crm/profile` | crm-token | Notificaciones y perfil |
| `/admin/login` | pública | Login admin (solo contraseña maestra/secundaria) |
| `/admin`, `/admin/users(+/new)`, `/admin/clients`, `/admin/audit-logs`, `/admin/settings`, `/admin/cartera` | admin-token (role admin) | Gestión usuarios, logs, settings |
| `/portal/login` | pública | Login cliente (type:'portal') |
| `/portal`, `/portal/cases(+/[id])`, `/portal/change-password` | crm-token role=cliente | Portal del cliente |

*`/admin/cartera` y `/crm/cartera` comparten permiso `cartera`.

## Endpoints API (≈88, agrupados)
| Grupo | Rutas | Notas |
|---|---|---|
| Auth | `POST /api/auth/login` (type admin/crm/portal), `/logout`, `GET /api/auth/me` | Públicas (exentas) |
| Admin | `/api/admin/users` (+[id]), `/change-password`, `/clients/[id]/reset-password`, `/init`, `/seed-master`, `/migrate-brand` | Requiere role admin (middleware). `/init` es PÚBLICO |
| Casos | `/api/cases` (+[id], `/assign`, `/status`, `/events`, `/documents`, `/activities`, `/deliverables`, `/hearings`, `/payments`, `/quotes`, `/evaluation`, `/work-plan`, `/suggest-expert`) | Núcleo del negocio |
| Clientes/Empresas/Peritos | `/api/clients` (+[id], `/validate`), `/api/companies`, `/api/experts` (+[id], `/validate`, `/availability`) | |
| Cotizaciones | `/api/quotes/[id]` (+`/approve`, `/reject`, `/send`) | approve/reject los usa el portal cliente |
| Work plans | `/api/work-plans` (+[id], `/activities`, `/approve`, `/reject`, `/submit`) | |
| Entregables/Evaluaciones/Audiencias | `/api/deliverables` (+`/[id]/review`), `/api/evaluations`, `/api/hearings/[id]` | |
| Pagos/Comisiones | `/api/payments/[id]` (+`/quote`, `/receipt`), `/api/commissions` (+`/calculate`), `/api/cartera` | |
| Actividades | `/api/activities/[id]` (+`/upload`) | upload → Sanity assets |
| Notificaciones | `/api/notifications` (+`/[id]/read`, `/mark-all-read`) | UI hace polling + WS push |
| WhatsApp | `/api/whatsapp/webhook` (público, valida secret), `/api/whatsapp/leads*` — **EXENTO de auth en middleware (¿bug?)** | leads, messages, convert, documents-to-case |
| Web form | `POST /api/web-form` (landing pública), `GET /api/web-form/list` | **NO exenta en middleware** → ¿401 al visitante? |
| Cron | `GET /api/cron/check-alerts` | Exenta + `x-cron-secret` |
| Otros | `/api/dashboard/stats`, `/api/reports/*`, `/api/settings`, `/api/users`, `/api/audit-logs`, `/api/crm|portal/change-password` | |

## Modelo de datos (PostgreSQL — `db/migrations/`)
25 tablas, 30 enums, triggers `updated_at`, índices GIN trgm. IDs `TEXT` (UUID nuevos, `_id` Sanity heredados).
- Núcleo: `cases` (brand CNP/Peritus, status, discipline, FKs a client/expert/users), `crm_client`, `crm_user` (7 roles), `company`, `expert` (+`expert_certification_file`), `registro_peritus`
- Ciclo del caso: `case_event`, `case_document`, `quote`, `work_plan` (+`work_plan_activity`), `deliverable`, `evaluation`, `hearing`, `payment`, `commission`
- Sistema: `notification`, `audit_log`, `system_setting`, `admin_config` (hashes contraseña maestra), `whatsapp_lead` (+documents/messages), `web_lead`
- Capa de acceso: `src/lib/db/pool.ts` (pool singleton, `query/queryOne/withTransaction/buildInsert/buildUpdate/newId`); módulos devuelven shapes estilo Sanity (`_id`, `_createdAt`, refs anidados)

## Flujos clave
- **Login admin**: `/admin/login` → POST `/api/auth/login` {type:'admin', password} → compara con `admin_config.master/secondary_password_hash` → cookie `admin-token` (sub:'admin', 7d, httpOnly)
- **Login CRM**: {type:'crm', email, password} → `crm_user` por email → cookie `crm-token`. Clientes (role cliente) son redirigidos de /crm a /portal
- **Login portal**: {type:'portal'} → credenciales en `crm_client` → cookie `crm-token` role cliente
- **Middleware** (`src/middleware.ts`): exime logins, `/api/auth/*`, `/api/admin/init`, `/api/whatsapp/webhook`, `/api/cron/check-alerts`, **`/crm/mensajes` y `/api/whatsapp/leads*`** (sospechoso); inyecta `x-user-id/role/name`; `/api/admin*` exige role admin
- **Realtime**: route handler → `triggerEvent()` (`src/lib/realtime/server.ts`) → hub en proceso → WS `/ws` (auth por cookie en upgrade, server.js) → `src/lib/realtime/client.ts` (reconexión) → hook `usePusher` (17 consumidores)
- **Caso**: crear (`POST /api/cases`, juridico/admin) → asignar perito (`/assign`, admin) → quote → aprobar (cliente/admin) → work-plan (submit/approve) → activities → deliverables (review admin) → hearings → payments → evaluación → cerrar
- **WhatsApp lead**: Evolution API → n8n → `POST /api/whatsapp/webhook` (WHATSAPP_WEBHOOK_SECRET) → `whatsapp_lead` → inbox `/crm/mensajes` → convert a caso
- **Web lead**: landing → `POST /api/web-form` → `web_lead` → `/crm/formularios`
- **Uploads**: route → `src/lib/sanity/assets.ts` (6 puntos) → Sanity CDN → URL en PG
- **Cron**: systemd `cnp-check-alerts.timer` (06/12/18 UTC) → check-alerts → notificaciones/emails

## Dependencias compartidas (alto impacto)
`src/middleware.ts` · `src/lib/db/pool.ts` · `src/lib/types.ts` (roles/enums/interfaces) · `src/lib/auth/*` · `server.js` (¡los headers de seguridad y el hub WS viven aquí!) · `src/components/layout/` (AppLayout/Sidebar/Header) · `src/hooks/useAuth.ts`, `useNotifications.ts`, `usePusher` · `src/lib/email.ts`

## Variables de entorno
`DATABASE_URL` (PG) · `JWT_SECRET` · `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO` · `SANITY_API_TOKEN` + `NEXT_PUBLIC_SANITY_*` (solo assets) · `EVOLUTION_API_URL/KEY/INSTANCE`, `WHATSAPP_WEBHOOK_SECRET` · `CRON_SECRET` · `NEXT_PUBLIC_APP_URL` · (huérfanas en VPS: `PUSHER_*`, `NEXT_PUBLIC_SANITY_ORGANIZATION_ID` — limpiar en Fase 9)

## Lecciones y gotchas (vivo)
- 2026-05-29 · `headers()` de next.config NO corre con servidor custom → headers de seguridad en `server.js`
- 2026-05-29 · `output:'standalone'` genera su propio server.js y mata el hub WS → prohibido
- 2026-05-29 · PM2 en fork ×1 obligatorio (hub WS en memoria de proceso); Nginx debe proxyear Upgrade en `/ws`
- 2026-05-29 · Fase 9 pendiente: rotar secretos expuestos en chat (SANITY_API_TOKEN, JWT_SECRET, RESEND_API_KEY, EVOLUTION_API_KEY), limpiar vars Pusher
- 2026-06-11 · QA: dos fallos de middleware ARREGLADOS — (1) `/api/whatsapp/leads*` y `/crm/mensajes` estaban exentos de auth → fuga pública de PII de leads; ahora exigen sesión (la página los consume con cookie crm-token, no había consumidor server/n8n). (2) `/api/web-form` (POST) estaba bloqueado por el matcher `/api/*` → 401 en el formulario público; ahora exento exacto (`/api/web-form/list` sigue protegido por ser match exacto).
- 2026-06-11 · QA: quitado `fetch('/api/cron/check-alerts', POST)` de `crm/cases/page.tsx` (daba 401 en cada carga; el cron real corre por systemd `cnp-check-alerts` 3×/día).
- 2026-06-11 · QA #4 (cosmético, SIN tocar): `/crm/cartera` no existe ni se enlaza (la URL la fabricó el barrido). El nav CRM (`nav-items.ts`) no tiene item Cartera; la página real es `/admin/cartera` (admin only). Residuo: el rol `financiero` lleva permiso `cartera` sin página accesible en CRM — decisión de producto pendiente (¿crear `/crm/cartera` para financiero o quitar el permiso?). No se cambia authz a ciegas.
- 2026-06-11 · QA #5 (ruido, SIN defecto de app): logs de `cnp` inundados con `Failed to find Server Action "x"`. La app no usa Server Actions (`grep 'use server'` vacío); son bots/escáneres POSTeando ids basura. Recomendación: regla de Nginx/firewall para descartar esos POST y limpiar observabilidad (ámbito vps-admin).
