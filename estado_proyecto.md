# Estado del Proyecto — GlowManager
**Fecha:** 6 de Junio 2026  
**Versión:** 4.0  
**Repositorio:** https://github.com/rvsoslim020295/GeneradorCitas  
**Rama activa:** `main` (todos los PRs mergeados)

---

## 1. Resumen Ejecutivo

GlowManager es un panel administrativo B2B para negocios de belleza (salones, barberías, spas, nail bars). Permite gestionar citas, clientes, colaboradores, servicios, pagos y reportes desde una interfaz web orientada a dueños y recepcionistas en desktop.

**Estado actual:** MVP 100% funcional y production-ready en seguridad. Esta sesión (v4.0) resolvió los bugs de seguridad BUG-04 y BUG-05 (JWT httpOnly + protección de rutas), BUG-03 (logo a Supabase Storage) y agregó los estados `IN_PROGRESS` y `RESCHEDULED` a las citas.

---

## 2. Stack Tecnológico

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
| Autenticación | JWT en httpOnly cookie — expira en 7 días |
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

## 3. Arquitectura del Frontend

### Estructura de rutas (`apps/web/src/app/`)

```
(auth)/
  login/                    AUTH-01 — Login
  registro/                 AUTH-00 — Registro de nuevo negocio
  recuperar-contrasena/     AUTH-02 — Recuperar contraseña
  resetear-contrasena/      AUTH-03 — Resetear contraseña
  verificar-correo/         AUTH-04 — Pantalla "revisa tu bandeja"
  verificar-email/          AUTH-05 — Confirmación de token de verificación

(onboarding)/
  onboarding/               SETUP-01 — Wizard 4 pasos

(agenda)/
  agenda/                   CAL-01 — Calendario Día/Semana/Mes
  nueva-cita/               CAL-03 — Nueva cita con slots reales
  citas/[id]/               CAL-02 — Detalle de cita (modal centrado)
  citas/[id]/cobrar/        CAL-04 — Cierre y pago con anticipo descontado

(dashboard)/
  dashboard/                DASH-01 — KPIs, alertas y card de bienvenida del negocio
  clientes/                 CLI-01 — Directorio (sin buscador global en TopBar)
  clientes/[id]/            CLI-02 — Perfil + historial + edición inline
  clientes/nuevo/
  colaboradores/            STAFF-01 — Lista (sin buscador global en TopBar)
  colaboradores/[id]/       STAFF-02 — Perfil, horarios, avatar, ausencias
  colaboradores/nuevo/
  servicios/                SRV-01 — Catálogo (sin buscador global en TopBar)
  servicios/[id]/           SRV-02 — Editar (bufferMinutes, color, isActive)
  servicios/nuevo/
  reportes/                 RPT-01 — Analytics completo con desglose de ingresos
  configuracion/            CFG hub
  configuracion/negocio/    CFG-01 — Datos del negocio + upload de logo a Supabase
  configuracion/agenda/     CFG-02 — Días, horario apertura/cierre, cancelación
  configuracion/usuarios/   CFG-03
  configuracion/whatsapp/   CFG-04
```

### Componentes globales
```
src/middleware.ts            Protección de rutas — redirige según cookie gm_token

src/components/layout/
  sidebar.tsx          Navegación lateral — filtro por rol
  top-bar.tsx          TopBar con prop hideSearch para páginas con buscador propio
  global-search.tsx    Buscador global con debounce 300ms
  query-provider.tsx   QueryClientProvider + ReactQuery DevTools

src/lib/api/
  client.ts            apiFetch — credentials: "include", sin header Authorization manual

src/lib/api/hooks/
  index.ts             Barrel de exports
  use-clients.ts
  use-collaborators.ts
  use-services.ts
  use-appointments.ts  → tipo Appointment incluye los 7 estados + paidAmount
  use-analytics.ts     → tipos CollaboratorStat, AnalyticsData con chartType
  use-notifications.ts
  use-settings.ts      → incluye openTime, closeTime en el tipo Settings
  use-availability.ts  → retorna SlotsResponse { slots: string[], slotDuration: number }

src/lib/hooks/
  use-debounce.ts

src/hooks/
  use-role.ts          Lee rol del usuario desde localStorage (gm_user, no gm_token)
```

---

## 4. Arquitectura del Backend

### Endpoints (`apps/api/src/routes/`)

