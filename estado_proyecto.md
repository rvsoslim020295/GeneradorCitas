# Estado del Proyecto — GlowManager
**Fecha:** 8 de Junio 2026
**Versión:** 8.0
**Repositorio:** https://github.com/rvsoslim020295/GeneradorCitas
**Rama activa:** `feat/super-admin`
**PRs de esta sesión:** #33 → #37 (todos mergeados a `main` ✅)

---

## 1. Resumen Ejecutivo

GlowManager es un panel administrativo B2B para negocios de belleza (salones, barberías, spas, nail bars). Permite gestionar citas, clientes, colaboradores, servicios, paquetes, pagos y reportes desde una interfaz web orientada a dueños y recepcionistas en desktop.

**Estado actual:** MVP 100% funcional. En esta sesión (v8.0) se resolvieron todos los bugs críticos de disponibilidad y reprogramación, se implementaron notificaciones WhatsApp gratuitas via `wa.me`, y se añadieron políticas de cancelación y reagendamiento independientes con validación real en backend.

---

## 2. Lo implementado en sesiones anteriores (hasta v7.0)

- Login unificado + Remember Me (sesión o 30 días)
- Planes BASIC / PRO / ENTERPRISE con restricciones en backend
- Módulo de Paquetes/Combos (mínimo 2 servicios, límite por plan)
- Métricas avanzadas en Reportes (top servicios, mapa de calor, clientes valiosos, origen de citas)
- Panel Super Admin completo (gestión de negocios, planes, suspensión)
- Bloqueo por plan vencido/suspendido → página `/plan-vencido`
- Campo `performsServices` en colaboradores (recepcionistas no aparecen al agendar)
- Capacidad máxima simultánea por servicio (`maxConcurrent`)
- Slots dinámicos por fin de cita real
- Walk-in con validación en tiempo real
- Cobrar y Completar desacoplados
- Modal de confirmación en página (reemplaza `confirm()` nativo)

---

## 3. Lo implementado en esta sesión (v8.0)

### 3.1 Fixes críticos de disponibilidad y timezone

| Fix | Descripción |
|---|---|
| `dayStart`/`dayEnd` sin `Z` | Las queries de citas usaban UTC, causando que se buscaran citas del día equivocado (offset UTC-5) |
| `isToday` con fecha local | Usaba `toISOString()` (UTC); después de las 7 PM Lima el UTC rollover mostraba slots pasados |
| `dateToMinutes()` con TZ explícito | Todos los `getHours()`/`getMinutes()` reemplazados por `toLocaleTimeString` con TZ explícito para no depender del proceso Node en ESM |
| Validación horario negocio con TZ | `appointments.ts` también usaba `getHours()` para validar si la cita cae dentro del horario |
| `reason` en slots vacíos | El endpoint `/availability/slots` retorna motivo específico cuando no hay disponibilidad |
| Schedule dinámico en colaboradores nuevos | Heredan `openTime`/`closeTime`/`operatingDays` del negocio en lugar de horario hardcodeado 09-18 |

**Motivos específicos devueltos cuando slots = []:**
- *"Ningún colaborador trabaja este día (Mon)"*
- *"Todos los horarios disponibles ya pasaron. Usa la sección Walk-in o elige otra fecha"*
- *"Capacidad máxima del servicio alcanzada (N simultáneos)"*
- *"El colaborador no tiene horario libre en esta fecha. Prueba otro colaborador o fecha"*

### 3.2 Flujo de reprogramar cita — corregido completamente

| Bug | Fix |
|---|---|
| Cita original (RESCHEDULED) bloqueaba la nueva | Agregado `"RESCHEDULED"` al `notIn` en chequeo de colaborador y cliente |
| RESCHEDULED bloqueaba slots en availability | Excluido en los dos `notIn` de availability.ts |
| `router.push` sin esperar confirmación | Movido al `afterConfirm` callback del modal — navega solo tras confirmar Y actualizar en servidor |
| Citas reagendadas visibles en calendario | Excluidas en los 3 filtros de `calendar-grid.tsx` |
| Reagendadas en "Citas de Hoy" y "Próxima Cita" | Excluidas con constante `INACTIVE` en dashboard |

### 3.3 UX de nueva cita

- **Toggle Hora Exacta / Slots** — botón integrado en la sección Hora; modo "Exacta" abre por defecto con la hora actual pre-llenada
- **Errores descriptivos** — el backend retorna `reason` y el frontend lo muestra en rojo; nunca diálogos nativos
- **Error JSON parseado en detalle de cita** — el `catch` de `executeUpdateStatus` parsea el body JSON del servidor correctamente

### 3.4 Notificaciones WhatsApp via wa.me (sin costo, sin API externa)

**Flujo:** Admin configura plantilla → en detalle de cita aparece botón → clic abre WhatsApp Web con mensaje pre-llenado → solo presiona Enviar.

