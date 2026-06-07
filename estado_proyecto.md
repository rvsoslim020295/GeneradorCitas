# Estado del Proyecto — GlowManager
**Fecha:** 6 de Junio 2026  
**Versión:** 5.0  
**Repositorio:** https://github.com/rvsoslim020295/GeneradorCitas  
**Rama activa:** `main` + `feat/super-admin` (pendiente de merge)

---

## 1. Resumen Ejecutivo

GlowManager es un panel administrativo B2B para negocios de belleza (salones, barberías, spas, nail bars). Permite gestionar citas, clientes, colaboradores, servicios, pagos y reportes desde una interfaz web orientada a dueños y recepcionistas en desktop.

**Estado actual:** MVP 100% funcional, production-ready en seguridad, con panel de super administrador funcional y sistema de planes de suscripción manual implementado.

---

## 2. Lo implementado en esta sesión (v5.0)

### 2.1 Fix: endpoint /users faltante (CFG-03)
- Creado `apps/api/src/routes/users.ts` con CRUD completo (GET, POST, PATCH, DELETE)
- Roles alineados al schema real: `OWNER`, `ADMIN`, `COLLABORATOR`
- Eliminados campos inexistentes `isActive` y `lastLoginAt` del frontend
- Página `/configuracion/usuarios` ahora carga correctamente

### 2.2 Fix: toggle de WhatsApp desalineado
- Corregido `left-0.5` en el componente `Toggle` de `/configuracion/whatsapp`

### 2.3 Panel Super Administrador + Planes de suscripción
- **Schema:** enums `PlanType` (TRIAL, BASIC, PRO, ENTERPRISE) y `PlanStatus` (ACTIVE, EXPIRED, SUSPENDED)
- **Schema:** campos `plan`, `planStatus`, `planExpiresAt` en `Business`
- **Schema:** modelo `SuperAdmin` independiente
- **Backend:** middleware `requireSuperAdmin` con cookie `gm_admin_token`
- **Backend:** rutas `/admin/auth/login`, `/admin/auth/logout`, `/admin/stats`, `/admin/businesses`, `/admin/businesses/:id`, `/admin/businesses/:id/plan`, `/admin/businesses/:id/suspend`
- **Script:** `create-super-admin.ts` para crear la cuenta inicial desde `.env`
- **Frontend:** `/admin/login`, `/admin/dashboard`, `/admin/negocios/[id]`
- **Middleware:** rutas `/admin` excluidas del flujo de auth de clientes

---

## 3. Stack Tecnológico

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
| ORM | Prisma 7.8 |
| Base de datos | PostgreSQL |
| Autenticación clientes | JWT en httpOnly cookie `gm_token` — 7 días |
| Autenticación admin | JWT en httpOnly cookie `gm_admin_token` — 7 días |
| Email | Nodemailer (SMTP Gmail) |
| Storage | Supabase Storage (bucket `logos`) |
| Runtime | Node.js (tsx watch) |

### Infraestructura
| Capa | Servicio |
|---|---|
| Frontend | Vercel (planificado) |
| Backend | Railway (planificado) |
| Base de datos | Supabase PostgreSQL (planificado) |
| Storage | Supabase Storage (activo) |
| Monorepo | pnpm workspaces |

---

## 4. Arquitectura del Frontend

### Estructura de rutas (`apps/web/src/app/`)

```
(auth)/
  login/                    AUTH-01
  registro/                 AUTH-00
  recuperar-contrasena/     AUTH-02
  resetear-contrasena/      AUTH-03
  verificar-correo/         AUTH-04
  verificar-email/          AUTH-05

(onboarding)/
  onboarding/               SETUP-01

(agenda)/
  agenda/                   CAL-01
  nueva-cita/               CAL-03
  citas/[id]/               CAL-02
  citas/[id]/cobrar/        CAL-04

(dashboard)/
  dashboard/                DASH-01
  clientes/                 CLI-01
  clientes/[id]/            CLI-02
  clientes/nuevo/
  colaboradores/            STAFF-01
  colaboradores/[id]/       STAFF-02
  colaboradores/nuevo/
  servicios/                SRV-01
  servicios/[id]/           SRV-02
  servicios/nuevo/
  reportes/                 RPT-01
  configuracion/            CFG hub
  configuracion/negocio/    CFG-01 — upload logo a Supabase
  configuracion/agenda/     CFG-02
  configuracion/usuarios/   CFG-03 — CRUD usuarios del negocio
  configuracion/whatsapp/   CFG-04

admin/
  login/                    ADMIN-01 — Login super admin
  dashboard/                ADMIN-02 — Listado de negocios + stats
  negocios/[id]/            ADMIN-03 — Gestión de plan y acceso
```

