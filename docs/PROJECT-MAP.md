# PROJECT-MAP — CNP | Peritus

Actualizado: 2026-08-04 · (RF-01..RF-14 + portales G-01..G-22 implementados — migraciones 007..009)

## Identidad y stack
CRM de peritajes judiciales para CNP (Colombia) + marca Peritus. Producción real en `https://cnp.com.co`, autoalojado en VPS `restaurar` (82.223.109.156): PM2 (`cnp`, fork ×1) + Nginx (TLS, proxy a :3000 con upgrade WS en `/ws`) + PostgreSQL 17 local (BD `cnp`, user `cnp_user`).

- Next.js 16.1.6 App Router + React 19.2.3 + TypeScript estricto + Tailwind 4 + shadcn/ui (new-york)
- Datos: `pg` con SQL crudo (sin ORM) — `src/lib/db/` (repositorios namespaced desde `index.ts`)
- Auth: JWT custom HS256 (`jose` al firmar, verificación manual `crypto` en server.js) + bcryptjs
- Realtime: WebSockets nativos (`ws`) — hub en `server.js` compartido vía `globalThis.__cnpRealtimeHub`
- Archivos: Sanity CDN (`@sanity/client`, solo `assets.upload`) — en PG solo `file_url/file_asset_id/...`
- Email: Resend (`src/lib/email.ts`, FROM `noresponder@cnp.com.co`) · WhatsApp: Evolution API + n8n
- Cron: systemd timer `cnp-check-alerts` 3×/día → `POST /api/cron/check-alerts` con `x-cron-secret`

## Mapa de rutas (páginas)
| Ruta | Auth | Qué muestra |
|---|---|---|
| `/`, `/abogados`, `/empresas`, `/jueces`, `/privacy` | pública | Landings por audiencia + formulario de contacto (POST `/api/web-form`) |
| `/crm/login` | pública | Login CRM (email+password, type:'crm') |
| `/crm` y `/crm/dashboard` | crm-token | Dashboard con stats |
| `/crm/cases` (+`/new`, `/[id]`, `/[id]/edit`) | crm-token | Ciclo completo; el perito solo ve casos donde es `assignedExpert`/`assignedFinanciero` y una ficha aislada del cliente |
| `/crm/clients`, `/crm/experts` (+new/[id]/edit) | crm-token | CRUD clientes y peritos |
| `/crm/quotes`, `/crm/payments`, `/crm/commissions` | crm-token | Cotizaciones, pagos, comisiones |
| `/crm/cartera` | crm-token (financiero/admin) | Cartera: previsto/cobrado/pendiente, vencimientos, gráfico 12m (comparte `CarteraView` con `/admin/cartera`) |
| `/crm/work-plans`, `/crm/deliverables`, `/crm/evaluations` | crm-token | Planes, entregables, evaluaciones |
| `/crm/reports` | crm-token (admin) | Reportes (casos, revenue, performance peritos) |
| `/crm/mensajes` | crm-token con permiso `mensajes` | Inbox WhatsApp leads; no está disponible para el perito |
| `/crm/formularios` | crm-token (juridico/admin) | Leads del formulario web |
| `/crm/notifications`, `/crm/profile` | crm-token | Notificaciones y perfil; el perito edita contacto, banco, contraseña y HV desde su perfil |
| `/admin/login` | pública | Login admin (solo contraseña maestra/secundaria) |
| `/admin`, `/admin/users(+/new)`, `/admin/clients`, `/admin/audit-logs`, `/admin/settings`, `/admin/cartera` | admin-token (role admin) | Gestión usuarios, logs, settings |
| `/portal/login` | pública | Login cliente (type:'portal') |
| `/portal`, `/portal/cases(+/[id])`, `/portal/profile`, `/portal/change-password` | crm-token role=cliente | Portal del cliente final: casos propios, perfil, pagos, documentos, dictámenes aprobados y mensajes con jurídico |

*`/admin/cartera` y `/crm/cartera` comparten permiso `cartera`.

