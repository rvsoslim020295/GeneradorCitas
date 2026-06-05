import { Hono } from "hono";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const analytics = new Hono();

analytics.use("*", requireAuth);

type Period = "this_month" | "last_week" | "last_30_days" | "this_year";

function getDateRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  switch (period) {
    case "this_month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "last_week": {
      // Lunes al domingo de la semana pasada
      const day = now.getDay() || 7; // dom=0 → 7
      start.setDate(now.getDate() - day - 6);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - day);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "last_30_days":
      start.setDate(now.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      break;
    case "this_year":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
  }

  return { start, end };
}

function getPrevDateRange(period: Period, current: { start: Date; end: Date }): { start: Date; end: Date } {
  const { start, end } = current;
  const spanMs = end.getTime() - start.getTime();

  if (period === "this_month") {
    // Mes calendario anterior completo
    const prevEnd = new Date(start.getFullYear(), start.getMonth(), 0, 23, 59, 59, 999);
    const prevStart = new Date(prevEnd.getFullYear(), prevEnd.getMonth(), 1, 0, 0, 0, 0);
    return { start: prevStart, end: prevEnd };
  }

  if (period === "this_year") {
    // Mismo período del año anterior (ene hasta hoy - 1 año)
    const prevStart = new Date(start);
    prevStart.setFullYear(prevStart.getFullYear() - 1);
    const prevEnd = new Date(end);
    prevEnd.setFullYear(prevEnd.getFullYear() - 1);
    return { start: prevStart, end: prevEnd };
  }

  // last_week / last_30_days: retroceder exactamente el mismo span
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - spanMs);
  return { start: prevStart, end: prevEnd };
}

// Genera el array de barras del gráfico según el período
function buildDailyRevenue(
  completed: { startTime: Date; price: number }[],
  period: Period,
  start: Date,
  end: Date,
): { day: string; amount: number }[] {
  const result: { day: string; amount: number }[] = [];

  if (period === "this_year") {
    // Una barra por mes (ene–mes actual)
    const currentMonth = end.getMonth();
    for (let m = 0; m <= currentMonth; m++) {
      const mStart = new Date(start.getFullYear(), m, 1, 0, 0, 0, 0);
      const mEnd   = new Date(start.getFullYear(), m + 1, 0, 23, 59, 59, 999);
      const amount = completed
        .filter((a) => a.startTime >= mStart && a.startTime <= mEnd)
        .reduce((s, a) => s + a.price, 0);
      result.push({
        day: mStart.toLocaleDateString("es-MX", { month: "short" }).slice(0, 3),
        amount,
      });
    }
  } else {
    // Una barra por día dentro del rango
    const msPerDay = 86_400_000;
    const days = Math.round((end.getTime() - start.getTime()) / msPerDay) + 1;

    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);

      const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
      const dayEnd   = new Date(date); dayEnd.setHours(23, 59, 59, 999);

      const amount = completed
        .filter((a) => a.startTime >= dayStart && a.startTime <= dayEnd)
        .reduce((s, a) => s + a.price, 0);

      result.push({
        day: date.toLocaleDateString("es-MX", { weekday: "short", day: "numeric" })
             .replace(".", "").slice(0, 5),
        amount,
      });
    }
  }

  return result;
}

// ─── GET /analytics?period= ───────────────────────────────────────────────────
analytics.get("/", async (c) => {
  const { businessId } = c.get("user");

  const rawPeriod = c.req.query("period") ?? "this_month";
  const period: Period = (["this_month", "last_week", "last_30_days", "this_year"] as const)
    .includes(rawPeriod as Period) ? rawPeriod as Period : "this_month";

  const { start, end } = getDateRange(period);
  const prev = getPrevDateRange(period, { start, end });

  const [appointments, prevAppointments] = await Promise.all([
    prisma.appointment.findMany({
      where: { businessId, startTime: { gte: start, lte: end } },
      include: { collaborator: { select: { id: true, name: true } } },
    }),
    prisma.appointment.findMany({
      where: { businessId, startTime: { gte: prev.start, lte: prev.end } },
      select: { status: true, price: true },
    }),
  ]);

  const total     = appointments.length;
  const completed = appointments.filter((a) => a.status === "COMPLETED");
  const cancelled = appointments.filter((a) => a.status === "CANCELLED");
  const noShow    = appointments.filter((a) => a.status === "NO_SHOW");
  const pending   = appointments.filter((a) => a.status === "PENDING" || a.status === "CONFIRMED");

  const totalRevenue = completed.reduce((sum, a) => sum + a.price, 0);
  const noShowRate   = total > 0 ? (noShow.length / total) * 100 : 0;

  const prevTotal     = prevAppointments.length;
  const prevCompleted = prevAppointments.filter((a) => a.status === "COMPLETED");
  const prevNoShow    = prevAppointments.filter((a) => a.status === "NO_SHOW");
  const prevRevenue   = prevCompleted.reduce((sum, a) => sum + a.price, 0);
  const prevNoShowRate = prevTotal > 0 ? (prevNoShow.length / prevTotal) * 100 : null;

  const dailyRevenue = buildDailyRevenue(
    completed.map((a) => ({ startTime: a.startTime, price: a.price })),
    period,
    start,
    end,
  );

  const statusDistribution = {
    completed: total > 0 ? Math.round((completed.length / total) * 100) : 0,
    pending:   total > 0 ? Math.round((pending.length   / total) * 100) : 0,
    cancelled: total > 0 ? Math.round(((cancelled.length + noShow.length) / total) * 100) : 0,
  };

  const collabRevenue: Record<string, { name: string; revenue: number; appointmentCount: number }> = {};
  for (const apt of completed) {
    const cid = apt.collaborator.id;
    if (!collabRevenue[cid]) collabRevenue[cid] = { name: apt.collaborator.name, revenue: 0, appointmentCount: 0 };
    collabRevenue[cid].revenue += apt.price;
    collabRevenue[cid].appointmentCount++;
  }

  const topCollaborators = Object.values(collabRevenue)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3)
    .map((c) => ({
      ...c,
      percentage: totalRevenue > 0 ? Math.round((c.revenue / totalRevenue) * 100) : 0,
    }));

  return c.json({
    kpis: {
      totalAppointments: total,
      totalAppointmentsPrev: prevTotal,
      completedAppointments: completed.length,
      completedAppointmentsPrev: prevCompleted.length,
      totalRevenue,
      totalRevenuePrev: prevRevenue,
      noShowRate: Math.round(noShowRate * 10) / 10,
      noShowRatePrev: prevNoShowRate !== null ? Math.round(prevNoShowRate * 10) / 10 : null,
    },
    dailyRevenue,
    statusDistribution,
    topCollaborators,
  });
});

export default analytics;
