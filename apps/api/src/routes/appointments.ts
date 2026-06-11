import { createRouter } from "../lib/hono.js";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requirePlanAccess } from "../middleware/plan-access.js";
import { getLimits } from "../lib/plan-limits.js";

const appointments = createRouter();

appointments.use("*", requireAuth);
appointments.use("*", requirePlanAccess);

// ─── Helper: registrar evento en el historial de la cita ──────────────────────
async function logEvent(appointmentId: string, type: string, description: string) {
  await prisma.appointmentEvent.create({ data: { appointmentId, type, description } });
}

// Error centinela para abortar una transacción cuando la cita ya fue cobrada
// (la carrera la gana otra petición). Se traduce a 400 fuera de la transacción.
class AlreadyPaidError extends Error {}

// Error con respuesta HTTP para abortar una transacción y devolver un código y
// cuerpo específicos fuera de ella (usado en la creación de citas con lock).
class HttpError extends Error {
  constructor(public status: 400 | 403 | 409 | 422, public body: Record<string, unknown>) {
    super();
  }
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente", CONFIRMED: "Confirmada", IN_PROGRESS: "En progreso",
  COMPLETED: "Completada", CANCELLED: "Cancelada", NO_SHOW: "No se presentó", RESCHEDULED: "Reagendada",
};

const ORIGINS = ["whatsapp", "phone", "instagram", "social", "walkin"] as const;

const createSchema = z.object({
  clientId: z.string(),
  collaboratorId: z.string(),
  serviceId: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  price: z.number().nonnegative(),
  notes: z.string().optional(),
  origin: z.enum(ORIGINS).optional().default("walkin"),
}).refine((d) => new Date(d.endTime) > new Date(d.startTime), {
  // Sin esto, un rango invertido (end < start) esquiva la detección de conflictos (auditoría 2.4)
  message: "La hora de fin debe ser posterior a la de inicio",
  path: ["endTime"],
});

const statusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW", "RESCHEDULED"]),
});

const paymentSchema = z.object({
  tipPercent: z.number().min(0).max(1).default(0),
  paymentMethod: z.enum(["card", "cash", "transfer", "app"]),
});

// Incluye las relaciones que el frontend necesita para mostrar el detalle
const appointmentInclude = {
  client: { select: { id: true, name: true, lastName: true, phone: true } },
  collaborator: { select: { id: true, name: true, role: true } },
  service: { select: { id: true, name: true, durationMin: true, bufferMinutes: true, category: true } },
} as const;

// ─── GET /appointments ────────────────────────────────────────────────────────
// Acepta ?search= para filtrar por nombre de cliente o servicio
// Si el usuario es COLLABORATOR con collaboratorId vinculado, solo ve sus propias citas
appointments.get("/", async (c) => {
  const { businessId, role, collaboratorId } = c.get("user");
  const search = c.req.query("search")?.trim() ?? "";

  const ownFilter = role === "COLLABORATOR" && collaboratorId
    ? { collaboratorId }
    : {};

  const data = await prisma.appointment.findMany({
    where: {
      businessId,
      ...ownFilter,
      ...(search && {
        OR: [
          { client:  { name: { contains: search, mode: "insensitive" } } },
          { service: { name: { contains: search, mode: "insensitive" } } },
        ],
      }),
    },
    include: appointmentInclude,
    orderBy: { startTime: "desc" },
  });

  return c.json(data);
});

// ─── GET /appointments/:id ────────────────────────────────────────────────────
appointments.get("/:id", async (c) => {
  const { businessId } = c.get("user");
  const id = c.req.param("id");

  const appointment = await prisma.appointment.findFirst({
    where: { id, businessId },
    include: appointmentInclude,
  });

  if (!appointment) return c.json({ error: "Cita no encontrada" }, 404);

  return c.json(appointment);
});

