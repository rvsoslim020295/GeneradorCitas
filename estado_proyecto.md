# Estado del Proyecto — GlowManager
**Fecha:** 5 de Junio 2026  
**Versión:** 2.0  
**Repositorio:** https://github.com/rvsoslim020295/GeneradorCitas  
**Rama activa:** `feat/tanstack-query` (PR #25, pendiente de merge)

---

## 1. Resumen Ejecutivo

GlowManager es un panel administrativo B2B para negocios de belleza (salones, barberías, spas, nail bars). Permite gestionar citas, clientes, colaboradores, servicios, pagos y reportes desde una interfaz web orientada a dueños y recepcionistas en desktop.

**Estado actual:** MVP 100% funcional. Esta sesión completó el flujo de registro y verificación de correo, la gestión de identidad del negocio (logo, RUC, teléfono), la configuración de horario de atención con validación end-to-end, y la documentación completa de historias de usuario con escenarios de comportamiento.

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
  clientes/                 CLI-01 — Directorio
  clientes/[id]/            CLI-02 — Perfil + historial + edición inline
  clientes/nuevo/
  colaboradores/            STAFF-01 — Lista
  colaboradores/[id]/       STAFF-02 — Perfil, horarios (con restricción de rango del negocio), avatar, ausencias
  colaboradores/nuevo/
  servicios/                SRV-01 — Catálogo
  servicios/[id]/           SRV-02 — Editar (bufferMinutes, color, isActive)
  servicios/nuevo/
  reportes/                 RPT-01 — Analytics con filtros reales por período
  configuracion/            CFG hub
  configuracion/negocio/    CFG-01 — Datos del negocio (nombre, RUC, teléfono, logo, localización)
  configuracion/agenda/     CFG-02 — Días, horario de apertura/cierre, cancelación
  configuracion/usuarios/   CFG-03
  configuracion/whatsapp/   CFG-04
```

### Componentes globales
```
src/components/layout/
  sidebar.tsx          Navegación lateral — filtro por rol
  top-bar.tsx          Búsqueda + campana de notificaciones
  global-search.tsx    Buscador con debounce 300ms
  query-provider.tsx   QueryClientProvider + ReactQuery DevTools

src/lib/api/
  client.ts            apiFetch — centraliza auth header y redirección 401

src/lib/api/hooks/
  index.ts             Barrel de exports
  use-clients.ts
  use-collaborators.ts
  use-services.ts
  use-appointments.ts
  use-analytics.ts
  use-notifications.ts
  use-settings.ts      → incluye openTime, closeTime en el tipo Settings
  use-availability.ts

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
| `collaborators.ts` | CRUD `/collaborators` + ausencias |
| `services.ts` | CRUD `/services` |
| `appointments.ts` | CRUD `/appointments` — valida horario del negocio (422) |
| `appointments.ts` | `PATCH /appointments/:id/status` |
| `appointments.ts` | `POST /appointments/:id/payment` |
| `appointments.ts` | `POST /appointments/:id/deposit` |
| `availability.ts` | `GET /availability/slots` — intersecta horario colaborador ∩ negocio |
| `notifications.ts` | `GET /notifications` |
| `analytics.ts` | `GET /analytics?period=` |
| `settings.ts` | `GET /settings`, `PATCH /settings/business` (acepta `ruc`, `phone`, `logoUrl`), `PATCH /settings/agenda` (acepta `openTime`, `closeTime`) |

### Utilidades del backend
```
src/lib/
  prisma.ts      Cliente Prisma singleton
  mailer.ts      Nodemailer — sendVerificationEmail() con fallback a console.log en dev
```

### Middleware
- `auth.ts` — `requireAuth`: verifica JWT, expone `c.get("user")` con `{ userId, email, businessId, role }`

### Email (Nodemailer)
- **Remitente:** `glowmanager95@gmail.com`
- **SMTP:** Gmail con App Password
- **Configuración:** variables `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` y `APP_URL` en `apps/api/.env`
- **Fallback dev:** si `SMTP_USER`/`SMTP_PASS` no están configurados, imprime el link en consola

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
  name                   String          ← firstName
  lastName               String?
  dni                    String?
  role                   Role     @default(OWNER)
  emailVerified          Boolean  @default(false)
  emailVerificationToken String?  @unique
  businessId             String
}
```

### Migraciones aplicadas (sesiones anteriores)
| Migración | Descripción |
|---|---|
| `20260605152210` | `depositAmount Float?` en Appointment |
| `20260605154104` | `lastName`, `documentType`, `documentNumber` en Collaborator |
| `20260605154508` | `phone String?` en Collaborator |

### Cambios de schema esta sesión (via `db push`)
| Campo | Modelo | Descripción |
|---|---|---|
| `lastName String?` | User | Apellidos del dueño, separado del nombre |
| `dni String?` | User | DNI del dueño registrado |
| `emailVerified Boolean` | User | Flag de verificación de correo |
| `emailVerificationToken String? @unique` | User | Token de verificación de un solo uso |
| `ruc String?` | Business | RUC fiscal del negocio |
| `logoUrl String?` | Business | Logo del negocio en base64 |
| `name String @default("")` | Business | Permite crear negocio sin nombre inicial |
| `type String @default("")` | Business | Permite crear negocio sin tipo inicial |
| `openTime String @default("09:00")` | Business | Hora de apertura del negocio |
| `closeTime String @default("18:00")` | Business | Hora de cierre del negocio |

---

## 6. Lo implementado en esta sesión

### 6.1 Flujo de Registro y Verificación de Correo (nuevo)

**Página de Registro (`/registro`):**
- Separado en Nombres + Apellidos (campos independientes)
- Añadidos DNI (obligatorio, 8 dígitos), RUC (obligatorio, 11 dígitos) y Teléfono (obligatorio)
- Eliminados Nombre del negocio y Tipo de negocio (se piden en Onboarding Paso 1)
- Sin placeholders en ningún campo
- `autoComplete="off"` y `autoComplete="new-password"` para evitar datos del navegador
- Al registrarse → redirige a `/verificar-correo` en lugar del onboarding directo

**Páginas nuevas:**
- `/verificar-correo` — pantalla de espera con el email destino y consejo de revisar spam
- `/verificar-email?token=` — procesa el token, guarda JWT en localStorage y redirige al onboarding

**Backend (`POST /auth/register`):**
- Ya no requiere `businessName` ni `businessType`
- Crea Business con `name: ""` y `type: ""` (se completan en el onboarding)
- Guarda `ruc` y `phone` en Business desde el registro
- Genera `emailVerificationToken` de 64 chars hexadecimales
- Envía email de verificación con nodemailer

**Backend (`GET /auth/verify-email`):**
- Busca usuario por token, marca `emailVerified = true`, limpia el token
- Retorna JWT para que el frontend continúe al onboarding sin requerir login

**Backend (`POST /auth/login`):**
- Retorna 403 con mensaje específico si `emailVerified = false`

**Email con Nodemailer:**
- Instalado `nodemailer` y `@types/nodemailer` en `apps/api`
- Creado `src/lib/mailer.ts` con `sendVerificationEmail()`
- Configurado con App Password de Gmail (`glowmanager95@gmail.com`)
- En dev sin SMTP: imprime el link de verificación en la consola del servidor

### 6.2 Correcciones de UI — Autofill del Navegador

- `autoComplete="off"` en formularios de registro y login
- `autoComplete="new-password"` en contraseñas y `autoComplete="new-email"` en emails
- CSS global corregido para `-webkit-autofill`: usa colores hex directos (`#ffffff` / `#0c0e10`) en vez de variables CSS (que no funcionan dentro del pseudo-elemento `:-webkit-autofill`)
- Eliminados `defaultValue="ana@glowmanager.com"` y `defaultValue="password123"` hardcodeados en el login