| Archivo | Rutas |
|---|---|
| `auth.ts` | `POST /auth/register` — crea negocio + usuario, genera token de verificación, envía email |
| `auth.ts` | `GET /auth/verify-email?token=` — verifica cuenta, setea cookie httpOnly, retorna user |
| `auth.ts` | `POST /auth/login` — bloquea si `emailVerified = false` (403), setea cookie httpOnly |
| `auth.ts` | `POST /auth/logout` — borra cookie `gm_token` (Max-Age=0) |
| `auth.ts` | `GET /auth/me` — incluye `logoUrl` del negocio y datos de trial |
| `clients.ts` | CRUD `/clients` |
| `collaborators.ts` | CRUD `/collaborators` + ausencias. Al crear → guarda schedule default Lun–Vie 09:00–18:00 |
| `services.ts` | CRUD `/services` |
| `appointments.ts` | CRUD `/appointments` — valida horario negocio (422), valida conflicto de cliente (409) |
| `appointments.ts` | `PATCH /appointments/:id/status` — acepta los 7 estados |
| `appointments.ts` | `POST /appointments/:id/payment` — guarda `paidAmount`, no modifica `price` |
| `appointments.ts` | `POST /appointments/:id/deposit` — valida que anticipo ≤ price (422) |
| `availability.ts` | `GET /availability/slots` — intersecta horario colaborador ∩ negocio, filtra slots pasados si es hoy |
| `notifications.ts` | `GET /notifications` |
| `analytics.ts` | `GET /analytics?period=` — soporta: `this_week`, `last_week`, `this_month`, `this_year` |
| `settings.ts` | `GET /settings`, `PATCH /settings/business`, `PATCH /settings/agenda` |
| `settings.ts` | `POST /settings/logo` — sube imagen a Supabase Storage, guarda URL en business.logoUrl |

### Lógica de períodos en Analytics

| Período | Rango | Gráfico |
|---|---|---|
| `this_week` | Dom–Sáb de la semana actual | 7 barras diarias |
| `last_week` | Dom–Sáb de la semana anterior | 7 barras diarias |
| `this_month` | 4 semanas dom–sáb que incluyen hoy | 4 barras semanales |
| `this_year` | 1 ene – hoy | Barras por mes |

### Utilidades del backend
```
src/lib/
  prisma.ts      Cliente Prisma singleton
  mailer.ts      Nodemailer — sendVerificationEmail() con fallback a console.log en dev
```

### Middleware
- `auth.ts` — `requireAuth`: verifica JWT desde cookie `gm_token` o header `Authorization`, expone `c.get("user")`
- CORS: `credentials: true`, origin desde env `FRONTEND_URL`

---

## 5. Schema Prisma (estado actual)

```prisma
enum AppointmentStatus {
  PENDING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
  RESCHEDULED
}

model Business {
  id                String   @id @default(cuid())
  name              String   @default("")
  type              String   @default("")
  ruc               String?
  logoUrl           String?  ← URL pública de Supabase Storage (no base64)
  phone             String?
  address           String?
  timezone          String   @default("America/Mexico_City")
  slotMinutes       Int      @default(30)
  cancellationHours Int      @default(24)
  operatingDays     String[] @default(["Mon","Tue","Wed","Thu","Fri"])
  openTime          String   @default("09:00")
  closeTime         String   @default("18:00")
  trialEndsAt       DateTime?
}

model User {
  id                     String   @id @default(cuid())
  email                  String   @unique
  password               String
  name                   String
  lastName               String?
  dni                    String?
  role                   Role     @default(OWNER)
  emailVerified          Boolean  @default(false)
  emailVerificationToken String?  @unique
  businessId             String
}

model Appointment {
  ...
  price          Float       ← precio BASE del servicio (inmutable)
  tipPercent     Float       @default(0)   ← ratio 0–1
  paidAmount     Float?      ← precio base + propina (se llena al cobrar)
  depositAmount  Float?      ← anticipo registrado (≤ price)
  paymentMethod  String?
  status         AppointmentStatus @default(PENDING)
  ...
}
```

### Invariante clave de pagos
```
price       = precio del servicio (nunca cambia)
paidAmount  = price * (1 + tipPercent)   ← se guarda al completar el cobro
tipAmount   = paidAmount - price
depositAmount ≤ price                    ← validado en backend (422) y frontend
```

---

## 6. Variables de entorno

### Backend (`apps/api/.env`)
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://smpsncdzdvoanqxieicc.supabase.co
SUPABASE_SERVICE_KEY=sb_secret_...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
APP_URL=http://localhost:3000
TZ=America/Lima   ← OBLIGATORIO en producción
```

### Frontend (`apps/web/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 7. Convención de datos

```ts
// ✅ Siempre así
import { useClients, useSettings, useAnalytics } from "@/lib/api/hooks";
const { data: clients, isLoading } = useClients(search);
const { data: settings } = useSettings();
const { data: analytics } = useAnalytics("this_week");

// Slots de disponibilidad — formato correcto del backend
const { data: slotsData } = useAvailabilitySlots(collaboratorId, serviceId, date);
const slots = slotsData?.slots ?? []; // string[], NO Slot[]

// ❌ Nunca más así
const token = localStorage.getItem("gm_token"); // ← token ya no existe en localStorage
const res = await fetch(`${API_URL}/clients`, { headers: { Authorization: `Bearer ${token}` } });

// ✅ Para fetch directo (fuera de hooks)
const res = await fetch(`${API_URL}/ruta`, { credentials: "include" });
```

---

## 8. Pantallas — Estado Final

