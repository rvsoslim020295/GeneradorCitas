# Estado del Proyecto — GlowManager
**Fecha:** 8 de Junio 2026
**Versión:** 7.0
**Repositorio:** https://github.com/rvsoslim020295/GeneradorCitas
**Rama activa:** `feat/super-admin` (pendiente de merge a `main`)

---

## 1. Resumen Ejecutivo

GlowManager es un panel administrativo B2B para negocios de belleza (salones, barberías, spas, nail bars). Permite gestionar citas, clientes, colaboradores, servicios, paquetes, pagos y reportes desde una interfaz web orientada a dueños y recepcionistas en desktop.

**Estado actual:** MVP 100% funcional con todas las funcionalidades core implementadas. Sistema de agendamiento avanzado con capacidad por servicio, slots dinámicos, walk-in en tiempo real, cobro y completado desacoplados, panel de super admin completo.

---

## 2. Lo implementado en sesiones anteriores (v6.0)

### Login unificado + Remember Me
- `/login` detecta super admin vs negocio automáticamente
- Cookie con `Max-Age` dinámico: sesión o 30 días según checkbox

### Planes de suscripción
- Página `/planes` con cards BASIC (S/15), PRO (S/30), ENTERPRISE (S/45)
- Modal de pago con QR Plin
- Restricciones de plan en backend (`plan-limits.ts`)

### Módulo de Paquetes/Combos
- CRUD completo en `/paquetes`
- Mínimo 2 servicios, límite por plan
- Precio especial vs precio individual tachado

### Métricas en Reportes (v6.0)
- Top servicios por ingreso
- Mapa de calor horas pico (día × hora)
- Clientes más valiosos
- Cancelaciones por colaborador
- Origen de citas (WhatsApp / Teléfono / Instagram / Presencial)
- Mejor mes del año

### Origen de citas
- Campo `origin` en `Appointment` (`whatsapp | phone | instagram | walkin`)
- `OriginSelector` conectado a BD

### Panel Super Admin
- `/admin/dashboard`: stats globales + listado negocios
- `/admin/negocios/:id`: gestión de plan, fecha de vencimiento, suspender/reactivar
- Login unificado detecta super admin automáticamente

---

## 3. Lo implementado en esta sesión (v7.0)

### 3.1 Bloqueo por plan vencido/suspendido
- `POST /auth/login` devuelve `plan` y `planStatus` del negocio
- Al login: si `planStatus` es `EXPIRED` o `SUSPENDED` → redirige a `/plan-vencido`
- Dashboard layout: guard que llama `/auth/me` en cada navegación y redirige si el plan venció
- Nueva página `/plan-vencido`: mensaje contextual distinto para EXPIRED vs SUSPENDED + CTA a `/planes` + botón cerrar sesión
- Rutas `/planes` y `/plan-vencido` exentas del guard

### 3.2 Métrica Nuevos vs Recurrentes (reemplaza Retención)
- Backend: `groupBy` para detectar clientes con citas previas al período
- Devuelve `newVsRecurring { new, recurring, total, newPct, recurringPct }`
- Frontend: card con barra de proporción verde/primario + conteos + porcentajes + total de clientes únicos

### 3.3 Campo `performsServices` en colaboradores
- Schema: `performsServices Boolean @default(true)` en `Collaborator`
- Todos los existentes heredan `true` automáticamente
- Backend: aceptado en create/update; availability filtra por `performsServices: true`
- Nueva cita: selector excluye colaboradores con `performsServices = false`
- Formularios crear/editar colaborador: toggle "Realiza servicios" con descripción
- **Caso de uso:** Recepcionistas, cajeros, administradores no aparecen al agendar citas

### 3.4 Capacidad máxima simultánea por servicio (`maxConcurrent`)
- Schema: `maxConcurrent Int?` en `Service` — `null` = sin límite
- Backend: `POST/PATCH /services` acepta `maxConcurrent`
- Availability: al buscar slots, verifica que las citas `PENDING+CONFIRMED+IN_PROGRESS` para ese servicio no superen `maxConcurrent`
- Las citas `COMPLETED` liberan el cupo (quien terminó antes ya no bloquea)
- Formularios nuevo/editar servicio: campo numérico en sección Logística con placeholder "Sin límite"
- **Caso de uso:** 3 sillas de corte → máximo 3 cortes simultáneos aunque haya más colaboradores libres