### Componentes globales
```
src/middleware.ts            Protección de rutas — redirige según cookie gm_token
                             Rutas /admin excluidas del flujo de clientes

src/components/layout/
  sidebar.tsx          Navegación lateral — filtro por rol
  top-bar.tsx          TopBar con prop hideSearch
  global-search.tsx    Buscador global con debounce 300ms
  query-provider.tsx   QueryClientProvider + ReactQuery DevTools

src/lib/api/
  client.ts            apiFetch — credentials: "include"

src/lib/api/hooks/
  index.ts
  use-clients.ts
  use-collaborators.ts
  use-services.ts
  use-appointments.ts  → 7 estados incluyendo IN_PROGRESS y RESCHEDULED
  use-analytics.ts
  use-notifications.ts
  use-settings.ts
  use-availability.ts
```

---

## 5. Arquitectura del Backend

### Endpoints (`apps/api/src/routes/`)

| Archivo | Rutas principales |
|---|---|
| `auth.ts` | POST /auth/register, GET /auth/verify-email, POST /auth/login, POST /auth/logout, GET /auth/me |
| `users.ts` | CRUD /users — usuarios del negocio actual |
| `clients.ts` | CRUD /clients |
| `collaborators.ts` | CRUD /collaborators + ausencias |
| `services.ts` | CRUD /services |
| `appointments.ts` | CRUD /appointments + status + payment + deposit |
| `availability.ts` | GET /availability/slots |
| `notifications.ts` | GET /notifications |
| `analytics.ts` | GET /analytics?period= |
| `settings.ts` | GET/PATCH /settings, POST /settings/logo |
| `admin.ts` | POST /admin/auth/login, POST /admin/auth/logout, GET /admin/stats, CRUD /admin/businesses |

### Middleware
- `auth.ts` — `requireAuth`: lee cookie `gm_token` o header `Authorization`
- `admin-auth.ts` — `requireSuperAdmin`: lee cookie `gm_admin_token`
- CORS: `credentials: true`, origin desde env `FRONTEND_URL`

---

## 6. Schema Prisma (estado actual)

```prisma
enum Role { OWNER / COLLABORATOR / ADMIN }

enum AppointmentStatus {
  PENDING / CONFIRMED / IN_PROGRESS / COMPLETED / CANCELLED / NO_SHOW / RESCHEDULED
}

enum PlanType { TRIAL / BASIC / PRO / ENTERPRISE }
enum PlanStatus { ACTIVE / EXPIRED / SUSPENDED }

model Business {
  ...
  plan              PlanType   @default(TRIAL)
  planStatus        PlanStatus @default(ACTIVE)
  planExpiresAt     DateTime?
  trialEndsAt       DateTime?
}

model SuperAdmin {
  id        String
  email     String @unique
  password  String
  name      String
}

model Appointment {
  price          Float    ← precio base (inmutable)
  tipPercent     Float    @default(0)
  paidAmount     Float?   ← total cobrado con propina
  depositAmount  Float?   ← anticipo (≤ price)
  paymentMethod  String?
  status         AppointmentStatus
}
```

---

## 7. Variables de entorno

### Backend (`apps/api/.env`)
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
ADMIN_JWT_SECRET=...           ← para cookies del panel admin
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://smpsncdzdvoanqxieicc.supabase.co
SUPABASE_SERVICE_KEY=sb_secret_...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=glowmanager95@gmail.com
SMTP_PASS=...
APP_URL=http://localhost:3000
TZ=America/Lima                ← OBLIGATORIO en producción
SUPER_ADMIN_EMAIL=...          ← solo para el script de seed
SUPER_ADMIN_NAME=...
SUPER_ADMIN_PASSWORD=...
```

### Frontend (`apps/web/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 8. Panel Super Admin

| Ruta | Descripción |
|---|---|
| `/admin/login` | Login exclusivo con credenciales de super admin |
| `/admin/dashboard` | Stats globales + lista de todos los negocios registrados |
| `/admin/negocios/:id` | Detalle del negocio, cambio de plan, fecha de vencimiento, suspender/reactivar |