| ID | Pantalla | Estado |
|---|---|---|
| AUTH-00 | Registro | ✅ |
| AUTH-01 | Login | ✅ |
| AUTH-02 | Recuperar contraseña | ✅ |
| AUTH-03 | Resetear contraseña | ✅ |
| AUTH-04 | Verifica tu correo | ✅ |
| AUTH-05 | Verificar email (token) | ✅ |
| SETUP-01 | Onboarding wizard 4 pasos | ✅ |
| DASH-01 | Dashboard con card de bienvenida + KPIs | ✅ |
| CAL-01 | Calendario Día/Semana/Mes | ✅ |
| CAL-02 | Detalle de cita | ✅ |
| CAL-03 | Nueva cita con slots reales | ✅ |
| CAL-04 | Cierre de cita / pago con anticipo | ✅ |
| CLI-01 | Directorio de clientes | ✅ |
| CLI-02 | Perfil cliente | ✅ |
| STAFF-01 | Lista colaboradores | ✅ |
| STAFF-02 | Perfil colaborador | ✅ |
| SRV-01 | Catálogo de servicios | ✅ |
| SRV-02 | Formulario nuevo/editar servicio | ✅ |
| RPT-01 | Reportes con desglose servicios/propinas y tabla de colaboradores | ✅ |
| CFG-01 | Datos del negocio + logo en Supabase Storage | ✅ |
| CFG-02 | Agenda y políticas | ✅ |
| CFG-03 | Gestión de usuarios del sistema | ✅ |
| CFG-04 | Notificaciones WhatsApp (UI) | ✅ |
| SYS-01 | Notificaciones in-app | ✅ |
| SYS-02 | 404 | ✅ |
| SYS-03 | Error general | ✅ |

**Total: 26/26 (100%)**

---

## 9. Bugs Pendientes

| ID | Descripción | Severidad | Módulo | Estado |
|---|---|---|---|---|
| BUG-01 | Anticipo sin validación | Media | Citas | ✅ Resuelto |
| BUG-02 | KPIs hardcodeados | Media | Reportes | ✅ Resuelto |
| BUG-03 | Logo en base64 en BD | Baja | Configuración | ✅ Resuelto — Supabase Storage |
| BUG-04 | Protección de rutas solo client-side | Media | Seguridad | ✅ Resuelto — middleware.ts |
| BUG-05 | JWT en localStorage (XSS) | Media | Seguridad | ✅ Resuelto — httpOnly cookie |

**Sin bugs pendientes conocidos.**

---

## 10. Deuda Técnica Pendiente

### Media prioridad
| Item | Descripción |
|---|---|
| `IN_PROGRESS` / `RESCHEDULED` | Estados implementados en schema y UI ✅ |
| WhatsApp real | CFG-04 tiene la UI pero sin integración Twilio/Meta ni cron job |

### Baja prioridad
| Item | Descripción |
|---|---|
| Drag & drop en calendario | Evaluar migrar a FullCalendar |
| `payments` tabla separada | El pago está inline en `Appointment` |
| `staff_services` N:M | Especialidades como `String[]` en lugar de tabla puente |
| Responsividad móvil | Diseño optimizado para desktop únicamente |
| `audit_log` | Tabla de trazabilidad de acciones críticas |

---

## 11. PRs

| PR | Título | Estado |
|---|---|---|
| #23 | feat(cita-detail): modal centrado, Cobrar/Completar, anticipo | ✅ Mergeado |
| #24 | feat(data): integrar TanStack Query v5 | ✅ Mergeado |
| #25 | feat(data): completar migración TanStack Query | ✅ Mergeado |
| #26 | feat: comparativos reales, BUG-01, paidAmount, reportes completos | ✅ Mergeado |
| #27 | feat: verificación de email, reportes completos y correcciones BUG-01/02 | ✅ Mergeado |
| #28 | feat(BUG-03): migrar logo a Supabase Storage | ✅ Mergeado |
| #29 | feat: estados IN_PROGRESS y RESCHEDULED en citas | ✅ Mergeado |
| #30 | feat(security): migrar JWT a httpOnly cookie + protección de rutas | ✅ Mergeado |

---

## 12. Próximos Pasos Sugeridos

1. **Deploy a producción** — Frontend en Vercel, Backend en Railway, BD en Supabase PostgreSQL
2. **WhatsApp real** — integración Twilio o Meta Cloud API + cron job de recordatorios
3. **Drag & drop en calendario** — evaluar FullCalendar
4. **`payments` tabla separada** — mejor trazabilidad financiera
5. **Responsividad móvil** — actualmente solo desktop

---

## 13. Nota importante para producción

Al desplegar en Railway, agregar la variable de entorno:
```
TZ=America/Lima
```
El backend usa `getHours()` (hora local del proceso) para validar horarios de citas y slots de disponibilidad. Sin esta variable, los cálculos serán incorrectos en servidores con TZ diferente.

Además configurar `FRONTEND_URL` con la URL real de Vercel para que CORS y las cookies funcionen correctamente en producción.
