# Estado del Proyecto — GlowManager
**Fecha:** 9 de Junio 2026
**Versión:** 10.0
**Repositorio:** https://github.com/rvsoslim020295/GeneradorCitas
**Rama activa:** `main`
**PRs mergeados en esta sesión:** #45, #46 (previos), #47, #48

---

## 1. Resumen Ejecutivo

GlowManager es un panel administrativo B2B para negocios de belleza (salones, barberías, spas, nail bars). Permite gestionar citas, clientes, colaboradores, servicios, paquetes, pagos y reportes desde una interfaz web orientada a dueños y recepcionistas en desktop.

**Estado actual:** MVP 100% funcional, build de producción limpio (0 errores TS, 0 errores ESLint, 32/32 páginas generadas). Listo para deploy en Vercel + Railway + Supabase.

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
- Fixes críticos de TZ y disponibilidad
- Notificaciones WhatsApp via `wa.me` con plantillas editables
- Políticas de cancelación y reagendamiento independientes
- Sistema completo de roles OWNER / ADMIN / COLLABORATOR
- Solo mis citas para COLLABORATOR (vínculo User↔Collaborator)
- Historial real de cita (modelo `AppointmentEvent` + timeline)
- Exportar reportes a Excel
- Ficha técnica por cliente (modelo `ClientRecord` + CRUD + UI)
- Fusionar clientes duplicados (endpoint merge + modal UI)

---

## 3. Lo implementado en esta sesión (v10.0)

### 3.1 Recordatorios automáticos WhatsApp (PR #47)

**`apps/api/src/lib/reminder-scheduler.ts`** — scheduler `node-cron` que corre cada hora:
- Busca negocios con plan ACTIVE y `reminderEnabled` o `reminder2hEnabled`
- **Recordatorio 24h**: ventana ±1h alrededor de las 24h anteriores a la cita
- **Recordatorio 2h**: ventana ±30min alrededor de las 2h anteriores
- Genera link `wa.me` con mensaje personalizado por plantilla del negocio
- Registra evento `REMINDER_SENT` en `AppointmentEvent`
- No reenvía si `reminderSentAt` / `reminder2hSentAt` ya tiene valor

**Fix tipo `Settings`**: `reminderEnabled` y `reminder2hEnabled` agregados al tipo frontend — los toggles ahora persisten correctamente al recargar.

**Fix scheduler 2h**: usaba la plantilla de 24h (`waTplReminder`) en lugar de su propia plantilla por defecto.

### 3.2 Fixes UX — Eliminaciones con modal in-page

Reemplazado `confirm()` nativo del browser por modal de confirmación in-page en:
- `clientes/[id]` — eliminar cliente
- `colaboradores/[id]` — eliminar colaborador
- `servicios/[id]` — eliminar servicio
- `paquetes/page` — eliminar paquete (con nombre del paquete en el mensaje)

### 3.3 Fix — `<a>` anidado en ClientCard

`ClientCard` usaba `<Link>` (que renderiza `<a>`) como wrapper y contenía un `<a>` de WhatsApp adentro → hydration error. Corregido: `<Link>` → `<div>` con `onClick={() => router.push(...)}`. El botón WhatsApp sigue siendo `<a>` con `e.stopPropagation()`.

### 3.4 Notificaciones en tiempo real

- **TopBar** migrado de `fetch` manual → `useQuery` con `refetchInterval: 2 min`
- Al crear una cita: invalida `["notifications"]` inmediatamente
- Al cambiar estado de cita: invalida `["notifications"]` inmediatamente
- Al abrir el panel de campana: siempre hace `refetch()` fresco
- **Rango ampliado**: notificaciones y "Acción Requerida" muestran citas PENDING de hoy + 7 días (antes solo hoy/2 días)
- **Fix Dashboard**: filtro de `d > now` → `d >= todayStart` para mostrar citas creadas para el momento actual

### 3.5 Perfil de cliente — mejoras de navegación

- **Citas clickeables**: cada tarjeta del historial navega a `/citas/:id`
- **"Ver todo"**: navega a `/agenda?search=<nombre completo del cliente>`
- **GlobalSearch**: lee `?search=` de la URL al montar (via `useSearchParams`) para pre-llenar la búsqueda
- **TopBar**: `GlobalSearch` envuelto en `<Suspense>` (requerido por `useSearchParams` en Next.js 15)
- **Fix JSX**: `</div>` faltante que cerraba el grid de 3 columnas en `clientes/[id]`

### 3.6 Botón "Registrar Anticipo" — ocultar en estados finales

El botón aparecía en todos los estados. Ahora se oculta cuando `status` es `COMPLETED`, `PAID`, `CANCELLED` o `NO_SHOW`.

