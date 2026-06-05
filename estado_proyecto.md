# Estado del Proyecto — GlowManager
**Fecha:** Junio 2026  
**Versión:** 1.3  
**Repositorio:** https://github.com/rvsoslim020295/GeneradorCitas  
**Rama principal:** `main`

---

## 1. Resumen Ejecutivo

GlowManager es un panel administrativo B2B para negocios de belleza (salones, barberías, spas, nail bars). Permite gestionar citas, clientes, colaboradores, servicios, pagos y reportes desde una sola interfaz web orientada a dueños y recepcionistas en desktop.

**Estado actual:** ~98% del MVP completado. Todas las pantallas implementadas, schema de base de datos completo y sincronizado, flujo de nueva cita con disponibilidad real, bugs críticos de sesión resueltos.

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
  nueva-cita/               CAL-03 — Nueva cita con slots reales de disponibilidad
  citas/[id]/               CAL-02 — Detalle de cita
  citas/[id]/cobrar/        CAL-04 — Cierre y pago

(dashboard)/
  dashboard/                DASH-01 — KPIs y alertas
  clientes/                 CLI-01 — Directorio
  clientes/[id]/            CLI-02 — Perfil + historial + edición inline
  clientes/nuevo/
  colaboradores/            STAFF-01 — Lista
  colaboradores/[id]/       STAFF-02 — Perfil, horarios, avatar, ausencias
  colaboradores/nuevo/
  servicios/                SRV-01 — Catálogo
  servicios/[id]/           SRV-02 — Editar (bufferMinutes, color, isActive)
  servicios/nuevo/
  reportes/                 RPT-01 — Analytics (solo OWNER)
  configuracion/            CFG hub (solo OWNER)
  configuracion/negocio/    CFG-01
  configuracion/agenda/     CFG-02
  configuracion/usuarios/   CFG-03
  configuracion/whatsapp/   CFG-04
```

### Componentes globales
```
src/components/layout/
  sidebar.tsx          Navegación lateral — filtro por rol
  top-bar.tsx          Búsqueda global + campana de notificaciones reales
  global-search.tsx    Buscador (clientes, servicios, citas) con debounce 300ms

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
| `collaborators.ts` | CRUD `/collaborators` — incluye `schedule`, `avatarUrl` |
| `collaborators.ts` | `GET/POST/DELETE /collaborators/:id/absences` |
| `services.ts` | CRUD `/services` — incluye `bufferMinutes`, `color`, `isActive` |
| `appointments.ts` | CRUD `/appointments` — búsqueda, estados, pago |
| `availability.ts` | `GET /availability/slots?collaboratorId&serviceId&date` |
| `notifications.ts` | `GET /notifications` — derivadas de citas |
| `analytics.ts` | `GET /analytics` — KPIs del negocio |
| `settings.ts` | `GET/PATCH /settings` — configuración del negocio |

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
  id, name, role, specialties String[]
  isActive Boolean
  avatarUrl String?          ← agregado esta sesión
  schedule  Json?            ← agregado esta sesión (horario semanal Mon-Sun)
  businessId
}

model Service {
  id, name, description, category
  durationMin Int
  bufferMinutes Int @default(0)    ← agregado esta sesión
  price Float
  color String @default("#3B82F6") ← agregado esta sesión
  isActive Boolean @default(true)  ← agregado esta sesión
  businessId
}

model Appointment {
  id, startTime, endTime
  status (PENDING|CONFIRMED|COMPLETED|CANCELLED|NO_SHOW)
  price, notes, tipPercent, paymentMethod
  businessId, clientId, collaboratorId, serviceId
}