### 6.3 Onboarding

- **Paso 1 (Perfil del salón):** sin cambios — ya pedía nombre y tipo de negocio
- **Paso 2 (Horario):** eliminada la sección "Duración de citas" (depende del servicio, no del negocio); solo quedan los días de operación
- **Paso 3 (Primer servicio):** corregido bug crítico — `durationMinutes` → `durationMin` y añadido `category: "General"` (sin esto el servicio no se guardaba silenciosamente)

### 6.4 Dashboard — Card de Bienvenida del Negocio

Nueva card en la parte superior del dashboard que muestra:
- Logo del negocio (imagen si está configurada, iniciales si no)
- Tipo de negocio como etiqueta
- Nombre del negocio en grande
- Saludo personalizado con el nombre del usuario
- Fecha del día

Al guardar cambios en Configuración → Datos del Negocio, se invalidan los queries `["settings"]` y `["me"]` para que el dashboard se actualice automáticamente.

### 6.5 Logo del Negocio

- Nuevo campo `logoUrl String?` en Business (almacenado como base64)
- Backend: `PATCH /settings/business` acepta `logoUrl`
- Backend: `GET /auth/me` retorna `logoUrl` en el objeto `business`
- Frontend: la página de configuración carga el logo guardado al entrar y lo incluye al guardar
- Frontend: el dashboard muestra la imagen si existe, o las iniciales si no

