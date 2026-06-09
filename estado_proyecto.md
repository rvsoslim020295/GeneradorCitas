# Estado del Proyecto — GlowManager
**Fecha:** 9 de Junio 2026
**Versión:** 10.0
**Repositorio:** https://github.com/rvsoslim020295/GeneradorCitas
**Rama activa:** `feat/recordatorios-whatsapp`
**PRs de esta sesión:** #38 → #46

---

## 1. Resumen Ejecutivo

GlowManager es un panel administrativo B2B para negocios de belleza (salones, barberías, spas, nail bars). Permite gestionar citas, clientes, colaboradores, servicios, paquetes, pagos y reportes desde una interfaz web orientada a dueños y recepcionistas en desktop.

**Estado actual:** MVP 100% funcional + 7 features nuevas implementadas en sesión v10.0. El sistema tiene roles diferenciados (OWNER/ADMIN/COLLABORATOR), protección real de rutas, historial de eventos, fichas técnicas por cliente, fusión de duplicados, recordatorios automáticos WhatsApp y exportación a Excel.

---

## 2. Lo implementado hasta v9.0 (sesiones anteriores)

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
- Sistema de roles OWNER/ADMIN/COLLABORATOR con protección de rutas
- Seguridad en `/users`: solo OWNER puede crear/editar/eliminar
- Vínculo User ↔ Collaborator con filtro "solo mis citas"
- Fixes de UI: login h-screen, header agenda sticky, admin panel

---

## 3. Lo implementado en esta sesión (v10.0)

### 3.1 Fixes de UX — Modales de confirmación
Reemplazados todos los `confirm()` nativos del browser por modales in-page:
- Eliminar **cliente** (`clientes/[id]`)
- Eliminar **colaborador** (`colaboradores/[id]`)
- Eliminar **servicio** (`servicios/[id]`)
- Eliminar **paquete** (`paquetes/page`)

### 3.2 Fix — `<a>` anidado en ClientCard (hydration error)
`ClientCard` usaba `<Link>` (= `<a>`) como wrapper con un `<a>` de WhatsApp adentro.
Solución: reemplazado `<Link>` por `<div onClick={() => router.push(...)}>`

### 3.3 Fix — Ocultar "Registrar Anticipo" en citas COMPLETADAS
El botón y formulario de anticipo ya no se muestran cuando la cita está completada.

### 3.4 Precios con efecto señuelo
| Plan | Precio anterior | Precio nuevo |
|---|---|---|
| Básico | S/15 | **S/29** |
| Pro | S/30 | **S/39** |
| Enterprise | S/45 | **S/45** |
Salto PRO→ENTERPRISE = S/6 → empuja al cliente hacia Enterprise.

### 3.5 WhatsApp en página de Planes
Paso 4 del modal de pago es un enlace `wa.me/51922358205` con mensaje pre-llenado para enviar el comprobante.

### 3.6 PR #41 — Búsqueda y filtros en admin dashboard
- Input de búsqueda en tiempo real (nombre, email, tipo de negocio)
- Selector de plan (TRIAL/BASIC/PRO/ENTERPRISE)
- Selector de estado (ACTIVE/EXPIRED/SUSPENDED)
- Contador "X de Y negocios" — todo con `useMemo`, sin cambios de backend

### 3.7 PR #42 — Historial real de cita
- Nuevo modelo `AppointmentEvent` en schema
- Helper `logEvent()` registra eventos automáticamente: creación, cambio de status, pago, anticipo
- Nuevo endpoint `GET /appointments/:id/events`
- Frontend: reemplaza `MOCK_TIMELINE` por query real

### 3.8 PR #43 — Exportar Excel en Reportes
- Instala `xlsx` en `apps/api`
- `GET /analytics/export?period=` genera `.xlsx` con 2 hojas: "Citas" y "Resumen"
- Solo PRO y ENTERPRISE (`canExportExcel`)
- Botón verde activo / gris deshabilitado según plan

### 3.9 PR #44 — Ficha técnica por cliente
- Nuevo modelo `ClientRecord` (tratamiento, fórmula/color, alergias, notas, fecha)
- CRUD: `GET/POST/PATCH/DELETE /clients/:id/records`
- UI: lista acordeón en perfil del cliente, alergias en ámbar, modal eliminar

### 3.10 PR #45 — Fusionar clientes duplicados
- `POST /clients/merge`: mueve citas, suma métricas, fusiona datos, elimina duplicado en transacción
- Banner de duplicados con botones "Fusionar: {Nombre}"
- Modal con selección visual del registro a conservar

