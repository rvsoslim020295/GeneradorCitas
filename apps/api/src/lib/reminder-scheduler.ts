import cron from "node-cron";
import prisma from "./prisma.js";

// Plantilla por defecto si el negocio no tiene una configurada
const DEFAULT_REMINDER = `Hola {cliente}, 🔔 te recordamos tu cita de mañana en {negocio}.\n\n📅 {fecha} a las {hora}\n✂️ {servicio} con {colaborador}\n\nSi necesitas reagendar escríbenos. ¡Hasta mañana!`;

function buildMessage(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((msg, [k, v]) => msg.replaceAll(k, v), template);
}

function buildWaUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  const number = digits.startsWith("51") ? digits : `51${digits}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function formatDate(date: Date, tz: string): string {
  return date.toLocaleDateString("es-PE", {
    timeZone: tz,
    weekday: "long", day: "numeric", month: "long",
  });
}

function formatTime(date: Date, tz: string): string {
  return date.toLocaleTimeString("es-PE", {
    timeZone: tz,
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

async function processReminders() {
  const now = new Date();

  // Buscar todos los negocios con al menos un recordatorio habilitado
  const businesses = await prisma.business.findMany({
    where: {
      OR: [{ reminderEnabled: true }, { reminder2hEnabled: true }],
      planStatus: "ACTIVE",
    },
    select: {
      id: true, name: true, timezone: true,
      reminderEnabled: true, reminder2hEnabled: true,
      waTplReminder: true,
    },
  });

  for (const biz of businesses) {
    const tz = biz.timezone ?? "America/Lima";

    // ── Recordatorio 24h ──────────────────────────────────────────────────────
    if (biz.reminderEnabled) {
      const from24 = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      const to24   = new Date(now.getTime() + 25 * 60 * 60 * 1000);

      const appointments = await prisma.appointment.findMany({
        where: {
          businessId: biz.id,
          startTime: { gte: from24, lte: to24 },
          status: { in: ["PENDING", "CONFIRMED"] },
          reminderSentAt: null,
          client: { phone: { not: null } },
        },
        include: {
          client:      { select: { name: true, phone: true } },
          service:     { select: { name: true } },
          collaborator:{ select: { name: true } },
        },
      });

      for (const apt of appointments) {
        const vars = {
          "{cliente}":     apt.client.name,
          "{negocio}":     biz.name,
          "{fecha}":       formatDate(apt.startTime, tz),
          "{hora}":        formatTime(apt.startTime, tz),
          "{servicio}":    apt.service.name,
          "{colaborador}": apt.collaborator.name,
        };
        const message = buildMessage(biz.waTplReminder ?? DEFAULT_REMINDER, vars);
        const waUrl   = buildWaUrl(apt.client.phone!, message);

        // Registrar el evento en el historial de la cita
        await prisma.$transaction([
          prisma.appointment.update({
            where: { id: apt.id },
            data: { reminderSentAt: now },
          }),
          prisma.appointmentEvent.create({
            data: {
              appointmentId: apt.id,
              type: "REMINDER_SENT",
              description: `Recordatorio 24h generado → ${waUrl}`,
            },
          }),
        ]);

        console.log(`[Recordatorio 24h] ${apt.client.name} → ${waUrl}`);
      }
    }

    // ── Recordatorio 2h ───────────────────────────────────────────────────────
    if (biz.reminder2hEnabled) {
      const from2 = new Date(now.getTime() + 1.5 * 60 * 60 * 1000);
      const to2   = new Date(now.getTime() + 2.5 * 60 * 60 * 1000);

      const appointments = await prisma.appointment.findMany({
        where: {
          businessId: biz.id,
          startTime: { gte: from2, lte: to2 },
          status: { in: ["PENDING", "CONFIRMED"] },
          reminder2hSentAt: null,
          client: { phone: { not: null } },
        },
        include: {
          client:      { select: { name: true, phone: true } },
          service:     { select: { name: true } },
          collaborator:{ select: { name: true } },
        },
      });

      for (const apt of appointments) {
        const vars = {
          "{cliente}":     apt.client.name,
          "{negocio}":     biz.name,
          "{fecha}":       formatDate(apt.startTime, tz),
          "{hora}":        formatTime(apt.startTime, tz),
          "{servicio}":    apt.service.name,
          "{colaborador}": apt.collaborator.name,
        };
        const tpl2h = `Hola {cliente}, ⏰ tu cita es en 2 horas en {negocio}.\n\n📅 {fecha} a las {hora}\n✂️ {servicio} con {colaborador}\n\n¡Te esperamos!`;
        const message = buildMessage(tpl2h, vars);
        const waUrl   = buildWaUrl(apt.client.phone!, message);

        await prisma.$transaction([
          prisma.appointment.update({
            where: { id: apt.id },
            data: { reminder2hSentAt: now },
          }),
          prisma.appointmentEvent.create({
            data: {
              appointmentId: apt.id,
              type: "REMINDER_SENT",
              description: `Recordatorio 2h generado → ${waUrl}`,
            },
          }),
        ]);

        console.log(`[Recordatorio 2h] ${apt.client.name} → ${waUrl}`);
      }
    }
  }
}

// Corre cada hora en punto
export function startReminderScheduler() {
  cron.schedule("0 * * * *", async () => {
    console.log("[Scheduler] Procesando recordatorios WhatsApp...");
    try {
      await processReminders();
    } catch (err) {
      console.error("[Scheduler] Error en recordatorios:", err);
    }
  });
  console.log("[Scheduler] Recordatorios WhatsApp activos (cada hora)");
}
