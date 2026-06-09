# Estado del Proyecto — GlowManager
**Fecha:** 9 de Junio 2026
**Versión:** 11.0
**Repositorio:** https://github.com/rvsoslim020295/GeneradorCitas
**Rama activa:** `main`
**PRs mergeados en esta sesión:** #45–#48 (previos), deploy en progreso

---

## 1. Resumen Ejecutivo

GlowManager es un panel administrativo B2B para negocios de belleza (salones, barberías, spas, nail bars). Permite gestionar citas, clientes, colaboradores, servicios, paquetes, pagos y reportes desde una interfaz web orientada a dueños y recepcionistas en desktop.

**Estado actual:** MVP 100% funcional en código. Deploy en progreso — frontend en Vercel funcionando, backend en Railway con problema de arranque por compatibilidad Prisma 6 + pnpm.

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

## 4. Lo implementado en esta sesión (v11.0) — Deploy

### 4.1 Configuración de deploy

- **`nixpacks.toml`** (raíz): configura build en Railway
  - Build: `pnpm exec prisma generate && pnpm --filter api exec tsc`
  - Start: `node apps/api/dist/index.js`
- **`apps/web/vercel.json`**: framework Next.js para Vercel
- **`pnpm-lock.yaml`**: commiteado para builds reproducibles
- **`.npmrc`**: `shamefully-hoist=true` para compatibilidad pnpm

### 4.2 Servicios configurados

- **Railway PostgreSQL**: base de datos en producción, Online
- **Vercel Hobby**: frontend deployado y funcionando en https://glowmanager-web.vercel.app
- **Schema migrado**: `prisma db push` corrido contra Railway PostgreSQL
- **Super admin creado**: `glowmanager95@gmail.com` / `mamita123`

### 4.3 Fixes de compatibilidad Prisma

- Bajada de Prisma 7 → Prisma 6 (Prisma 7 tenía incompatibilidad con pnpm en Railway por `@prisma/client-runtime-utils`)
- `prisma.config.ts` eliminado (era específico de Prisma 7)
- `datasource db.url = env("DATABASE_URL")` restaurado en schema
- Output del cliente Prisma: `apps/api/generated/prisma` (custom, commiteado)
- Imports actualizados en `prisma.ts` y `seed.ts`

### 4.4 Variables de entorno configuradas

**Railway (backend):**
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<generado>
ADMIN_JWT_SECRET=<generado>
FRONTEND_URL=https://glowmanager-web.vercel.app
APP_URL=https://glowmanager-web.vercel.app
SUPABASE_URL=https://smpsncdzdvoanqxieicc.supabase.co
SUPABASE_SERVICE_KEY=<service_role key>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=glowmanager95@gmail.com
SMTP_PASS=<app password Gmail>
TZ=America/Lima
NODE_ENV=production
SUPER_ADMIN_EMAIL=glowmanager95@gmail.com
SUPER_ADMIN_NAME=GlowManagerAdmin
SUPER_ADMIN_PASSWORD=mamita123
```

**Vercel (frontend):**
```
NEXT_PUBLIC_API_URL=https://generadorcitas-production.up.railway.app
```

---

## 5. Bug pendiente — Backend no arranca en Railway

**Síntoma:** `GET /health` devuelve 502. Deploy dice "Completed" pero el proceso crashea al iniciar.

**Último error conocido:** `Cannot find module '@prisma/client-runtime-utils'` — persistía incluso después de bajar a Prisma 6 (el paquete quedó como dependencia directa con versión 7.8.0 en `apps/api/package.json`).

**Último commit pusheado:** `97e0fd8` — Prisma 6, schema con url, output generado en `apps/api/generated/prisma`.

**Próximo paso para resolver:**
1. Verificar que el deploy de `97e0fd8` haya terminado en Railway
2. Si sigue fallando, revisar `apps/api/package.json` — eliminar `@prisma/client-runtime-utils` (era de Prisma 7, ya no aplica)
3. Correr localmente: `pnpm exec prisma generate && cd apps/api && pnpm exec tsc` para confirmar que el build es limpio
4. Si persiste, intentar buildear el servidor con `tsx` en lugar de `tsc` para evitar el paso de compilación

---

## 6. Stack Tecnológico

### Frontend (`apps/web`)
| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js App Router | 15.5.19 |
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
| Autenticación clientes | JWT en httpOnly cookie `gm_token` |
| Autenticación admin | JWT en httpOnly cookie `gm_admin_token` |
| Email | Nodemailer (SMTP Gmail) |
| Storage | Supabase Storage (bucket `logos`) |
| Runtime | Node.js v22 |
| Scheduler | node-cron (recordatorios WhatsApp) |

### Infraestructura
| Capa | Servicio |
|---|---|
| Frontend | Vercel (Hobby) — https://glowmanager-web.vercel.app |
| Backend | Railway — https://generadorcitas-production.up.railway.app |
| Base de datos | Railway PostgreSQL |
| Storage | Supabase Storage (activo) |
| Monorepo | pnpm workspaces |

---

## 7. Arquitectura del Frontend

### Grupos de rutas (`apps/web/src/app/`)

```
(auth)/
  login/                    ✅
  registro/
  recuperar-contrasena/
  resetear-contrasena/
  verificar-correo/
  verificar-email/

