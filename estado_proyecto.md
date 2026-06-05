# Estado del Proyecto — GlowManager
**Fecha:** Junio 2026  
**Versión:** 1.2  
**Repositorio:** https://github.com/rvsoslim020295/GeneradorCitas

---

## 1. Resumen Ejecutivo

GlowManager es un panel administrativo B2B para negocios de belleza (salones, barberías, spas, nail bars). Permite gestionar citas, clientes, colaboradores, servicios, pagos y reportes desde una sola interfaz web. El sistema está orientado a dueños y recepcionistas que trabajan desde computadora.

**Estado actual:** ~97% del MVP completado. Todas las pantallas están implementadas, los campos críticos del schema están en la DB, y el flujo de nueva cita ya muestra disponibilidad real.

---

## 2. Stack Tecnológico

### Frontend
| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 15.x |
| Lenguaje | TypeScript | 5.x |
| Estilos | Tailwind CSS v4 | 4.x |
| Design System | Material Design 3 (tokens CSS) | — |
| Fuente | Inter (Google Fonts) | — |
| Íconos | Lucide React | 1.x |
| Gestor de paquetes | pnpm (workspace) | — |

### Backend
| Capa | Tecnología |
|---|---|
| Runtime | Node.js (Bun compatible) |
| Framework | Hono.js |
| ORM | Prisma |
| Base de datos | PostgreSQL |
| Autenticación | JWT (token en localStorage) |

### Infraestructura
- **Frontend:** Vercel (planificado)
- **Backend:** Railway (planificado)
- **DB:** Supabase PostgreSQL (planificado)
- **Monorepo:** pnpm workspaces (`apps/web` + `apps/api`)

---

## 3. Arquitectura del Frontend

### Estructura de rutas (`apps/web/src/app/`)

```
(auth)/
  login/                  → AUTH-01
  recuperar-contrasena/   → AUTH-02
  resetear-contrasena/    → AUTH-03

(onboarding)/
  onboarding/             → SETUP-01: Wizard 4 pasos

(agenda)/
  agenda/                 → CAL-01: Calendario Día/Semana/Mes
  nueva-cita/             → CAL-03: Formulario nueva cita (con slots reales)
  citas/[id]/             → CAL-02: Detalle de cita
  citas/[id]/cobrar/      → CAL-04: Cierre de cita / registro de pago

(dashboard)/
  dashboard/              → DASH-01
  clientes/               → CLI-01
  clientes/[id]/          → CLI-02
  clientes/nuevo/         → Formulario nuevo cliente
  colaboradores/          → STAFF-01
  colaboradores/[id]/     → STAFF-02 (con avatar upload y horarios persistentes)
  colaboradores/nuevo/    → Formulario nuevo colaborador
  servicios/              → SRV-01
  servicios/[id]/         → SRV-02: Editar servicio (con bufferMinutes, color, isActive)
  servicios/nuevo/        → SRV-02: Nuevo servicio
  reportes/               → RPT-01 (solo OWNER)
  configuracion/          → CFG hub (solo OWNER)
  configuracion/negocio/  → CFG-01
  configuracion/agenda/   → CFG-02
  configuracion/usuarios/ → CFG-03
  configuracion/whatsapp/ → CFG-04
```

### Componentes globales
```
src/
  components/
    layout/
      sidebar.tsx           → Navegación lateral con filtro por rol
      top-bar.tsx           → Búsqueda global + campana con notificaciones reales
      global-search.tsx     → Buscador (clientes, servicios, citas) con debounce
    theme-provider.tsx      → Contexto claro/oscuro
  hooks/
    use-role.ts             → Hook para leer rol del usuario
```

---

## 4. Pantallas implementadas

| ID | Pantalla | Estado |
|---|---|---|
| AUTH-01 | Login | ✅ |
| AUTH-02 | Recuperar contraseña | ✅ |
| AUTH-03 | Resetear contraseña | ✅ |
| SETUP-01 | Onboarding wizard 4 pasos | ✅ |
| DASH-01 | Dashboard ejecutivo con KPIs | ✅ |
| CAL-01 | Calendario Día / Semana / Mes | ✅ |
| CAL-02 | Detalle de cita con estados y acciones | ✅ |
| CAL-03 | Nueva cita con slots de disponibilidad reales | ✅ |
| CAL-04 | Cierre de cita / registro de pago | ✅ |
| CLI-01 | Directorio de clientes | ✅ |
| CLI-02 | Perfil cliente (historial + métricas + edición) | ✅ |
| STAFF-01 | Lista de colaboradores | ✅ |
| STAFF-02 | Perfil colaborador (horarios persistentes + avatar) | ✅ |
| SRV-01 | Catálogo de servicios | ✅ |
| SRV-02 | Formulario nuevo / editar servicio | ✅ |
| RPT-01 | Analytics con gráficos (OWNER) | ✅ |
| CFG-01 | Datos del negocio | ✅ |
| CFG-02 | Agenda y políticas | ✅ |
| CFG-03 | Gestión de usuarios del sistema | ✅ |
| CFG-04 | Notificaciones WhatsApp | ✅ |
| SYS-01 | Notificaciones in-app (datos reales) | ✅ |
| SYS-02 | 404 | ✅ |
| SYS-03 | Error general | ✅ |