**Schema:** 3 campos nuevos en `Business`: `waTplConfirmation`, `waTplReminder`, `waTplPayment`

**Config WhatsApp** (`/configuracion/whatsapp`):
- Conectada a la BD real (antes era UI estática sin persistencia)
- 3 plantillas editables con preview
- Variables copiables al portapapeles: `{cliente}`, `{negocio}`, `{fecha}`, `{hora}`, `{servicio}`, `{colaborador}`, `{precio}`
- Texto por defecto si el negocio no ha configurado plantillas aún

**Detalle de cita:** sección "Notificar por WhatsApp" (antes del Historial)
- Grid de 3 tarjetas: ✅ Confirmación · 🔔 Recordatorio · 💳 Cobro
- Deshabilitadas si el cliente no tiene teléfono

**Perfil de cliente:** botón WhatsApp abre `wa.me/{número}` real; deshabilitado con tooltip si no hay teléfono.

### 3.5 Reportes — desglose en Total Citas

El KPI "Total Citas" ahora muestra debajo (solo si valor > 0):
- Canceladas (rojo)
- No se presentaron (naranja)
- Reagendadas (gris)

### 3.6 Políticas de cancelación y reagendamiento independientes

**Schema:** nuevo campo `reschedulingHours` en `Business` (default 12h)

**Backend** — valida al cambiar status:
- `CANCELLED` → verifica `cancellationHours`
- `RESCHEDULED` → verifica `reschedulingHours`
- Retorna 422: *"La política del local exige al menos X horas de anticipación (faltan Y h)"*
- Si el campo es 0 → sin restricción

**Config/Agenda:** dos secciones separadas con preview en texto ("24 h antes de la cita" / "Sin restricción")

### 3.7 Fix: cliente Prisma desactualizado

Al agregar `reschedulingHours` con `db push`, el cliente Prisma generado en `apps/api/generated/prisma` quedó stale causando crashes en el backend. Fix: `npx prisma generate` + reinicio del servidor.

**⚠️ Regla para producción:** siempre correr `npx prisma generate && npx prisma db push` al hacer deploy tras cambios de schema.

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

### Estructura de rutas (`apps/web/src/app/`)

```
(auth)/
  login/                    AUTH-01 — Login unificado (negocios + super admin)
  registro/                 AUTH-00
  recuperar-contrasena/     AUTH-02
  resetear-contrasena/      AUTH-03
  verificar-correo/         AUTH-04
  verificar-email/          AUTH-05

(onboarding)/
  onboarding/               SETUP-01

(agenda)/
  agenda/                   CAL-01 — Sin RESCHEDULED en calendario ✨ v8.0
  nueva-cita/               CAL-03 — Toggle Exacta/Slots + hora actual pre-llenada ✨ v8.0
  citas/[id]/               CAL-02 — WhatsApp contextual + políticas cancelación ✨ v8.0
  citas/[id]/cobrar/        CAL-04

(dashboard)/
  dashboard/                DASH-01 — Sin RESCHEDULED en métricas ✨ v8.0
  plan-vencido/             PLAN-02
  clientes/                 CLI-01
  clientes/[id]/            CLI-02 — Botón WhatsApp real ✨ v8.0
  colaboradores/            STAFF-01
  colaboradores/[id]/       STAFF-02
  colaboradores/nuevo/      STAFF-03 — Schedule heredado del negocio ✨ v8.0
  servicios/                SRV-01
  servicios/[id]/           SRV-02
  servicios/nuevo/          SRV-03
  paquetes/                 PKG-01 a PKG-03
  planes/                   PLAN-01
  reportes/                 RPT-01 — Desglose canceladas/no-show/reagendadas ✨ v8.0
  configuracion/negocio/    CFG-01
  configuracion/agenda/     CFG-02 — Cancelación y reagendamiento separados ✨ v8.0
  configuracion/usuarios/   CFG-03
  configuracion/whatsapp/   CFG-04 — Plantillas reales conectadas a BD ✨ v8.0

admin/
  dashboard/                ADMIN-02
  negocios/[id]/            ADMIN-03
```

### Hooks disponibles (`apps/web/src/lib/api/hooks/`)
```
use-clients.ts
use-collaborators.ts         → tipo incluye performsServices
use-services.ts              → tipo incluye maxConcurrent
use-appointments.ts
use-analytics.ts             → kpis incluye cancelledCount / noShowCount / rescheduledCount
use-notifications.ts
use-settings.ts              → incluye waTpl* y reschedulingHours ✨ v8.0
use-availability.ts          → SlotsResponse incluye reason ✨ v8.0
use-packages.ts
```

---

## 6. Arquitectura del Backend

### Endpoints (`apps/api/src/routes/`)