### 6.6 RUC y Teléfono en Configuración del Negocio

- Añadido campo `ruc` al tipo `Business` en la página de configuración
- El RUC y el teléfono se precargan automáticamente con los datos guardados durante el registro
- RUC y Teléfono se muestran en la misma fila (grid 2 columnas)
- El campo RUC solo acepta dígitos y tiene máximo 11 caracteres

### 6.7 Configuración de Horario de Atención (CFG-02)

Nueva sección en Configuración → Agenda y Políticas:
- Selectores de Hora de apertura y Hora de cierre en intervalos de 30 min (formato 12h AM/PM)
- El selector de cierre filtra automáticamente para mostrar solo horas posteriores a la apertura
- Resumen visual: "Tu negocio atiende de 9:00 AM a 6:00 PM · 9h"
- Validación: error si se intenta guardar con apertura >= cierre
- Página migrada de fetch manual a TanStack Query (`useQuery` + `useMutation`)
- Botón "Guardar" en el header y al pie de la página

### 6.8 Validación de Horario en Citas

**Disponibilidad (`GET /availability/slots`):**
- Los slots se calculan como la intersección del horario del colaborador y el horario del negocio:
  - `effectiveStart = max(collaborator.start, business.openTime)`
  - `effectiveEnd = min(collaborator.end, business.closeTime)`
- Colaboradores que trabajen fuera del horario del negocio solo ofrecen slots dentro del rango del local

**Creación de cita (`POST /appointments`):**
- Valida que `startTime` y `endTime` estén dentro de `openTime`–`closeTime` del negocio
- Si la cita cae fuera del rango → retorna error 422 con mensaje: *"La cita debe estar dentro del horario de atención: HH:MM – HH:MM"*

### 6.9 Horario de Colaboradores con Restricción del Negocio

- Hook `useSettings()` actualizado para incluir `openTime` y `closeTime` en el tipo `Settings`
- La página de perfil del colaborador carga el horario del negocio con `useSettings()`
- Badge de referencia: "Rango del local: 09:00 – 18:00" junto al título del horario laboral
- Inputs de tiempo con atributos `min={bizOpen}` y `max={bizClose}`
- Función `updateDay()` con auto-corrección:
  - Al activar un día: si el horario guardado está fuera del rango, se ajusta automáticamente
  - Al cambiar hora de inicio: se clampea al rango válido y se corrige la hora de fin si es necesario
  - Al cambiar hora de fin: se clampea al cierre del negocio si excede el límite

### 6.10 Documentación — Historias de Usuario