**Total: 23/23 (100%)**

---

## 5. Endpoints del backend (`apps/api/src/routes/`)

| Ruta | Descripción |
|---|---|
| `POST /auth/login` | Login con email + contraseña |
| `GET /clients?search=` | Lista clientes con búsqueda |
| `GET/POST/PATCH/DELETE /clients/:id` | CRUD clientes |
| `GET /collaborators?search=` | Lista colaboradores |
| `GET/POST/PATCH/DELETE /collaborators/:id` | CRUD colaboradores (incluye `schedule`, `avatarUrl`) |
| `GET/POST /collaborators/:id/absences` | Ausencias del colaborador |
| `DELETE /collaborators/:id/absences/:absId` | Eliminar ausencia |
| `GET /services?search=` | Lista servicios (incluye `bufferMinutes`, `color`, `isActive`) |
| `GET/POST/PATCH/DELETE /services/:id` | CRUD servicios |
| `GET /appointments?search=` | Lista citas con búsqueda |
| `GET/POST /appointments` | Crear cita (valida solapamientos) |
| `PATCH /appointments/:id/status` | Cambiar estado |
| `POST /appointments/:id/payment` | Registrar pago |
| `GET /availability/slots` | Slots disponibles para colaborador+servicio+fecha |
| `GET /analytics` | Métricas del negocio |
| `GET /notifications` | Notificaciones derivadas de citas |
| `GET/PATCH /settings` | Configuración del negocio |

---

## 6. Schema Prisma (campos clave)

```prisma
model Service {
  durationMin   Int
  bufferMinutes Int     @default(0)   ← NUEVO
  color         String  @default("#3B82F6")  ← NUEVO
  isActive      Boolean @default(true)  ← NUEVO
}

model Collaborator {
  avatarUrl  String?   ← NUEVO
  schedule   Json?     ← NUEVO (horario semanal Mon-Sun)
}
```

---

## 7. Flujo de trabajo acordado

- **Una feature = un branch = un PR**
- Formato de ramas: `feat/nombre`, `fix/nombre`
- Los PRs se mergean desde GitHub antes de iniciar la siguiente rama
- El remote usa token de `gh auth` embebido en la URL

---

## 8. Deuda técnica restante

### Prioridad media
| Item | Descripción |
|---|---|
| FullCalendar | El calendario está implementado desde cero. Sin drag & drop ni vista multi-recurso (columnas paralelas por colaborador en vista semana) |
| Estado global | Sin TanStack Query ni Zustand. Todo se carga localmente por componente |
| `IN_PROGRESS` / `RESCHEDULED` | Estados del documento de arquitectura no implementados |
| `source` en Appointment | Campo de origen de la cita (MANUAL/WHATSAPP/etc.) no está en el schema |
| `audit_log` | Tabla de trazabilidad de cambios críticos no implementada |

### Prioridad baja
| Item | Descripción |
|---|---|
| WhatsApp real | CFG-04 tiene la UI pero sin integración con Twilio/Meta ni cron jobs (BullMQ) |
| `payments` tabla separada | Actualmente el pago está inline en `Appointment` |
| `staff_services` N:M | Actualmente `specialties: String[]` en lugar de tabla puente con precio/duración por colaborador |
| Responsividad móvil | Diseño optimizado para desktop. Sin breakpoints para móvil |
| Token en httpOnly cookie | JWT en localStorage, menos seguro para producción |

---

## 9. Próximos pasos sugeridos

1. Integración WhatsApp real (cron job + Twilio/Meta Cloud API)
2. Migrar JWT a httpOnly cookie
3. Agregar `source` y `IN_PROGRESS`/`RESCHEDULED` al modelo Appointment
4. Drag & drop en el calendario (evaluar FullCalendar)
5. Estado global con TanStack Query
