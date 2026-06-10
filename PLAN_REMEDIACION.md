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
| ☐ | 2.6 | Máquina de estados en cambios de status | `routes/appointments.ts` |
| ☐ | 2.4 | Validar `endTime > startTime` | `routes/appointments.ts` |
| ☐ | 2.10 | `price` del cliente sin contrastar con el servicio | `routes/appointments.ts` |
| ☐ | 4.2 | Trial nunca expira → cron de expiración | nuevo scheduler |
| ☐ | 4.3 | Bypass de límite vía PATCH `isActive` | `collaborators.ts`, `packages.ts` |
| ☐ | 6.3 | Downgrade de plan sin reconciliar datos | `routes/admin.ts` |
| ☐ | 8.3 | `clientHistoryDays` ignorado | `routes/clients.ts` |
| ☐ | 7.1 / 10.1 | Borrado físico de colaborador/servicio sin chequeo → soft-delete | `collaborators.ts`, `services.ts` |

**Criterio de salida:** transiciones de cita válidas; planes realmente limitan; borrados seguros.

---

## Sprint 4 — Zona horaria unificada (2-3 días) · "Una sola verdad temporal"
Fix transversal: usar `business.timezone` en todos los cálculos.

| Estado | ID | Hallazgo | Archivo |
|:--:|---|---|---|
| ☐ | 6.2 | `business.timezone` ignorado por reservas | `availability.ts`, `appointments.ts` |
| ☐ | 3.2 | Ventana del día en TZ del proceso | `routes/availability.ts` |
| ☐ | 2.7 / 4.8 | Límites mensuales/anticipación en TZ del proceso | `routes/appointments.ts` |
| ☐ | 11.2 | Heatmap/cortes de analytics en TZ del proceso | `routes/analytics.ts` |
| ☐ | 10.2 | Validar IANA timezone y formato `HH:MM` en settings | `routes/settings.ts` |

**Criterio de salida:** todas las horas mostradas, validadas y recordadas coinciden con la TZ configurada del negocio.

---

## Sprint 5 — Scheduler, rendimiento y pulido (3-4 días)

| Estado | ID | Hallazgo | Archivo |
|:--:|---|---|---|
| ☐ | 5.2 | Ventana 2h: recordatorio perdido si se salta una corrida | `reminder-scheduler.ts` |
| ☐ | 5.3 | Sin try/catch por cita → fallo en cascada | `reminder-scheduler.ts` |
| ☐ | 5.1 | Doble envío con múltiples instancias (claim atómico) | `reminder-scheduler.ts` |
| ☐ | 3.1 | N+1 en availability | `routes/availability.ts` |
| ☐ | 11.1 | Analytics carga todo en memoria → agregación en BD | `routes/analytics.ts` |
| ☐ | 5.4 | Semántica de "enviado" del recordatorio | `reminder-scheduler.ts` + UI |
| ☐ | 5.5 | PII en logs | `reminder-scheduler.ts` |
| ☐ | 12.3 | Prisma sin graceful shutdown | `lib/prisma.ts`, `index.ts` |

**Criterio de salida:** recordatorios robustos e idempotentes; dashboards rápidos bajo carga.

---

## Backlog (baja prioridad)
`4.5` (getLimits log), `4.6` (TRIAL=BASIC), `5.6`, `5.7`, `5.8`, `6.4` (auditoría admin), `6.5`, `6.7`, `7.2`, `7.3`, `8.4`, `10.3`, `11.3`, `12.4`.

---

## Notas de ejecución
- **Cambios de schema** (1.5, 1.9, 2.5, 6.1, 2.1) requieren migración Prisma → agrupar y probar en staging.
- Cada sprint cierra con pruebas manuales del flujo afectado antes de mergear.
- Sprint 0 y 1 son los de mayor relación impacto/esfuerzo: priorizar.
