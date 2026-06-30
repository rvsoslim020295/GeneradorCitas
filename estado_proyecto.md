# Estado del Proyecto — GlowManager
> Última actualización: 2026-06-29

---

## Resumen ejecutivo

GlowManager es un SaaS de gestión para negocios de belleza (salones, barberías, spas).
Monorepo con backend API (Hono + Prisma + PostgreSQL) y frontend (Next.js 15 App Router).
Desplegado en **Railway** (API) + **Vercel** (web).

---

## Arquitectura

```
GeneradorCitas/
├── apps/
│   ├── api/                    # Hono.js + Prisma + TypeScript
│   │   ├── src/
│   │   │   ├── index.ts        # Entrada, middlewares globales, cron
│   │   │   ├── routes/         # 12 módulos REST
│   │   │   │   ├── auth.ts
│   │   │   │   ├── appointments.ts
│   │   │   │   ├── availability.ts
│   │   │   │   ├── clients.ts
│   │   │   │   ├── collaborators.ts
│   │   │   │   ├── services.ts
│   │   │   │   ├── packages.ts
│   │   │   │   ├── analytics.ts
│   │   │   │   ├── settings.ts
│   │   │   │   ├── notifications.ts
│   │   │   │   ├── users.ts
│   │   │   │   └── admin.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts          # JWT + tokenVersion
│   │   │   │   ├── admin-auth.ts
│   │   │   │   └── plan-access.ts   # requirePlanAccess
│   │   │   └── lib/
│   │   │       ├── prisma.ts
│   │   │       ├── mailer.ts        # Brevo (email transaccional)
│   │   │       ├── timezone.ts      # safeTimezone, zonedDayRange, etc.
│   │   │       ├── rate-limit.ts
│   │   │       ├── plan-limits.ts
│   │   │       └── plan-scheduler.ts # Cron expiración de trials
│   │   └── generated/prisma/        # Cliente Prisma (regenerado en build)
│   └── web/                    # Next.js 15 App Router + Tailwind CSS 4
│       └── src/
│           ├── app/
│           │   ├── (auth)/         # login, registro, recuperar/resetear contraseña
│           │   ├── (dashboard)/    # agenda, clientes, colaboradores, servicios,
│           │   │                   # paquetes, reportes, configuración, plan-vencido
│           │   ├── admin/          # panel superadmin
│           │   └── api/logout/     # route que borra cookies y redirige
│           ├── components/
│           │   └── layout/
│           │       ├── top-bar.tsx  # Header con dropdown perfil (portal)
│           │       └── sidebar.tsx
│           └── middleware.ts        # Protección de rutas por cookie gm_token
├── prisma/
│   ├── schema.prisma
│   └── migrations/              # 18 migraciones aplicadas
└── nixpacks.toml                # Build: prisma generate + tsc; Start: migrate deploy + node
```

### Modelos de datos principales
`Business` → `User` · `Collaborator` · `Client` · `Service` · `Package` · `Appointment` · `AppointmentEvent`

### Planes
`TRIAL` (7 días, experiencia PRO) → `BASIC` · `PRO` · `PREMIUM` · `EXPIRED` / `SUSPENDED`

---

## Lo hecho en esta sesión (2026-06-29)

### Sprint 2.5 — Float → Decimal (dinero exacto)
- `schema.prisma`: `Float` → `Decimal @db.Decimal(10,2)` en 6 campos:
  `Appointment.price`, `paidAmount`, `depositAmount` · `Client.totalSpent` · `Service.price` · `Package.price`
- Migración SQL `20260610200000_float_to_decimal` (aplicada local y prod)
- `appointments.ts`: cálculo de propina con `Prisma.Decimal`; helper `serializeAppointment` → `number` en frontera JSON
- `services.ts` / `packages.ts` / `clients.ts`: helpers `serSvc` / `serPkg` / `serClient`
- `analytics.ts`: todos los `reduce` usan `Number(a.price)`
- **Verificado**: S/50 × 1.1 = `55.00` exacto en BD y `55` (number) en JSON

### Bugs de producción corregidos hoy
| Commit | Bug | Causa | Fix |
|---|---|---|---|
| `4dbeb3b` | 500 en /availability | `timezone = "Lima\|Lima\|Magdalena del Mar"` | `safeTimezone()` con fallback `America/Lima` |
| `3c8c624` | "Cerrar sesión" cortado en dropdown | `backdrop-filter:blur` crea stacking context | React Portal a `document.body` |
| `0ea70c8` | Cerrar sesión en plan-vencido no redirigía | `apiFetch` lanzaba excepción bloqueando redirect | `window.location.href = "/api/logout"` |
| `c038469` | Bucle de redirecciones al cerrar sesión | Plan-vencido usaba `/login` directo sin borrar cookie | Corregido a `/api/logout` |

---

## Estado de la auditoría de seguridad (PLAN_REMEDIACION.md)

| Sprint | Estado | Descripción |
|---|---|---|
| 0 | ✅ | Hardening arranque: JWT fail-fast, CORS allowlist, error handler global |
| 1 | ✅ | Seguridad acceso: IDOR, mass-assignment, rate-limit, tokenVersion, tokens hasheados |
| 2 | ✅ | Integridad transaccional: advisory locks, anti-doble-cobro, Decimal en dinero |
| 3 | ✅ | Reglas negocio: máquina de estados, límites por plan, soft-delete, trial expiry |
| 4 | ✅ | Zona horaria unificada: `business.timezone` en toda la agenda |
| 5 | ✅ | Scheduler robusto: claim atómico, reentrancia, PII masking, N+1 eliminado |

### Backlog pendiente (baja prioridad, sin urgencia)
- `5.6` Plantilla recordatorio WhatsApp 2h configurable (requiere migración)
- `6.4` Auditoría de acciones admin (tabla de logs)
- `10.3` Validar magic bytes en upload de logo
- `11.1` Analytics: agregación en BD (rendimiento bajo carga alta)
- `11.3` "this_month" = mes calendario real (ahora son 4 semanas fijas)

---

## Variables de entorno requeridas en Railway

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | PostgreSQL Railway |
| `JWT_SECRET` | ≥ 32 chars |
| `ADMIN_JWT_SECRET` | ≥ 32 chars |
| `CORS_ORIGINS` | `https://glowmanager-web.vercel.app` |
| `APP_URL` | `https://glowmanager-web.vercel.app` |
| `BREVO_API_KEY` | Email transaccional |
| `BREVO_SENDER_EMAIL` | Remitente verificado en Brevo |
| `BREVO_SENDER_NAME` | `GlowManager` |
| `TZ` | `America/Lima` |

---

## Acción pendiente en Railway Console (una sola vez)

```sql
UPDATE "Business" SET timezone = 'America/Lima' WHERE timezone NOT LIKE 'America/%';
```

---

## URLs de producción

- **Frontend**: https://glowmanager-web.vercel.app
- **API**: https://generadorcitas-production.up.railway.app
- **Repo**: https://github.com/rvsoslim020295/GeneradorCitas
