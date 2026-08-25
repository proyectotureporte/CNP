# CNP | Peritus — instrucciones del proyecto

Consulta `docs/PROJECT-MAP.md` antes de cualquier cambio no trivial; es el mapa vivo y la fuente actual sobre rutas, permisos, datos y flujos.

## Stack y verificación

- Next.js 16 App Router, React 19 y TypeScript estricto.
- PostgreSQL mediante SQL crudo en `src/lib/db/`; no hay ORM.
- Auth JWT propia en `src/lib/auth/` y permisos compartidos entre UI/API.
- Servidor custom `server.js` para Next.js y WebSockets.
- Antes de entregar cambios: `npx tsc --noEmit`, lint del alcance y `npm run build`.
- No hacer commit, push ni despliegue salvo petición expresa del usuario.

## Reglas críticas

- Roles definitivos: `admin`, `comercial_juridico`, `junta`, `perito_interno`, `perito`, `cliente`.
- Cambiar permisos siempre desde `src/lib/types.ts` y `src/lib/auth/permissions.ts`; nunca confiar solo en ocultar UI.
- El acceso combinado de `ferneyolicas@gmail.com` usa la bandera JWT firmada `allRoles`; no es un séptimo rol.
- Peritos y clientes deben conservar su aislamiento de casos y datos privados mediante `src/lib/auth/caseAccess.ts`.
- Los dos hilos de mensajería de cada caso son independientes y no permiten suplantación de audiencia.
- Los IDs son `TEXT`; la tabla `cases` es palabra reservada y las migraciones viven en `db/migrations/`.
- PM2 debe mantener una sola instancia porque el hub WebSocket vive en memoria.
- Los headers de seguridad viven en `server.js`; no usar `output: 'standalone'`.
- Preservar modificaciones ajenas existentes en el worktree y evitar operaciones destructivas.
