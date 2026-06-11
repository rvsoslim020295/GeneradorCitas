import cron from "node-cron";
import prisma from "./prisma.js";

// Plantilla por defecto si el negocio no tiene una configurada
const DEFAULT_REMINDER = `Hola {cliente}, 🔔 te recordamos tu cita de mañana en {negocio}.\n\n📅 {fecha} a las {hora}\n✂️ {servicio} con {colaborador}\n\nSi necesitas reagendar escríbenos. ¡Hasta mañana!`;
const TPL_2H = `Hola {cliente}, ⏰ tu cita es en 2 horas en {negocio}.\n\n📅 {fecha} a las {hora}\n✂️ {servicio} con {colaborador}\n\n¡Te esperamos!`;

const HOUR = 60 * 60 * 1000;

function buildMessage(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((msg, [k, v]) => msg.replaceAll(k, v), template);
}

function buildWaUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  const number = digits.startsWith("51") ? digits : `51${digits}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

// Enmascara el teléfono para no exponer PII en logs (auditoría 5.5)
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 4 ? `***${digits.slice(-4)}` : "***";
}

function formatDate(date: Date, tz: string): string {
  return date.toLocaleDateString("es-PE", { timeZone: tz, weekday: "long", day: "numeric", month: "long" });
}

function formatTime(date: Date, tz: string): string {
  return date.toLocaleTimeString("es-PE", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false });
}

type ReminderKind = {
  label: "24h" | "2h";
  sentField: "reminderSentAt" | "reminder2hSentAt";
  template: string;
  // Ventana relativa a "ahora" en ms: la cita debe empezar en (lower, upper].
  // Límite inferior abierto para recuperar corridas perdidas (auditoría 5.2).
  lower: number;
  upper: number;
};

const reminderInclude = {
  client:       { select: { name: true, phone: true } },
  service:      { select: { name: true } },
  collaborator: { select: { name: true } },
} as const;

async function processKind(
  biz: { id: string; name: string; timezone: string; waTplReminder: string | null },
  kind: ReminderKind,
  now: Date,
) {
  const tz = biz.timezone ?? "America/Lima";
  const appointments = await prisma.appointment.findMany({
    where: {
      businessId: biz.id,
      startTime: { gt: new Date(now.getTime() + kind.lower), lte: new Date(now.getTime() + kind.upper) },
      status: { in: ["PENDING", "CONFIRMED"] },
      [kind.sentField]: null,
      client: { phone: { not: null } },
    },
    include: reminderInclude,
  });

  for (const apt of appointments) {
    // Aislar errores por cita: una falla no aborta el resto (auditoría 5.3)
    try {
      const phone = apt.client.phone?.trim();
      if (!phone || phone.replace(/\D/g, "").length < 6) continue; // teléfono vacío/ inválido (auditoría 5.8)

      // Claim atómico: solo procede quien logra marcar el campo (evita doble
      // envío entre instancias / corridas solapadas) — auditoría 5.1
      const claimed = await prisma.appointment.updateMany({
        where: { id: apt.id, [kind.sentField]: null },
        data: { [kind.sentField]: now },
      });
      if (claimed.count === 0) continue; // otra corrida/instancia ya lo tomó

      const vars = {
        "{cliente}":     apt.client.name,
        "{negocio}":     biz.name,
        "{fecha}":       formatDate(apt.startTime, tz),
        "{hora}":        formatTime(apt.startTime, tz),
        "{servicio}":    apt.service.name,
        "{colaborador}": apt.collaborator.name,
      };
      const message = buildMessage(kind.template, vars);
      const waUrl   = buildWaUrl(phone, message); // el enlace queda en el evento para envío manual

      await prisma.appointmentEvent.create({
        data: {
          appointmentId: apt.id,
          type: "REMINDER_SENT",
          description: `Recordatorio ${kind.label} generado → ${waUrl}`,
        },
      });

      // Log sin PII: nombre + teléfono enmascarado, sin la URL completa (auditoría 5.5)
      console.log(`[Recordatorio ${kind.label}] ${apt.client.name} (${maskPhone(phone)}) — enlace listo`);
    } catch (err) {
      console.error(`[Recordatorio ${kind.label}] Falló la cita ${apt.id}:`, err);
    }
  }
}

// Exportada para pruebas / posible disparo manual.
export async function processReminders() {
  const now = new Date();

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
    if (biz.reminderEnabled) {
      // 24h: cita entre 2h y 24h de distancia, aún no recordada
      await processKind(biz, {
        label: "24h", sentField: "reminderSentAt",
        template: biz.waTplReminder ?? DEFAULT_REMINDER,
        lower: 2 * HOUR, upper: 24 * HOUR,
      }, now);
    }
    if (biz.reminder2hEnabled) {
      // 2h: cita en las próximas 2 horas, aún no recordada
      await processKind(biz, {
        label: "2h", sentField: "reminder2hSentAt",
        template: TPL_2H,
        lower: 0, upper: 2 * HOUR,
      }, now);
    }
  }
}

// Guarda de reentrancia: si una corrida se solapa con la anterior, se omite (auditoría 5.7)
let running = false;

export function startReminderScheduler() {
  cron.schedule("0 * * * *", async () => {
    if (running) {
      console.warn("[Scheduler] La corrida anterior sigue activa, se omite esta.");
      return;
    }
    running = true;
    console.log("[Scheduler] Procesando recordatorios WhatsApp...");
    try {
      await processReminders();
    } catch (err) {
      console.error("[Scheduler] Error en recordatorios:", err);
    } finally {
      running = false;
    }
  });
  console.log("[Scheduler] Recordatorios WhatsApp activos (cada hora)");
}