### 3.5 Slots dinámicos por fin de cita real
- Antes: slots solo en intervalos fijos (ej. 4:00, 4:30, 5:00)
- Ahora: también se añade el momento exacto en que termina cada cita activa del colaborador
- Si un corte de 40 min empieza a las 4:00 → termina a las 4:40 → **4:40 aparece como slot disponible**
- Candidatos = grilla fija ∪ fin de cada cita activa del colaborador

### 3.6 Walk-in con validación en tiempo real
- Nueva sección "⚡ Hora exacta (walk-in)" en el formulario de nueva cita
- Aparece solo cuando servicio y fecha están seleccionados
- El usuario escribe cualquier hora (ej. 4:47) — debounce 500ms
- Indicador en tiempo real: ✅ verde "Disponible" / ❌ rojo con motivo específico
- Motivos: "Fuera del horario del negocio" / "Capacidad máxima alcanzada" / "Sin colaboradores disponibles"
- Nuevo endpoint `GET /availability/check?serviceId&date&time&collaboratorId`
- Si walk-in está válido, **tiene prioridad** sobre el slot picker
- Limpiable con botón ✕

### 3.7 Cobrar y Completar desacoplados
- **Antes:** cobrar forzaba `status = COMPLETED`; si estaba COMPLETED desaparecían todos los botones
- **Ahora:** son acciones completamente independientes

| Situación | Badges | Botones |
|---|---|---|
| Sin cobrar + sin completar | 🟡 Pago pendiente · 🔵 Servicio pendiente | Cobrar + Completar |
| Sin cobrar + completado | 🟡 Pago pendiente | Cobrar |
| Cobrado + sin completar | 🔵 Servicio pendiente | Completar |
| Cobrado + completado | ✅ Todo listo | — |

- Reprogramar / Cancelar / No-show: solo visibles si el servicio no está completado
- Página de cobro redirige al detalle de cita (no a la agenda)
- Backend: `POST /appointments/:id/payment` ya no cambia el status; verifica `paidAmount !== null` para evitar cobro doble

### 3.8 Modal de confirmación en página (reemplaza `confirm()` nativo)
- Eliminado el diálogo `confirm()` del browser en toda la app
- Reemplazado por modal centrado con fondo oscuro translúcido
- Implementado en: detalle de cita, panel admin (suspender/reactivar)
- Botones "Cancelar" / "Confirmar" con estilo del sistema
- Clic fuera del modal también lo cierra

### 3.9 Panel Admin — mejoras
- **Fecha de vencimiento editable:** schema Zod ahora acepta `YYYY-MM-DD` además de ISO datetime
- Muestra la fecha en texto legible ("12 de junio de 2026") debajo del input
- Mejor manejo de errores: mensaje del servidor visible en pantalla
- **Toggle modo oscuro/claro** en header del dashboard admin y detalle de negocio
- `confirm()` de Suspender/Reactivar reemplazado por modal en página

### 3.10 Mensaje de error descriptivo en colaboradores
- Al fallar el guardado, el error muestra el motivo específico del servidor
- Ej: "No se pudo guardar el colaborador: Tu plan TRIAL permite máximo 2 colaboradores"

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
  nueva-cita/               CAL-03 — Walk-in + slots dinámicos ✨ v7.0
  citas/[id]/               CAL-02 — Cobrar/Completar desacoplados ✨ v7.0
  citas/[id]/cobrar/        CAL-04

(dashboard)/
  dashboard/                DASH-01
  plan-vencido/             PLAN-02 — Pantalla plan vencido/suspendido ✨ v7.0
  clientes/                 CLI-01
  clientes/[id]/            CLI-02
  colaboradores/            STAFF-01
  colaboradores/[id]/       STAFF-02 — Toggle performsServices ✨ v7.0
  colaboradores/nuevo/      STAFF-03 — Toggle performsServices ✨ v7.0
  servicios/                SRV-01
  servicios/[id]/           SRV-02 — Campo maxConcurrent ✨ v7.0
  servicios/nuevo/          SRV-03 — Campo maxConcurrent ✨ v7.0
  paquetes/                 PKG-01
  paquetes/nuevo/           PKG-02
  paquetes/[id]/            PKG-03
  planes/                   PLAN-01
  reportes/                 RPT-01 — Nuevos vs Recurrentes ✨ v7.0
  configuracion/            CFG hub
  configuracion/negocio/    CFG-01
  configuracion/agenda/     CFG-02
  configuracion/usuarios/   CFG-03
  configuracion/whatsapp/   CFG-04

