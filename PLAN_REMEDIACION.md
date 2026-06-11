# Plan de Remediación por Sprints — GeneradorCitas (GlowManager)

> Generado a partir de la auditoría de los 12 módulos. Cada hallazgo conserva su ID original (ej. `1.1`).
> Estado: ☐ pendiente · ◐ en progreso · ☑ hecho

---

## Sprint 0 — Hardening de arranque (1-2 días) · "Que no explote en silencio"
Fixes aislados, bajo riesgo, sin cambios de schema. Se pueden hacer y desplegar de inmediato.

| Estado | ID | Hallazgo | Archivo |
|:--:|---|---|---|
| ☑ | 1.1 | Secreto JWT con fallback hardcodeado → fail-fast | `lib/env.ts`, `middleware/auth.ts`, `middleware/admin-auth.ts` |
| ☑ | 1.2 | CORS reflectante + credenciales → allowlist | `index.ts` |
| ☑ | 1.6 | `/auth/test-email` abierto → protegido con `requireSuperAdmin` | `routes/auth.ts` |
| ☑ | 12.1 | Sin `app.onError` global → handler de errores Prisma | `index.ts` |
| ☑ | 12.2 | `APP_URL` default localhost → exigir en prod | `lib/mailer.ts` |
| ☑ | 3.3 | `slotMinutes=0` → bucle infinito (guarda defensiva) | `routes/availability.ts` |

**Criterio de salida:** el servidor falla al arrancar si faltan secretos; CORS solo acepta orígenes conocidos; ningún 500 opaco por errores Prisma esperables. ✅ **COMPLETADO**

> ⚠️ **Acción de despliegue requerida:** configurar en Railway las variables `JWT_SECRET` y `ADMIN_JWT_SECRET` (≥32 chars), `CORS_ORIGINS` (dominios del frontend separados por coma) y `APP_URL`. Sin ellas el arranque en producción fallará intencionalmente.

---

## Sprint 1 — Seguridad de acceso y datos (3-5 días) · "Cerrar las puertas"
Vulnerabilidades de acceso explotables sin condiciones especiales.

| Estado | ID | Hallazgo | Archivo |
|:--:|---|---|---|
| ☑ | 8.1 | Mass-assignment en `PATCH /clients/:id` | `routes/clients.ts` |
| ☑ | 2.3 | FKs sin validar tenancy (IDOR cross-tenant en citas) | `routes/appointments.ts` |
| ☑ | 4.1 | `planStatus` no se valida → middleware `requirePlanAccess` | `middleware/plan-access.ts` + rutas |
| ☑ | 1.3 | Enumeración de usuarios en login (+ frontend) | `routes/auth.ts`, `web/login/page.tsx` |
| ☑ | 1.4 / 6.6 | Rate-limiting en auth y admin login (+ frontend 429) | `lib/rate-limit.ts`, `routes/auth.ts`, `routes/admin.ts`, `web/login` |
| ☑ | 1.5 | Reset invalida JWT previos (tokenVersion) | migración + `middleware/auth.ts` + `auth.ts` |
| ☑ | 1.9 | Tokens de reset/verificación hasheados (sha256) | `auth.ts` |

**Criterio de salida:** ningún usuario puede tocar datos de otro tenant; suspender un negocio lo bloquea; login no filtra existencia; reset invalida sesiones. ✅ **SPRINT 1 COMPLETADO**

> 🔴 **ACCIÓN DE DESPLIEGUE CRÍTICA (1.5):** el pipeline de Railway (`nixpacks.toml`) NO corre `prisma migrate deploy`. Antes (o durante) el deploy de este código a producción hay que ejecutar la migración `20260610160000_add_token_version` contra la BD de producción (`pnpm exec prisma migrate deploy`). Si se despliega el código sin la columna `tokenVersion`, `requireAuth` fallará en cada request autenticado → caída total. Recomendado: añadir `pnpm exec prisma migrate deploy` al `[phases.build]` o a un pre-deploy de Railway.

> ℹ️ Bonus: al regenerar el JWT de `/verify-email` se incluyó `collaboratorId`, lo que de paso corrige el hallazgo **1.8** (token sin `collaboratorId`).

