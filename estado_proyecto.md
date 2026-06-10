# Estado del Proyecto — GlowManager
**Fecha:** 9 de Junio 2026
**Versión:** 12.0
**Repositorio:** https://github.com/rvsoslim020295/GeneradorCitas
**Rama activa:** `main`

---

## 1. Resumen Ejecutivo

GlowManager es un panel administrativo B2B para negocios de belleza (salones, barberías, spas, nail bars). Permite gestionar citas, clientes, colaboradores, servicios, paquetes, pagos y reportes desde una interfaz web orientada a dueños y recepcionistas en desktop.

**Estado actual:** ✅ MVP 100% en producción — frontend en Vercel + backend en Railway operativos. Login funcionando. Dashboard accesible.

---

## 2. URLs de Producción

| Servicio | URL |
|---|---|
| **Frontend (Vercel)** | https://glowmanager-web.vercel.app |
| **Backend (Railway)** | https://generadorcitas-production.up.railway.app |
| **Base de datos** | Railway PostgreSQL (interno) |
| **Storage logos** | Supabase Storage — bucket `logos` |

---

## 3. Lo implementado hasta v10.0 (sesiones anteriores)

- Login unificado + Remember Me
- Planes BASIC / PRO / ENTERPRISE con restricciones en backend
- Módulo de Paquetes/Combos
- Métricas avanzadas en Reportes
- Panel Super Admin completo
- Bloqueo por plan vencido/suspendido → `/plan-vencido`
- Campo `performsServices` en colaboradores
- Capacidad máxima simultánea por servicio (`maxConcurrent`)
- Slots dinámicos, Walk-in, Cobrar/Completar desacoplados
- Fixes críticos de TZ y disponibilidad
- Notificaciones WhatsApp via `wa.me` con plantillas editables
- Políticas de cancelación y reagendamiento independientes
- Sistema completo de roles OWNER / ADMIN / COLLABORATOR
- Solo mis citas para COLLABORATOR (vínculo User↔Collaborator)
- Historial real de cita (modelo `AppointmentEvent` + timeline)
- Exportar reportes a Excel
- Ficha técnica por cliente (modelo `ClientRecord` + CRUD + UI)
- Fusionar clientes duplicados (endpoint merge + modal UI)
- Recordatorios automáticos WhatsApp (scheduler 24h y 2h)
- Modales in-page para eliminaciones
- Notificaciones en tiempo real con TanStack Query
- Mejoras de navegación en perfil de cliente
- Build limpio: 0 errores TS, 0 errores ESLint, 32/32 páginas

---

## 4. Lo resuelto en v11.0 — Deploy inicial

### 4.1 Configuración de deploy
- `nixpacks.toml` — build y start para Railway
- `apps/web/vercel.json` — framework Next.js para Vercel
- `pnpm-lock.yaml` commiteado para builds reproducibles
- `.npmrc` con `shamefully-hoist=true`

### 4.2 Servicios configurados
- Railway PostgreSQL Online
- Vercel Hobby deployado en https://glowmanager-web.vercel.app
- Schema migrado: `prisma db push` contra Railway PostgreSQL
- Super admin creado: `glowmanager95@gmail.com`

### 4.3 Fixes Prisma
- Bajada Prisma 7 → Prisma 6
- Eliminados `@prisma/adapter-pg` y `@prisma/client-runtime-utils`
- `prisma.ts` simplificado a `new PrismaClient()` estándar

---

## 5. Lo resuelto en v12.0 — Fixes de producción (esta sesión)

### 5.1 Backend Railway no respondía (502)
- **Causa:** Railway proxy apuntaba al puerto 3001 pero el app escuchaba en 3000 (variable `PORT=3000` seteada manualmente, Railway Networking actualizado a port 3000)
- **Fix adicional:** `hostname: "0.0.0.0"` en `serve()` de Hono para escuchar en todas las interfaces

### 5.2 CORS bloqueado
- **Causa:** middleware `hono/cors` con `origin` función no enviaba headers en Railway
- **Fix:** middleware CORS manual con headers explícitos; OPTIONS handler con `app.options("*", ...)`

### 5.3 Auth cross-domain (cookie no viajaba entre Vercel y Railway)
- **Causa:** cookies `SameSite=Lax` bloqueadas cross-domain; middleware Next.js verificaba cookie server-side
- **Fix:**
  1. Cookies cambiadas a `SameSite=None; Secure`
  2. Backend devuelve `token` en body del login
  3. Frontend guarda token en `localStorage` + cookie JS (`document.cookie`) para que el middleware de Next.js la lea
  4. `apiFetch` envía `Authorization: Bearer TOKEN` desde localStorage
  5. `requireSuperAdmin` middleware actualizado para aceptar Authorization header

### 5.4 SMTP bloqueado en Railway
- **Causa:** Railway bloquea puerto 587 (ETIMEDOUT)
- **Fix:** puerto cambiado a **465 con SSL** (`secure: true`); timeout 8s en conexión
- **Variable Railway:** `SMTP_PORT=465`
- **Pendiente:** verificar que emails de verificación lleguen correctamente con puerto 465

### 5.5 Registro colgado
- **Causa:** `sendVerificationEmail` sin timeout bloqueaba la respuesta
- **Fix:** `connectionTimeout: 8000` y `socketTimeout: 8000` en nodemailer

### 5.6 Variables Railway configuradas correctamente
| Variable | Valor |
|---|---|
| `PORT` | `3000` |
| `SMTP_PORT` | `465` |
| Railway Networking | Port 3000 |