## Endpoints API (≈88, agrupados)
| Grupo | Rutas | Notas |
|---|---|---|
| Auth | `POST /api/auth/login` (type admin/crm/portal), `/logout`, `GET /api/auth/me` | Públicas (exentas) |
| Admin | `/api/admin/users` (+[id]), `/change-password`, `/clients/[id]/reset-password`, `/init`, `/seed-master`, `/migrate-brand` | Requiere role admin (middleware). `/init` es PÚBLICO |
| Casos | `/api/cases` (+[id], `/assign`, `/status`, `/commercial-status`, `/committee`, `/events`, `/documents`, `/activities`, `/deliverables`, `/hearings`, `/payments`, `/quotes`, `/evaluation`, `/work-plan`, `/suggest-expert`, `/messages`, `/document-requests`, `/execution`, `/payment-receipts`) | Núcleo del negocio. Todas las lecturas de portal pasan por `caseAccess.ts`; mensajería separa jurídico↔perito y jurídico↔cliente |
| Clientes/Empresas/Peritos | `/api/clients` (+[id], `/validate`), `/api/companies`, `/api/experts` (+[id], `/validate`, `/availability`) | |
| Cotizaciones | `/api/quotes/[id]` (+`/approve`, `/reject`, `/send`, `/revise`, `/download`, PATCH seguimiento) | El cliente solo ve propuestas no borrador de sus casos; archivos se descargan por proxy autorizado. Cada propuesta fija `quoted_business_days` |
| Work plans | `/api/work-plans` (+[id], `/activities`, `/approve`, `/reject`, `/submit`) | |
| Entregables/Evaluaciones/Audiencias | `/api/deliverables` (+`/[id]/review`, `/[id]/download`), `/api/deliverable-attachments/[id]/download`, `/api/evaluations`, `/api/hearings/[id]` | El perito carga dictamen PDF y anexos; el cliente solo puede listar/descargar entregables aprobados. Rechazo exige comentario y lo envía al hilo del perito |
| Pagos/Comisiones | `/api/payments/[id]` (+`/quote`, `/receipt`, `/receipt-download`), `/api/commissions` (+`/calculate`, `/:id/receipt`, `/:id/receipt-download`), `/api/cartera` | El cliente aporta comprobante pendiente; financiero/admin valida. El perito solo ve soportes de su propia comisión |
| Portales/perfil | `/api/expert/profile` (+`/cv`), `/api/portal/profile`, `/api/portal/change-password` | Autoservicio aislado. Cambiar HV devuelve al perito a `en_evaluacion` y avisa al admin; cliente ve la cuenta de pago de la marca del caso |
| Mensajería/archivos | `/api/cases/[id]/messages`, `/api/case-messages/[id]/attachment`, `/api/documents/[id]/download` | Dos audiencias mutuamente excluyentes; adjuntos y documentos salen por proxy con autorización y `no-store` |
| Actividades | `/api/activities/[id]` (+`/upload`, `/download`) | Evidencias en Sanity; la URL persistente no se entrega al navegador y la descarga revalida acceso al caso |
| Notificaciones | `/api/notifications` (+`/[id]/read`, `/mark-all-read`) | UI hace polling + WS push |
| WhatsApp | `/api/whatsapp/webhook` (público, valida secret), `/api/whatsapp/leads*` (sesión y permiso) | leads, messages, convert, documents-to-case |
| Web form | `POST /api/web-form` (público exacto), `GET /api/web-form/list` (admin/jurídico/mercadeo) | La lista protege los datos personales del lead |
| Cron | `POST /api/cron/check-alerts` | Exenta + `x-cron-secret` |
| Otros | `/api/dashboard/stats`, `/api/reports/*`, `/api/settings`, `/api/users`, `/api/audit-logs`, `/api/crm|portal/change-password` | |

## Modelo de datos (PostgreSQL — `db/migrations/`)
IDs `TEXT` (UUID nuevos, `_id` Sanity heredados), triggers `updated_at` e índices de acceso por caso/audiencia.
- Núcleo: `cases` (brand CNP/Peritus, status, discipline, FKs a client/expert/users), `crm_client`, `crm_user` (8 roles activos en la app), `company`, `expert` (+`expert_certification_file`; clasificación migración 003: `seniority` junior/senior/master, `category` 7 macro-categorías, ciclo de vida `validation_status` candidato→en_evaluacion→activado, formación pregrado/num_especializaciones/num_maestrias/doctorado), `registro_peritus`
- Ciclo del caso: `case_event`, `case_document`, `quote`, `work_plan` (+`work_plan_activity`), `deliverable`, `evaluation`, `hearing`, `payment`, `commission`, `committee_review` (007: 1 fila/caso — viabilidad/alcance/honorarios/entregables/tiempo)
- Migración 007 (backlog RF): `cases` +`channel` (canal origen) +`commercial_status` (pipeline prospecto→ganado/perdido, separado del `status` técnico) +`loss_reason` +`execution_start_date/execution_deadline`; `case_document` +`status` +`is_required`; `quote` +`channel` +`parent_quote_id` +`next_follow_up_date` +`acceptance_notes`; `crm_client.client_type`; `crm_user.client_id`
- Migraciones 008/009 (G-01..G-22): valores de enum confirmados por separado; banco completo del perito; `assigned_juridico_id`; reloj congelable y plazo hábil de la propuesta; tablas `deliverable_attachment`, `document_request`, `case_message`; soporte de comisión; auditoría de comprobante de cliente; cuentas de pago CNP/PERITUS. El `CHECK case_message_audience_role_check` impide que perito/cliente escriban en el hilo contrario incluso si el API falla
- Sistema: `notification`, `audit_log`, `system_setting`, `admin_config` (hashes contraseña maestra), `whatsapp_lead` (+documents/messages), `web_lead`
- Capa de acceso: `src/lib/db/pool.ts` (pool singleton, `query/queryOne/withTransaction/buildInsert/buildUpdate/newId`); módulos devuelven shapes estilo Sanity (`_id`, `_createdAt`, refs anidados)