| Archivo | Rutas principales |
|---|---|
| `auth.ts` | POST /auth/login (devuelve plan + planStatus), GET /auth/me |
| `users.ts` | CRUD /users |
| `clients.ts` | GET /clients (filtrado por historial según plan) |
| `collaborators.ts` | CRUD + límite plan + performsServices + schedule dinámico ✨ v8.0 |
| `services.ts` | CRUD + maxConcurrent |
| `packages.ts` | CRUD + límite plan |
| `appointments.ts` | CRUD + status (validación políticas ✨ v8.0) + payment + deposit |
| `availability.ts` | GET /slots (TZ explícito + reason ✨ v8.0) + GET /check |
| `analytics.ts` | GET /analytics (cancelledCount/noShowCount/rescheduledCount ✨ v8.0) |
| `settings.ts` | GET/PATCH /settings (waTpl* + reschedulingHours ✨ v8.0) |
| `admin.ts` | Panel super admin |

---

## 7. Schema Prisma (estado actual v8.0)

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
  reschedulingHours   Int        @default(12)    ← ✨ v8.0
  operatingDays       String[]   @default(["Mon","Tue","Wed","Thu","Fri"])
  openTime            String     @default("09:00")
  closeTime           String     @default("18:00")
  plan                PlanType   @default(TRIAL)
  planStatus          PlanStatus @default(ACTIVE)
  planExpiresAt       DateTime?
  trialEndsAt         DateTime?
  waTplConfirmation   String?                    ← ✨ v8.0
  waTplReminder       String?                    ← ✨ v8.0
  waTplPayment        String?                    ← ✨ v8.0
}

model Collaborator {
  isActive         Boolean  @default(true)
  performsServices Boolean  @default(true)
  schedule         Json?    // heredado del negocio al crear ✨ v8.0
}

model Service {
  bufferMinutes  Int   @default(0)
  maxConcurrent  Int?
  price          Float
}

model Appointment {
  origin         String?  @default("walkin")
  paidAmount     Float?   // independiente del status
  paymentMethod  String?
}
```

---

## 8. Lógica de Disponibilidad (v8.0)

```
TZ = process.env.TZ || "America/Lima"   ← explícito, no depende del proceso Node

Para cada colaborador activo (isActive=true, performsServices=true):
  1. Verificar que el día esté habilitado en su schedule
  2. workStart = max(collab.start, businessOpen)
     workEnd   = min(collab.end,   businessClose)
  3. Candidatos = grilla fija (cada slotMinutes) ∪ fin de cada cita activa
  4. Para cada candidato:
     a. slotStart >= nowMinutes (hora actual en TZ local, solo si es hoy)
     b. Colaborador libre? (no PENDING/CONFIRMED/IN_PROGRESS en ese rango)
        — COMPLETED y RESCHEDULED excluidos → liberan al colaborador
     c. Capacidad del servicio no superada? (si maxConcurrent != null)
        — Solo cuenta PENDING/CONFIRMED/IN_PROGRESS

Si slots = [] → retorna reason descriptivo al frontend
```

---

## 9. Políticas de Cancelación y Reagendamiento (v8.0)

```
PATCH /appointments/:id/status

Al status = "CANCELLED":
  hoursUntil = (startTime - now) / 3_600_000
  si hoursUntil > 0 && hoursUntil < business.cancellationHours:
    → 422 "La política del local exige al menos X horas (faltan Y h)"

Al status = "RESCHEDULED":
  si hoursUntil > 0 && hoursUntil < business.reschedulingHours:
    → 422 "La política del local exige al menos X horas (faltan Y h)"

cancellationHours = 0 o reschedulingHours = 0 → sin restricción
```

---

## 10. Notificaciones WhatsApp (v8.0)

### Variables disponibles en plantillas
| Variable | Reemplazada por |
|---|---|
| `{cliente}` | Nombre del cliente |
| `{negocio}` | Nombre del negocio |
| `{fecha}` | Fecha formateada ("lunes, 9 de junio") |
| `{hora}` | Hora de la cita ("15:00") |
| `{servicio}` | Nombre del servicio |
| `{colaborador}` | Nombre del colaborador |
| `{precio}` | Precio del servicio |

### Plantillas por defecto (si el negocio no las configuró)
```
✅ Confirmación:
"Hola {cliente}, ✅ tu cita está confirmada en {negocio}.
📅 {fecha} a las {hora} · ✂️ {servicio} con {colaborador} · 💰 S/{precio}"

🔔 Recordatorio:
"Hola {cliente}, 🔔 te recordamos tu cita de mañana en {negocio}.
📅 {fecha} a las {hora} · ✂️ {servicio} con {colaborador}"

