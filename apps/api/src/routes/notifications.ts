import { createRouter } from "../lib/hono.js";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requirePlanAccess } from "../middleware/plan-access.js";

const notifications = createRouter();

notifications.use("*", requireAuth);
notifications.use("*", requirePlanAccess);

// ─── GET /notifications ───────────────────────────────────────────────────────
// Devuelve notificaciones derivadas del estado de las citas del negocio:
//   - Citas PENDING de hoy (pendientes de confirmar)
//   - Citas CONFIRMED en las próximas 2 horas
//   - Citas CONFIRMED/PENDING del día anterior que quedaron sin cerrar
notifications.get("/", async (c) => {
  const { businessId } = c.get("user");

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const next7Days = new Date(todayStart); next7Days.setDate(next7Days.getDate() + 7);

  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayEnd   = new Date(todayStart); yesterdayEnd.setMilliseconds(-1);

  const [pendingToday, soonConfirmed, unclosed] = await Promise.all([
    // Citas PENDING de hoy y los próximos 7 días (acción requerida: confirmar)
    prisma.appointment.findMany({
      where: { businessId, status: "PENDING", startTime: { gte: todayStart, lte: next7Days } },
      include: { client: { select: { name: true } }, service: { select: { name: true } } },
      orderBy: { startTime: "asc" },
    }),
    // Citas confirmadas en las próximas 2 horas
    prisma.appointment.findMany({
      where: { businessId, status: "CONFIRMED", startTime: { gte: now, lte: twoHoursLater } },
      include: { client: { select: { name: true } }, service: { select: { name: true } } },
      orderBy: { startTime: "asc" },
    }),
    // Citas de ayer que no se completaron ni cancelaron
    prisma.appointment.findMany({
      where: { businessId, status: { in: ["PENDING", "CONFIRMED"] }, startTime: { gte: yesterdayStart, lte: yesterdayEnd } },
      include: { client: { select: { name: true } }, service: { select: { name: true } } },
      orderBy: { startTime: "asc" },
    }),
  ]);

  const items: {
    id: string;
    type: "pending_confirmation" | "starting_soon" | "unclosed";
    title: string;
    body: string;
    appointmentId: string;
    createdAt: string;
  }[] = [];

  for (const apt of pendingToday) {
    const isToday = apt.startTime >= todayStart && apt.startTime <= todayEnd;
    const time = apt.startTime.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
    const dateLabel = isToday
      ? `a las ${time}`
      : `${apt.startTime.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })} ${time}`;
    items.push({
      id: `pending-${apt.id}`,
      type: "pending_confirmation",
      title: "Cita sin confirmar",
      body: `${apt.client.name} · ${apt.service.name} · ${dateLabel}`,
      appointmentId: apt.id,
      createdAt: now.toISOString(),
    });
  }

  for (const apt of soonConfirmed) {
    const time = apt.startTime.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
    const mins = Math.round((apt.startTime.getTime() - now.getTime()) / 60000);
    items.push({
      id: `soon-${apt.id}`,
      type: "starting_soon",
      title: "Cita próxima",
      body: `${apt.client.name} · ${apt.service.name} en ${mins} min (${time})`,
      appointmentId: apt.id,
      createdAt: now.toISOString(),
    });
  }

  for (const apt of unclosed) {
    const date = apt.startTime.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
    items.push({
      id: `unclosed-${apt.id}`,
      type: "unclosed",
      title: "Cita sin cerrar",
      body: `${apt.client.name} · ${apt.service.name} del ${date}`,
      appointmentId: apt.id,
      createdAt: now.toISOString(),
    });
  }

  return c.json({ count: items.length, items });
});

export default notifications;