Creado el archivo `hu_generador_citas.md` con:
- **38 Historias de Usuario** organizadas en 10 módulos
- Formato estándar: Como / Quiero / Para + Criterios de aceptación + Prioridad + Estado
- **~95 Escenarios de comportamiento** con formato Dado que / El sistema / Resultado
- Cubre caminos felices, casos de error, validaciones y edge cases
- Tabla de deuda técnica relacionada por HU

---

## 7. Pantallas — Estado Final

| ID | Pantalla | Estado |
|---|---|---|
| AUTH-00 | Registro (nombres, apellidos, DNI, RUC, teléfono, email, contraseña) | ✅ |
| AUTH-01 | Login (sin datos hardcodeados, maneja 403 de email no verificado) | ✅ |
| AUTH-02 | Recuperar contraseña | ✅ |
| AUTH-03 | Resetear contraseña | ✅ |
| AUTH-04 | Verifica tu correo (pantalla de espera post-registro) | ✅ Nuevo |
| AUTH-05 | Verificar email (procesa token, redirige al onboarding) | ✅ Nuevo |
| SETUP-01 | Onboarding wizard 4 pasos (paso 2 sin duración de citas) | ✅ |
| DASH-01 | Dashboard con card de bienvenida del negocio + KPIs | ✅ |
| CAL-01 | Calendario Día/Semana/Mes | ✅ |
| CAL-02 | Detalle de cita (modal centrado) | ✅ |
| CAL-03 | Nueva cita con slots reales (respeta horario del negocio) | ✅ |
| CAL-04 | Cierre de cita / pago con anticipo | ✅ |
| CLI-01 | Directorio de clientes | ✅ |
| CLI-02 | Perfil cliente | ✅ |
| STAFF-01 | Lista colaboradores | ✅ |
| STAFF-02 | Perfil colaborador (horario restringido al rango del negocio) | ✅ |
| SRV-01 | Catálogo de servicios | ✅ |
| SRV-02 | Formulario nuevo/editar servicio | ✅ |
| RPT-01 | Analytics con filtros por período | ✅ |
| CFG-01 | Datos del negocio (RUC, teléfono, logo precargados) | ✅ |
| CFG-02 | Agenda y políticas (días + horario apertura/cierre + cancelación) | ✅ |
| CFG-03 | Gestión de usuarios del sistema | ✅ |
| CFG-04 | Notificaciones WhatsApp (UI) | ✅ |
| SYS-01 | Notificaciones in-app con estado de lectura | ✅ |
| SYS-02 | 404 | ✅ |
| SYS-03 | Error general | ✅ |

**Total: 26/26 (100%)**

---

## 8. Flujo de Registro (nuevo — esta sesión)

```
/registro
  ↓ POST /auth/register (name, lastName, dni, ruc, phone, email, password)
  ↓ Crea Business (ruc, phone) + User (emailVerified: false, token generado)
  ↓ Envía email desde glowmanager95@gmail.com con link de verificación
  ↓
/verificar-correo?email=xxx
  ↓ (usuario hace clic en el link del correo)
  ↓
/verificar-email?token=xxx
  ↓ GET /auth/verify-email?token=xxx
  ↓ emailVerified = true, token limpiado, JWT retornado
  ↓ localStorage: gm_token + gm_user
  ↓
/onboarding (Paso 1: nombre y tipo del negocio)
  → Paso 2: días de operación
  → Paso 3: primer servicio
  → Paso 4: ¡Listo!
  ↓
/dashboard
```

---

## 9. Convención de datos — resumen rápido

```ts
// ✅ Siempre así
import { useClients, useSettings } from "@/lib/api/hooks";
const { data: clients, isLoading } = useClients(search);
const { data: settings } = useSettings(); // incluye openTime y closeTime

// ❌ Nunca más así
const token = localStorage.getItem("gm_token");
const res = await fetch(`${API_URL}/clients`, { headers: { Authorization: `Bearer ${token}` } });
```

---

## 10. Bugs Pendientes

