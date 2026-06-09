# Estado del Proyecto — GlowManager
**Fecha:** 9 de Junio 2026
**Versión:** 8.0
**Repositorio:** https://github.com/rvsoslim020295/GeneradorCitas
**Rama activa:** `feat/super-admin` (PRs pendientes de merge: #35, #36, #37)

---

## 1. Resumen Ejecutivo

GlowManager es un panel administrativo B2B para negocios de belleza (salones, barberías, spas, nail bars). Permite gestionar citas, clientes, colaboradores, servicios, paquetes, pagos y reportes desde una interfaz web orientada a dueños y recepcionistas en desktop.

**Estado actual:** MVP 100% funcional. Se añadieron en esta sesión (v8.0): notificaciones WhatsApp via wa.me, políticas de cancelación/reagendamiento independientes, corrección completa del flujo de reprogramar cita, y múltiples fixes de timezone y disponibilidad.

---

## 2. Lo implementado en sesiones anteriores (hasta v7.0)

### Login unificado + Remember Me
### Planes de suscripción (BASIC / PRO / ENTERPRISE)
### Módulo de Paquetes/Combos
### Métricas avanzadas en Reportes
### Panel Super Admin completo
### Bloqueo por plan vencido/suspendido
### Campo `performsServices` en colaboradores
### Capacidad máxima simultánea por servicio (`maxConcurrent`)
### Slots dinámicos por fin de cita real
### Walk-in con validación en tiempo real
### Cobrar y Completar desacoplados
### Modal de confirmación en página (reemplaza `confirm()` nativo)

---

## 3. Lo implementado en esta sesión (v8.0)

### 3.1 Fixes de disponibilidad y timezone (TZ)
- **`dayStart`/`dayEnd` sin `Z`** — consultas de citas usan hora local, no UTC
- **`isToday` con fecha local** — usa `toLocaleDateString` con TZ explícito (`America/Lima`)
- **`dateToMinutes()` helper** — convierte Date a minutos usando zona horaria explícita del negocio; evita depender del TZ del proceso Node en ESM
- **`reason` en slots vacíos** — endpoint `/availability/slots` retorna motivo específico cuando `slots = []`:
  - *"Ningún colaborador trabaja este día"*
  - *"Todos los horarios disponibles ya pasaron. Usa Walk-in"*
  - *"Capacidad máxima del servicio alcanzada"*
  - *"El colaborador no tiene horario libre"*
- **Validación horario negocio con TZ** — `appointments.ts` usa TZ explícito al verificar si la cita cae dentro del horario del local
- **Schedule dinámico en colaboradores nuevos** — heredan `openTime`/`closeTime`/`operatingDays` del negocio en lugar de horario hardcodeado 09:00–18:00

### 3.2 Flujo de reprogramar cita — corregido completamente
- **`RESCHEDULED` excluido del chequeo de conflictos** — la cita original ya no bloquea la nueva al reagendar (tanto en colaborador como en cliente)
- **`RESCHEDULED` excluido de slots disponibles** — el endpoint de disponibilidad también ignora citas reagendadas al calcular slots
- **Navegación correcta** — `router.push` solo ocurre después de confirmar el modal y actualizar el status exitosamente; antes navegaba inmediatamente sin esperar confirmación
- **Citas RESCHEDULED ocultas en calendario** — excluidas en los 3 filtros del `calendar-grid.tsx`
- **Dashboard** — citas reagendadas excluidas de "Citas de Hoy" y "Próxima Cita"

### 3.3 UX nueva cita
- **Toggle Hora Exacta / Slots** — botón integrado en la sección Hora; reemplaza la sección walk-in separada
- **Walk-in pre-llenado** — se abre con la hora actual del sistema
- **Errores descriptivos** — mensajes específicos del servidor en pantalla (no diálogos nativos)
- **Error de servidor parseado** — el `catch` en `executeUpdateStatus` parsea el JSON correctamente

### 3.4 Notificaciones WhatsApp via wa.me (sin API de pago)
- **Schema**: 3 campos en `Business` — `waTplConfirmation`, `waTplReminder`, `waTplPayment`
- **Backend settings**: acepta y persiste las 3 plantillas
- **Config WhatsApp** (`/configuracion/whatsapp`):
  - Conectada a la BD real (antes era UI estática)
  - 3 plantillas editables en textarea con preview
  - Variables disponibles con copia al portapapeles: `{cliente}`, `{negocio}`, `{fecha}`, `{hora}`, `{servicio}`, `{colaborador}`, `{precio}`
  - Texto por defecto si el negocio no ha configurado plantillas
- **Detalle de cita**: sección "Notificar por WhatsApp" antes del Historial
  - 3 tarjetas en grid: ✅ Confirmación · 🔔 Recordatorio · 💳 Cobro
  - Cada botón genera un `wa.me` link con el mensaje pre-llenado con datos reales
  - Deshabilitados si el cliente no tiene teléfono
- **Perfil de cliente**: botón WhatsApp abre `wa.me` real; deshabilitado con tooltip si no hay teléfono

### 3.5 Reportes — desglose en Total Citas
- KPI "Total Citas" ahora muestra debajo cuántas fueron:
  - Canceladas (rojo)
  - No se presentaron (naranja)
  - Reagendadas (gris)
- Solo aparece si alguno tiene valor > 0

### 3.6 Políticas de cancelación y reagendamiento independientes
- **Schema**: nuevo campo `reschedulingHours` en `Business` (default 12h)
- **Backend**: valida al cambiar status:
  - `CANCELLED` → verifica `cancellationHours`
  - `RESCHEDULED` → verifica `reschedulingHours`
  - Retorna 422 con mensaje: *"La política del local exige al menos X horas (faltan Y h)"*
- **Config/agenda**: dos secciones separadas con preview en texto ("24 h antes / Sin restricción")
- **Detalle de cita**: error del servidor se parsea y muestra en pantalla en rojo

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
  agenda/                   CAL-01
  nueva-cita/               CAL-03 — Toggle Exacta/Slots + walk-in hora actual ✨ v8.0
  citas/[id]/               CAL-02 — WhatsApp contextual + políticas cancelación ✨ v8.0
  citas/[id]/cobrar/        CAL-04

(dashboard)/
  dashboard/                DASH-01 — Sin citas RESCHEDULED ✨ v8.0
  plan-vencido/             PLAN-02
  clientes/                 CLI-01
  clientes/[id]/            CLI-02 — Botón WhatsApp real ✨ v8.0
  colaboradores/            STAFF-01
  colaboradores/[id]/       STAFF-02
  colaboradores/nuevo/      STAFF-03
  servicios/                SRV-01
  servicios/[id]/           SRV-02
  servicios/nuevo/          SRV-03
  paquetes/                 PKG-01
  paquetes/nuevo/           PKG-02
  paquetes/[id]/            PKG-03
  planes/                   PLAN-01
  reportes/                 RPT-01 — Desglose canceladas/no-show/reagendadas ✨ v8.0
  configuracion/            CFG hub
  configuracion/negocio/    CFG-01
  configuracion/agenda/     CFG-02 — Cancelación y reagendamiento separados ✨ v8.0
  configuracion/usuarios/   CFG-03
  configuracion/whatsapp/   CFG-04 — Plantillas editables conectadas a BD ✨ v8.0

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
use-analytics.ts             → kpis incluye cancelledCount/noShowCount/rescheduledCount
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
| `auth.ts` | POST /auth/login, GET /auth/me |
| `users.ts` | CRUD /users |
| `clients.ts` | GET /clients |
| `collaborators.ts` | CRUD + schedule dinámico desde negocio ✨ v8.0 |
| `services.ts` | CRUD + maxConcurrent |
| `packages.ts` | CRUD + límite plan |
| `appointments.ts` | CRUD + status con validación de políticas ✨ v8.0 + payment desacoplado |
| `availability.ts` | GET /slots (TZ explícito + reason) ✨ v8.0 + GET /check |
| `analytics.ts` | GET /analytics (cancelledCount/noShowCount/rescheduledCount) ✨ v8.0 |
| `settings.ts` | GET/PATCH /settings (waTpl* + reschedulingHours) ✨ v8.0 |
| `admin.ts` | Panel super admin |

---

## 7. Schema Prisma (estado actual)

```prisma
model Business {
  ...
  cancellationHours   Int      @default(24)
  reschedulingHours   Int      @default(12)    ← ✨ v8.0
  waTplConfirmation   String?                  ← ✨ v8.0
  waTplReminder       String?                  ← ✨ v8.0
  waTplPayment        String?                  ← ✨ v8.0
}

model Collaborator {
  ...
  isActive         Boolean  @default(true)
  performsServices Boolean  @default(true)
}

model Service {
  ...
  bufferMinutes  Int      @default(0)
  maxConcurrent  Int?
  price          Float
}

model Appointment {
  ...
  origin         String?  @default("walkin")
  paidAmount     Float?
  paymentMethod  String?
}
```

---

## 8. Lógica de Disponibilidad (v8.0)

```
TZ = business.timezone ?? process.env.TZ ?? "America/Lima"

Para cada colaborador activo con performsServices=true:
  1. Verificar que el día esté habilitado en su schedule
  2. Candidatos = grilla fija (cada slotMinutes) ∪ fin de cada cita activa
  3. Para cada candidato:
     a. slotStart >= nowMinutes (hora actual en TZ local)
     b. ¿Colaborador libre? (no PENDING/CONFIRMED/IN_PROGRESS/RESCHEDULED en ese rango)
     c. ¿Capacidad del servicio no superada? (si maxConcurrent != null)
  4. Si pasa todos los checks → slot disponible

COMPLETED y RESCHEDULED liberan tanto al colaborador como el cupo de capacidad.

Cuando slots = [] → retorna reason descriptivo:
  - "Ningún colaborador trabaja este día (Mon)"
  - "Todos los horarios disponibles ya pasaron. Usa Walk-in"
  - "Capacidad máxima del servicio alcanzada (N simultáneos)"
  - "El colaborador no tiene horario libre en esta fecha"
```

---

## 9. Políticas de Cancelación y Reagendamiento (v8.0)

```
Al intentar CANCELAR:
  hoursUntil = (startTime - now) / 3600000
  si hoursUntil > 0 && hoursUntil < cancellationHours → 422
  mensaje: "La política del local exige al menos X horas (faltan Y h)"

Al intentar REAGENDAR:
  si hoursUntil > 0 && hoursUntil < reschedulingHours → 422
  mensaje: "La política del local exige al menos X horas (faltan Y h)"

Si cancellationHours = 0 o reschedulingHours = 0 → sin restricción
```

---

## 10. Notificaciones WhatsApp (v8.0)

### Cómo funciona
1. Admin configura plantillas en `/configuracion/whatsapp`
2. En detalle de cita aparecen 3 botones: ✅ Confirmación · 🔔 Recordatorio · 💳 Cobro
3. Al hacer clic → abre `wa.me/{número}?text={mensaje_pre_llenado}`
4. WhatsApp Web se abre con el mensaje listo → el usuario solo presiona Enviar

### Variables disponibles en plantillas
| Variable | Valor |
|---|---|
| `{cliente}` | Nombre del cliente |
| `{negocio}` | Nombre del negocio |
| `{fecha}` | Fecha de la cita (ej. "lunes, 9 de junio") |
| `{hora}` | Hora de la cita (ej. "15:00") |
| `{servicio}` | Nombre del servicio |
| `{colaborador}` | Nombre del colaborador |
| `{precio}` | Precio del servicio |

### Plantillas por defecto
```
Confirmación: "Hola {cliente}, ✅ tu cita está confirmada en {negocio}. 📅 {fecha} a las {hora} ✂️ {servicio} con {colaborador} 💰 S/{precio}"
Recordatorio: "Hola {cliente}, 🔔 te recordamos tu cita de mañana en {negocio}..."
Cobro:        "Hola {cliente}, 💳 tu servicio de {servicio} quedó pendiente de pago..."
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
| AUTH-01 | Login unificado | ✅ |
| AUTH-00 a AUTH-05 | Flujo completo auth | ✅ |
| SETUP-01 | Onboarding | ✅ |
| DASH-01 | Dashboard KPIs | ✅ v8.0 (sin RESCHEDULED) |
| PLAN-02 | Plan vencido/suspendido | ✅ |
| CAL-01 | Agenda/calendario | ✅ v8.0 (sin RESCHEDULED) |
| CAL-02 | Detalle de cita | ✅ v8.0 (WhatsApp + políticas) |
| CAL-03 | Nueva cita | ✅ v8.0 (toggle Exacta/Slots) |
| CAL-04 | Cobro de cita | ✅ |
| CLI-01, CLI-02 | Clientes | ✅ v8.0 (WhatsApp real) |
| STAFF-01 a STAFF-03 | Colaboradores | ✅ |
| SRV-01 a SRV-03 | Servicios | ✅ |
| PKG-01 a PKG-03 | Paquetes | ✅ |
| PLAN-01 | Planes de suscripción | ✅ |
| RPT-01 | Reportes | ✅ v8.0 (desglose estados) |
| CFG-01 | Config negocio | ✅ |
| CFG-02 | Config agenda | ✅ v8.0 (cancelación + reagendamiento) |
| CFG-03 | Config usuarios | ✅ |
| CFG-04 | Config WhatsApp | ✅ v8.0 (plantillas reales) |
| ADMIN-02, ADMIN-03 | Panel super admin | ✅ |

**Total pantallas clientes: 33/33 · Panel admin: 2/2**

---

## 13. PRs de esta sesión

| PR | Título | Estado |
|---|---|---|
| #33 | v7.0 feat/super-admin | ✅ Mergeado |
| #34 | Fix bugs agenda, disponibilidad, walk-in con hora actual | ✅ Mergeado |
| #35 | Fix bugs RESCHEDULED en agenda, dashboard y reportes | 🔄 Pendiente |
| #36 | Feat: WhatsApp wa.me con plantillas editables | 🔄 Pendiente |
| #37 | Feat: políticas cancelación/reagendamiento independientes | 🔄 Pendiente |

---

## 14. Bugs Resueltos en esta Sesión (v8.0)

| Bug | Descripción | Estado |
|---|---|---|
| Timezone incorrecto en disponibilidad | `dayStart/dayEnd` usaban UTC (`Z`) causando queries del día equivocado | ✅ |
| `isToday` con UTC rollover | Después de las 7 PM Lima, UTC pasaba a "mañana" y mostraba slots pasados | ✅ |
| `getHours()` dependía del TZ del proceso | En ESM, dotenv puede cargar tarde; se usa `toLocaleTimeString` con TZ explícito | ✅ |
| 0 slots sin explicación | Frontend mostraba mensaje genérico; ahora retorna `reason` específico | ✅ |
| Conflicto al reprogramar | Cita original (RESCHEDULED) bloqueaba la nueva | ✅ |
| Navegación inmediata al reprogramar | `router.push` corría sin esperar confirmación del modal | ✅ |
| Citas RESCHEDULED visibles en agenda | Aparecían en calendario, dashboard y "próxima cita" | ✅ |
| Reagendadas contaban en "Completadas" | Dashboard incluía RESCHEDULED en métricas activas | ✅ |
| Botón WhatsApp en cliente sin acción | Era un `<button>` estático sin href | ✅ |
| Botones WhatsApp apretados junto al teléfono | Movidos a sección propia antes del Historial | ✅ |
| Colaboradores nuevos con horario fijo 09-18 | Ahora heredan el horario real del negocio | ✅ |
| Error de servidor no parseado en detalle de cita | El catch mostraba JSON crudo en vez del mensaje | ✅ |

---

## 15. Deuda Técnica Pendiente

### Alta prioridad
| Item | Descripción |
|---|---|
| **Deploy a producción** | Vercel (frontend) + Railway (backend) + Supabase (BD) |
| **Exportar Excel** | Flag `canExportExcel` listo en plan-limits, falta endpoint y botón en reportes |

### Media prioridad
| Item | Descripción |
|---|---|
| **WhatsApp automático** | Opción B/C: Baileys o Evolution API para envío sin intervención manual |
| **Recordatorios automáticos** | La UI de config/whatsapp tiene toggles 24h/2h pero sin backend scheduler |
| **Foto de resultado por cita** | Portafolio del negocio — sugerida, no implementada |
| **Comisiones por colaborador** | % sobre servicios atendidos |
| **Ficha técnica por cliente** | Historial de coloraciones, tratamientos, alergias |

### Baja prioridad
| Item | Descripción |
|---|---|
| **Culqi / pagos automáticos** | Plan se activa manualmente hoy |
| **Drag & drop en calendario** | Evaluar FullCalendar |
| **`payments` tabla separada** | El pago está inline en `Appointment` |
| **Responsividad móvil** | Solo desktop |
| **`audit_log`** | Trazabilidad de acciones críticas |
| **Historial de la cita real** | MOCK_TIMELINE en detalle de cita — no conectado a BD |

---

## 16. Nota importante para producción

```
TZ=America/Lima          ← en Railway, para cálculos de horarios correctos
FRONTEND_URL=https://tu-dominio.vercel.app
NODE_ENV=production      ← activa flag Secure en las cookies httpOnly
```

## 17. Crear cuenta super admin

```bash
cd apps/api
npx tsx src/scripts/create-super-admin.ts
```

---

## 18. Convención de PRs (desde v8.0)

PRs separados por contexto/feature, no uno gigante:
- `fix/bugs-agenda` — fixes de disponibilidad, conflictos, calendario
- `feat/whatsapp` — notificaciones y plantillas
- `feat/politicas` — cancelación y reagendamiento
- `feat/reportes` — mejoras en reportes y métricas
- `feat/deploy` — configuración de producción