**Flujo de activación manual de planes:**
1. Cliente se registra → 7 días trial gratis
2. Al vencer, el negocio queda `planStatus: EXPIRED`
3. Cliente paga (transferencia, yape, etc.)
4. Admin entra a `/admin/negocios/:id`, selecciona plan y fecha de vencimiento, guarda
5. Cliente recupera acceso automáticamente

**Crear/recrear cuenta super admin:**
```bash
cd apps/api
npx tsx src/scripts/create-super-admin.ts
```

---

## 9. Pantallas — Estado Final

| ID | Pantalla | Estado |
|---|---|---|
| AUTH-00 a AUTH-05 | Flujo completo de auth + verificación email | ✅ |
| SETUP-01 | Onboarding wizard | ✅ |
| DASH-01 | Dashboard KPIs | ✅ |
| CAL-01 a CAL-04 | Agenda, nueva cita, detalle, cobro | ✅ |
| CLI-01, CLI-02 | Clientes | ✅ |
| STAFF-01, STAFF-02 | Colaboradores | ✅ |
| SRV-01, SRV-02 | Servicios | ✅ |
| RPT-01 | Reportes | ✅ |
| CFG-01 a CFG-04 | Configuración completa | ✅ |
| SYS-01 a SYS-03 | Notificaciones, 404, Error | ✅ |
| ADMIN-01 a ADMIN-03 | Panel super admin | ✅ |

**Total pantallas clientes: 26/26 · Panel admin: 3/3**

---

## 10. Bugs — Estado Final

| ID | Descripción | Estado |
|---|---|---|
| BUG-01 | Anticipo sin validación | ✅ Resuelto |
| BUG-02 | KPIs hardcodeados | ✅ Resuelto |
| BUG-03 | Logo en base64 en BD | ✅ Resuelto — Supabase Storage |
| BUG-04 | Protección de rutas solo client-side | ✅ Resuelto — middleware.ts |
| BUG-05 | JWT en localStorage | ✅ Resuelto — httpOnly cookie |

**Sin bugs pendientes conocidos.**

---

## 11. Deuda Técnica Pendiente

### Media prioridad
| Item | Descripción |
|---|---|
| Bloqueo por plan vencido | Al hacer login, verificar planStatus y redirigir si EXPIRED/SUSPENDED |
| WhatsApp real | CFG-04 tiene UI pero sin integración real (BuilderBot o Meta Cloud API pendiente) |

### Baja prioridad
| Item | Descripción |
|---|---|
| Culqi / pagos automáticos | Actualmente el plan se activa manualmente por el admin |
| Drag & drop en calendario | Evaluar FullCalendar |
| `payments` tabla separada | El pago está inline en `Appointment` |
| `staff_services` N:M | Especialidades como `String[]` |
| Responsividad móvil | Solo desktop |
| `audit_log` | Trazabilidad de acciones críticas |

---

## 12. PRs

| PR | Título | Estado |
|---|---|---|
| #23–#26 | TanStack Query, cita-detail, comparativos, BUG-01 | ✅ Mergeados |
| #27 | Verificación de email + correcciones | ✅ Mergeado |
| #28 | BUG-03 — Logo a Supabase Storage | ✅ Mergeado |
| #29 | Estados IN_PROGRESS y RESCHEDULED | ✅ Mergeado |
| #30 | BUG-04 + BUG-05 — Seguridad httpOnly cookie | ✅ Mergeado |
| #31 (pendiente) | Panel super admin + planes de suscripción | 🔄 Pendiente de merge |

---

## 13. Próximos Pasos Sugeridos

1. **Merge PR #31** — panel super admin
2. **Bloqueo por plan vencido** — verificar `planStatus` al login y mostrar pantalla de plan vencido
3. **Deploy a producción** — Vercel (frontend) + Railway (backend) + Supabase (BD)
4. **BuilderBot / WhatsApp** — integración de notificaciones reales
5. **Culqi** — pasarela de pagos para automatizar activación de planes

---

## 14. Nota importante para producción

```
TZ=America/Lima          ← en Railway, para cálculos de horarios correctos
FRONTEND_URL=https://tu-dominio.vercel.app  ← para CORS y cookies
NODE_ENV=production      ← activa flag Secure en las cookies httpOnly
```