> ⚠️ Nota de rendimiento: `requireAuth` ahora hace 1 consulta (tokenVersion) y `requirePlanAccess` otra (planStatus) por request autenticado. Optimizable a futuro combinándolas en un solo lookup.

---

## Sprint 2 — Integridad transaccional y dinero (4-6 días) · "Que no se pierda ni un centavo"
Race conditions y consistencia financiera. Requiere pruebas de concurrencia.

| Estado | ID | Hallazgo | Archivo |
|:--:|---|---|---|
| ☑ | 2.2 | Doble cobro: guard dentro de transacción (updateMany condicional) | `routes/appointments.ts` |
| ☑ | 2.1 | TOCTOU doble reserva: advisory lock por negocio | `routes/appointments.ts` |
| ☑ | 2.9 | `logEvent` (pago) dentro de la transacción | `routes/appointments.ts` |
| ☑ | 8.2 | Fusión de clientes destruye fichas clínicas | `routes/clients.ts` |
| ☑ | 9.1 | Paquete: `deleteMany`+`createMany` sin transacción | `routes/packages.ts` |
| ☑ | 6.1 | Orden de borrado de negocio viola FKs | `routes/admin.ts` |
| ☐ | 2.5 | Dinero en `Float` → migrar a `Decimal` | schema + cálculos |
| ☑ | 4.4 | check-then-act de límites → advisory lock (citas, colaboradores, paquetes) | `appointments.ts`, `collaborators.ts`, `packages.ts` |

**Criterio de salida:** doble clic / reintentos no producen doble cobro ni doble reserva; ninguna fusión o borrado pierde datos; el dinero cuadra al centavo. ✅ **SPRINT 2 COMPLETADO** (excepto 2.5, pospuesto)

> 2.5 (dinero a Decimal) queda pendiente por decisión del usuario — se abordará en una sesión dedicada.
> Verificado en runtime con pruebas de concurrencia: 8 reservas simultáneas → 1 creada; 4 pagos → 1 aceptado; 5 colaboradores en BASIC → 2 creados; merge preserva fichas; delete de negocio con dependencias OK.

---

## Sprint 3 — Reglas de negocio y máquina de estados (3-4 días)
Lógica de negocio correcta y enforcement de planes.

| Estado | ID | Hallazgo | Archivo |
|:--:|---|---|---|
| ☑ | 2.6 | Máquina de estados en cambios de status | `routes/appointments.ts` |
| ☑ | 2.4 | Validar `endTime > startTime` | `routes/appointments.ts` |
| ☑ | 2.10 | `price` derivado del servicio en backend | `routes/appointments.ts` |
| ☑ | 4.2 | Trial expira con cron diario + pasada al arrancar | `lib/plan-scheduler.ts`, `index.ts` |
| ☑ | 4.3 | Re-chequeo de límite al reactivar `isActive` | `collaborators.ts`, `packages.ts` |
| ☑ | 6.3 | Downgrade avisa qué excede el nuevo plan (no destructivo) | `routes/admin.ts` |
| ☑ | 8.3 | `clientHistoryDays` aplicado por plan | `routes/clients.ts` |
| ☑ | 7.1 / 10.1 | Soft-delete de colaborador/servicio con historial | `collaborators.ts`, `services.ts` |

**Verificado en runtime: 12/12 PASS** (trial expira, end<=start rechazado, precio derivado, transiciones de estado, soft-delete, historial por plan, reactivación con límite).

**Criterio de salida:** transiciones de cita válidas; planes realmente limitan; borrados seguros.

---

## Sprint 4 — Zona horaria unificada (2-3 días) · "Una sola verdad temporal"
Fix transversal: usar `business.timezone` en todos los cálculos.

| Estado | ID | Hallazgo | Archivo |
|:--:|---|---|---|
| ☑ | 6.2 | `business.timezone` usado en reservas (no más hardcode Lima) | `availability.ts`, `appointments.ts` |
| ☑ | 3.2 | Ventana del día con `zonedDayRange` en TZ del negocio | `lib/timezone.ts`, `availability.ts` |
| ☑ | 2.7 | Límite mensual en TZ del negocio (4.8 advance-days queda como comparación de instante, aceptable) | `routes/appointments.ts` |
| ☑ | 11.2 | Analytics: `TZ=America/Lima` en el proceso alinea los cálculos con `Date` local | env var + `nixpacks` |
| ☑ | 10.2 | Validación de IANA timezone y formato `HH:MM` en settings | `routes/settings.ts` |