## Flujos clave
- **Login admin**: `/admin/login` → POST `/api/auth/login` {type:'admin', password} → compara con `admin_config.master/secondary_password_hash` → cookie `admin-token` (sub:'admin', 7d, httpOnly)
- **Login CRM**: {type:'crm', email, password} → `crm_user` por email → cookie `crm-token`. Clientes (role cliente) son redirigidos de /crm a /portal
- **Login portal**: {type:'portal'} → credenciales y FK `client_id` en `crm_user` → cookie `crm-token` role cliente
- **Middleware** (`src/middleware.ts`): exime logins, `/api/auth/*`, `/api/admin/init`, webhook WhatsApp, cron y POST público exacto de web-form; protege inbox/leads, inyecta `x-user-id/role/name`, reserva `/api/admin*` a admin y redirige al perito a `/crm/cases`
- **Realtime**: route handler → `triggerEvent()` (`src/lib/realtime/server.ts`) → hub en proceso → WS `/ws` (auth por cookie en upgrade, server.js) → `src/lib/realtime/client.ts` (reconexión) → hook `usePusher` (17 consumidores)
- **Caso**: crear (jurídico/admin) → asignar perito con perfil activo y cinco datos bancarios completos (admin/administrativo) → cotizar plazo hábil (financiero/admin) → aprobar → validar primer pago e iniciar reloj → plan del perito (estructura editable en borrador; estados/evidencias durante la ejecución aprobada) → dictamen/anexos → revisión jurídico/admin → al aprobar se libera automáticamente al cliente; al rechazar el comentario obligatorio llega al hilo jurídico↔perito. Revisión y mensaje se confirman en una misma transacción
- **Aislamiento del caso**: `src/lib/auth/caseAccess.ts` centraliza pertenencia y sanitización. El perito solo entra si es `assignedExpert`/`assignedFinanciero`, no recibe nodo cliente ni áreas comerciales; el cliente solo entra por `crm_user.client_id`, no recibe nodo del perito. Ambos ven como único contacto a `assignedJuridico`
- **Mensajería**: una fila pertenece a `juridico_perito` o `juridico_cliente`; nunca se crea un hilo común. API, UI y constraint de BD fijan la audiencia por rol; adjuntos generan notificación, correo y evento sin exponer al tercero
- **Ejecución**: `src/lib/cases/execution.ts` usa el plazo cotizado y festivos de Colombia; empieza al validar el primer pago, se suspende/reanuda conservando días hábiles restantes y alerta cuando quedan ≤3
- **Autorización (2 capas, fuente única)**: módulos/páginas por `ROLE_PERMISSIONS` (`canAccessRoute` en middleware, `hasPermission` en sidebar/tabs) + acciones por helpers en `src/lib/auth/permissions.ts`, enforced en servidor con `guardRole(request, canX)` (`src/lib/auth/guard.ts`, lee `x-user-role`). UI y API beben de los MISMOS helpers.
- **WhatsApp lead**: Evolution API → n8n → `POST /api/whatsapp/webhook` (WHATSAPP_WEBHOOK_SECRET) → `whatsapp_lead` → inbox `/crm/mensajes` → convert a caso
- **Web lead**: landing → `POST /api/web-form` → `web_lead` → `/crm/formularios`
- **Uploads**: route → `src/lib/sanity/assets.ts` → Sanity CDN → URL privada en PG; toda descarga sensible usa `src/lib/files/proxyStoredAsset.ts`, autorización previa, `Content-Disposition` y `Cache-Control: no-store`
- **Cron**: systemd `cnp-check-alerts.timer` (06/12/18 UTC) → check-alerts con `CRON_SECRET` obligatorio → 7 automatizaciones (item 21): audiencias, vencimientos con ventana por `priority` (RF-06: urgente 14d/alta 10d/normal 7d/baja 4d), docs requeridos pendientes (cadencia por priority), expiración de quotes por `valid_until`, seguimientos vencidos, propuestas sin respuesta >7d, ejecución por vencer (≤3 días hábiles)
- **Notificaciones (RF-13)**: TODO pasa por `src/lib/notify.ts` (`notifyUsers`/`notifyUsersAndAdmins`): persiste + push WS `notification:new` (bug del push arreglado) + correo opcional al buzón configurado. Buzones (item 17) en `system_setting`: `email_admin`, `email_comite`, `email_comunicaciones` — editables en /admin/settings
- **Auditoría (item 19)**: `src/lib/audit.ts` (`auditEntityChange` con diff campo a campo old/new) — cableada en cases (create/PUT/DELETE/status/assign/commercial), quotes (send/approve/reject/revise), payments, committee, documentos checklist. UI con diff en /admin/audit-logs
- **Máquina de estados**: fuente única en `src/lib/cases/stateMachine.ts` (VALID_TRANSITIONS + COMMERCIAL_TRANSITIONS) — importada por API y UI; `archivado` ya mapeado (gestionado→archivado→gestionado)

