# Estado del Proyecto — GlowManager
**Fecha:** Junio 2026  
**Versión:** 1.4  
**Repositorio:** https://github.com/rvsoslim020295/GeneradorCitas  
**Rama activa:** `feat/cita-detail-improvements` (PR #23, pendiente de merge)

---

## 1. Resumen Ejecutivo

GlowManager es un panel administrativo B2B para negocios de belleza (salones, barberías, spas, nail bars). Permite gestionar citas, clientes, colaboradores, servicios, pagos y reportes desde una sola interfaz web orientada a dueños y recepcionistas en desktop.

**Estado actual:** MVP completado + mejoras de UX significativas en esta sesión. Todas las pantallas funcionales, flujo de pago con anticipo, reportes con filtros reales y notificaciones con estado de lectura.

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

### Migraciones aplicadas (sesión actual)
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

## 7. Todo lo implementado en esta sesión (PR #23)

### Detalle de Cita (`CAL-02`)
- Panel cambiado de **drawer lateral** a **modal centrado** con overlay y click-fuera para cerrar
- **"Completar y Cobrar"** separado en dos botones independientes:
  - **Cobrar** → navega al flujo de pago (`/citas/:id/cobrar`)
  - **Completar** → marca COMPLETED sin pasar por caja
- **Registrar Anticipo** — sección expandible con dos modos:
  - Por porcentaje: chips de 20/30/50/100% con preview del monto calculado
  - Monto fijo: input numérico con prefijo S/
- **Botón WhatsApp funcional** — abre `wa.me/51{phone}` en nueva pestaña; deshabilitado si no hay teléfono
- Eliminado botón de llamada — solo WhatsApp

### Flujo de Cobro (`CAL-04`)
- Si hay anticipo registrado: muestra desglose **Precio servicio → − Anticipo → Saldo pendiente**
- La propina se calcula sobre el saldo (no sobre el total)
- Footer dice "Saldo a Cobrar" en vez de "Total a Pagar" cuando hay anticipo
- **Propina con modo monto fijo** además de los porcentajes (0/10/15/20%)

### Colaboradores — Crear y Editar (`STAFF-02`)
- **Nombre y Apellido** separados en dos campos (grid 2 columnas)
- **Documento de identidad**: selector `[DNI] [CE]` + número (8 dígitos DNI, 12 CE)
- **Teléfono** agregado en ambos formularios
- Sin placeholders en ningún campo
- Al editar: separa el `name` existente en firstName/lastName automáticamente

### Dashboard (`DASH-01`)
- **Bug corregido**: badges de estado en "Citas de Hoy" ahora muestran correctamente Cancelada (rojo), No se presentó (gris), además de Pendiente, Confirmada y Completada

### Reportes (`RPT-01`)
- **Filtros de período funcionales** — el selector activa un re-fetch real al backend:
  - **Este Día**: barras por hora (8:00–20:00)
  - **Esta Semana**: barras diarias lun→hoy
  - **Semana Pasada**: 7 días anteriores a hoy (excluye hoy)
  - **Últimos 30 días**: barras semanales con rango "7-13 Jun" o "28 May-3 Jun" si cruza mes
  - **Este Año**: barras mensuales
- **Gráfico corregido**: bug de `height: X%` sin referencia (barras invisibles) — fixed con `items-stretch` + `flex-col justify-end`
- **Etiquetas mejoradas**: "Lun 2 Jun", "Mar 3 Jun" — día + fecha + mes en todos los períodos
- **"Tasa No-Show"** → **"Tasa de Inasistencia"**
- **Delta real de inasistencia**: badge compara período actual vs período anterior equivalente (rojo si empeoró, verde si mejoró, gris si igual, "Sin datos anteriores" si no hay comparación)
- Título del gráfico: **"Ingresos"** con subtítulo dinámico según período
- Eliminado botón de 3 puntos sin funcionalidad

### Notificaciones (`SYS-01`)
- **Estado de lectura** guardado en `localStorage` (`gm_read_notifs`)
- El punto rojo y contador solo muestran notificaciones no leídas
- Al abrir el panel: todas se marcan leídas tras 400ms
- Al hacer click en una notif: se marca leída inmediatamente
- Notificaciones leídas: 50% opacidad, sin punto azul
- Al re-fetch: se limpian IDs de citas que ya no existen

### Configuración — Datos del Negocio (`CFG-01`)
- Subtítulo del hub actualizado: eliminada "zona horaria" de la descripción

---

## 8. Bugs resueltos esta sesión

1. **Cita cancelada aparecía como "Pendiente" en Dashboard** — el badge de "Citas de Hoy" solo tenía lógica para CONFIRMED/COMPLETED. Corregido para los 5 estados.
2. **Gráfico de ingresos invisible** — `height: X%` en columnas sin altura definida colapsaba a 0px. Corregido con `items-stretch` + `flex-col justify-end`.
3. **Etiquetas truncadas en gráfico** — `slice(0,5)` sobre `toLocaleDateString` producía "lun 1" para "lunes 12". Reemplazado por formato explícito por período.
4. **Notificaciones siempre "nuevas"** — no había mecanismo de lectura. Implementado con localStorage.
5. **Anticipo no descontado en cobro** — la página de cobro calculaba la propina y total sobre el precio completo ignorando el anticipo ya pagado.
6. **Botones de llamada/WhatsApp no funcionales** — eran `<button>` sin href. Reemplazados por `<a href="wa.me/...">` y `<a href="tel:...">`.

---

## 9. Flujo de trabajo

- **Una feature = un branch = un PR**
- Formato: `feat/nombre`, `fix/nombre`
- Mergear desde GitHub antes de iniciar nueva rama
- Después de cambios de schema: siempre ejecutar `prisma migrate dev` + `prisma generate` + reiniciar el API

---

## 10. Deuda técnica pendiente

### Media prioridad
| Item | Descripción |
|---|---|
| FullCalendar | Calendario implementado desde cero. Sin drag & drop ni vista multi-recurso (columnas paralelas por colaborador) |
| Estado global | Sin TanStack Query ni Zustand. Todo se carga por componente — re-fetches innecesarios al navegar |
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
| Comparativos hardcodeados en KPIs | "+12% vs mes ant." en Total Citas y Completadas son estáticos |

---

## 11. Próximos pasos sugeridos

1. **Merge PR #23** — todos los cambios de esta sesión están en `feat/cita-detail-improvements`
2. **TanStack Query** — reemplazar fetches manuales por queries cacheadas (impacto inmediato en rendimiento)
3. **Protección de rutas server-side** — middleware Next.js + validación de rol en endpoints del backend
4. **Integración WhatsApp** — cron job con BullMQ + Twilio o Meta Cloud API (de pago)
5. **Drag & drop en calendario** — evaluar migrar a FullCalendar
6. **Migrar JWT a httpOnly cookie** — más seguro para producción
7. **Comparativos reales en todos los KPIs** — extender el delta de `noShowRate` a totalRevenue, completedAppointments y totalAppointments
