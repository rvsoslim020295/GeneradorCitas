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
    case "last_week":
      // Ayer y los 6 días anteriores (7 días corridos)
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
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

const DAYS_ES  = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

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
      const label = mStart.toLocaleDateString("es-PE", { month: "short" });
      result.push({ day: label.charAt(0).toUpperCase() + label.slice(1, 3), amount });
    }

  } else if (period === "last_30_days") {
    // Agrupa por semana → 4-5 barras, etiqueta en una línea: "7-13 Jun"
    const msPerDay = 86_400_000;
    const totalDays = Math.round((end.getTime() - start.getTime()) / msPerDay) + 1;
    const weeks = Math.ceil(totalDays / 7);

    for (let w = 0; w < weeks; w++) {
      const wStart = new Date(start.getTime() + w * 7 * msPerDay);
      wStart.setHours(0, 0, 0, 0);
      const wEnd = new Date(Math.min(wStart.getTime() + 6 * msPerDay, end.getTime()));
      wEnd.setHours(23, 59, 59, 999);

      const amount = completed
        .filter((a) => a.startTime >= wStart && a.startTime <= wEnd)
        .reduce((s, a) => s + a.price, 0);

      // Si el rango cruza de mes, mostrar ambos meses: "28 May-3 Jun"
      const sameMon = wStart.getMonth() === wEnd.getMonth();
      const label = sameMon
        ? `${wStart.getDate()}-${wEnd.getDate()} ${MONTHS_ES[wEnd.getMonth()]}`
        : `${wStart.getDate()} ${MONTHS_ES[wStart.getMonth()]}-${wEnd.getDate()} ${MONTHS_ES[wEnd.getMonth()]}`;

      result.push({ day: label, amount });
    }

  } else {
    // Una barra por día → "Lun 2 Jun", "Mar 3 Jun", etc.
    const msPerDay = 86_400_000;
    const days = Math.round((end.getTime() - start.getTime()) / msPerDay) + 1;

    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      date.setHours(12, 0, 0, 0);

      const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
      const dayEnd   = new Date(date); dayEnd.setHours(23, 59, 59, 999);

      const amount = completed
        .filter((a) => a.startTime >= dayStart && a.startTime <= dayEnd)
        .reduce((s, a) => s + a.price, 0);

      result.push({
        day: `${DAYS_ES[date.getDay()]} ${date.getDate()} ${MONTHS_ES[date.getMonth()]}`,
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

  const appointments = await prisma.appointment.findMany({
    where: {
      businessId,
      startTime: { gte: start, lte: end },
    },
    include: {
      collaborator: { select: { id: true, name: true } },
    },
  });

  const total     = appointments.length;
  const completed = appointments.filter((a) => a.status === "COMPLETED");
  const cancelled = appointments.filter((a) => a.status === "CANCELLED");
  const noShow    = appointments.filter((a) => a.status === "NO_SHOW");
  const pending   = appointments.filter((a) => a.status === "PENDING" || a.status === "CONFIRMED");

  const totalRevenue = completed.reduce((sum, a) => sum + a.price, 0);
  const noShowRate   = total > 0 ? (noShow.length / total) * 100 : 0;

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
      completedAppointments: completed.length,
      totalRevenue,
      noShowRate: Math.round(noShowRate * 10) / 10,
    },
    dailyRevenue,
    statusDistribution,
    topCollaborators,
  });
});

export default analytics;