## Dependencias compartidas (alto impacto)
`src/middleware.ts` · `src/lib/db/pool.ts` · `src/lib/types.ts` (roles/enums/interfaces, `ROLE_PERMISSIONS`, `ROLE_CASE_TABS`) · `src/lib/auth/*` (`permissions.ts`, `guard.ts`, `caseAccess.ts`) · `src/lib/files/proxyStoredAsset.ts` · `server.js` (¡los headers de seguridad y el hub WS viven aquí!) · `src/components/layout/` · `src/hooks/useAuth.ts`, `useNotifications.ts`, `usePusher` · `src/lib/email.ts`

## Variables de entorno
`DATABASE_URL` (PG) · `JWT_SECRET` · `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO` · `SANITY_API_TOKEN` + `NEXT_PUBLIC_SANITY_*` (solo assets) · `EVOLUTION_API_URL/KEY/INSTANCE`, `WHATSAPP_WEBHOOK_SECRET` · `CRON_SECRET` · `NEXT_PUBLIC_APP_URL` · (huérfanas en VPS: `PUSHER_*`, `NEXT_PUBLIC_SANITY_ORGANIZATION_ID` — limpiar en Fase 9)

## Lecciones y gotchas (vivo)
- 2026-05-29 · `headers()` de next.config NO corre con servidor custom → headers de seguridad en `server.js`
- 2026-05-29 · `output:'standalone'` genera su propio server.js y mata el hub WS → prohibido
- 2026-05-29 · PM2 en fork ×1 obligatorio (hub WS en memoria de proceso); Nginx debe proxyear Upgrade en `/ws`
- 2026-05-29 · Fase 9 pendiente: rotar secretos expuestos en chat (SANITY_API_TOKEN, JWT_SECRET, RESEND_API_KEY, EVOLUTION_API_KEY), limpiar vars Pusher
- 2026-06-11 · QA: dos fallos de middleware ARREGLADOS — (1) `/api/whatsapp/leads*` y `/crm/mensajes` estaban exentos de auth → fuga pública de PII de leads; ahora exigen sesión (la página los consume con cookie crm-token, no había consumidor server/n8n). (2) `/api/web-form` (POST) estaba bloqueado por el matcher `/api/*` → 401 en el formulario público; ahora exento exacto (`/api/web-form/list` sigue protegido por ser match exacto).
- 2026-06-11 · QA: quitado `fetch('/api/cron/check-alerts', POST)` de `crm/cases/page.tsx` (daba 401 en cada carga; el cron real corre por systemd `cnp-check-alerts` 3×/día).
- 2026-06-11 · QA #4 RESUELTO: creada la página `/crm/cartera` para el rol `financiero`. `CarteraView` extraído a `src/components/crm/CarteraView.tsx` (componente compartido); `admin/cartera/page.tsx` y `crm/cartera/page.tsx` lo re-exportan. Añadido item "Cartera" a `navItems` (CRM) con `permission:'cartera'` y mapeo `/crm/cartera→cartera` en `ROUTE_PERMISSION_MAP`. Verificado en vivo como financiero: ve el item y la página carga (KPIs + tablas, `/api/cartera` 200).
- 2026-06-13 · Coherencia de roles de principio a fin. (1) `ROLE_PERMISSIONS`/`ROLE_CASE_TABS` ampliados: juridico +experts/+deliverables y todas las tabs del caso; financiero +commissions/+experts; administrativo +experts; mercadeo +clients/+formularios; postventa +evaluations. (2) **Hallazgo**: los helpers de `permissions.ts` eran código MUERTO (ninguna API validaba rol salvo `/api/admin/*`) → ahora se aplican en servidor vía `guardRole` en ~30 rutas del flujo (cases/clients create, assign, quotes CRUD+approve/reject, deliverables review, work-plan+activities, experts CRUD/validate, payments/commissions, lead convert, evaluations) y en lecturas sensibles (cartera/reports/audit-logs/settings/evaluations con `hasPermission`). (3) **Bug arreglado** en `canAccessRoute`: hacía match de `/crm` ANTES que la ruta específica (greedy `startsWith`) → el gate de módulo se reducía a "tiene dashboard"; ahora ordena por prefijo más largo. (4) Middleware: rol sin acceso a un módulo ya NO desloguea, redirige a `/crm`. (5) Decisiones de negocio: asignar perito=admin+administrativo; revisar entregas=admin+juridico; convertir leads/crear cliente=admin+juridico+mercadeo; editar/eliminar/validar cliente=admin+juridico (`canManageClients`); plan de trabajo lo edita administrativo (antes financiero, incoherente); peritos CRUD/validate solo admin (`canManageExperts`); evaluaciones=admin+postventa. (6) UI alineada a los mismos helpers (QuoteList, WorkPlanTab, deliverables, experts, ClientTable, cases/clients) y corregido rol inexistente `'comite'`. Verificado `tsc`+build OK.
- 2026-07-23 · Auditoría contra backlog RF-01..RF-14: gotchas descubiertos — (1) `audit_log` + `createAuditLog` (`src/lib/db/auditLog.ts`) existen pero con **0 call sites**: la tabla queda siempre vacía y `/admin/audit-logs` ni pinta `old_values/new_values`. (2) `triggerEvent('notification:new')` jamás se emite: la campana solo se actualiza por polling de 60s (el push realtime de notificaciones nuevas está roto). (3) `POST /api/quotes/[id]/send` está huérfano — ningún botón en UI lo llama, la transición quote `borrador→enviada` es inalcanzable desde producto; el estado `expirada` nunca se asigna (no hay lógica sobre `valid_until`). (4) Estado `archivado` existe en el enum de BD pero no está en `CASE_STATUSES`/labels/transiciones TS (inalcanzable). (5) `case_document` NO tiene columna de estado (no hay checklist recibido/parcial/no recibido; los docs solo nacen al subir archivo). (6) `cases.priority` no influye en los plazos del cron check-alerts (umbral fijo 7 días; priority solo colorea la notificación). (7) Los 2 payments se auto-crean al CREAR la quote (estado borrador), no al aprobarla; validar pago (receipt→`validado`) no notifica ni cambia el estado del caso. (8) La máquina de estados de caso está duplicada front (`crm/cases/[id]/page.tsx`) y back (`api/cases/[id]/status/route.ts`). (9) El vínculo portal↔cliente es por email en texto (`clientAccess.ts`, `LIMIT 1`), no FK.
- 2026-08-04 · G-01..G-22: el aislamiento no depende solo de ocultar componentes. Se reforzó en cuatro capas: pertenencia/sanitización del objeto caso, filtros de consulta, descargas proxy sin URL cruda y constraints de mensajería en PostgreSQL. Los valores añadidos a enums viven en la migración 008 y su uso en la 009: PostgreSQL exige que el valor quede confirmado antes de utilizarlo en `UPDATE`/defaults dentro de otra migración.
- 2026-06-11 · QA #5 RESUELTO: regla en Nginx (`/etc/nginx/sites-available/cnp.com.co`) `if ($http_next_action) { return 444; }` — descarta los sondeos de bots a Server Actions (la app no usa Server Actions). Backup en `/root/cnp.com.co.bak-2026-06-11`. Verificado: petición con header `Next-Action` → conexión cerrada (444); tráfico legítimo intacto (GET / 200, web-form 400). Si se reinstala Nginx, re-aplicar la regla.
