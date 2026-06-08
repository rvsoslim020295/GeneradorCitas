# Estado del Proyecto — GlowManager
**Fecha:** 8 de Junio 2026
**Versión:** 6.0
**Repositorio:** https://github.com/rvsoslim020295/GeneradorCitas
**Rama activa:** `main` + `feat/super-admin` (pendiente de merge)

---

## 1. Resumen Ejecutivo

GlowManager es un panel administrativo B2B para negocios de belleza (salones, barberías, spas, nail bars). Permite gestionar citas, clientes, colaboradores, servicios, paquetes, pagos y reportes desde una interfaz web orientada a dueños y recepcionistas en desktop.

**Estado actual:** MVP 100% funcional, production-ready en seguridad, con panel de super administrador, sistema de planes de suscripción manual, módulo de paquetes/combos de servicios, y sistema de métricas avanzadas en reportes.

---

## 2. Lo implementado en esta sesión (v6.0)

### 2.1 Login unificado (Super Admin + Negocios)
- El mismo `/login` detecta si las credenciales son de `User` o `SuperAdmin`
- Si es super admin emite cookie `gm_admin_token` y redirige a `/admin/dashboard`
- Si ya tiene `gm_admin_token` activo y va a `/login`, el middleware lo redirige directo al panel admin
- Ruta `/admin/login` eliminada — ya no existe ni es necesaria
- Todas las redirecciones internas del panel admin actualizadas de `/admin/login` → `/login`

### 2.2 Remember Me en el login
- Checkbox "Remember me" ahora funciona realmente
- **Sin marcar:** cookie sin `Max-Age` → se borra al cerrar el navegador
- **Marcado:** cookie dura 30 días
- Aplica tanto para usuarios de negocio (`gm_token`) como para super admin (`gm_admin_token`)

### 2.3 Página de Planes de Suscripción (`/planes`)
- Cards para BASIC (S/15), PRO (S/30), ENTERPRISE (S/45)
- Estrategia de price anchoring: la diferencia PRO→ENTERPRISE es pequeña para empujar al cliente al plan más alto
- Badge "Plan actual" en la card del plan activo (TRIAL y BASIC comparten card)
- Botón "Plan activo" deshabilitado para el plan en uso
- Modal de pago con QR de Plin al seleccionar un plan
- Flecha para retroceder + barra de título fija
- Botón "Actualizar Plan" del sidebar conectado a `/planes`
- Plan actual consumido desde `GET /auth/me` (se agregó `plan` y `planStatus` a la respuesta)

### 2.4 Restricciones de plan implementadas (backend)
Archivo central: `apps/api/src/lib/plan-limits.ts`

| Límite | TRIAL/BASIC | PRO | ENTERPRISE |
|---|---|---|---|
| Colaboradores | 2 | 4 | Ilimitados |
| Citas/mes | 50 | 200 | Ilimitadas |
| Anticipación | 7 días | 30 días | Sin límite |
| Historial clientes | 30 días | 6 meses | Completo |
| Depósitos/anticipos | ❌ | ✅ | ✅ |
| Exportar Excel | ❌ | ✅ | ✅ |
| Paquetes | 0 | 5 | Ilimitados |

- `POST /collaborators` → verifica máx. colaboradores activos
- `POST /appointments` → verifica citas del mes + días de anticipación
- `POST /appointments/:id/deposit` → verifica `canUseDeposits`
- `GET /clients` → filtra por última visita según `clientHistoryDays`
- `POST /packages` → verifica máx. paquetes activos
- Errores devueltos con `code` específico y mensaje legible para mostrar al usuario

### 2.5 Módulo de Paquetes/Combos (`/paquetes`)
- Nuevo modelo `Package` + tabla de unión `PackageService` (N:M con `Service`)
- CRUD completo: listar, crear, editar, eliminar
- Validación: mínimo 2 servicios por paquete
- Vista de listado muestra precio original tachado, precio especial, ahorro en verde, duración total, chips de servicios con colores
- Formulario de creación/edición con selección visual de servicios
- Resumen automático de duración + precio individual al seleccionar servicios
- Advertencia si el precio del paquete es mayor que los servicios por separado
- Restricción por plan aplicada en backend
- Entrada en el sidebar entre "Servicios" y "Reportes" (solo OWNER)

### 2.6 Origen de citas
- Nuevo campo `origin` en `Appointment` (`whatsapp` | `phone` | `instagram` | `walkin`)
- `OriginSelector` ahora es controlado — el canal seleccionado se envía y guarda en BD
- Default: `whatsapp`
- Citas anteriores quedan como `walkin` (valor por defecto del schema)

### 2.7 Métricas avanzadas en Reportes
Nuevas métricas añadidas al endpoint `GET /analytics` y visualizadas en `/reportes`:

| Métrica | Descripción |
|---|---|
| 🏆 Mejor mes del año | Solo en "Este Año" — tarjeta destacada con el mes de mayor ingreso |
| ✂️ Top servicios | Top 5 por ingreso con barra de porcentaje |
| 🗺️ Mapa de calor horas pico | Tabla día × hora con gradiente de intensidad (8h–20h) |
| ⭐ Clientes más valiosos | Top 5 por gasto en el período |
| ❌ Cancelaciones por colaborador | Barra rojo/amarillo según severidad (≥30% = crítico) |
| 📣 Origen de citas | Distribución por canal: WhatsApp, Teléfono, Instagram, Presencial |
| 👥 Retención de clientes | % clientes del período anterior que volvieron (con estados de color) |

### 2.8 Nueva Cita — "Cualquiera disponible" funciona
- Endpoint `/availability/slots` ahora acepta `collaboratorId` como opcional
- Sin colaborador → busca slots en todos los activos, devuelve `slotCollaboratorMap`
- Al guardar, asigna automáticamente el primer colaborador libre para el slot elegido
- Garantiza que no haya cruces: cada slot solo aparece si al menos un colaborador está libre

### 2.9 Logo del panel admin clickeable
- El logo "GlowManager / Admin" en el dashboard del super admin redirige a `/admin/dashboard`

---

## 3. Stack Tecnológico

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

## 4. Arquitectura del Frontend

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
  nueva-cita/               CAL-03
  citas/[id]/               CAL-02
  citas/[id]/cobrar/        CAL-04

(dashboard)/
  dashboard/                DASH-01
  clientes/                 CLI-01
  clientes/[id]/            CLI-02
  clientes/nuevo/
  colaboradores/            STAFF-01
  colaboradores/[id]/       STAFF-02
  colaboradores/nuevo/
  servicios/                SRV-01
  servicios/[id]/           SRV-02
  servicios/nuevo/
  paquetes/                 PKG-01 — Listado de paquetes ✨ NUEVO
  paquetes/nuevo/           PKG-02 — Crear paquete ✨ NUEVO
  paquetes/[id]/            PKG-03 — Editar paquete ✨ NUEVO
  planes/                   PLAN-01 — Planes de suscripción ✨ NUEVO
  reportes/                 RPT-01 — Métricas avanzadas ✨ MEJORADO
  configuracion/            CFG hub
  configuracion/negocio/    CFG-01
  configuracion/agenda/     CFG-02
  configuracion/usuarios/   CFG-03
  configuracion/whatsapp/   CFG-04

admin/
  dashboard/                ADMIN-02 — Logo clickeable
  negocios/[id]/            ADMIN-03
```

### Hooks disponibles (`apps/web/src/lib/api/hooks/`)
```
use-clients.ts
use-collaborators.ts
use-services.ts
use-appointments.ts
use-analytics.ts
use-notifications.ts
use-settings.ts
use-availability.ts      → colaboradorId ahora opcional
use-packages.ts          ✨ NUEVO — usePackages, usePackage, useCreatePackage,
                                    useUpdatePackage, useDeletePackage
```

---

## 5. Arquitectura del Backend

### Endpoints (`apps/api/src/routes/`)

| Archivo | Rutas principales |
|---|---|
| `auth.ts` | POST /auth/login (unificado), POST /auth/logout, GET /auth/me (incluye plan+planStatus) |
| `users.ts` | CRUD /users |
| `clients.ts` | GET /clients (filtrado por historial según plan) |
| `collaborators.ts` | CRUD /collaborators + límite por plan |
| `services.ts` | CRUD /services |
| `packages.ts` | CRUD /packages + límite por plan ✨ NUEVO |
| `appointments.ts` | CRUD + status + payment + deposit (con límites de plan) |
| `availability.ts` | GET /availability/slots (collaboratorId opcional) |
| `analytics.ts` | GET /analytics?period= (6 métricas nuevas) |
| `settings.ts` | GET/PATCH /settings, POST /settings/logo |
| `admin.ts` | Panel super admin |

### Archivos de lógica compartida
```
apps/api/src/lib/
  plan-limits.ts    ✨ NUEVO — tabla central de límites por plan
  prisma.ts
  mailer.ts
```

---

## 6. Schema Prisma (estado actual)

```prisma
model Appointment {
  ...
  origin         String?  @default("walkin")  ← ✨ NUEVO
}

model Package {                               ← ✨ NUEVO
  id          String
  name        String
  description String?
  price       Float
  isActive    Boolean
  businessId  String
  services    PackageService[]
}

model PackageService {                        ← ✨ NUEVO
  id        String
  packageId String
  serviceId String
  @@unique([packageId, serviceId])
}

model Service {
  ...
  packages  PackageService[]                  ← ✨ NUEVO (relación inversa)
}