(agenda)/
  agenda/                   ✅
  nueva-cita/               ✅
  citas/[id]/               ✅
  citas/[id]/cobrar/

(dashboard)/
  dashboard/                ✅
  plan-vencido/
  clientes/                 ✅
  clientes/[id]/            ✅
  clientes/nuevo/
  colaboradores/            ✅
  colaboradores/[id]/
  colaboradores/nuevo/
  servicios/                ✅
  servicios/[id]/
  servicios/nuevo/
  paquetes/                 ✅
  planes/                   ✅
  reportes/
  configuracion/negocio/
  configuracion/agenda/
  configuracion/usuarios/
  configuracion/whatsapp/   ✅

admin/
  dashboard/
  negocios/[id]/
```

---

## 8. Arquitectura del Backend

### Endpoints (`apps/api/src/routes/`)

| Archivo | Rutas principales |
|---|---|
| `auth.ts` | POST /auth/login, GET /auth/me |
| `users.ts` | GET /users; POST/PATCH/DELETE — solo OWNER |
| `clients.ts` | CRUD + duplicados + POST /clients/merge + fichas técnicas |
| `collaborators.ts` | CRUD + performsServices + schedule dinámico |
| `services.ts` | CRUD + maxConcurrent |
| `packages.ts` | CRUD + límite plan |
| `appointments.ts` | CRUD + status + origins |
| `availability.ts` | GET /slots (TZ explícito + reason) |
| `analytics.ts` | métricas completas |
| `settings.ts` | GET/PATCH /settings /business /agenda /logo /whatsapp |
| `notifications.ts` | GET /notifications |
| `admin.ts` | Panel super admin |

### Build config (Railway)
```
Build Command: pnpm exec prisma generate && pnpm --filter api exec tsc
Start Command: node apps/api/dist/index.js
Root Directory: (vacío — raíz del repo)
```

---

## 9. Schema Prisma (v6, estado actual)

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../apps/api/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Modelos principales: `Business`, `User`, `Client`, `Collaborator`, `Service`, `Package`, `Appointment`, `AppointmentEvent`, `ClientRecord`

---

## 10. Variables de entorno locales

### Backend (`apps/api/.env`)
```
DATABASE_URL=postgresql://... (local)
JWT_SECRET=...
ADMIN_JWT_SECRET=...
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://smpsncdzdvoanqxieicc.supabase.co
SUPABASE_SERVICE_KEY=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=glowmanager95@gmail.com
SMTP_PASS=...
APP_URL=http://localhost:3000
TZ=America/Lima
SUPER_ADMIN_EMAIL=...
SUPER_ADMIN_NAME=...
SUPER_ADMIN_PASSWORD=...
```

### Frontend (`apps/web/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 11. Deuda Técnica Pendiente

### Crítico (bloquea producción)
| Item | Descripción |
|---|---|
| **Backend Railway crashea** | Ver sección 5 — resolver arranque del API en Railway |

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

## 12. Comandos útiles

```bash
# Desarrollo local
pnpm --filter web dev       # frontend en :3000
pnpm --filter api dev       # backend en :3001

# Build
pnpm exec prisma generate
pnpm --filter api run build  # tsc → apps/api/dist/

# Base de datos producción
DATABASE_URL="postgresql://postgres:...@yamabiko.proxy.rlwy.net:20654/railway" pnpm exec prisma db push

# Crear super admin en producción
cd apps/api
DATABASE_URL="..." SUPER_ADMIN_EMAIL="..." SUPER_ADMIN_PASSWORD="..." npx tsx src/scripts/create-super-admin.ts
```

---

## 13. Historial de PRs

| PR | Título | Estado |
|---|---|---|
| #1–#44 | Features y fixes de sesiones anteriores | ✅ Mergeados |
| #45 | Feat: fusionar clientes duplicados | ✅ Mergeado |
| #46 | Feat: recordatorios automáticos WhatsApp | ✅ Mergeado |
| #47 | Fix: recordatorios + UX eliminaciones + notificaciones RT | ✅ Mergeado |
| #48 | Fix: build producción limpio — TS cero errores | ✅ Mergeado |
| — | Deploy: Railway + Vercel (en progreso) | 🔄 En curso |
