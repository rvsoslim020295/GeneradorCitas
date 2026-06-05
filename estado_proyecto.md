# Estado del Proyecto — GlowManager
**Fecha:** 5 de Junio 2026  
**Versión:** 1.5  
**Repositorio:** https://github.com/rvsoslim020295/GeneradorCitas  
**Rama activa:** `feat/tanstack-query` (PR #25, pendiente de merge)

---

## 1. Resumen Ejecutivo

GlowManager es un panel administrativo B2B para negocios de belleza (salones, barberías, spas, nail bars). Permite gestionar citas, clientes, colaboradores, servicios, pagos y reportes desde una sola interfaz web orientada a dueños y recepcionistas en desktop.

**Estado actual:** MVP 100% funcional. Esta sesión completó la integración de TanStack Query v5 en la totalidad del frontend — ya no existe ningún `fetch` manual ni acceso directo a `localStorage.getItem("gm_token")` en páginas o componentes. Todo el acceso a datos pasa por hooks centralizados con caché automático.

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
| **Data fetching** | **TanStack Query** | **v5** |

### Backend (`apps/api`)
| Capa | Tecnología |
|---|---|
| Framework | Hono.js |
| ORM | Prisma 7.8 |
| Base de datos | PostgreSQL |
| Autenticación | JWT — expira en 7 días |
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
  recuperar-contrasena/     AUTH-02 — Recuperar contraseña
  resetear-contrasena/      AUTH-03 — Resetear contraseña

(onboarding)/
  onboarding/               SETUP-01 — Wizard 4 pasos

(agenda)/
  agenda/                   CAL-01 — Calendario Día/Semana/Mes
  nueva-cita/               CAL-03 — Nueva cita con slots reales
  citas/[id]/               CAL-02 — Detalle de cita (modal centrado)
  citas/[id]/cobrar/        CAL-04 — Cierre y pago con anticipo descontado

(dashboard)/
  dashboard/                DASH-01 — KPIs y alertas
  clientes/                 CLI-01 — Directorio
  clientes/[id]/            CLI-02 — Perfil + historial + edición inline
  clientes/nuevo/
  colaboradores/            STAFF-01 — Lista
  colaboradores/[id]/       STAFF-02 — Perfil, horarios, avatar, ausencias, DNI/CE, teléfono
  colaboradores/nuevo/
  servicios/                SRV-01 — Catálogo
  servicios/[id]/           SRV-02 — Editar (bufferMinutes, color, isActive)
  servicios/nuevo/
  reportes/                 RPT-01 — Analytics con filtros reales por período
  configuracion/            CFG hub
  configuracion/negocio/    CFG-01 — Nombre, categoría, teléfono, dirección, logo, localización
  configuracion/agenda/     CFG-02
  configuracion/usuarios/   CFG-03
  configuracion/whatsapp/   CFG-04
```

### Componentes globales
```
src/components/layout/
  sidebar.tsx          Navegación lateral — filtro por rol
  top-bar.tsx          Búsqueda + campana de notificaciones con estado de lectura
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
  use-settings.ts
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
| `auth.ts` | `POST /auth/login`, `POST /auth/register`, `GET /auth/me` |
| `clients.ts` | CRUD `/clients` — búsqueda con `?search=` |
| `collaborators.ts` | CRUD `/collaborators` — incluye `schedule`, `avatarUrl`, `lastName`, `documentType`, `documentNumber`, `phone` |
| `collaborators.ts` | `GET/POST/DELETE /collaborators/:id/absences` |
| `services.ts` | CRUD `/services` — incluye `bufferMinutes`, `color`, `isActive` |
| `appointments.ts` | CRUD `/appointments` — búsqueda, estados, pago |
| `appointments.ts` | `PATCH /appointments/:id/status` |
| `appointments.ts` | `POST /appointments/:id/payment` — registra pago completo |
| `appointments.ts` | `POST /appointments/:id/deposit` — registra anticipo parcial |
| `availability.ts` | `GET /availability/slots?collaboratorId&serviceId&date` |
| `notifications.ts` | `GET /notifications` — derivadas de citas |
| `analytics.ts` | `GET /analytics?period=` — KPIs filtrados por período |
| `settings.ts` | `GET /settings`, `PATCH /settings/business` |

### Middleware
- `auth.ts` — `requireAuth`: verifica JWT, expone `c.get("user")` con `{ userId, email, businessId, role }`

---

## 5. Schema Prisma (estado actual)

```prisma
model Business {
  id, name, type, phone, address, timezone
  slotMinutes Int @default(30)
  cancellationHours Int @default(24)
  operatingDays String[]
}

model User {
  id, email, password, name
  role Role (OWNER | COLLABORATOR | ADMIN)
  businessId
}

model Collaborator {
  id, name, lastName String?
  role, specialties String[]
  isActive Boolean
  avatarUrl String?
  schedule  Json?
  documentType   String?     ← DNI | CE
  documentNumber String?
  phone          String?
  businessId
}

model Service {
  id, name, description, category
  durationMin Int
  bufferMinutes Int @default(0)
  price Float
  color String @default("#3B82F6")
  isActive Boolean @default(true)
  businessId
}

model Appointment {
  id, startTime, endTime
  status (PENDING|CONFIRMED|COMPLETED|CANCELLED|NO_SHOW)
  price, notes, tipPercent, paymentMethod
  depositAmount Float?       ← anticipo parcial
  businessId, clientId, collaboratorId, serviceId
}

model Client {
  id, name, lastName, dni, phone, email, notes
  totalVisits Int, totalSpent Float
  businessId
}
```

### Migraciones aplicadas (sesiones anteriores)
| Migración | Descripción |
|---|---|
| `20260605152210` | `depositAmount Float?` en Appointment |
| `20260605154104` | `lastName`, `documentType`, `documentNumber` en Collaborator |
| `20260605154508` | `phone String?` en Collaborator |

---

## 6. Pantallas — estado final

| ID | Pantalla | Estado |
|---|---|---|
| AUTH-01 | Login | ✅ |
| AUTH-02 | Recuperar contraseña | ✅ |
| AUTH-03 | Resetear contraseña | ✅ |
| SETUP-01 | Onboarding wizard 4 pasos | ✅ |
| DASH-01 | Dashboard con KPIs y alertas | ✅ |
| CAL-01 | Calendario Día/Semana/Mes | ✅ |
| CAL-02 | Detalle de cita (modal centrado) | ✅ |
| CAL-03 | Nueva cita con slots reales | ✅ |
| CAL-04 | Cierre de cita / pago con anticipo | ✅ |
| CLI-01 | Directorio de clientes | ✅ |
| CLI-02 | Perfil cliente | ✅ |
| STAFF-01 | Lista colaboradores | ✅ |
| STAFF-02 | Perfil colaborador (horarios + avatar + ausencias + DNI/CE + teléfono) | ✅ |
| SRV-01 | Catálogo de servicios | ✅ |
| SRV-02 | Formulario nuevo/editar servicio | ✅ |
| RPT-01 | Analytics con filtros por período | ✅ |
| CFG-01 | Datos del negocio | ✅ |
| CFG-02 | Agenda y políticas | ✅ |
| CFG-03 | Gestión de usuarios del sistema | ✅ |
| CFG-04 | Notificaciones WhatsApp (UI) | ✅ |
| SYS-01 | Notificaciones in-app con estado de lectura | ✅ |
| SYS-02 | 404 | ✅ |
| SYS-03 | Error general | ✅ |

**Total: 23/23 (100%)**

---

## 7. Lo implementado en esta sesión (PRs #24 y #25)

### PR #24 — Infraestructura TanStack Query

**Archivos nuevos creados:**

- `src/components/query-provider.tsx` — `QueryClientProvider` con `staleTime: 60s` + `ReactQueryDevtools` en desarrollo
- `src/lib/api/client.ts` — `apiFetch`: centraliza el header `Authorization`, redirección automática al `/login` en 401, y `Content-Type: application/json`
- `src/lib/hooks/use-debounce.ts` — hook genérico de debounce (300ms en búsquedas)
- `src/lib/api/hooks/use-clients.ts` — `useClients`, `useClient`, `useCreateClient`, `useUpdateClient`, `useDeleteClient`
- `src/lib/api/hooks/use-collaborators.ts` — `useCollaborators`, `useCollaborator`, `useCollaboratorAbsences`, `useCreateCollaborator`, `useUpdateCollaborator`, `useDeleteCollaborator`, `useAddAbsence`, `useDeleteAbsence`
- `src/lib/api/hooks/use-services.ts` — `useServices`, `useService`, `useCreateService`, `useUpdateService`, `useDeleteService`
- `src/lib/api/hooks/use-appointments.ts` — `useAppointments`, `useAppointment`, `useCreateAppointment`, `useUpdateAppointmentStatus`, `useRegisterPayment`, `useRegisterDeposit`
- `src/lib/api/hooks/use-analytics.ts` — `useAnalytics(period)`
- `src/lib/api/hooks/use-notifications.ts` — `useNotifications()` con polling cada 60s
- `src/lib/api/hooks/use-settings.ts` — `useSettings`, `useUpdateSettings`
- `src/lib/api/hooks/use-availability.ts` — `useAvailabilitySlots(collaboratorId, serviceId, date)`
- `src/lib/api/hooks/index.ts` — barrel de exports

**Páginas migradas en PR #24:**
- `dashboard`, `clientes`, `colaboradores`, `servicios`, `reportes`

### PR #25 — Migración completa del resto del frontend

**Páginas migradas:**

| Página | Cambio principal |
|---|---|
| `agenda` | `useAppointments` + `useCollaborators` — eliminados 2 `useEffect` + `fetch` paralelos |
| `citas/[id]` | `useAppointment` + mutaciones; `updateStatus` y `handleSaveDeposit` → `useMutation` |
| `citas/[id]/cobrar` | `useAppointment` + `useRegisterPayment`; sin `useEffect` ni token manual |
| `nueva-cita/_components/new-appointment-modal` | 3 fetches paralelos → 3 hooks; slots → `useAvailabilitySlots`; submit → `useCreateAppointment` |
| `clientes/[id]` | `useQuery` + `useUpdateClient` + `useDeleteClient`; edición inline sin fetch manual |
| `clientes/nuevo` | `useCreateClient`; `setSaving` → `createClient.isPending` |
| `colaboradores/[id]` | `useCollaborator` + `useCollaboratorAbsences` + todas las mutaciones |
| `colaboradores/nuevo` | `useCreateCollaborator` |
| `servicios/[id]` | `useService` + `useCollaborators` + `useUpdateService` + `useDeleteService` |
| `servicios/nuevo` | `useCollaborators` + `useCreateService` |
| `configuracion/negocio` | `useQuery("/settings")` + `useMutation("/settings/business")`; edits quirúrgicos preservando PERU_GEO |

**CLAUDE.md creado** en `apps/web/` — instrucciones permanentes para Claude y el equipo:
- Prohibición explícita de `fetch` directo y `localStorage.getItem("gm_token")` en páginas
- Referencia a todos los hooks disponibles por dominio
- Patrón para crear mutaciones ad-hoc cuando no hay hook específico

### Beneficios conseguidos

| Antes | Después |
|---|---|
| ~15 copias de `localStorage.getItem("gm_token")` | 0 — solo en `apiFetch` |
| Re-fetch al navegar entre páginas | Caché de 60s — navegación instantánea |
| `loadData()` manual tras mutaciones | `invalidateQueries` automático |
| `useEffect` + `useState` + `fetch` en cada página | 1–3 líneas con hooks |
| Sin indicador de estado de mutación | `isPending` nativo de TanStack |

---

## 8. Flujo de trabajo

- **Una feature = un branch = un PR**
- Formato: `feat/nombre`, `fix/nombre`
- Mergear desde GitHub antes de iniciar nueva rama
- Después de cambios de schema: siempre ejecutar `prisma migrate dev` + `prisma generate` + reiniciar el API
- **Nuevas páginas deben usar los hooks de `src/lib/api/hooks/`** — ver `apps/web/CLAUDE.md`

---

## 9. Convención de datos — resumen rápido

```ts
// ✅ Siempre así
import { useClients, useCreateClient } from "@/lib/api/hooks";
const { data: clients, isLoading, error } = useClients(search);
const create = useCreateClient();
await create.mutateAsync({ name, phone });

// ❌ Nunca más así
const token = localStorage.getItem("gm_token");
const res = await fetch(`${API_URL}/clients`, { headers: { Authorization: `Bearer ${token}` } });
```

---

## 10. Deuda técnica pendiente

### Media prioridad
| Item | Descripción |
|---|---|
| FullCalendar | Calendario implementado desde cero. Sin drag & drop ni vista multi-recurso (columnas paralelas por colaborador) |
| `IN_PROGRESS` / `RESCHEDULED` | Estados no implementados en schema ni UI |
| `source` en Appointment | Campo de origen (MANUAL/WHATSAPP/PHONE/etc.) no está en el schema |
| `audit_log` | Tabla de trazabilidad de acciones críticas no implementada |

### Baja prioridad
| Item | Descripción |
|---|---|
| WhatsApp real | CFG-04 tiene la UI pero sin integración Twilio/Meta ni cron job (BullMQ + Redis) |
| `payments` tabla separada | El pago está inline en `Appointment` (tipPercent, paymentMethod, price, depositAmount) |
| `staff_services` N:M | Las especialidades son `String[]` en lugar de tabla puente con precio/duración personalizada |
| Responsividad móvil | Diseño optimizado para desktop únicamente |
| JWT en httpOnly cookie | Token en `localStorage` — menos seguro en producción |
| Protección de rutas server-side | Verificación de rol solo client-side; el backend no valida rol por endpoint |
| Comparativos hardcodeados en KPIs | "+12% vs mes ant." en Total Citas, Completadas e Ingresos son estáticos |

---

## 11. PRs completados en esta sesión

| PR | Título | Estado |
|---|---|---|
| #23 | feat(cita-detail): modal centrado, separar Cobrar/Completar, anticipo y botones funcionales | ✅ Mergeado |
| #24 | feat(data): integrar TanStack Query v5 | ✅ Mergeado |
| #25 | feat(data): completar migración TanStack Query — todas las páginas | 🔄 Pendiente de merge |

---

## 12. Próximos pasos sugeridos

1. **Merge PR #25** — completar la migración TanStack Query
2. **Comparativos reales en todos los KPIs** — extender el delta de `noShowRate` a `totalRevenue`, `completedAppointments` y `totalAppointments` en el backend y mostrarlos en Dashboard y Reportes
3. **Protección de rutas server-side** — middleware Next.js + validación de rol en endpoints del backend
4. **Integración WhatsApp** — cron job con BullMQ + Twilio o Meta Cloud API
5. **Drag & drop en calendario** — evaluar migrar a FullCalendar
6. **Migrar JWT a httpOnly cookie** — más seguro para producción