### 3.7 Toggle WhatsApp — alineación

Toggles de recordatorios automáticos: `shrink-0` + `self-center` en el botón, `left-0.5` fijo en el círculo interior para evitar desplazamiento visual.

### 3.8 Página de Planes — mejoras

- **Precios restaurados**: Básico S/29 · Pro S/39 · Enterprise S/45 (efecto señuelo)
- **QR recortado**: contenedor con `overflow-hidden` y `object-cover` + `objectPosition: center 42%` para mostrar solo el código QR sin espacios blancos de la imagen original
- **Modal compacto**: padding y gaps reducidos, `max-h-[90vh] overflow-y-auto`
- **Barra sticky**: barra de título con flecha de retroceso ahora es `sticky top-0 z-10`
- **Paso 4**: enlaza directamente a `wa.me/51922358205` con mensaje pre-llenado
- **Número visible**: "Plin · 922 358 205" debajo del nombre

### 3.9 Limpieza TypeScript — cero errores (PR #48)

**Frontend:**
- `use-analytics.ts`: campos faltantes con tipos exactos (`heatmap`, `newVsRecurring`, `bestMonth`, `topServices`, `topClients`, `originBreakdown`, `cancellationByCollaborator`)
- `paquetes/page.tsx`: tipo `Package` del hook, ícono renombrado a `PackageIcon` para evitar colisión
- `colaboradores/[id]`: cast `as Schedule` en `updateDay` para resolver índice string
- `use-appointments.ts`: campo `origin` opcional en tipo de `createAppointment`

**Backend:**
- `lib/hono.ts`: helper `createRouter()` con `Variables: { user: AuthPayload }` tipado
- Todos los routers: `new Hono()` → `createRouter()` — `c.get("user")` ahora tipado
- `analytics.ts`: tipo de `bestMonth` corregido (`day` → `month` + campo `appointments`)

### 3.10 Build producción limpio

- Comillas sin escapar en modal de paquetes → `&ldquo;&rdquo;`
- Variables no usadas eliminadas: `MONTHS_ES`, `depositAmount` local, `API_URL`, `useClient`, `router` (×2), `inputClass`, `Flower2`
- `<img>` con logo dinámico: `// eslint-disable-next-line` correcto fuera del ternario JSX
- `allClients` envuelto en `useMemo` para estabilizar dependencias del `useEffect`
- **Resultado: 32/32 páginas generadas, 0 errores, 0 warnings bloqueantes**

---

## 4. Stack Tecnológico

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
| ORM | Prisma 7.8 |
| Base de datos | PostgreSQL |
| Autenticación clientes | JWT en httpOnly cookie `gm_token` |
| Autenticación admin | JWT en httpOnly cookie `gm_admin_token` |
| Email | Nodemailer (SMTP Gmail) |
| Storage | Supabase Storage (bucket `logos`) |
| Runtime | Node.js v22 (tsx watch) |
| Scheduler | node-cron (recordatorios WhatsApp) |

### Infraestructura (objetivo deploy)
| Capa | Servicio |
|---|---|
| Frontend | Vercel |
| Backend | Railway |
| Base de datos | Supabase PostgreSQL |
| Storage | Supabase Storage (activo) |
| Monorepo | pnpm workspaces |

---

## 5. Arquitectura del Frontend

### Grupos de rutas (`apps/web/src/app/`)

```
(auth)/
  login/                    ✅ traducido, h-screen, sin "Contact Support"
  registro/
  recuperar-contrasena/
  resetear-contrasena/
  verificar-correo/
  verificar-email/

(agenda)/                   ✅ layout con verificación de plan
  agenda/                   ✅ vista diferenciada COLLABORATOR, header sticky
  nueva-cita/               ✅ origen "social" (Redes Sociales)
  citas/[id]/               ✅ botón anticipo oculto en estados finales
  citas/[id]/cobrar/

(dashboard)/                ✅ layout con protección de rutas por rol
  dashboard/                ✅ Acción Requerida con rango 7 días
  plan-vencido/
  clientes/                 ✅ detección duplicados, WhatsApp fix, modal eliminar
  clientes/[id]/            ✅ citas clickeables, "Ver todo" con search, fichas técnicas
  clientes/nuevo/
  colaboradores/            ✅ modal eliminar in-page
  colaboradores/[id]/
  colaboradores/nuevo/
  servicios/                ✅ modal eliminar in-page
  servicios/[id]/
  servicios/nuevo/
  paquetes/                 ✅ modal eliminar in-page con nombre
  planes/                   ✅ QR recortado, precios S/29/39/45, link WA, sticky
  reportes/
  configuracion/negocio/
  configuracion/agenda/
  configuracion/usuarios/
  configuracion/whatsapp/   ✅ toggles recordatorios automáticos alineados

admin/
  dashboard/
  negocios/[id]/
```