// ─── POST /appointments ───────────────────────────────────────────────────────
appointments.post("/", async (c) => {
  const { businessId } = c.get("user");
  const body = await c.req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Datos inválidos", details: parsed.error.issues }, 400);
  }

  const { startTime, endTime, collaboratorId } = parsed.data;
  const start = new Date(startTime);
  const end   = new Date(endTime);

  // ── Verificar que cliente, colaborador y servicio sean del negocio ─────────
  // Evita inyección de datos cross-tenant vía IDs de otro negocio (auditoría 2.3).
  const [clientOk, collabOk, serviceOk] = await Promise.all([
    prisma.client.findFirst({ where: { id: parsed.data.clientId, businessId }, select: { id: true } }),
    prisma.collaborator.findFirst({ where: { id: collaboratorId, businessId }, select: { id: true } }),
    prisma.service.findFirst({ where: { id: parsed.data.serviceId, businessId }, select: { id: true, price: true } }),
  ]);
  if (!clientOk || !collabOk || !serviceOk) {
    return c.json({ error: "Cliente, colaborador o servicio no válido" }, 400);
  }

  // El precio lo fija el servidor desde el servicio, no el cliente (auditoría 2.10).
  // Evita manipular el precio de la cita por fuera del catálogo.
  const servicePrice = serviceOk.price;

  // ── Verificar límites del plan ────────────────────────────────────────────
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  const limits = getLimits(business?.plan ?? "BASIC");

  // Límite de citas por mes
  if (limits.maxAppointmentsPerMonth !== -1) {
    const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
    const monthEnd   = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    const monthCount = await prisma.appointment.count({
      where: {
        businessId,
        startTime: { gte: monthStart, lt: monthEnd },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
    });
    if (monthCount >= limits.maxAppointmentsPerMonth) {
      return c.json({
        error: `Has alcanzado el límite de ${limits.maxAppointmentsPerMonth} citas este mes. Actualiza tu plan para continuar.`,
        code: "PLAN_LIMIT_APPOINTMENTS",
      }, 403);
    }
  }

  // Límite de anticipación
  if (limits.maxAdvanceDays !== -1) {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + limits.maxAdvanceDays);
    if (start > maxDate) {
      return c.json({
        error: `Tu plan solo permite agendar citas con hasta ${limits.maxAdvanceDays} días de anticipación. Actualiza tu plan para agendar más adelante.`,
        code: "PLAN_LIMIT_ADVANCE_DAYS",
      }, 403);
    }
  }

  // ── Validar que la cita esté dentro del horario del negocio ──
  if (business?.openTime && business?.closeTime) {
    const tz = process.env.TZ || "America/Lima";
    const [oh, om] = (business.openTime).split(":").map(Number);
    const [ch, cm] = (business.closeTime).split(":").map(Number);
    const openMins  = oh * 60 + om;
    const closeMins = ch * 60 + cm;
    const toMins = (d: Date) => {
      const [h, m] = d.toLocaleTimeString("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).split(":").map(Number);
      return h * 60 + m;
    };
    const startMins = toMins(start);
    const endMins   = toMins(end);

    if (startMins < openMins || endMins > closeMins) {
      return c.json({
        error: `La cita debe estar dentro del horario de atención: ${business.openTime} – ${business.closeTime}.`,
      }, 422);
    }
  }

  // ── Sección crítica serializada con advisory lock por negocio ─────────────
  // Evita dobles reservas y superar el límite mensual bajo concurrencia
  // (auditoría 2.1 / 4.4). Los chequeos de conflicto y la creación ocurren
  // dentro del mismo lock+transacción, así dos peticiones simultáneas no pueden
  // colarse entre el "verificar" y el "crear".
  try {
    const appointment = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`appt:${businessId}`}))`;

      // Re-chequeo autoritativo del límite mensual dentro del lock (auditoría 4.4)
      if (limits.maxAppointmentsPerMonth !== -1) {
        const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
        const monthEnd   = new Date(start.getFullYear(), start.getMonth() + 1, 1);
        const monthCount = await tx.appointment.count({
          where: { businessId, startTime: { gte: monthStart, lt: monthEnd }, status: { notIn: ["CANCELLED", "NO_SHOW"] } },
        });
        if (monthCount >= limits.maxAppointmentsPerMonth) {
          throw new HttpError(403, {
            error: `Has alcanzado el límite de ${limits.maxAppointmentsPerMonth} citas este mes. Actualiza tu plan para continuar.`,
            code: "PLAN_LIMIT_APPOINTMENTS",
          });
        }
      }

      // Cruce de horario del colaborador (excluye canceladas, no-shows, reagendadas y completadas)
      const conflict = await tx.appointment.findFirst({
        where: {
          collaboratorId,
          businessId,
          status: { notIn: ["CANCELLED", "NO_SHOW", "RESCHEDULED", "COMPLETED"] },
          OR: [{ startTime: { lt: end }, endTime: { gt: start } }],
        },
        include: {
          client: { select: { name: true, lastName: true } },
          service: { select: { name: true } },
        },
      });
      if (conflict) {
        const conflictStart = conflict.startTime.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
        const conflictEnd   = conflict.endTime.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
        const clientName    = [conflict.client.name, (conflict.client as { lastName?: string | null }).lastName].filter(Boolean).join(" ");
        throw new HttpError(409, {
          error: `El colaborador ya tiene una cita de ${conflictStart} a ${conflictEnd} con ${clientName} (${conflict.service.name}).`,
          conflictId: conflict.id,
        });
      }

      // Cruce del cliente: no puede tener dos citas activas al mismo tiempo
      const clientConflict = await tx.appointment.findFirst({
        where: {
          clientId: parsed.data.clientId,
          businessId,
          status: { notIn: ["CANCELLED", "NO_SHOW", "RESCHEDULED", "COMPLETED"] },
          startTime: { lt: end },
          endTime:   { gt: start },
        },
        include: {
          service:      { select: { name: true } },
          collaborator: { select: { name: true } },
        },
      });
      if (clientConflict) {
        const cs = clientConflict.startTime.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
        const ce = clientConflict.endTime.toLocaleTimeString("es-MX",   { hour: "2-digit", minute: "2-digit", hour12: false });
        throw new HttpError(409, {
          error: `El cliente ya tiene una cita de ${cs} a ${ce} para ${clientConflict.service.name} con ${clientConflict.collaborator.name}.`,
          conflictId: clientConflict.id,
        });
      }

      const created = await tx.appointment.create({
        data: { ...parsed.data, price: servicePrice, startTime: start, endTime: end, businessId },
        include: appointmentInclude,
      });
      await tx.appointmentEvent.create({
        data: { appointmentId: created.id, type: "CREATED", description: "Cita creada" },
      });
      return created;
    });

    return c.json(appointment, 201);
  } catch (e) {
    if (e instanceof HttpError) return c.json(e.body, e.status);
    throw e;
  }
});

// ─── PATCH /appointments/:id/status ──────────────────────────────────────────
// Cambia el estado de la cita: CONFIRMED, COMPLETED, CANCELLED, NO_SHOW
appointments.patch("/:id/status", async (c) => {
  const { businessId } = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Estado inválido" }, 400);
  }

  const [existing, business] = await Promise.all([
    prisma.appointment.findFirst({ where: { id, businessId } }),
    prisma.business.findUnique({ where: { id: businessId }, select: { cancellationHours: true, reschedulingHours: true } }),
  ]);
  if (!existing) return c.json({ error: "Cita no encontrada" }, 404);

  const newStatus = parsed.data.status;

  // ── Máquina de estados: solo transiciones válidas (auditoría 2.6) ─────────
  // Los estados terminales no admiten más cambios (no reabrir citas cerradas).
  const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    PENDING:     ["CONFIRMED", "IN_PROGRESS", "CANCELLED", "NO_SHOW", "RESCHEDULED"],
    CONFIRMED:   ["IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW", "RESCHEDULED"],
    IN_PROGRESS: ["COMPLETED", "CANCELLED"],
    COMPLETED:   [],
    CANCELLED:   [],
    NO_SHOW:     [],
    RESCHEDULED: [],
  };
  if (newStatus !== existing.status && !ALLOWED_TRANSITIONS[existing.status]?.includes(newStatus)) {
    return c.json({
      error: `No se puede cambiar el estado de ${STATUS_LABELS[existing.status] ?? existing.status} a ${STATUS_LABELS[newStatus] ?? newStatus}.`,
      code: "INVALID_STATUS_TRANSITION",
    }, 422);
  }

  // ── Validar política de cancelación ──────────────────────────────────────
  if (newStatus === "CANCELLED" && business?.cancellationHours) {
    const hoursUntil = (new Date(existing.startTime).getTime() - Date.now()) / 36e5;
    if (hoursUntil > 0 && hoursUntil < business.cancellationHours) {
      return c.json({
        error: `No se puede cancelar esta cita. La política del local exige al menos ${business.cancellationHours} horas de anticipación (faltan ${Math.round(hoursUntil)} h).`,
        code: "POLICY_CANCELLATION",
      }, 422);
    }
  }

  // ── Validar política de reagendamiento ────────────────────────────────────
  if (newStatus === "RESCHEDULED" && business?.reschedulingHours) {
    const hoursUntil = (new Date(existing.startTime).getTime() - Date.now()) / 36e5;
    if (hoursUntil > 0 && hoursUntil < business.reschedulingHours) {
      return c.json({
        error: `No se puede reagendar esta cita. La política del local exige al menos ${business.reschedulingHours} horas de anticipación (faltan ${Math.round(hoursUntil)} h).`,
        code: "POLICY_RESCHEDULING",
      }, 422);
    }
  }

  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status: newStatus },
    include: appointmentInclude,
  });

  await logEvent(id, "STATUS_CHANGED",
    `Estado cambiado a ${STATUS_LABELS[newStatus] ?? newStatus}`
  );

  return c.json(appointment);
});

// ─── POST /appointments/:id/payment ──────────────────────────────────────────
// Registra el pago de una cita:
// 1. Calcula el total con propina
// 2. Guarda paidAmount + paymentMethod (NO cambia el status)
// 3. Actualiza totalVisits y totalSpent del cliente
appointments.post("/:id/payment", async (c) => {
  const { businessId } = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = paymentSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Datos de pago inválidos" }, 400);
  }

  const existing = await prisma.appointment.findFirst({
    where: { id, businessId },
  });
  if (!existing) return c.json({ error: "Cita no encontrada" }, 404);
  if (existing.paidAmount !== null) {
    return c.json({ error: "Esta cita ya fue cobrada" }, 400);
  }
  if (["CANCELLED", "NO_SHOW"].includes(existing.status)) {
    return c.json({ error: "No se puede cobrar una cita cancelada o con inasistencia" }, 400);
  }

  const { tipPercent, paymentMethod } = parsed.data;
  const totalWithTip = existing.price * (1 + tipPercent);

  // El guard anti-doble-cobro se aplica DENTRO de la transacción con un
  // updateMany condicional (paidAmount: null). Si dos pagos concurrentes llegan
  // a la vez, solo uno actualiza (count===1); el otro aborta (auditoría 2.2).
  // El evento de pago se registra en la misma transacción (auditoría 2.9).
  try {
    const result = await prisma.$transaction(async (tx) => {
      const upd = await tx.appointment.updateMany({
        where: { id, businessId, paidAmount: null, status: { notIn: ["CANCELLED", "NO_SHOW"] } },
        data: { tipPercent, paymentMethod, paidAmount: totalWithTip },
      });
      if (upd.count === 0) throw new AlreadyPaidError();

      await tx.client.update({
        where: { id: existing.clientId },
        data: {
          totalVisits: { increment: 1 },
          totalSpent: { increment: totalWithTip },
        },
      });

      await tx.appointmentEvent.create({
        data: {
          appointmentId: id,
          type: "PAYMENT_REGISTERED",
          description: `Pago registrado: S/${totalWithTip.toFixed(2)} vía ${paymentMethod}`,
        },
      });

      return tx.appointment.findUnique({ where: { id }, include: appointmentInclude });
    });

    return c.json(result);
  } catch (e) {
    if (e instanceof AlreadyPaidError) {
      return c.json({ error: "Esta cita ya fue cobrada" }, 400);
    }
    throw e;
  }
});

// ─── POST /appointments/:id/deposit ──────────────────────────────────────────
// Registra un anticipo parcial en la cita
appointments.post("/:id/deposit", async (c) => {
  const { businessId } = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);

  const parsed = z.object({ depositAmount: z.number().positive() }).safeParse(body);
  if (!parsed.success) return c.json({ error: "Monto de anticipo inválido" }, 400);

  // ── Verificar que el plan permita anticipos ───────────────────────────────
  const biz = await prisma.business.findUnique({ where: { id: businessId } });
  const limits = getLimits(biz?.plan ?? "BASIC");
  if (!limits.canUseDeposits) {
    return c.json({
      error: "Tu plan actual no incluye el registro de anticipos. Actualiza tu plan para usar esta función.",
      code: "PLAN_LIMIT_DEPOSITS",
    }, 403);
  }

  const existing = await prisma.appointment.findFirst({ where: { id, businessId } });
  if (!existing) return c.json({ error: "Cita no encontrada" }, 404);
  if (existing.status === "COMPLETED") return c.json({ error: "La cita ya fue cobrada" }, 400);

  if (parsed.data.depositAmount > existing.price) {
    return c.json({
      error: `El anticipo no puede superar el precio del servicio (S/${existing.price.toFixed(2)}).`,
    }, 422);
  }

  const appointment = await prisma.appointment.update({
    where: { id },
    data: { depositAmount: parsed.data.depositAmount },
    include: appointmentInclude,
  });

  await logEvent(id, "DEPOSIT_REGISTERED",
    `Anticipo registrado: S/${parsed.data.depositAmount.toFixed(2)}`
  );

  return c.json(appointment);
});

// ─── GET /appointments/:id/events ────────────────────────────────────────────
appointments.get("/:id/events", async (c) => {
  const { businessId } = c.get("user");
  const id = c.req.param("id");

  const appointment = await prisma.appointment.findFirst({ where: { id, businessId } });
  if (!appointment) return c.json({ error: "Cita no encontrada" }, 404);

  const events = await prisma.appointmentEvent.findMany({
    where: { appointmentId: id },
    orderBy: { createdAt: "desc" },
  });

  return c.json(events);
});

export default appointments;