**Criterio de salida:** todas las horas mostradas, validadas y recordadas coinciden con la TZ del negocio. ✅ **SPRINT 4 COMPLETADO** (negocios todos en Perú/Lima, backfill a `America/Lima`).

**Verificado: 17/17** (helper de TZ 10/10 + integración 7/7).

> 🔴 **ACCIÓN DE DESPLIEGUE:** añadir `TZ=America/Lima` a las variables de Railway (la API hoy corre en UTC). Esto alinea los cálculos de analytics que usan `Date` local del proceso.

---

## Sprint 5 — Scheduler, rendimiento y pulido (3-4 días)

| Estado | ID | Hallazgo | Archivo |
|:--:|---|---|---|
| ☑ | 5.2 | Ventana abierta con recuperación de corridas perdidas | `reminder-scheduler.ts` |
| ☑ | 5.3 | try/catch por cita → sin fallo en cascada | `reminder-scheduler.ts` |
| ☑ | 5.1 | Claim atómico (`updateMany` condicional) anti-duplicado | `reminder-scheduler.ts` |
| ☑ | 5.7 | Guarda de reentrancia en el cron | `reminder-scheduler.ts` |
| ☑ | 5.8 | Filtra teléfonos vacíos/ inválidos | `reminder-scheduler.ts` |
| ☑ | 5.5 | Logs sin PII (teléfono enmascarado, sin URL) | `reminder-scheduler.ts` |
| ☑ | 3.1 | N+1 en availability eliminado (consulta única + agrupado) | `routes/availability.ts` |
| ☑ | 12.3 | Graceful shutdown de Prisma (SIGTERM/SIGINT) | `index.ts` |
| ⏸️ | 11.1 | Analytics agregación en BD — **pospuesto** (riesgo/valor) | `routes/analytics.ts` |
| ✔️ | 5.4 | Recordatorios manuales: enlace wa.me en el evento, scheduler robusto | `reminder-scheduler.ts` |

**Criterio de salida:** recordatorios robustos e idempotentes; dashboards rápidos bajo carga. ✅ **SPRINT 5 COMPLETADO** (11.1 pospuesto).

**Verificado: scheduler 7/7 + availability N+1 (Col1 ocupado / Col2 libre / agregado correcto).**

---

## Backlog (baja prioridad)
**Hechos en el lote de backlog:**
- ☑ `4.5` getLimits loguea plan desconocido (no degrada en silencio)
- ☑ `4.6` TRIAL ahora = experiencia PRO (incentiva conversión)
- ☑ `6.5` id inexistente en admin → 404 vía `onError` global (cubierto en Sprint 0)
- ☑ `6.7` `planExpiresAt` no puede ser pasado en plan ACTIVE
- ☑ `7.2` validación profunda de `schedule` (HH:MM + end>start)
- ☑ `7.3` = 4.3 (ya hecho en Sprint 3)
- ☑ `8.4` merge usa `||` (cubre cadena vacía, no solo null)
- ☑ `12.4` email-validator: carga defensiva + bloquea subdominios desechables
- ☑ `5.7`, `5.8` (hechos en Sprint 5)

**Quedan en backlog (cosméticos / decisión):**
- `5.6` plantilla 2h hardcodeada (requiere campo `waTplReminder2h` + migración)
- `6.4` auditoría admin (pospuesto por decisión del usuario)
- `10.3` logo: validar magic bytes (hardening menor)
- `11.3` "this_month" = 4 semanas, no mes calendario (etiqueta/UX)
- `2.5` dinero `Float` → `Decimal` (migración invasiva)
- `11.1` analytics: agregación en BD (rendimiento)

---

## Notas de ejecución
- **Cambios de schema** (1.5, 1.9, 2.5, 6.1, 2.1) requieren migración Prisma → agrupar y probar en staging.
- Cada sprint cierra con pruebas manuales del flujo afectado antes de mergear.
- Sprint 0 y 1 son los de mayor relación impacto/esfuerzo: priorizar.