### Hooks disponibles (`apps/web/src/lib/api/hooks/`)
```
use-clients.ts
use-collaborators.ts
use-services.ts
use-appointments.ts      ✅ origin opcional, invalida ["notifications"]
use-analytics.ts         ✅ tipos completos incluyendo métricas avanzadas
use-notifications.ts
use-settings.ts          ✅ reminderEnabled + reminder2hEnabled tipados
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
| `users.ts` | GET /users; POST/PATCH/DELETE — solo OWNER |
| `clients.ts` | CRUD + duplicados + POST /clients/merge + fichas técnicas |
| `collaborators.ts` | CRUD + performsServices + schedule dinámico |
| `services.ts` | CRUD + maxConcurrent |
| `packages.ts` | CRUD + límite plan |
| `appointments.ts` | CRUD + status + origins: social |
| `availability.ts` | GET /slots (TZ explícito + reason) |
| `analytics.ts` | métricas completas con heatmap, topServices, topClients, etc. |
| `settings.ts` | GET/PATCH /settings /business /agenda /logo /whatsapp |
| `notifications.ts` | GET /notifications — PENDING 7 días + próximas 2h + sin cerrar |
| `admin.ts` | Panel super admin |

### Helper tipado (`apps/api/src/lib/hono.ts`)
```ts
export function createRouter() {
  return new Hono<{ Variables: { user: AuthPayload } }>();
}
// Todos los routers usan createRouter() — c.get("user") completamente tipado
```

### Scheduler (`apps/api/src/lib/reminder-scheduler.ts`)
```
startReminderScheduler() — llamado en index.ts al arrancar
Cron: "0 * * * *" (cada hora en punto)
  → Busca negocios ACTIVE con reminderEnabled o reminder2hEnabled
  → 24h: ventana 23h–25h desde ahora
  → 2h:  ventana 1.5h–2.5h desde ahora
  → Genera wa.me link + registra AppointmentEvent REMINDER_SENT
  → No reenvía si reminderSentAt/reminder2hSentAt ya tiene valor
```

---

## 7. Schema Prisma (estado actual v10.0)

Sin cambios de schema respecto a v9.0. Los campos agregados en sesiones anteriores vigentes:

```prisma
model Business {
  reminderEnabled     Boolean   @default(false)
  reminder2hEnabled   Boolean   @default(false)
  // ... resto igual a v8.0
}

model Appointment {
  reminderSentAt    DateTime?
  reminder2hSentAt  DateTime?
}

model ClientRecord {
  id           String   @id @default(cuid())
  clientId     String
  date         DateTime @default(now())
  treatment    String
  colorFormula String?
  allergies    String?
  notes        String?
  client       Client   @relation(...)
}

model AppointmentEvent {
  id            String   @id @default(cuid())
  appointmentId String
  type          String
  description   String
  createdAt     DateTime @default(now())
}
```

---

## 8. Lógica de Roles

| Funcionalidad | OWNER | ADMIN | COLLABORATOR |
|---|---|---|---|
| Dashboard, Clientes, Colaboradores, Servicios | ✅ | ✅ | ❌ |
| Agenda (todas las citas) | ✅ | ✅ | ✅ (solo vista Día) |
| Nueva Cita | ✅ | ✅ | ✅ |
| Paquetes, Reportes | ✅ | ❌ | ❌ |
| Configuración | ✅ | ❌ | ❌ |
| Crear/editar/eliminar usuarios | ✅ | ❌ | ❌ |
| Banner de trial | ✅ | ❌ | ❌ |

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

### Variables requeridas en producción (Railway + Vercel)
```
# Railway (backend):
DATABASE_URL=postgresql://...  ← Supabase connection string
JWT_SECRET=<string seguro>
ADMIN_JWT_SECRET=<string seguro>
FRONTEND_URL=https://<tu-dominio>.vercel.app
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=glowmanager95@gmail.com
SMTP_PASS=...
APP_URL=https://<tu-dominio>.vercel.app
TZ=America/Lima
NODE_ENV=production
SUPER_ADMIN_EMAIL=...
SUPER_ADMIN_NAME=...
SUPER_ADMIN_PASSWORD=...

