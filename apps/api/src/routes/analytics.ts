import { Hono } from "hono";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const analytics = new Hono();

analytics.use("*", requireAuth);

// ─── GET /analytics ───────────────────────────────────────────────────────────
// Devuelve todos los KPIs y métricas del negocio calculados desde la DB
analytics.get("/", async (c) => {
  const { businessId } = c.get("user");

  // Traemos todas las citas del negocio de una sola vez para calcular todo
  const appointments = await prisma.appointment.findMany({
    where: { businessId },
    include: {
      collaborator: { select: { id: true, name: true } },
    },
  });

  const total = appointments.length;
  const completed = appointments.filter((a) => a.status === "COMPLETED");
  const cancelled = appointments.filter((a) => a.status === "CANCELLED");
  const noShow = appointments.filter((a) => a.status === "NO_SHOW");
  const pending = appointments.filter((a) => a.status === "PENDING" || a.status === "CONFIRMED");

  const totalRevenue = completed.reduce((sum, a) => sum + a.price, 0);
  const noShowRate = total > 0 ? (noShow.length / total) * 100 : 0;

  // ── Ingresos por día (últimos 7 días) ──────────────────────────────────────
  const today = new Date();
  const dailyRevenue: { day: string; amount: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayLabel = date.toLocaleDateString("es-MX", { weekday: "short" }).slice(0, 1).toUpperCase();

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayRevenue = completed
      .filter((a) => new Date(a.startTime) >= dayStart && new Date(a.startTime) <= dayEnd)
      .reduce((sum, a) => sum + a.price, 0);

    dailyRevenue.push({ day: dayLabel, amount: dayRevenue });
  }

  // ── Distribución por estado (porcentajes) ─────────────────────────────────
  const statusDistribution = {
    completed: total > 0 ? Math.round((completed.length / total) * 100) : 0,
    pending: total > 0 ? Math.round((pending.length / total) * 100) : 0,
    cancelled: total > 0 ? Math.round(((cancelled.length + noShow.length) / total) * 100) : 0,
  };

  // ── Top 3 colaboradores por ingresos ──────────────────────────────────────
  const collabRevenue: Record<string, { name: string; revenue: number; appointmentCount: number }> = {};

  for (const apt of completed) {
    const cid = apt.collaborator.id;
    if (!collabRevenue[cid]) {
      collabRevenue[cid] = { name: apt.collaborator.name, revenue: 0, appointmentCount: 0 };
    }
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