---

## PLAN LISTO — 2.5: dinero `Float` → `Decimal` (próxima sesión)

> Objetivo: eliminar el error de redondeo IEEE-754 acumulado en dinero. Migración
> + ajuste de cálculos + serialización. Riesgo medio-alto (toca dinero y el
> contrato JSON con el frontend). Hacer en rama propia `fix/auditoria-2.5-decimal`.

### 1. Campos afectados (schema.prisma)
Cambiar `Float` → `Decimal @db.Decimal(10,2)`:
- `Appointment.price`, `Appointment.paidAmount` (nullable), `Appointment.depositAmount` (nullable)
- `Client.totalSpent`
- `Service.price`
- `Package.price`

`Appointment.tipPercent` es una **fracción** (0–1), no dinero → dejar como `Float`
o pasar a `Decimal @db.Decimal(5,4)`. Recomendado: dejarlo `Float` para no
complicar (se multiplica, no se acumula).

### 2. Migración SQL (crear manual, como las anteriores por el drift local)
Postgres castea `double precision` → `numeric` sin pérdida visible:
```sql
ALTER TABLE "Appointment" ALTER COLUMN "price" TYPE numeric(10,2);
ALTER TABLE "Appointment" ALTER COLUMN "paidAmount" TYPE numeric(10,2);
ALTER TABLE "Appointment" ALTER COLUMN "depositAmount" TYPE numeric(10,2);
ALTER TABLE "Client" ALTER COLUMN "totalSpent" TYPE numeric(10,2);
ALTER TABLE "Service" ALTER COLUMN "price" TYPE numeric(10,2);
ALTER TABLE "Package" ALTER COLUMN "price" TYPE numeric(10,2);
```
Aplicar con `prisma db execute` + `prisma migrate resolve --applied` (patrón usado
en `20260610160000_add_token_version` por el drift de la BD local).

### 3. Cálculos a ajustar (Prisma devuelve `Prisma.Decimal`)
- `routes/appointments.ts` POST `/:id/payment`: `existing.price * (1 + tipPercent)`
  → usar `new Prisma.Decimal(existing.price).mul(1 + tipPercent)`. El `increment`
  de `totalSpent` admite `Decimal`. Redondear a 2 decimales.
- `routes/appointments.ts` `/:id/deposit`: comparación `depositAmount > price` →
  usar `.gt()` / convertir.
- `routes/analytics.ts`: TODAS las reducciones `reduce((s,a)=>s+a.price,0)` y
  `paidAmount ?? price` → operar con `Prisma.Decimal` o convertir a number con
  `Number(x)` solo al final para los KPIs (acepta pérdida en agregados de
  display, no en persistencia). Heatmap/topClients/topServices igual.
- `routes/analytics.ts` export Excel: `xlsx` quiere numbers → `Number(decimal)`.

### 4. Serialización JSON ⚠️ (lo más delicado)
Prisma serializa `Decimal` como **string** en JSON (`"50.00"`, no `50`). El
frontend hace `price.toFixed(2)` y aritmética asumiendo `number` → **se rompería**.
Dos opciones:
- **(A, recomendada)** Convertir a `number` en la frontera de salida: mapear las
  respuestas de citas/servicios/paquetes/clientes con `Number(x)` antes de
  `c.json(...)`. Mantiene el contrato actual del frontend intacto.
- **(B)** Actualizar el frontend para parsear strings (`Number(price)`) en cada
  uso. Más invasivo y propenso a olvidos.

### 5. Verificación (runtime, como en los sprints)
- Pago: `S/100 * 1.1 = 110.00` exacto (no `110.00000000000001`).
- `client.totalSpent` tras varios pagos cuadra al centavo.
- Analytics: `serviceRevenue`, `totalRevenue`, `tipRevenue` correctos.
- Export Excel abre con números, no strings.
- Frontend (agenda, cobro, analíticas) muestra montos bien.

### 6. Despliegue
- Migración se aplica sola con `migrate deploy` en el `start` de Railway.
- No requiere env vars nuevas.