---

## 6. Estado actual de flujos

| Flujo | Estado |
|---|---|
| Login super admin | ✅ Funciona |
| Login usuario normal | ✅ Funciona |
| Dashboard | ✅ Accesible |
| Registro | ✅ Crea cuenta (email de verificación pendiente confirmar) |
| Verificación email | ⚠️ Pendiente confirmar con puerto 465 |
| Onboarding negocio (4 pasos) | ⚠️ Solo accesible vía link de verificación en email |

---

## 7. Deuda Técnica Pendiente

### Crítico
| Item | Descripción |
|---|---|
| **Verificación email** | Confirmar que puerto 465 envía emails correctamente en Railway |
| **Onboarding post-registro** | Usuarios verificados manualmente no pasan por los 4 pasos de configuración del negocio |

### Media prioridad
| Item | Descripción |
|---|---|
| **WhatsApp botón en ficha técnica** | Enviar resumen de tratamiento al cliente vía wa.me |
| **WhatsApp automático real** | Evolucionar de wa.me manual a Baileys o Evolution API |
| **Comisiones por colaborador** | % sobre servicios atendidos |
| **Foto de resultado por cita** | Portafolio del negocio |

### Baja prioridad
| Item | Descripción |
|---|---|
| **Pagos automáticos (Culqi)** | Activación de plan es manual hoy |
| **Drag & drop en calendario** | Evaluar FullCalendar |
| **Tabla `payments` separada** | El pago está inline en `Appointment` |
| **Responsividad móvil** | Solo desktop |
| **`audit_log`** | Trazabilidad de acciones críticas |

---

## 8. Stack Tecnológico

### Frontend (`apps/web`)
| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js App Router | 15.x |
| Lenguaje | TypeScript | 5.x |
| Estilos | Tailwind CSS | 4.x |
| Design System | Material Design 3 (tokens CSS) | — |
| Fuente | Inter (Google Fonts) | — |
| Íconos | Lucide React | 1.x |
| Data fetching | TanStack Query | v5 |

### Backend (`apps/api`)
| Capa | Tecnología |
|---|---|
| Framework | Hono.js |
| ORM | Prisma 6.x |
| Base de datos | PostgreSQL (Railway) |
| Auth | JWT — Authorization header + cookie fallback |
| Email | Nodemailer (SMTP Gmail, puerto 465 SSL) |
| Storage | Supabase Storage (bucket `logos`) |
| Runtime | Node.js v22 |
| Scheduler | node-cron (recordatorios WhatsApp) |

### Infraestructura
| Capa | Servicio |
|---|---|
| Frontend | Vercel (Hobby) |
| Backend | Railway — port 3000 |
| Base de datos | Railway PostgreSQL |
| Storage | Supabase Storage |
| Monorepo | pnpm workspaces |

---

## 9. Arquitectura Auth (v12.0)

**Login flow:**
1. POST `/auth/login` → backend devuelve `{ token, user }`
2. Frontend guarda `token` en `localStorage("gm_token")` + `document.cookie("gm_token")` 
3. `apiFetch` envía `Authorization: Bearer TOKEN` en cada request
4. Middleware Next.js lee cookie `gm_token` para proteger rutas server-side
5. Backend middleware lee `Authorization` header (o cookie como fallback)

---

## 10. Build config (Railway)

```
Build: pnpm exec prisma generate && pnpm --filter api run build
Start: node /app/apps/api/dist/index.js
Port:  3000 (Railway Networking → Port 3000)
```

---

## 11. Variables de entorno Railway (producción)

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<generado>
ADMIN_JWT_SECRET=<generado>
FRONTEND_URL=https://glowmanager-web.vercel.app
APP_URL=https://glowmanager-web.vercel.app
SUPABASE_URL=https://smpsncdzdvoanqxieicc.supabase.co
SUPABASE_SERVICE_KEY=<service_role key>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=glowmanager95@gmail.com
SMTP_PASS=<app password Gmail>
TZ=America/Lima
NODE_ENV=production
PORT=3000
SUPER_ADMIN_EMAIL=glowmanager95@gmail.com
SUPER_ADMIN_NAME=GlowManagerAdmin
SUPER_ADMIN_PASSWORD=mamita123
```

---

## 12. Comandos útiles

```bash
# Desarrollo local
pnpm --filter web dev       # frontend en :3000
pnpm --filter api dev       # backend en :3001

# Build
pnpm exec prisma generate
pnpm --filter api run build

# Verificar usuario manualmente (Railway Console)
node -e "import('/app/apps/api/dist/lib/prisma.js').then(async ({default: prisma}) => { await prisma.user.updateMany({ where: { email: 'EMAIL' }, data: { emailVerified: true } }); console.log('verificado'); process.exit(0); });"
```

---

## 13. Historial de PRs / Commits clave

| Commit | Descripción |
|---|---|
| `33e93c5` | fix: eliminar dependencias Prisma 7 |
| `7b70ae1` | fix: CORS manual con headers explícitos |
| `35bbdf9` | fix: servidor escucha en 0.0.0.0 |
| `e268aa0` | fix: cookies SameSite=None; Secure |
| `b2d919c` | fix: auth por Authorization header |
| `795f40d` | fix: admin auth acepta Authorization header |
| `782b31f` | fix: timeout 8s en SMTP |
| `c2bb597` | fix: SMTP puerto 465 SSL |
| `ce0dde0` | fix: cookie JS para middleware Next.js |
