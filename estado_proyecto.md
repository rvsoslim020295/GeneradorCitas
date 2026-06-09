# Estado del Proyecto — GlowManager
**Fecha:** 9 de Junio 2026
**Versión:** 9.0
**Repositorio:** https://github.com/rvsoslim020295/GeneradorCitas
**Rama activa:** `feat/super-admin`
**PRs de esta sesión:** Sin merge — trabajo acumulado en rama activa

---

## 1. Resumen Ejecutivo

GlowManager es un panel administrativo B2B para negocios de belleza (salones, barberías, spas, nail bars). Permite gestionar citas, clientes, colaboradores, servicios, paquetes, pagos y reportes desde una interfaz web orientada a dueños y recepcionistas en desktop.

**Estado actual:** MVP 100% funcional. En esta sesión (v9.0) se implementó el sistema completo de roles diferenciados (OWNER / ADMIN / COLLABORATOR) con protección real de rutas en backend y frontend, se corrigieron múltiples bugs de UI, se mejoró la seguridad del módulo de usuarios, y se unificaron mejoras de UX en agenda, clientes y configuración.

---

## 2. Lo implementado hasta v8.0 (sesiones anteriores)

- Login unificado + Remember Me
- Planes BASIC / PRO / ENTERPRISE con restricciones en backend
- Módulo de Paquetes/Combos
- Métricas avanzadas en Reportes
- Panel Super Admin completo
- Bloqueo por plan vencido/suspendido → `/plan-vencido`
- Campo `performsServices` en colaboradores
- Capacidad máxima simultánea por servicio (`maxConcurrent`)
- Slots dinámicos, Walk-in, Cobrar/Completar desacoplados
- Modal de confirmación in-page (sin `confirm()` nativo)
- Fixes críticos de TZ y disponibilidad
- Notificaciones WhatsApp via `wa.me`
- Políticas de cancelación y reagendamiento independientes

---

## 3. Lo implementado en esta sesión (v9.0)

### 3.1 Sistema de Roles — Frontend y Backend

**`use-role.ts`** — tipos corregidos: `RECEPTIONIST`/`STAFF` → `ADMIN`/`COLLABORATOR`