admin/
  dashboard/                ADMIN-02 — Toggle tema ✨ v7.0
  negocios/[id]/            ADMIN-03 — Fecha editable + toggle tema ✨ v7.0
```

### Hooks disponibles (`apps/web/src/lib/api/hooks/`)
```
use-clients.ts
use-collaborators.ts         → tipo incluye performsServices ✨ v7.0
use-services.ts              → tipo incluye maxConcurrent ✨ v7.0
use-appointments.ts
use-analytics.ts
use-notifications.ts
use-settings.ts
use-availability.ts          → useAvailabilitySlots + useAvailabilityCheck ✨ v7.0
use-packages.ts
```

---

## 6. Arquitectura del Backend

### Endpoints (`apps/api/src/routes/`)

| Archivo | Rutas principales |
|---|---|
| `auth.ts` | POST /auth/login (devuelve plan+planStatus), GET /auth/me |
| `users.ts` | CRUD /users |
| `clients.ts` | GET /clients (filtrado por historial según plan) |
| `collaborators.ts` | CRUD + límite plan + performsServices |
| `services.ts` | CRUD + maxConcurrent |
| `packages.ts` | CRUD + límite plan |
| `appointments.ts` | CRUD + status + payment (desacoplado de status) + deposit |
| `availability.ts` | GET /slots (slots dinámicos) + GET /check (walk-in) |
| `analytics.ts` | GET /analytics (newVsRecurring reemplaza retentionRate) |
| `settings.ts` | GET/PATCH /settings, POST /settings/logo |
| `admin.ts` | Panel super admin (plan acepta YYYY-MM-DD) |

---

## 7. Schema Prisma (estado actual)

```prisma
model Collaborator {
  ...
  isActive         Boolean  @default(true)
  performsServices Boolean  @default(true)   ← ✨ v7.0
}

model Service {
  ...
  bufferMinutes  Int      @default(0)
  maxConcurrent  Int?                         ← ✨ v7.0
  price          Float
}

model Appointment {
  ...
  origin         String?  @default("walkin")
  paidAmount     Float?                       ← independiente del status
  paymentMethod  String?
}

model Package { ... }
model PackageService { ... }
model SuperAdmin { ... }
```

---

## 8. Planes de Suscripción

| | BASIC | PRO | ENTERPRISE |
|---|---|---|---|
| **Precio** | S/ 15/mes | S/ 30/mes | S/ 45/mes |
| Colaboradores | 2 | 4 | Ilimitados |
| Citas/mes | 50 | 200 | Ilimitadas |
| Anticipación | 7 días | 30 días | Sin límite |
| Historial clientes | 30 días | 6 meses | Completo |
| Reportes | Básicos | Completos | Completos |
| Paquetes de servicios | ❌ | ✅ hasta 5 | ✅ ilimitados |
| Registro de anticipos | ❌ | ✅ | ✅ |
| Exportar Excel | ❌ | ✅ | ✅ |
| Soporte prioritario | ❌ | ❌ | ✅ |

### Flujo de pago manual
1. Cliente en trial de 7 días → al vencer: `planStatus: EXPIRED`
2. Login con plan vencido → redirige a `/plan-vencido`
3. Cliente va a `/planes`, selecciona plan, escanea QR Plin
4. Envía comprobante al admin
5. Super admin activa desde `/admin/negocios/:id`

---

## 9. Lógica de Disponibilidad (v7.0)

```
Para cada colaborador activo con performsServices=true:
  1. Generar candidatos = grilla fija (cada slotMinutes) ∪ fin de cada cita activa
  2. Para cada candidato:
     a. ¿Colaborador libre? (no PENDING/CONFIRMED/IN_PROGRESS en ese rango)
     b. ¿Capacidad del servicio no superada? (si maxConcurrent != null)
  3. Si pasa ambos checks → slot disponible

COMPLETED libera tanto al colaborador como el cupo de capacidad.

Endpoint /availability/check:
  Valida una hora exacta arbitraria (walk-in)
  Retorna { available, collaboratorId, reason? }