### 3.11 PR #46 — Recordatorios automáticos WhatsApp
- Schema: `reminderEnabled` + `reminder2hEnabled` en `Business`; `reminderSentAt` + `reminder2hSentAt` en `Appointment`
- `node-cron` corre cada hora, genera links `wa.me` y registra `AppointmentEvent` tipo `REMINDER_SENT`
- Config/WhatsApp: toggle switches para activar recordatorio 24h y 2h antes

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
| Scheduler | node-cron (recordatorios WhatsApp) |
| Excel | xlsx |
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
  login/                    ✅ h-screen, textos ES, sin "Contact Support"
  registro/
  recuperar-contrasena/
  resetear-contrasena/
  verificar-correo/
  verificar-email/

(agenda)/                   ✅ layout con verificación de plan
  agenda/                   ✅ vista diferenciada COLLABORATOR, header sticky
  nueva-cita/               ✅ origen "social" (Redes Sociales)
  citas/[id]/               ✅ historial real, anticipo oculto si COMPLETADA
  citas/[id]/cobrar/

(dashboard)/                ✅ layout con protección de rutas por rol
  dashboard/
  plan-vencido/
  clientes/                 ✅ detección duplicados + botón fusionar
  clientes/[id]/            ✅ ficha técnica, teléfono +51, modal eliminar
  clientes/nuevo/
  colaboradores/
  colaboradores/[id]/       ✅ modal eliminar
  colaboradores/nuevo/
  servicios/
  servicios/[id]/           ✅ modal eliminar
  servicios/nuevo/
  paquetes/                 ✅ modal eliminar
  paquetes/[id]/
  planes/                   ✅ precios señuelo, WhatsApp comprobante
  reportes/                 ✅ exportar Excel PRO/ENTERPRISE
  configuracion/negocio/
  configuracion/agenda/
  configuracion/usuarios/   ✅ roles, seguridad, selector collaborador
  configuracion/whatsapp/   ✅ toggles recordatorios 24h/2h

admin/
  dashboard/                ✅ búsqueda + filtros plan/estado
  negocios/[id]/
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
export function useRole(): UserRole
export function useRoleInfo(): { role: UserRole; collaboratorId: string | null }
```

---

## 6. Arquitectura del Backend

### Endpoints (`apps/api/src/routes/`)

| Archivo | Rutas principales |
|---|---|
| `auth.ts` | POST /auth/login, GET /auth/me (incluye collaboratorId) |
| `users.ts` | GET /users; POST/PATCH/DELETE — solo OWNER |
| `clients.ts` | CRUD + /records CRUD + POST /merge |
| `collaborators.ts` | CRUD + performsServices + schedule dinámico |
| `services.ts` | CRUD + maxConcurrent |
| `packages.ts` | CRUD + límite plan |
| `appointments.ts` | CRUD + status + GET /:id/events |
| `availability.ts` | GET /slots (TZ explícito + reason) |
| `analytics.ts` | GET / (métricas) + GET /export (Excel) |
| `settings.ts` | GET/PATCH /settings /business /agenda /logo |
| `admin.ts` | Panel super admin |

### Scheduler (`apps/api/src/lib/`)
- `reminder-scheduler.ts` — cron cada hora, genera links wa.me y registra AppointmentEvent

---

## 7. Schema Prisma (estado actual v10.0)

```prisma
model Business {
  // ...campos base...
  waTplConfirmation   String?
  waTplReminder       String?
  waTplPayment        String?
  reminderEnabled     Boolean  @default(false)   // ✨ v10.0
  reminder2hEnabled   Boolean  @default(false)   // ✨ v10.0
}

model User {
  role           Role          @default(OWNER)   // OWNER | ADMIN | COLLABORATOR
  collaboratorId String?       @unique            // ✨ v9.0
  collaborator   Collaborator? @relation(...)
}

model Appointment {
  // ...campos base...
  reminderSentAt    DateTime?    // ✨ v10.0
  reminder2hSentAt  DateTime?    // ✨ v10.0
  events            AppointmentEvent[]
}

model AppointmentEvent {                          // ✨ v10.0
  id            String
  appointmentId String
  type          String   // CREATED | STATUS_CHANGED | PAYMENT_REGISTERED | DEPOSIT_REGISTERED | REMINDER_SENT
  description   String
  createdAt     DateTime @default(now())
}

model Client {
  // ...campos base...
  records ClientRecord[]
}