**Protección de rutas en `(dashboard)/layout.tsx`:**
| Rol | Rutas permitidas | Redirige a |
|---|---|---|
| OWNER | Todo | — |
| ADMIN | Dashboard, Agenda, Clientes, Colaboradores, Servicios | `/dashboard` si intenta /paquetes /reportes /configuracion |
| COLLABORATOR | /agenda, /citas/*, /nueva-cita | `/agenda` si intenta cualquier otra ruta |

**`(agenda)/layout.tsx`** — añadida verificación de plan (antes no tenía ninguna).

**Sidebar** — COLLABORATOR solo ve Agenda. ADMIN ve todo excepto Paquetes, Reportes y Configuración.

**Vista de Agenda para COLLABORATOR:**
- Banner informativo azul
- Selector Día/Semana/Mes oculto — siempre en vista Día
- `AgendaToolbar` acepta props `lockedToDayView` y `onViewChange` opcional

### 3.2 Seguridad en endpoints `/users`

Antes: cualquier usuario autenticado podía crear/modificar/eliminar usuarios.
Ahora:
- `POST /users` — solo OWNER; rol máximo asignable: ADMIN o COLLABORATOR (no OWNER)
- `PATCH /users/:id` — solo OWNER; no puede modificar a otro OWNER
- `DELETE /users/:id` — solo OWNER; no puede eliminar al OWNER
- Schema Zod actualizado: `z.enum(["COLLABORATOR", "ADMIN"])` (OWNER excluido)

### 3.3 Página Configuración/Usuarios — refactor completo

- **Migrado** de `fetch` directo → `apiFetch` + `useQuery`/`useMutation`
- **`confirm()` nativo** → modal in-page con botón de confirmación
- **Toggle de rol** → dropdown con selector completo (ADMIN ↔ COLLABORATOR)
- **Formulario nuevo usuario**: placeholders neutrales, `autoComplete="off"` / `"new-password"` para evitar autofill del browser
- **Dropdown de rol** abre hacia arriba (`bottom-full`) para evitar corte por overflow
- Sección lista sin `overflow-hidden` para que el dropdown sea visible

### 3.4 Banner de trial — solo para OWNER

El banner "X días restantes / Actualizar Plan" en el sidebar ahora se oculta para ADMIN y COLLABORATOR.

### 3.5 Fixes de UI — Agenda

- **Header de colaboradores** movido dentro del contenedor `overflow-auto` como `sticky top-0` — elimina desalineación de columnas causada por la scrollbar
- Mismo fix aplicado a vista Semana

### 3.6 Fixes de UI — Login

- `min-h-screen` → `h-screen overflow-hidden` en `<main>` (el body tenía `min-height: 884px` que causaba crecimiento)
- Imagen izquierda ahora ocupa `h-full` completo
- Eliminado bloque "Contact Support" en inglés
- Traducidos todos los textos: "Welcome back", "Email Address", "Password", "Remember me", "Forgot password?", "Login"
- **`globals.css`**: `body { min-height: max(884px, 100dvh) }` → `html, body { height: 100%; overflow: hidden }`
- `html { color-scheme: light }` / `html.dark { color-scheme: dark }` para inputs de fecha
- Todas las páginas auth corregidas: `min-h-screen` → `h-full overflow-y-auto`

### 3.7 Fixes de UI — Admin Panel

- Páginas admin corregidas: `min-h-screen` → `h-full overflow-y-auto`
- Banner de feedback → `fixed top-4 left-1/2` (no empuja el contenido)
- Input de fecha "Vence el": ícono nativo oculto, reemplazado por `CalendarDays` de Lucide + `showPicker()` via ref
- Eliminada la fecha de texto duplicada debajo del input
- `color-scheme: inherit` en input de fecha (respeta modo claro/oscuro del documento)

### 3.8 Fixes de UI — Configuración/Agenda

- Selects de hora: `appearance-none` sin ícono → añadido `ChevronDown` de Lucide
- Inputs numéricos de horas (cancelación/reagendamiento): flechas nativas invisibles → reemplazadas por botones `−` / `+` explícitos con límites 0-168

### 3.9 Fix — Perfil de Cliente (crash RESCHEDULED/IN_PROGRESS)

`statusBadge` en `/clientes/[id]` solo tenía 5 estados. Si `apt.status` era `RESCHEDULED` o `IN_PROGRESS`, crasheaba con "Cannot read properties of undefined (reading 'className')".
- Tipo `AppointmentStatus` ampliado: +`RESCHEDULED`, +`IN_PROGRESS`
- Map `statusBadge` completado con los nuevos estados
- Fallback defensivo `?? { label: apt.status, ... }` para cualquier futuro status

### 3.10 Fix — Botón WhatsApp en listado de clientes

El ícono de mensaje en `ClientCard` era un `<button>` sin acción (solo frenaba propagación). Ahora:
- **Con teléfono**: `<a href="https://wa.me/51..." target="_blank">` — ícono verde
- **Sin teléfono**: `<span>` deshabilitado con tooltip, opacidad reducida

### 3.11 Origen "Redes Sociales" en Nueva Cita

- Botón `Camera` (Instagram) → `Share2` (Redes Sociales), id: `social`
- Backend `appointments.ts`: `ORIGINS` incluye `"social"` e `"instagram"` (legacy)
- Backend `analytics.ts`: `instagram` normalizado → `social` en métricas, label "Redes Sociales"

### 3.12 Clientes — duplicados y formato de teléfono

**Detección de duplicados en listado:**
- Banner ámbar con nombres duplicados detectados (mismo nombre+apellido, case-insensitive)
- Card con borde ámbar + ícono `Copy` junto al nombre duplicado
- Se calcula en frontend con `useMemo` sobre la lista completa

**Control de teléfono `+51` en edición de perfil:**
- `/clientes/nuevo` — ya tenía el control correcto
- `/clientes/[id]` (edición inline) — ahora mismo control: `+51 ` fijo, solo 9 dígitos numéricos
- Al cargar el teléfono existente, se normaliza automáticamente (ej: `+51456789123` → `+51 456789123`)

---

## 4. Stack Tecnológico

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
| Autenticación clientes | JWT en httpOnly cookie `gm_token` |
| Autenticación admin | JWT en httpOnly cookie `gm_admin_token` |
| Email | Nodemailer (SMTP Gmail) |
| Storage | Supabase Storage (bucket `logos`) |
| Runtime | Node.js v22 (tsx watch) |

### Infraestructura
| Capa | Servicio |
|---|---|
| Frontend | Vercel (planificado) |
| Backend | Railway (planificado) |
| Base de datos | Supabase PostgreSQL (planificado) |
| Storage | Supabase Storage (activo) |
| Monorepo | pnpm workspaces |

---

## 5. Arquitectura del Frontend

### Grupos de rutas (`apps/web/src/app/`)

```
(auth)/
  login/                    ✅ v9.0 — traducido, h-screen, sin "Contact Support"
  registro/
  recuperar-contrasena/
  resetear-contrasena/
  verificar-correo/
  verificar-email/

(agenda)/                   ✅ v9.0 — layout con verificación de plan
  agenda/                   ✅ v9.0 — vista diferenciada COLLABORATOR, header sticky
  nueva-cita/               ✅ v9.0 — origen "social" (Redes Sociales)
  citas/[id]/
  citas/[id]/cobrar/

(dashboard)/                ✅ v9.0 — layout con protección de rutas por rol
  dashboard/
  plan-vencido/
  clientes/                 ✅ v9.0 — detección de duplicados, WhatsApp fix
  clientes/[id]/            ✅ v9.0 — crash fix RESCHEDULED, teléfono +51, WhatsApp
  clientes/nuevo/
  colaboradores/
  colaboradores/[id]/
  colaboradores/nuevo/
  servicios/
  servicios/[id]/
  servicios/nuevo/
  paquetes/
  planes/
  reportes/
  configuracion/negocio/    ✅ v9.0 — isError guard, staleTime: 0
  configuracion/agenda/     ✅ v9.0 — ChevronDown en selects, botones +/−
  configuracion/usuarios/   ✅ v9.0 — roles, seguridad, modal, apiFetch
  configuracion/whatsapp/

admin/
  dashboard/                ✅ v9.0 — h-full overflow-y-auto
  negocios/[id]/            ✅ v9.0 — feedback fixed, input fecha con showPicker()
```

### Hooks disponibles (`apps/web/src/lib/api/hooks/`)
```
use-clients.ts
use-collaborators.ts
use-services.ts
use-appointments.ts
use-analytics.ts
use-notifications.ts
use-settings.ts
use-availability.ts
use-packages.ts
```

### Hook de rol (`apps/web/src/hooks/use-role.ts`)
```ts
export type UserRole = "OWNER" | "ADMIN" | "COLLABORATOR" | null;
```

---

## 6. Arquitectura del Backend

### Endpoints (`apps/api/src/routes/`)

| Archivo | Rutas principales |
|---|---|
| `auth.ts` | POST /auth/login, GET /auth/me |
| `users.ts` | GET /users (todos); POST/PATCH/DELETE — solo OWNER ✨ v9.0 |
| `clients.ts` | CRUD + duplicados por teléfono/DNI |
| `collaborators.ts` | CRUD + performsServices + schedule dinámico |
| `services.ts` | CRUD + maxConcurrent |
| `packages.ts` | CRUD + límite plan |
| `appointments.ts` | CRUD + status + origins: social ✨ v9.0 |
| `availability.ts` | GET /slots (TZ explícito + reason) |
| `analytics.ts` | instagram → social normalizado ✨ v9.0 |
| `settings.ts` | GET/PATCH /settings /business /agenda /logo |
| `admin.ts` | Panel super admin |

---

## 7. Schema Prisma (estado actual v9.0)

Sin cambios de schema respecto a v8.0. El schema v8.0 es el vigente:

```prisma
model Business {
  id                  String     @id @default(cuid())
  name                String     @default("")
  type                String     @default("")
  ruc                 String?
  logoUrl             String?
  phone               String?
  address             String?
  timezone            String     @default("America/Mexico_City")
  slotMinutes         Int        @default(30)
  cancellationHours   Int        @default(24)
  reschedulingHours   Int        @default(12)
  operatingDays       String[]   @default(["Mon","Tue","Wed","Thu","Fri"])
  openTime            String     @default("09:00")
  closeTime           String     @default("18:00")
  plan                PlanType   @default(TRIAL)
  planStatus          PlanStatus @default(ACTIVE)
  planExpiresAt       DateTime?
  trialEndsAt         DateTime?
  waTplConfirmation   String?
  waTplReminder       String?
  waTplPayment        String?
}

model User {
  role  Role  @default(ADMIN)   // OWNER | ADMIN | COLLABORATOR
}

enum Role {
  OWNER
  COLLABORATOR
  ADMIN
}
```

---

## 8. Lógica de Roles

### Qué puede hacer cada rol

| Funcionalidad | OWNER | ADMIN | COLLABORATOR |
|---|---|---|---|
| Dashboard, Clientes, Colaboradores, Servicios | ✅ | ✅ | ❌ |
| Agenda (todas las citas) | ✅ | ✅ | ✅ (solo vista Día) |
| Nueva Cita | ✅ | ✅ | ✅ |
| Paquetes, Reportes | ✅ | ❌ | ❌ |
| Configuración | ✅ | ❌ | ❌ |
| Crear/editar/eliminar usuarios | ✅ | ❌ | ❌ |
| Banner de trial | ✅ | ❌ | ❌ |

### Protección implementada
- **Backend**: `requireAuth` + verificación de `role === "OWNER"` en rutas de `/users`
- **Frontend layout**: `apiFetch("/auth/me")` en cada layout → redirect según rol
- **Sidebar**: filtra items por `ownerOnly` y `collaboratorHidden`
- **Nota**: la protección de rutas del frontend es client-side y complementaria — la real está en el backend

---

## 9. Variables de Entorno

### Backend (`apps/api/.env`)
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
ADMIN_JWT_SECRET=...
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://smpsncdzdvoanqxieicc.supabase.co
SUPABASE_SERVICE_KEY=sb_secret_...
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

## 10. Pantallas — Estado Final

| ID | Pantalla | Estado |
|---|---|---|
| AUTH-00 a AUTH-05 | Flujo completo de autenticación | ✅ v9.0 |
| SETUP-01 | Onboarding | ✅ |
| DASH-01 | Dashboard KPIs | ✅ |
| PLAN-02 | Plan vencido/suspendido | ✅ |
| CAL-01 | Agenda / calendario | ✅ v9.0 |
| CAL-02 | Detalle de cita | ✅ v9.0 |
| CAL-03 | Nueva cita | ✅ v9.0 |
| CAL-04 | Cobro de cita | ✅ |
| CLI-01 | Listado de clientes | ✅ v9.0 |
| CLI-02 | Perfil de cliente | ✅ v9.0 |
| CLI-03 | Nuevo cliente | ✅ |
| STAFF-01 a STAFF-03 | Colaboradores | ✅ |
| SRV-01 a SRV-03 | Servicios | ✅ |
| PKG-01 a PKG-03 | Paquetes | ✅ |
| PLAN-01 | Planes de suscripción | ✅ |
| RPT-01 | Reportes | ✅ |
| CFG-01 | Config negocio | ✅ v9.0 |
| CFG-02 | Config agenda | ✅ v9.0 |
| CFG-03 | Config usuarios | ✅ v9.0 |
| CFG-04 | Config WhatsApp | ✅ |
| ADMIN-02 | Panel super admin — dashboard | ✅ v9.0 |
| ADMIN-03 | Panel super admin — detalle negocio | ✅ v9.0 |

**Total: 33/33 pantallas cliente · 2/2 panel admin**

---

## 11. Deuda Técnica Pendiente

### Alta prioridad
| Item | Descripción |
|---|---|
| **Deploy a producción** | Vercel + Railway + Supabase. Requiere `prisma generate && prisma db push` en el pipeline |
| **Exportar Excel** | Flag `canExportExcel` listo en `plan-limits.ts`, falta endpoint GET y botón en reportes |
| **"Solo mis citas" para COLLABORATOR** | Requiere campo `collaboratorId` en modelo `User` (link User → Collaborator). Sin ese vínculo no se puede filtrar automáticamente |

### Media prioridad
| Item | Descripción |
|---|---|
| **WhatsApp automático** | Evolucionar de wa.me manual a Baileys o Evolution API |
| **Recordatorios automáticos** | Config/WhatsApp tiene toggles 24h/2h pero no hay scheduler en backend |
| **Historial de cita real** | `MOCK_TIMELINE` en detalle de cita — no conectado a BD |
| **Foto de resultado por cita** | Portafolio del negocio |
| **Comisiones por colaborador** | % sobre servicios atendidos |
| **Ficha técnica por cliente** | Historial de coloraciones, tratamientos, alergias |
| **Merge de clientes duplicados** | Actualmente solo se detectan, no se pueden fusionar desde la UI |

### Baja prioridad
| Item | Descripción |
|---|---|
| **Pagos automáticos (Culqi)** | Activación de plan es manual hoy |
| **Drag & drop en calendario** | Evaluar FullCalendar |
| **Tabla `payments` separada** | El pago está inline en `Appointment` |
| **Responsividad móvil** | Solo desktop |
| **`audit_log`** | Trazabilidad de acciones críticas |
| **Errores TS pre-existentes** | reportes, paquetes, colaboradores, nueva-cita tienen errores de tipos no bloqueantes |

---

## 12. Reglas para producción

```bash
# Al hacer deploy tras cambios de schema:
npx prisma generate
npx prisma db push   # o migrate deploy en prod

# Variables obligatorias en Railway:
TZ=America/Lima
FRONTEND_URL=https://tu-dominio.vercel.app
NODE_ENV=production   # activa flag Secure en cookies httpOnly
```

## 13. Crear cuenta super admin

```bash
cd apps/api
npx tsx src/scripts/create-super-admin.ts
```

---

## 14. Historial de PRs

| PR | Título | Estado |
|---|---|---|
| #1–#32 | Features y fixes de sesiones anteriores | ✅ Mergeados |
| #33 | v7.0 — walk-in, maxConcurrent, cobrar/completar desacoplados | ✅ Mergeado |
| #34 | Fix TZ, errors descriptivos, walk-in hora actual | ✅ Mergeado |
| #35 | Fix RESCHEDULED en agenda, dashboard y reportes | ✅ Mergeado |
| #36 | Feat: WhatsApp wa.me con plantillas editables | ✅ Mergeado |
| #37 | Feat: políticas cancelación/reagendamiento independientes | ✅ Mergeado |
| — | v9.0 — roles, seguridad, UI fixes (sin PR aún) | 🔄 En rama |

---

## 15. Convención de PRs

Un PR por contexto/feature — no PRs gigantes mezclados:

| Contexto | Nombre de rama sugerido |
|---|---|
| Roles y seguridad | `feat/roles` |
| Bugs de agenda/disponibilidad | `fix/bugs-agenda` |
| Deploy y CI/CD | `feat/deploy` |
| Panel admin | `feat/admin` |