model Client {
  id, name, lastName, dni, phone, email, notes
  totalVisits Int, totalSpent Float
  businessId
}
```

### Migraciones aplicadas
| Migración | Descripción |
|---|---|
| `20260605142527` | `avatarUrl` en Collaborator |
| `20260605143343` | `bufferMinutes`, `color`, `isActive` en Service + `schedule` en Collaborator |

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
| CAL-02 | Detalle de cita | ✅ |
| CAL-03 | Nueva cita con slots reales | ✅ |
| CAL-04 | Cierre de cita / pago | ✅ |
| CLI-01 | Directorio de clientes | ✅ |
| CLI-02 | Perfil cliente | ✅ |
| STAFF-01 | Lista colaboradores | ✅ |
| STAFF-02 | Perfil colaborador (horarios + avatar + ausencias) | ✅ |
| SRV-01 | Catálogo de servicios | ✅ |
| SRV-02 | Formulario nuevo/editar servicio | ✅ |
| RPT-01 | Analytics (OWNER) | ✅ |
| CFG-01 | Datos del negocio | ✅ |
| CFG-02 | Agenda y políticas | ✅ |
| CFG-03 | Gestión de usuarios del sistema | ✅ |
| CFG-04 | Notificaciones WhatsApp (UI) | ✅ |
| SYS-01 | Notificaciones in-app reales | ✅ |
| SYS-02 | 404 | ✅ |
| SYS-03 | Error general | ✅ |

**Total: 23/23 (100%)**

---

## 7. Todo lo implementado en esta sesión

### PRs mergeados (#11 al #22)

| PR | Descripción |
|---|---|
| #11 | `feat(sug-C)`: buffer visual post-cita en calendario (zonas rayadas) |
| #12 | `feat(sug-D)`: buscador global funcional en top-bar |
| #13 | `feat(sug-E)`: upload de avatar en perfil del colaborador |
| #14 | `feat(SYS-01)`: notificaciones in-app reales (endpoint + campana) |
| #15 | `fix(buscador)`: alinear `?q=` → `?search=`, agregar búsqueda a appointments |
| #16 | `feat(avatar)`: campo `avatarUrl` en schema Prisma + migración |
| #17 | `fix(schema)`: `bufferMinutes`, `color`, `isActive` en Service; `schedule` en Collaborator |
| #18 | `feat(availability)`: endpoint `/availability/slots` + slots reales en nueva cita |
| #19 | `fix(auth)`: no redirigir al login en errores de red, solo en 401 explícito |
| #20 | `fix(agenda)`: `<button>` anidado en filtro de colaboradores → hydration error |
| #21 | `fix(colaboradores)`: alineación toggle/label en horario laboral (v1) |
| #22 | `fix(colaboradores)`: toggle horario — `overflow-hidden` + `inline-flex` + label `w-12` |

### Bugs resueltos esta sesión
1. **Login → redirige al login en 1 segundo** — el `catch` genérico del dashboard mandaba al login ante cualquier error de red. Corregido para redirigir solo en 401.
2. **Citas vacías** — la migración `fix-service-collaborator-fields` estaba creada pero no aplicada. Al hacer `prisma generate` sin migrar, el client de Prisma pedía `bufferMinutes` que no existía en la DB. Resuelto aplicando `prisma migrate dev` + `prisma generate`.
3. **Hydration error en filtro de agenda** — `<button>` dentro de `<button>` en `agenda-toolbar.tsx`. Reemplazado por `<span role="button">`.
4. **Toggle de horario desalineado** — thumb con `absolute` sin `overflow-hidden` se desbordaba visualmente sobre el label. Corregido con `inline-flex` + `overflow-hidden` + label más ancho.

---

## 8. Flujo de trabajo

- **Una feature = un branch = un PR**
- Formato: `feat/nombre`, `fix/nombre`
- Mergear desde GitHub antes de iniciar nueva rama
- Después de cambios de schema: siempre ejecutar `prisma migrate dev` + `prisma generate` + reiniciar el API

---

## 9. Deuda técnica pendiente

### Media prioridad
| Item | Descripción |
|---|---|
| FullCalendar | Calendario implementado desde cero. Sin drag & drop ni vista multi-recurso (columnas paralelas por colaborador) |
| Estado global | Sin TanStack Query ni Zustand. Todo se carga por componente — re-fetches innecesarios al navegar |
| `IN_PROGRESS` / `RESCHEDULED` | Estados definidos en el doc de arquitectura, no implementados en el schema ni en la UI |
| `source` en Appointment | Campo de origen (MANUAL/WHATSAPP/PHONE/etc.) no está en el schema |
| `audit_log` | Tabla de trazabilidad de acciones críticas no implementada |

### Baja prioridad
| Item | Descripción |
|---|---|
| WhatsApp real | CFG-04 tiene la UI pero sin integración Twilio/Meta ni cron job (BullMQ + Redis) |
| `payments` tabla separada | El pago está inline en `Appointment` (tipPercent, paymentMethod, price) |
| `staff_services` N:M | Las especialidades son `String[]` en lugar de tabla puente con precio/duración personalizada por colaborador |
| Responsividad móvil | Diseño optimizado para desktop únicamente |
| JWT en httpOnly cookie | Token en `localStorage` — menos seguro en producción |
| Protección de rutas server-side | La verificación de rol es solo client-side. El backend valida el token pero no el rol en cada endpoint |

---

## 10. Próximos pasos sugeridos

1. **Integración WhatsApp** — cron job con BullMQ + Twilio o Meta Cloud API para recordatorios automáticos
2. **Migrar JWT a httpOnly cookie** — más seguro para producción
3. **Agregar `source` e `IN_PROGRESS`/`RESCHEDULED`** al modelo Appointment
4. **TanStack Query** — reemplazar los fetches manuales por queries cacheadas
5. **Drag & drop en calendario** — evaluar migrar a FullCalendar
6. **Protección de rutas server-side** — middleware en Next.js + validación de rol en endpoints del backend
