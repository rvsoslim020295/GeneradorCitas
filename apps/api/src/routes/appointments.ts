import { Hono } from "hono";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const appointments = new Hono();

appointments.use("*", requireAuth);

const createSchema = z.object({
  clientId: z.string(),
  collaboratorId: z.string(),
  serviceId: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  price: z.number().nonnegative(),
  notes: z.string().optional(),
});

const statusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]),
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
appointments.get("/", async (c) => {
  const { businessId } = c.get("user");
  const search = c.req.query("search")?.trim() ?? "";

  const data = await prisma.appointment.findMany({
    where: {
      businessId,
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
  const end = new Date(endTime);

  // Verificar cruce de horario del colaborador (excluye canceladas y no-shows)
  const conflict = await prisma.appointment.findFirst({
    where: {
      collaboratorId,
      businessId,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      OR: [
        // Nueva cita empieza dentro de una existente
        { startTime: { lt: end }, endTime: { gt: start } },
      ],
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
    return c.json({
      error: `El colaborador ya tiene una cita de ${conflictStart} a ${conflictEnd} con ${clientName} (${conflict.service.name}).`,
      conflictId: conflict.id,
    }, 409);
  }

  // Verificar cruce del cliente: no puede tener dos citas activas al mismo tiempo
  const clientConflict = await prisma.appointment.findFirst({
    where: {
      clientId: parsed.data.clientId,
      businessId,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
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
    return c.json({
      error: `El cliente ya tiene una cita de ${cs} a ${ce} para ${clientConflict.service.name} con ${clientConflict.collaborator.name}.`,
      conflictId: clientConflict.id,
    }, 409);
  }

  const appointment = await prisma.appointment.create({
    data: {
      ...parsed.data,
      startTime: start,
      endTime: end,
      businessId,
    },
    include: appointmentInclude,
  });

  return c.json(appointment, 201);
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

  const existing = await prisma.appointment.findFirst({
    where: { id, businessId },
  });
  if (!existing) return c.json({ error: "Cita no encontrada" }, 404);

  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status: parsed.data.status },
    include: appointmentInclude,
  });

  return c.json(appointment);
});

// ─── POST /appointments/:id/payment ──────────────────────────────────────────
// Registra el pago de una cita:
// 1. Calcula el total con propina
// 2. Marca la cita como COMPLETED con método de pago
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
  if (existing.status === "COMPLETED") {
    return c.json({ error: "Esta cita ya fue cobrada" }, 400);
  }

  const { tipPercent, paymentMethod } = parsed.data;
  const totalWithTip = existing.price * (1 + tipPercent);

  // Usamos una transacción para que todo se actualice junto o nada se actualice
  const result = await prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.update({
      where: { id },
      data: {
        status: "COMPLETED",
        tipPercent,
        paymentMethod,
        price: totalWithTip,
      },
      include: appointmentInclude,
    });

    // Actualiza las métricas acumuladas del cliente
    await tx.client.update({
      where: { id: existing.clientId },
      data: {
        totalVisits: { increment: 1 },
        totalSpent: { increment: totalWithTip },
      },
    });

    return appointment;
  });

  return c.json(result);
});

// ─── POST /appointments/:id/deposit ──────────────────────────────────────────
// Registra un anticipo parcial en la cita
appointments.post("/:id/deposit", async (c) => {
  const { businessId } = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);

  const parsed = z.object({ depositAmount: z.number().positive() }).safeParse(body);
  if (!parsed.success) return c.json({ error: "Monto de anticipo inválido" }, 400);

  const existing = await prisma.appointment.findFirst({ where: { id, businessId } });
  if (!existing) return c.json({ error: "Cita no encontrada" }, 404);
  if (existing.status === "COMPLETED") return c.json({ error: "La cita ya fue cobrada" }, 400);

  const appointment = await prisma.appointment.update({
    where: { id },
    data: { depositAmount: parsed.data.depositAmount },
    include: appointmentInclude,
  });

  return c.json(appointment);
});

export default appointments;
