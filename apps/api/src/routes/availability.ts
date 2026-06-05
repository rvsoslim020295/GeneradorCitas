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

  const collaboratorId = c.req.query("collaboratorId");
  const serviceId      = c.req.query("serviceId");
  const date           = c.req.query("date"); // YYYY-MM-DD

  if (!collaboratorId || !serviceId || !date) {
    return c.json({ error: "Se requieren collaboratorId, serviceId y date" }, 400);
  }

  // Validar formato de fecha
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return c.json({ error: "Formato de fecha inválido. Usa YYYY-MM-DD" }, 400);
  }

  // Cargar colaborador, servicio y config del negocio en paralelo
  const [collaborator, service, business] = await Promise.all([
    prisma.collaborator.findFirst({ where: { id: collaboratorId, businessId } }),
    prisma.service.findFirst({ where: { id: serviceId, businessId } }),
    prisma.business.findUnique({ where: { id: businessId } }),
  ]);

  if (!collaborator) return c.json({ error: "Colaborador no encontrado" }, 404);
  if (!service)      return c.json({ error: "Servicio no encontrado" }, 404);
  if (!business)     return c.json({ error: "Negocio no encontrado" }, 404);

  // ── 1. Verificar que el colaborador trabaja ese día ──
  const dateObj = new Date(`${date}T12:00:00`); // noon to avoid DST issues
  const dayKey  = DAY_KEYS[dateObj.getDay()];   // "Mon", "Tue", ...

  const schedule = (collaborator.schedule ?? null) as WeekSchedule | null;
  const daySchedule: DaySchedule | undefined = schedule?.[dayKey];

  if (!daySchedule?.enabled) {
    return c.json({ slots: [], slotDuration: business.slotMinutes, reason: "El colaborador no trabaja ese día" });
  }

  // ── 2. Calcular duración total (servicio + buffer) ──
  const totalMinutes = service.durationMin + (service.bufferMinutes ?? 0);
  const slotStep     = business.slotMinutes; // granularidad del calendario

  // Intersección entre horario del colaborador y horario del negocio
  const businessOpen  = timeToMinutes(business.openTime  ?? "00:00");
  const businessClose = timeToMinutes(business.closeTime ?? "23:59");

  const workStart = Math.max(timeToMinutes(daySchedule.start), businessOpen);
  const workEnd   = Math.min(timeToMinutes(daySchedule.end),   businessClose);

  // ── 3. Obtener citas existentes ese día ──
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd   = new Date(`${date}T23:59:59.999Z`);

  const existingApts = await prisma.appointment.findMany({
    where: {
      collaboratorId,
      businessId,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      startTime: { gte: dayStart, lte: dayEnd },
    },
    select: { startTime: true, endTime: true },
  });

  // Convertir citas a rangos en minutos desde medianoche
  const busyRanges = existingApts.map(apt => ({
    start: apt.startTime.getHours() * 60 + apt.startTime.getMinutes(),
    end:   apt.endTime.getHours()   * 60 + apt.endTime.getMinutes(),
  }));

  // ── 4. Calcular el mínimo en minutos desde medianoche permitido para hoy ──
  const now = new Date();
  const isToday = date === now.toISOString().split("T")[0];
  const nowMinutes = isToday
    ? now.getHours() * 60 + now.getMinutes()
    : 0;

  // ── 5. Generar slots candidatos y filtrar los ocupados y pasados ──
  const availableSlots: string[] = [];

  for (let slotStart = workStart; slotStart + totalMinutes <= workEnd; slotStart += slotStep) {
    if (slotStart < nowMinutes) continue;

    const slotEnd = slotStart + totalMinutes;

    const hasConflict = busyRanges.some(range =>
      slotStart < range.end && slotEnd > range.start
    );

    if (!hasConflict) {
      const hh = String(Math.floor(slotStart / 60)).padStart(2, "0");
      const mm = String(slotStart % 60).padStart(2, "0");
      availableSlots.push(`${hh}:${mm}`);
    }
  }

  return c.json({ slots: availableSlots, slotDuration: slotStep, totalDuration: totalMinutes });
});

export default availability;
