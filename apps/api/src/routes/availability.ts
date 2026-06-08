import { Hono } from "hono";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const availability = new Hono();

availability.use("*", requireAuth);

type DaySchedule = { enabled: boolean; start: string; end: string };
type WeekSchedule = Record<string, DaySchedule>;

const DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Convierte "HH:MM" a minutos desde medianoche
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// ─── GET /availability/slots ──────────────────────────────────────────────────
// Devuelve los slots de tiempo disponibles para un colaborador + servicio + fecha.
//
// Query params:
//   collaboratorId  — UUID del colaborador
//   serviceId       — UUID del servicio
//   date            — fecha en formato YYYY-MM-DD (zona horaria del negocio)
//
// Respuesta: { slots: ["09:00", "09:30", ...], slotDuration: 30 }
availability.get("/slots", async (c) => {
  const { businessId } = c.get("user");

  const collaboratorId = c.req.query("collaboratorId") || null; // opcional
  const serviceId      = c.req.query("serviceId");
  const date           = c.req.query("date"); // YYYY-MM-DD

  if (!serviceId || !date) {
    return c.json({ error: "Se requieren serviceId y date" }, 400);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return c.json({ error: "Formato de fecha inválido. Usa YYYY-MM-DD" }, 400);
  }

  const [service, business] = await Promise.all([
    prisma.service.findFirst({ where: { id: serviceId, businessId } }),
    prisma.business.findUnique({ where: { id: businessId } }),
  ]);

  if (!service)  return c.json({ error: "Servicio no encontrado" }, 404);
  if (!business) return c.json({ error: "Negocio no encontrado" }, 404);

  // Si no se especificó colaborador, usar todos los activos
  const collaborators = collaboratorId
    ? await prisma.collaborator.findMany({ where: { id: collaboratorId, businessId, isActive: true } })
    : await prisma.collaborator.findMany({ where: { businessId, isActive: true } });

  if (collaborators.length === 0) {
    return c.json({ slots: [], slotDuration: business.slotMinutes, reason: "Sin colaboradores disponibles" });
  }

  const dateObj  = new Date(`${date}T12:00:00`);
  const dayKey   = DAY_KEYS[dateObj.getDay()];
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd   = new Date(`${date}T23:59:59.999Z`);

  const totalMinutes  = service.durationMin + (service.bufferMinutes ?? 0);
  const slotStep      = business.slotMinutes;
  const businessOpen  = timeToMinutes(business.openTime  ?? "00:00");
  const businessClose = timeToMinutes(business.closeTime ?? "23:59");

  const now = new Date();
  const isToday    = date === now.toISOString().split("T")[0];
  const nowMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : 0;

  // Para cada slot, guardar qué colaborador lo tiene libre (el primero encontrado)
  const slotCollaboratorMap: Record<string, string> = {};

  for (const collab of collaborators) {
    const schedule    = (collab.schedule ?? null) as WeekSchedule | null;
    const daySchedule = schedule?.[dayKey];
    if (!daySchedule?.enabled) continue;

    const workStart = Math.max(timeToMinutes(daySchedule.start), businessOpen);
    const workEnd   = Math.min(timeToMinutes(daySchedule.end),   businessClose);

    const existingApts = await prisma.appointment.findMany({
      where: {
        collaboratorId: collab.id,
        businessId,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        startTime: { gte: dayStart, lte: dayEnd },
      },
      select: { startTime: true, endTime: true },
    });

    const busyRanges = existingApts.map(apt => ({
      start: apt.startTime.getHours() * 60 + apt.startTime.getMinutes(),
      end:   apt.endTime.getHours()   * 60 + apt.endTime.getMinutes(),
    }));

    for (let slotStart = workStart; slotStart + totalMinutes <= workEnd; slotStart += slotStep) {
      if (slotStart < nowMinutes) continue;
      const slotEnd = slotStart + totalMinutes;
      const hasConflict = busyRanges.some(r => slotStart < r.end && slotEnd > r.start);
      if (!hasConflict) {
        const hh  = String(Math.floor(slotStart / 60)).padStart(2, "0");
        const mm  = String(slotStart % 60).padStart(2, "0");
        const key = `${hh}:${mm}`;
        // Solo registrar el primer colaborador disponible para ese slot
        if (!slotCollaboratorMap[key]) slotCollaboratorMap[key] = collab.id;
      }
    }
  }

  // Ordenar los slots cronológicamente
  const availableSlots = Object.keys(slotCollaboratorMap).sort();

  return c.json({
    slots: availableSlots,
    slotCollaboratorMap, // mapa slot → colaboradorId (útil cuando es "cualquiera")
    slotDuration: slotStep,
    totalDuration: totalMinutes,
  });
});

export default availability;