```

---

## 10. Variables de Entorno

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

## 11. Pantallas — Estado Final

| ID | Pantalla | Estado |
|---|---|---|
| AUTH-01 | Login unificado | ✅ |
| AUTH-00 a AUTH-05 | Flujo completo auth | ✅ |
| SETUP-01 | Onboarding | ✅ |
| DASH-01 | Dashboard KPIs | ✅ |
| PLAN-02 | Plan vencido/suspendido | ✅ Nuevo v7.0 |
| CAL-01 a CAL-04 | Agenda, nueva cita (walk-in), detalle (cobrar/completar desacoplado), cobro | ✅ Mejorado v7.0 |
| CLI-01, CLI-02 | Clientes | ✅ |
| STAFF-01 a STAFF-03 | Colaboradores (performsServices) | ✅ Mejorado v7.0 |
| SRV-01 a SRV-03 | Servicios (maxConcurrent) | ✅ Mejorado v7.0 |
| PKG-01 a PKG-03 | Paquetes | ✅ |
| PLAN-01 | Planes de suscripción | ✅ |
| RPT-01 | Reportes (nuevos vs recurrentes) | ✅ Mejorado v7.0 |
| CFG-01 a CFG-04 | Configuración completa | ✅ |
| ADMIN-02, ADMIN-03 | Panel super admin (fecha editable, toggle tema) | ✅ Mejorado v7.0 |

**Total pantallas clientes: 33/33 · Panel admin: 2/2**

---

## 12. Bugs Resueltos en esta Sesión (v7.0)

| Bug | Descripción | Estado |
|---|---|---|
| Guardado de colaborador sin motivo | Solo mostraba "No se pudo guardar", sin razón | ✅ Resuelto |
| `performsServices` no en tipo TS | `as never` en mutación | ✅ Resuelto |
| `confirm()` nativo del browser | Diálogo feo fuera de la app | ✅ Modal en página |
| Cobrar forzaba COMPLETED | Pagado ≠ completado | ✅ Desacoplado |
| COMPLETED ocultaba botón Cobrar | Si terminó sin cobrar, no había forma de cobrar | ✅ Resuelto |
| Fecha vencimiento no editable (admin) | Zod `datetime()` muy estricto | ✅ Acepta `YYYY-MM-DD` |
| Ícono calendario tapado (modo claro) | Lucide icon con `pointer-events-none` encima | ✅ Eliminado |
| Import `Calendar` eliminado por error | Crash en página admin | ✅ Restaurado |
| Toggle tema ausente en panel admin | Solo el panel cliente lo tenía | ✅ Agregado |

---

## 13. Deuda Técnica Pendiente

### Alta prioridad
| Item | Descripción |
|---|---|
| Exportar Excel | Flag `canExportExcel` listo en plan-limits, falta endpoint y botón en reportes |
| Deploy a producción | Vercel (frontend) + Railway (backend) + Supabase (BD) |

### Media prioridad
| Item | Descripción |
|---|---|
| WhatsApp real | CFG-04 tiene UI pero sin integración (BuilderBot o Meta Cloud API) |
| Foto de resultado por cita | Portafolio del negocio — sugerida, no implementada |
| Comisiones por colaborador | % sobre servicios atendidos |
| Ficha técnica por cliente | Historial de coloraciones, tratamientos, alergias |

### Baja prioridad
| Item | Descripción |
|---|---|
| Culqi / pagos automáticos | Plan se activa manualmente hoy |
| Drag & drop en calendario | Evaluar FullCalendar |
| `payments` tabla separada | El pago está inline en `Appointment` |
| Responsividad móvil | Solo desktop |
| `audit_log` | Trazabilidad de acciones críticas |

---

## 14. PRs

| PR | Título | Estado |
|---|---|---|
| #1–#30 | Sesiones anteriores | ✅ Mergeados |
| #32 | v6.0 + v7.0 — feat/super-admin | 🔄 Pendiente de merge |

---

## 15. Próximos Pasos Sugeridos

1. **Merge PR #32** — mergear `feat/super-admin` a `main`
2. **Exportar a Excel** — implementar endpoint y botón en reportes
3. **Deploy a producción** — Vercel + Railway + Supabase
4. **Foto de resultado por cita** — portafolio del negocio
5. **BuilderBot / WhatsApp** — notificaciones reales
6. **Comisiones por colaborador**

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