💳 Cobro pendiente:
"Hola {cliente}, 💳 tu servicio de {servicio} quedó pendiente de pago.
💰 Total: S/{precio} · 📍 {negocio}"
```

---

## 11. Variables de Entorno

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

## 12. Pantallas — Estado Final

| ID | Pantalla | Estado |
|---|---|---|
| AUTH-00 a AUTH-05 | Flujo completo de autenticación | ✅ |
| SETUP-01 | Onboarding | ✅ |
| DASH-01 | Dashboard KPIs + Resumen Operativo | ✅ v8.0 |
| PLAN-02 | Plan vencido/suspendido | ✅ |
| CAL-01 | Agenda / calendario por colaborador | ✅ v8.0 |
| CAL-02 | Detalle de cita | ✅ v8.0 |
| CAL-03 | Nueva cita | ✅ v8.0 |
| CAL-04 | Cobro de cita | ✅ |
| CLI-01 | Listado de clientes | ✅ |
| CLI-02 | Perfil de cliente | ✅ v8.0 |
| STAFF-01 a STAFF-03 | Colaboradores | ✅ v8.0 |
| SRV-01 a SRV-03 | Servicios | ✅ |
| PKG-01 a PKG-03 | Paquetes | ✅ |
| PLAN-01 | Planes de suscripción | ✅ |
| RPT-01 | Reportes | ✅ v8.0 |
| CFG-01 | Config negocio | ✅ |
| CFG-02 | Config agenda | ✅ v8.0 |
| CFG-03 | Config usuarios | ✅ |
| CFG-04 | Config WhatsApp | ✅ v8.0 |
| ADMIN-02 | Panel super admin — dashboard | ✅ |
| ADMIN-03 | Panel super admin — detalle negocio | ✅ |

**Total: 33/33 pantallas cliente · 2/2 panel admin**

---

## 13. Historial de PRs

| PR | Título | Estado |
|---|---|---|
| #1–#31 | Features y fixes de sesiones anteriores | ✅ Mergeados |
| #32 | v6.0 — super admin, planes, paquetes | ✅ Mergeado |
| #33 | v7.0 — walk-in, maxConcurrent, cobrar/completar desacoplados | ✅ Mergeado |
| #34 | Fix TZ, errors descriptivos, walk-in hora actual | ✅ Mergeado |
| #35 | Fix RESCHEDULED en agenda, dashboard y reportes | ✅ Mergeado |
| #36 | Feat: WhatsApp wa.me con plantillas editables | ✅ Mergeado |
| #37 | Feat: políticas cancelación/reagendamiento independientes | ✅ Mergeado |

---

## 14. Deuda Técnica Pendiente

### Alta prioridad
| Item | Descripción |
|---|---|
| **Deploy a producción** | Vercel + Railway + Supabase. Requiere `prisma generate && prisma db push` en el pipeline |
| **Exportar Excel** | Flag `canExportExcel` listo en `plan-limits.ts`, falta endpoint GET y botón en reportes |

### Media prioridad
| Item | Descripción |
|---|---|
| **WhatsApp automático** | Evolucionar de wa.me manual a Baileys o Evolution API para envío sin intervención |
| **Recordatorios automáticos** | Config/WhatsApp tiene toggles 24h/2h pero no hay scheduler en backend |
| **Historial de cita real** | `MOCK_TIMELINE` en detalle de cita — no conectado a BD |
| **Foto de resultado por cita** | Portafolio del negocio |
| **Comisiones por colaborador** | % sobre servicios atendidos |
| **Ficha técnica por cliente** | Historial de coloraciones, tratamientos, alergias |

### Baja prioridad
| Item | Descripción |
|---|---|
| **Pagos automáticos (Culqi)** | Activación de plan es manual hoy |
| **Drag & drop en calendario** | Evaluar FullCalendar |
| **Tabla `payments` separada** | El pago está inline en `Appointment` |
| **Responsividad móvil** | Solo desktop |
| **`audit_log`** | Trazabilidad de acciones críticas |

---

## 15. Reglas para producción

```bash
# Al hacer deploy tras cambios de schema:
npx prisma generate
npx prisma db push   # o migrate deploy en prod

# Variables obligatorias en Railway:
TZ=America/Lima
FRONTEND_URL=https://tu-dominio.vercel.app
NODE_ENV=production   # activa flag Secure en cookies httpOnly
```

## 16. Crear cuenta super admin

```bash
cd apps/api
npx tsx src/scripts/create-super-admin.ts
```

---

## 17. Convención de PRs (desde v8.0)

Un PR por contexto/feature — no PRs gigantes mezclados:

| Contexto | Nombre de rama sugerido |
|---|---|
| Bugs de agenda/disponibilidad | `fix/bugs-agenda` |
| Features de WhatsApp | `feat/whatsapp` |
| Reportes y métricas | `feat/reportes` |
| Deploy y CI/CD | `feat/deploy` |
| Panel admin | `feat/admin` |
