# Estado del Proyecto — GlowManager
**Fecha:** 5 de Junio 2026  
**Versión:** 3.0  
**Repositorio:** https://github.com/rvsoslim020295/GeneradorCitas  
**Rama activa:** `feat/tanstack-query` (PR #26, pendiente de merge)

---

## 1. Resumen Ejecutivo

GlowManager es un panel administrativo B2B para negocios de belleza (salones, barberías, spas, nail bars). Permite gestionar citas, clientes, colaboradores, servicios, pagos y reportes desde una interfaz web orientada a dueños y recepcionistas en desktop.

**Estado actual:** MVP 100% funcional. Esta sesión (v3.0) resolvió los bugs de alta y media prioridad: comparativos reales en KPIs, validación de anticipo, separación correcta de precio base vs monto cobrado, y una refactorización completa del módulo de reportes con desglose de ingresos por servicios y propinas.

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
| Autenticación | JWT — expira en 7 días |
| Email | Nodemailer (SMTP Gmail) |
| Runtime | Node.js (tsx watch) |

### Infraestructura
| Capa | Servicio |
|---|---|
| Frontend | Vercel (planificado) |
| Backend | Railway (planificado) |
| Base de datos | Supabase PostgreSQL (planificado) |
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
  configuracion/negocio/    CFG-01 — Datos del negocio
  configuracion/agenda/     CFG-02 — Días, horario apertura/cierre, cancelación
  configuracion/usuarios/   CFG-03
  configuracion/whatsapp/   CFG-04
```

### Componentes globales
```
src/components/layout/
  sidebar.tsx          Navegación lateral — filtro por rol
  top-bar.tsx          TopBar con prop hideSearch para páginas con buscador propio
  global-search.tsx    Buscador global con debounce 300ms
  query-provider.tsx   QueryClientProvider + ReactQuery DevTools

src/lib/api/
  client.ts            apiFetch — centraliza auth header y redirección 401

src/lib/api/hooks/
  index.ts             Barrel de exports
  use-clients.ts
  use-collaborators.ts
  use-services.ts
  use-appointments.ts  → tipo Appointment incluye paidAmount
  use-analytics.ts     → tipos CollaboratorStat, AnalyticsData con chartType
  use-notifications.ts
  use-settings.ts      → incluye openTime, closeTime en el tipo Settings
  use-availability.ts  → retorna SlotsResponse { slots: string[], slotDuration: number }

src/lib/hooks/
  use-debounce.ts

src/hooks/
  use-role.ts          Lee rol del usuario desde localStorage
```

---

## 4. Arquitectura del Backend

### Endpoints (`apps/api/src/routes/`)

| Archivo | Rutas |
|---|---|
| `auth.ts` | `POST /auth/register` — crea negocio + usuario, genera token de verificación, envía email |
| `auth.ts` | `GET /auth/verify-email?token=` — verifica cuenta, retorna JWT |
| `auth.ts` | `POST /auth/login` — bloquea si `emailVerified = false` (403) |
| `auth.ts` | `GET /auth/me` — incluye `logoUrl` del negocio |
| `clients.ts` | CRUD `/clients` |
| `collaborators.ts` | CRUD `/collaborators` + ausencias. Al crear → guarda schedule default Lun–Vie 09:00–18:00 |
| `services.ts` | CRUD `/services` |
| `appointments.ts` | CRUD `/appointments` — valida horario negocio (422), valida conflicto de cliente (409) |
| `appointments.ts` | `PATCH /appointments/:id/status` |
| `appointments.ts` | `POST /appointments/:id/payment` — guarda `paidAmount`, no modifica `price` |
| `appointments.ts` | `POST /appointments/:id/deposit` — valida que anticipo ≤ price (422) |
| `availability.ts` | `GET /availability/slots` — intersecta horario colaborador ∩ negocio, filtra slots pasados si es hoy |
| `notifications.ts` | `GET /notifications` |
| `analytics.ts` | `GET /analytics?period=` — soporta: `this_week`, `last_week`, `this_month`, `this_year` |
| `settings.ts` | `GET /settings`, `PATCH /settings/business`, `PATCH /settings/agenda` |

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
- `auth.ts` — `requireAuth`: verifica JWT, expone `c.get("user")` con `{ userId, email, businessId, role }`

---

## 5. Schema Prisma (estado actual)

```prisma
model Business {
  id                String   @id @default(cuid())
  name              String   @default("")
  type              String   @default("")
  ruc               String?
  logoUrl           String?
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

## 6. Lo implementado en esta sesión (v3.0)

### 6.1 Comparativos reales en KPIs (BUG-02 ✅)
- Backend calcula un período previo equivalente por tipo: semana anterior, 4 semanas antes, mes calendario anterior, mismo YTD año anterior
- Respuesta incluye `totalAppointmentsPrev`, `completedAppointmentsPrev`, `totalRevenuePrev`, `tipRevenuePrev`, `noShowRatePrev`
- Componente `KpiDelta` en `/reportes`: muestra `+X% vs período ant.` en verde o rojo según tendencia. "Sin datos anteriores" si prev=0

### 6.2 Fix de disponibilidad y slots
- `use-availability` corregido: tipaba `Slot[]` pero el backend retorna `{ slots: string[], slotDuration: number }`
- Slots de horas pasadas filtrados cuando la fecha es hoy (`nowMinutes` en el backend)
- Bug de zona horaria corregido: `getUTCHours()` → `getHours()` en validación de horario de citas y rangos ocupados en availability

### 6.3 Schedule default en colaboradores nuevos
- `POST /collaborators`: si no viene `schedule` en el body, el backend persiste Lun–Vie 09:00–18:00 automáticamente
- Evita el estado `schedule = null` que bloqueaba la disponibilidad de colaboradores recién creados

### 6.4 Separación price / paidAmount (BUG en datos ✅)
- Nuevo campo `paidAmount Float?` en Appointment (via `db push`)
- `POST /appointments/:id/payment` ya no sobreescribe `price`; guarda `paidAmount: price * (1 + tipPercent)`
- Datos existentes en BD normalizados: `price` revertido a precio base, `paidAmount` al total real
- Analytics usa `price` para `serviceRevenue` y `paidAmount - price` para `tipRevenue`

### 6.5 Validación de anticipo (BUG-01 ✅)
- Backend: `POST /:id/deposit` retorna 422 si `depositAmount > price`
- Frontend: validación en `handleSaveDeposit` antes de llamar al hook
- UX: input en modo "monto fijo" muestra borde rojo y error inline en tiempo real; botón "Guardar Anticipo" deshabilitado si el monto es inválido

### 6.6 Módulo de Reportes — refactorización completa
**Ingresos desglosados en 3 cards:**
- `POR SERVICIOS` — precio base de citas completadas
- `PROPINAS` — monto de propinas con delta vs período anterior
- `TOTAL` — suma con delta vs período anterior

**Top 3 Colaboradores:**
- Ordenado por `serviceRevenue` (precio base, sin propina)
- Muestra precio base + propina en verde separados
- % calculado sobre ingresos de servicios, no sobre total

**Tabla "Todos los Colaboradores":**
- Columnas: Nombre | Citas | Servicios | Propinas | Total
- Fila de totales al pie que cuadra con los KPIs globales

**Períodos:**
- `Esta Semana` (default): Dom–Sáb actual, 7 barras diarias
- `Semana Pasada`: Dom–Sáb anterior, 7 barras diarias
- `Este Mes (4 semanas)`: 4 semanas dom–sáb que incluyen hoy, 4 barras semanales — título "Ingresos por Semana"
- `Este Año`: barras mensuales (sin cambios)
- Eliminado `Últimos 30 días` (redundante)
- Título del gráfico dinámico según `chartType` devuelto por el backend

### 6.7 UX — TopBar sin buscador duplicado
- `TopBar` recibe prop `hideSearch` (boolean)
- Páginas Clientes, Colaboradores y Servicios usan `<TopBar hideSearch />` para no mostrar el buscador global (ya tienen buscador propio en la página)

### 6.8 Fix console error AppointmentCard
- Conflicto entre propiedades CSS shorthand `border` + `borderLeft` + `borderLeftWidth` resuelto usando propiedades individuales (`borderTopWidth`, `borderRightWidth`, etc.)

---

## 7. Pantallas — Estado Final

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
| CFG-01 | Datos del negocio | ✅ |
| CFG-02 | Agenda y políticas | ✅ |
| CFG-03 | Gestión de usuarios del sistema | ✅ |
| CFG-04 | Notificaciones WhatsApp (UI) | ✅ |
| SYS-01 | Notificaciones in-app | ✅ |
| SYS-02 | 404 | ✅ |
| SYS-03 | Error general | ✅ |

**Total: 26/26 (100%)**

---

## 8. Convención de datos

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
const token = localStorage.getItem("gm_token");
const res = await fetch(`${API_URL}/clients`, { headers: { Authorization: `Bearer ${token}` } });
```

---

## 9. Bugs Pendientes

| ID | Descripción | Severidad | Módulo | Estado |
|---|---|---|---|---|
| BUG-01 | Anticipo sin validación | Media | Citas | ✅ Resuelto |
| BUG-02 | KPIs hardcodeados | Media | Reportes | ✅ Resuelto |
| BUG-03 | Logo en base64 en BD — límite de payload | Baja | Configuración | Pendiente |
| BUG-04 | Protección de rutas solo client-side | Media | Seguridad | Pendiente |
| BUG-05 | JWT en localStorage (XSS) | Media | Seguridad | Pendiente |

---

## 10. Deuda Técnica Pendiente

### Alta prioridad
| Item | Descripción |
|---|---|
| Protección de rutas server-side | Middleware Next.js + validación de rol en endpoints del backend |
| Migrar JWT a httpOnly cookie | Token en localStorage — menos seguro en producción |

### Media prioridad
| Item | Descripción |
|---|---|
| Almacenamiento de logo | Migrar de base64 en BD a servicio de storage (S3, Cloudinary, Supabase Storage) |
| `IN_PROGRESS` / `RESCHEDULED` | Estados adicionales no implementados en schema ni UI |

### Baja prioridad
| Item | Descripción |
|---|---|
| WhatsApp real | CFG-04 tiene la UI pero sin integración Twilio/Meta ni cron job |
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
| #26 | feat: comparativos reales, BUG-01, paidAmount, reportes completos | 🔄 Pendiente de merge |

---

## 12. Próximos Pasos Sugeridos

1. **Merge PR #26** — incluye todos los cambios de esta sesión
2. **BUG-04 — Protección de rutas server-side** — middleware Next.js + validación de rol por endpoint en backend
3. **BUG-05 — Migrar JWT a httpOnly cookie** — más invasivo, toca todo el flujo de auth
4. **BUG-03 — Migrar logo a storage externo** — requiere cuenta en Cloudinary o Supabase Storage
5. **Estados `IN_PROGRESS` / `RESCHEDULED`** — agregar al schema y a la UI de detalle de cita

---

## 13. Nota importante para producción

Al desplegar en Railway, agregar la variable de entorno:
```
TZ=America/Lima
```
El backend usa `getHours()` (hora local del proceso) para validar horarios de citas y slots de disponibilidad. Sin esta variable, los cálculos serán incorrectos en servidores con TZ diferente.