model Business {
  ...
  packages  Package[]                         ← ✨ NUEVO (relación inversa)
}
```

---

## 7. Planes de Suscripción

### Precios y features

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
1. Cliente llega al trial de 7 días
2. Al vencer → `planStatus: EXPIRED`
3. Cliente va a `/planes`, selecciona plan, escanea QR Plin
4. Envía comprobante al admin
5. Admin activa desde `/admin/negocios/:id`

### QR de pago
- Archivo: `apps/web/public/qr-plin.jpeg`
- Titular: Edgar Russbel Huaman Ramos (Plin)

---

## 8. Panel Super Admin

| Ruta | Descripción |
|---|---|
| `/login` | Login unificado (detecta super admin automáticamente) |
| `/admin/dashboard` | Stats globales + listado de negocios |
| `/admin/negocios/:id` | Gestión de plan, fecha de vencimiento, suspender/reactivar |

**Crear cuenta super admin:**
```bash
cd apps/api
npx tsx src/scripts/create-super-admin.ts
```

---

## 9. Variables de Entorno

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

## 10. Pantallas — Estado Final

| ID | Pantalla | Estado |
|---|---|---|
| AUTH-01 | Login unificado | ✅ Mejorado v6 |
| AUTH-00 a AUTH-05 | Flujo completo auth | ✅ |
| SETUP-01 | Onboarding | ✅ |
| DASH-01 | Dashboard KPIs | ✅ |
| CAL-01 a CAL-04 | Agenda, nueva cita, detalle, cobro | ✅ |
| CLI-01, CLI-02 | Clientes | ✅ |
| STAFF-01, STAFF-02 | Colaboradores | ✅ |
| SRV-01, SRV-02 | Servicios | ✅ |
| PKG-01 a PKG-03 | Paquetes | ✅ Nuevo v6 |
| PLAN-01 | Planes de suscripción | ✅ Nuevo v6 |
| RPT-01 | Reportes con 6 métricas nuevas | ✅ Mejorado v6 |
| CFG-01 a CFG-04 | Configuración completa | ✅ |
| ADMIN-02, ADMIN-03 | Panel super admin | ✅ |

**Total pantallas clientes: 32/32 · Panel admin: 2/2**

---

## 11. Bugs Resueltos en esta Sesión

| Bug | Descripción | Estado |
|---|---|---|
| Login super admin | `/admin/login` era ruta separada | ✅ Fusionado al login normal |
| Remember me | Checkbox no hacía nada | ✅ Cookie con Max-Age dinámico |
| Plan actual en /planes | Badge no aparecía (API no devolvía `plan`) | ✅ Resuelto |
| Retención de clientes | Card sin color ni contexto | ✅ 4 estados visuales |
| Historial clientes | Filtraba por `createdAt` en vez de última visita | ✅ Filtro por citas recientes |
| Colaboradores inactivos | Se contaban para el límite del plan | ✅ Solo cuenta activos |
| "Cualquiera disponible" | No mostraba horarios disponibles | ✅ `collaboratorId` opcional |
| OriginSelector | Solo decorativo, no guardaba datos | ✅ Conectado a BD |
| Flecha en /planes | No existía, no había forma de retroceder | ✅ Barra de título fija |

---

## 12. Deuda Técnica Pendiente

### Alta prioridad
| Item | Descripción |
|---|---|
| Bloqueo por plan vencido | Al hacer login, verificar `planStatus` y redirigir si EXPIRED/SUSPENDED |
| Retención de clientes | Reemplazar la métrica actual por "Clientes nuevos vs recurrentes" (acordado, pendiente de implementar) |

### Media prioridad
| Item | Descripción |
|---|---|
| Exportar Excel | Flag `canExportExcel` en plan-limits listo, falta implementar el endpoint y botón |
| WhatsApp real | CFG-04 tiene UI pero sin integración (BuilderBot o Meta Cloud API) |
| Foto de resultado por cita | Portafolio del negocio — sugerida, no implementada |

### Baja prioridad
| Item | Descripción |
|---|---|
| Culqi / pagos automáticos | Actualmente el plan se activa manualmente |
| Drag & drop en calendario | Evaluar FullCalendar |
| `payments` tabla separada | El pago está inline en `Appointment` |
| Responsividad móvil | Solo desktop |
| `audit_log` | Trazabilidad de acciones críticas |
| Comisiones por colaborador | % sobre servicios atendidos |
| Ficha técnica por cliente | Historial de coloraciones, tratamientos, alergias |

---

## 13. PRs

| PR | Título | Estado |
|---|---|---|
| #23–#30 | Sesiones anteriores | ✅ Mergeados |
| #31 (pendiente) | Panel super admin + planes de suscripción | 🔄 Pendiente de merge |

---

## 14. Próximos Pasos Sugeridos

1. **Merge PR #31** — panel super admin
2. **Bloqueo por plan vencido** — verificar `planStatus` al login y mostrar pantalla de plan vencido
3. **Reemplazar "Retención" por "Nuevos vs Recurrentes"** — acordado en esta sesión
4. **Exportar a Excel** — implementar endpoint y botón en reportes
5. **Deploy a producción** — Vercel (frontend) + Railway (backend) + Supabase (BD)
6. **Foto de resultado por cita** — portafolio del negocio
7. **BuilderBot / WhatsApp** — notificaciones reales

---

## 15. Nota importante para producción

```
TZ=America/Lima          ← en Railway, para cálculos de horarios correctos
FRONTEND_URL=https://tu-dominio.vercel.app
NODE_ENV=production      ← activa flag Secure en las cookies httpOnly
```