| ID | Descripción | Severidad | Módulo | Estado |
|---|---|---|---|---|
| BUG-01 | Anticipo sin validación: se puede registrar un anticipo mayor al precio del servicio | Media | Citas | ✅ Resuelto |
| BUG-02 | Comparativos de KPIs hardcodeados: "+12% vs mes ant." en Total Citas, Completadas e Ingresos son estáticos | Media | Dashboard/Reportes | ✅ Resuelto |
| BUG-03 | El logo se almacena como base64 en la BD — imágenes grandes pueden superar límites de payload | Baja | Configuración | Pendiente |
| BUG-04 | La protección de rutas es solo client-side: el backend no valida el rol por endpoint | Media | Seguridad | Pendiente |
| BUG-05 | El JWT se almacena en localStorage (vulnerable a XSS) en lugar de httpOnly cookie | Media | Seguridad | Pendiente |

---

## 11. Deuda Técnica Pendiente

### Alta prioridad
| Item | Descripción |
|---|---|
| Protección de rutas server-side | Middleware Next.js + validación de rol en endpoints del backend |
| Migrar JWT a httpOnly cookie | Token en localStorage — menos seguro en producción |

### Media prioridad
| Item | Descripción |
|---|---|
| ~~Comparativos reales en KPIs~~ | ✅ Resuelto — deltas reales para totalAppointments, completedAppointments, totalRevenue, noShowRate |
| ~~Validación de anticipo~~ | ✅ Resuelto — 422 en backend + error inline + botón deshabilitado en frontend |
| Separación price / paidAmount | ✅ Resuelto — `price` es el precio base inmutable; `paidAmount` registra el total cobrado con propina |
| Almacenamiento de logo | Migrar de base64 en BD a servicio de storage (S3, Cloudinary, Supabase Storage) |
| `IN_PROGRESS` / `RESCHEDULED` | Estados no implementados en schema ni UI |

### Baja prioridad
| Item | Descripción |
|---|---|
| WhatsApp real | CFG-04 tiene la UI pero sin integración Twilio/Meta ni cron job (BullMQ + Redis) |
| Drag & drop en calendario | Evaluar migrar a FullCalendar |
| `payments` tabla separada | El pago está inline en `Appointment` |
| `staff_services` N:M | Las especialidades son `String[]` en lugar de tabla puente con precio/duración personalizada |
| Responsividad móvil | Diseño optimizado para desktop únicamente |
| `audit_log` | Tabla de trazabilidad de acciones críticas |
| `source` en Appointment | Campo de origen (MANUAL/WHATSAPP/PHONE) no implementado |

---

## 12. PRs Completados en Sesiones Anteriores

| PR | Título | Estado |
|---|---|---|
| #23 | feat(cita-detail): modal centrado, separar Cobrar/Completar, anticipo y botones funcionales | ✅ Mergeado |
| #24 | feat(data): integrar TanStack Query v5 | ✅ Mergeado |
| #25 | feat(data): completar migración TanStack Query — todas las páginas | 🔄 Pendiente de merge |

---

## 13. Próximos Pasos Sugeridos

1. **Merge PR #25** — completar la migración TanStack Query
2. **Comparativos reales en KPIs** — extender deltas a ingresos y citas completadas
3. **Validar anticipo en frontend + backend** — no puede superar el precio del servicio
4. **Migrar logo a servicio de storage** — reemplazar base64 por URL externa
5. **Protección de rutas server-side** — middleware Next.js + validación de rol por endpoint
6. **Migrar JWT a httpOnly cookie** — más seguro para producción
7. **Integración WhatsApp** — cron job con BullMQ + Twilio o Meta Cloud API

---

## 14. Documentación Generada Esta Sesión

| Archivo | Descripción |
|---|---|
| `hu_generador_citas.md` | 38 historias de usuario con criterios de aceptación y ~95 escenarios de comportamiento (Dado que / El sistema / Resultado) |
| `estado_proyecto.md` | Este archivo — resumen ejecutivo, arquitectura y estado del proyecto |
| `apps/web/CLAUDE.md` | Convenciones de TanStack Query para el equipo y Claude |