model ClientRecord {                              // ✨ v10.0
  id           String
  clientId     String
  date         DateTime
  treatment    String
  colorFormula String?
  allergies    String?
  notes        String?
}
```

---

## 8. Lógica de Roles

| Funcionalidad | OWNER | ADMIN | COLLABORATOR |
|---|---|---|---|
| Dashboard, Clientes, Colaboradores, Servicios | ✅ | ✅ | ❌ |
| Agenda (todas / solo propias si vinculado) | ✅ | ✅ | ✅ solo Día |
| Nueva Cita | ✅ | ✅ | ✅ |
| Paquetes, Reportes | ✅ | ❌ | ❌ |
| Configuración | ✅ | ❌ | ❌ |
| Crear/editar/eliminar usuarios | ✅ | ❌ | ❌ |
| Banner de trial | ✅ | ❌ | ❌ |
| Exportar Excel | ✅ PRO/ENT | ✅ PRO/ENT | ❌ |

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
| AUTH-00 a AUTH-05 | Flujo completo de autenticación | ✅ |
| SETUP-01 | Onboarding | ✅ |
| DASH-01 | Dashboard KPIs | ✅ |
| PLAN-02 | Plan vencido/suspendido | ✅ |
| CAL-01 | Agenda / calendario | ✅ |
| CAL-02 | Detalle de cita + historial real | ✅ v10.0 |
| CAL-03 | Nueva cita | ✅ |
| CAL-04 | Cobro de cita | ✅ |
| CLI-01 | Listado de clientes + fusionar duplicados | ✅ v10.0 |
| CLI-02 | Perfil de cliente + ficha técnica | ✅ v10.0 |
| CLI-03 | Nuevo cliente | ✅ |
| STAFF-01 a STAFF-03 | Colaboradores | ✅ |
| SRV-01 a SRV-03 | Servicios | ✅ |
| PKG-01 a PKG-03 | Paquetes | ✅ |
| PLAN-01 | Planes (precios señuelo + WhatsApp comprobante) | ✅ v10.0 |
| RPT-01 | Reportes + exportar Excel | ✅ v10.0 |
| CFG-01 | Config negocio | ✅ |
| CFG-02 | Config agenda | ✅ |
| CFG-03 | Config usuarios | ✅ |
| CFG-04 | Config WhatsApp + toggles recordatorios | ✅ v10.0 |
| ADMIN-02 | Panel super admin — dashboard + búsqueda/filtros | ✅ v10.0 |
| ADMIN-03 | Panel super admin — detalle negocio | ✅ |

**Total: 33/33 pantallas cliente · 2/2 panel admin**

---

## 11. Deuda Técnica Pendiente

### Alta prioridad
| Item | Descripción |
|---|---|
| **Deploy a producción** | Vercel + Railway + Supabase. Requiere `prisma generate && prisma db push` en el pipeline. Nuevas deps: `xlsx` + `node-cron` |

### Media prioridad
| Item | Descripción |
|---|---|
| **Drag & drop en agenda** | PR #7 pendiente — usar `@dnd-kit/core`, solo vista Día, PATCH startTime/endTime/collaboratorId |
| **WhatsApp automático real** | Actualmente genera link wa.me (manual). Evolucionar a Baileys o Evolution API |
| **Evento NOTE_ADDED** | El tipo existe en AppointmentEvent pero no se registra al editar notas |

### Baja prioridad
| Item | Descripción |
|---|---|
| **Pagos automáticos (Culqi)** | Activación de plan es manual hoy |
| **Responsividad móvil** | Solo desktop |
| **`audit_log`** | Trazabilidad de acciones críticas |
| **Errores TS pre-existentes** | reportes, paquetes, colaboradores, nueva-cita tienen errores de tipos no bloqueantes |
| **Comisiones por colaborador** | % sobre servicios atendidos |
| **Ordenar en admin dashboard** | Solo busca/filtra, no ordena por columna |
| **MRR en admin dashboard** | Total mensual estimado por plan |

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

# Dependencias nuevas en v10.0:
pnpm install --filter api   # xlsx + node-cron
```

---

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
| #33 | v7.0 — walk-in, maxConcurrent, cobrar/completar desacoplados | ✅ |
| #34 | Fix TZ, errors descriptivos, walk-in hora actual | ✅ |
| #35 | Fix RESCHEDULED en agenda, dashboard y reportes | ✅ |
| #36 | Feat: WhatsApp wa.me con plantillas editables | ✅ |
| #37 | Feat: políticas cancelación/reagendamiento independientes | ✅ |
| #38 | v9.0 — roles, seguridad, UI fixes | ✅ |
| #39 | v9.0 — rama limpia separada | ✅ |
| #40 | Feat: solo mis citas — vínculo User↔Collaborator | ✅ |
| #41 | Feat: búsqueda y filtros en admin dashboard | ✅ |
| #42 | Feat: historial real de cita — AppointmentEvent | ✅ |
| #43 | Feat: exportar reportes a Excel (PRO/ENTERPRISE) | ✅ |
| #44 | Feat: ficha técnica por cliente — ClientRecord | ✅ |
| #45 | Feat: fusionar clientes duplicados | ✅ |
| #46 | Feat: recordatorios automáticos WhatsApp | 🔄 En rama |

---

## 15. Convención de PRs

| Contexto | Nombre de rama sugerido |
|---|---|
| Nueva feature | `feat/nombre-feature` |
| Fix puntual | `fix/descripcion-corta` |
| Roles y seguridad | `feat/roles` |
| Bugs de agenda | `fix/bugs-agenda` |
| Deploy y CI/CD | `feat/deploy` |
| Panel admin | `feat/admin` |