# Vercel (frontend):
NEXT_PUBLIC_API_URL=https://<tu-api>.railway.app
```

---

## 10. Pantallas — Estado Final

| ID | Pantalla | Estado |
|---|---|---|
| AUTH-00 a AUTH-05 | Flujo completo de autenticación | ✅ |
| SETUP-01 | Onboarding | ✅ |
| DASH-01 | Dashboard KPIs + Acción Requerida 7 días | ✅ v10.0 |
| PLAN-02 | Plan vencido/suspendido | ✅ |
| CAL-01 | Agenda / calendario | ✅ |
| CAL-02 | Detalle de cita (anticipo oculto en finales) | ✅ v10.0 |
| CAL-03 | Nueva cita | ✅ |
| CAL-04 | Cobro de cita | ✅ |
| CLI-01 | Listado de clientes | ✅ |
| CLI-02 | Perfil de cliente (nav citas, "Ver todo", fichas) | ✅ v10.0 |
| CLI-03 | Nuevo cliente | ✅ |
| STAFF-01 a STAFF-03 | Colaboradores | ✅ |
| SRV-01 a SRV-03 | Servicios | ✅ |
| PKG-01 a PKG-03 | Paquetes | ✅ |
| PLAN-01 | Planes (QR, precios, WA link) | ✅ v10.0 |
| RPT-01 | Reportes | ✅ |
| CFG-01 | Config negocio | ✅ |
| CFG-02 | Config agenda | ✅ |
| CFG-03 | Config usuarios | ✅ |
| CFG-04 | Config WhatsApp (toggles recordatorios) | ✅ v10.0 |
| ADMIN-02 | Panel super admin — dashboard | ✅ |
| ADMIN-03 | Panel super admin — detalle negocio | ✅ |

**Total: 33/33 pantallas cliente · 2/2 panel admin**

---

## 11. Deuda Técnica Pendiente

### Deploy (próximo paso inmediato)
| Item | Descripción |
|---|---|
| **Deploy Vercel** | Frontend Next.js — `apps/web` |
| **Deploy Railway** | Backend Hono — `apps/api` |
| **Supabase prod** | `prisma generate && prisma db push` en pipeline |
| **Crear super admin prod** | `npx tsx src/scripts/create-super-admin.ts` tras deploy |

### Media prioridad
| Item | Descripción |
|---|---|
| **WhatsApp botón en ficha técnica** | Enviar resumen de tratamiento al cliente vía wa.me — frontend only, sin nuevo endpoint |
| **WhatsApp automático real** | Evolucionar de wa.me manual a Baileys o Evolution API |
| **Comisiones por colaborador** | % sobre servicios atendidos, visible en reportes y perfil |
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

## 12. Reglas para producción

```bash
# Al hacer deploy tras cambios de schema:
npx prisma generate
npx prisma db push   # o migrate deploy en prod

# Variables obligatorias en Railway:
TZ=America/Lima
FRONTEND_URL=https://tu-dominio.vercel.app
NODE_ENV=production   # activa flag Secure en cookies httpOnly

# Crear cuenta super admin (una sola vez):
cd apps/api
npx tsx src/scripts/create-super-admin.ts
```

---

## 13. Historial de PRs

| PR | Título | Estado |
|---|---|---|
| #1–#32 | Features y fixes de sesiones anteriores | ✅ Mergeados |
| #33 | v7.0 — walk-in, maxConcurrent, cobrar/completar desacoplados | ✅ Mergeado |
| #34 | Fix TZ, errors descriptivos, walk-in hora actual | ✅ Mergeado |
| #35 | Fix RESCHEDULED en agenda, dashboard y reportes | ✅ Mergeado |
| #36 | Feat: WhatsApp wa.me con plantillas editables | ✅ Mergeado |
| #37 | Feat: políticas cancelación/reagendamiento independientes | ✅ Mergeado |
| #38–#39 | v9.0 — roles, seguridad, UI fixes | ✅ Mergeado |
| #40 | Feat: solo mis citas — vínculo User↔Collaborator | ✅ Mergeado |
| #41 | Feat: búsqueda y filtros en admin dashboard | ✅ Mergeado |
| #42 | Feat: historial real de cita — AppointmentEvent | ✅ Mergeado |
| #43 | Feat: exportar reportes a Excel | ✅ Mergeado |
| #44 | Feat: ficha técnica por cliente — ClientRecord | ✅ Mergeado |
| #45 | Feat: fusionar clientes duplicados | ✅ Mergeado |
| #46 | Feat: recordatorios automáticos WhatsApp (scheduler) | ✅ Mergeado |
| #47 | Fix: recordatorios + UX eliminaciones + notificaciones RT | ✅ Mergeado |
| #48 | Fix: build producción limpio — TS cero errores | ✅ Mergeado |

---

## 14. Convención de PRs

Un PR por contexto/feature — no PRs gigantes mezclados:

| Contexto | Nombre de rama sugerido |
|---|---|
| Deploy y CI/CD | `feat/deploy` |
| Comisiones | `feat/comisiones` |
| WhatsApp ficha técnica | `feat/wa-ficha-tecnica` |
| WhatsApp automático real | `feat/wa-automatico` |
