import { Hono } from "hono";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const analytics = new Hono();

analytics.use("*", requireAuth);

type Period = "this_week" | "last_week" | "this_month" | "this_year";

// Retorna el domingo de la semana que contiene `date`
function weekSunday(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDateRange(period: Period): { start: Date; end: Date } {
  const now = new Date();

  switch (period) {
    case "this_week": {
      const start = weekSunday(now);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "last_week": {
      const thisSun = weekSunday(now);
      const end = new Date(thisSun.getTime() - 1); // sáb pasado 23:59
      const start = new Date(thisSun);
      start.setDate(thisSun.getDate() - 7); // dom pasado
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case "this_month": {
      // Últimas 4 semanas completas (dom–sáb) que incluyen hoy
      const thisSun = weekSunday(now);
      const start = new Date(thisSun);
      start.setDate(thisSun.getDate() - 21); // 3 semanas atrás = 4 semanas en total
      const end = new Date(thisSun);
      end.setDate(thisSun.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "this_year": {
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
  }
}

function getPrevDateRange(period: Period, current: { start: Date; end: Date }): { start: Date; end: Date } {
  const { start, end } = current;
  const spanMs = end.getTime() - start.getTime();

  if (period === "this_year") {
    const prevStart = new Date(start);
    prevStart.setFullYear(prevStart.getFullYear() - 1);
    const prevEnd = new Date(end);
    prevEnd.setFullYear(prevEnd.getFullYear() - 1);
    return { start: prevStart, end: prevEnd };
  }

  // this_week / last_week / this_month: retroceder exactamente el mismo span
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
  } else if (period === "this_month") {
    // 4 barras semanales (dom–sáb)
    for (let w = 0; w < 4; w++) {
      const wStart = new Date(start);
      wStart.setDate(start.getDate() + w * 7);
      const wEnd = new Date(wStart);
      wEnd.setDate(wStart.getDate() + 6);
      wEnd.setHours(23, 59, 59, 999);
      const amount = completed
        .filter((a) => a.startTime >= wStart && a.startTime <= wEnd)
        .reduce((s, a) => s + a.price, 0);
      const label = `${wStart.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}`;
      result.push({ day: label, amount });
    }
  } else {
    // this_week / last_week: una barra por día (dom–sáb, 7 barras)
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
      const dayEnd   = new Date(date); dayEnd.setHours(23, 59, 59, 999);
      const amount = completed
        .filter((a) => a.startTime >= dayStart && a.startTime <= dayEnd)
        .reduce((s, a) => s + a.price, 0);
      result.push({
        day: date.toLocaleDateString("es-MX", { weekday: "short", day: "numeric" })
             .replace(".", "").slice(0, 6).trim(),
        amount,
      });
    }
  }

  return result;
}

// ─── GET /analytics?period= ───────────────────────────────────────────────────
analytics.get("/", async (c) => {
  const { businessId } = c.get("user");

  const rawPeriod = c.req.query("period") ?? "this_week";
  const period: Period = (["this_week", "last_week", "this_month", "this_year"] as const)
    .includes(rawPeriod as Period) ? rawPeriod as Period : "this_week";

  const { start, end } = getDateRange(period);
  const prev = getPrevDateRange(period, { start, end });

  const [appointments, prevAppointments] = await Promise.all([
    prisma.appointment.findMany({
      where: { businessId, startTime: { gte: start, lte: end } },
      include: {
        collaborator: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, lastName: true } },
      },
    }),
    prisma.appointment.findMany({
      where: { businessId, startTime: { gte: prev.start, lte: prev.end } },
      select: { status: true, price: true, tipPercent: true, paidAmount: true, clientId: true },
    }),
  ]);

  const total       = appointments.length;
  const completed   = appointments.filter((a) => a.status === "COMPLETED");
  const cancelled   = appointments.filter((a) => a.status === "CANCELLED");
  const noShow      = appointments.filter((a) => a.status === "NO_SHOW");
  const rescheduled = appointments.filter((a) => a.status === "RESCHEDULED");
  const pending     = appointments.filter((a) => a.status === "PENDING" || a.status === "CONFIRMED");

  // price = precio base del servicio (inmutable)
  // paidAmount = lo que realmente se cobró (base + propina), null si aún no se cobró
  const serviceRevenue = completed.reduce((sum, a) => sum + a.price, 0);
  const tipRevenue     = completed.reduce((sum, a) => sum + ((a.paidAmount ?? a.price) - a.price), 0);
  const totalRevenue   = serviceRevenue + tipRevenue;
  const noShowRate     = total > 0 ? (noShow.length / total) * 100 : 0;

  const prevTotal     = prevAppointments.length;
  const prevCompleted = prevAppointments.filter((a) => a.status === "COMPLETED");
  const prevNoShow    = prevAppointments.filter((a) => a.status === "NO_SHOW");
  const prevServiceRevenue = prevCompleted.reduce((sum, a) => sum + a.price, 0);
  const prevTipRevenue     = prevCompleted.reduce((sum, a) => sum + ((a.paidAmount ?? a.price) - a.price), 0);
  const prevRevenue        = prevServiceRevenue + prevTipRevenue;
  const prevNoShowRate = prevTotal > 0 ? (prevNoShow.length / prevTotal) * 100 : null;

  const dailyRevenue = buildDailyRevenue(
    completed.map((a) => ({ startTime: a.startTime, price: a.paidAmount ?? a.price })),
    period,
    start,
    end,
  );

  const statusDistribution = {
    completed: total > 0 ? Math.round((completed.length / total) * 100) : 0,
    pending:   total > 0 ? Math.round((pending.length   / total) * 100) : 0,
    cancelled: total > 0 ? Math.round(((cancelled.length + noShow.length) / total) * 100) : 0,
  };

  const collabMap: Record<string, { name: string; serviceRevenue: number; tipRevenue: number; appointmentCount: number }> = {};
  for (const apt of completed) {
    const cid = apt.collaborator.id;
    if (!collabMap[cid]) collabMap[cid] = { name: apt.collaborator.name, serviceRevenue: 0, tipRevenue: 0, appointmentCount: 0 };
    const tip = (apt.paidAmount ?? apt.price) - apt.price;
    collabMap[cid].serviceRevenue += apt.price;
    collabMap[cid].tipRevenue     += tip;
    collabMap[cid].appointmentCount++;
  }

  const allCollaborators = Object.values(collabMap)
    .sort((a, b) => b.serviceRevenue - a.serviceRevenue)
    .map((c) => ({
      ...c,
      totalRevenue: c.serviceRevenue + c.tipRevenue,
      percentage: serviceRevenue > 0 ? Math.round((c.serviceRevenue / serviceRevenue) * 100) : 0,
    }));

  const topCollaborators = allCollaborators.slice(0, 3);

  // ── Top servicios ─────────────────────────────────────────────────────────
  const serviceMap: Record<string, { name: string; count: number; revenue: number }> = {};
  for (const apt of completed) {
    const sid = apt.service.id;
    if (!serviceMap[sid]) serviceMap[sid] = { name: apt.service.name, count: 0, revenue: 0 };
    serviceMap[sid].count++;
    serviceMap[sid].revenue += apt.paidAmount ?? apt.price;
  }
  const topServices = Object.values(serviceMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((s) => ({
      ...s,
      percentage: totalRevenue > 0 ? Math.round((s.revenue / totalRevenue) * 100) : 0,
    }));

  // ── Clientes más valiosos ─────────────────────────────────────────────────
  const clientMap: Record<string, { name: string; visits: number; revenue: number }> = {};
  for (const apt of completed) {
    const cid = apt.client.id;
    const name = [apt.client.name, apt.client.lastName].filter(Boolean).join(" ");
    if (!clientMap[cid]) clientMap[cid] = { name, visits: 0, revenue: 0 };
    clientMap[cid].visits++;
    clientMap[cid].revenue += apt.paidAmount ?? apt.price;
  }
  const topClients = Object.values(clientMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // ── Mapa de calor: día × hora ─────────────────────────────────────────────
  // Solo citas completadas. Resultado: array de { day: 0-6, hour: 0-23, count }
  const heatmapMap: Record<string, number> = {};
  for (const apt of appointments.filter((a) => a.status !== "CANCELLED" && a.status !== "NO_SHOW")) {
    const d = apt.startTime.getDay();   // 0=Dom … 6=Sáb
    const h = apt.startTime.getHours();
    const key = `${d}-${h}`;
    heatmapMap[key] = (heatmapMap[key] ?? 0) + 1;
  }
  const heatmap = Object.entries(heatmapMap).map(([key, count]) => {
    const [day, hour] = key.split("-").map(Number);
    return { day, hour, count };
  });

  // ── Nuevos vs Recurrentes ──────────────────────────────────────────────────
  // Para cada cliente único del período actual, verificar si tuvo citas antes del período
  const currentPeriodClientIds = [...new Set(completed.map((a) => a.client.id))];
  let newClients = 0;
  let recurringClients = 0;
  if (currentPeriodClientIds.length > 0) {
    const priorCounts = await prisma.appointment.groupBy({
      by: ["clientId"],
      where: {
        businessId,
        clientId: { in: currentPeriodClientIds },
        startTime: { lt: start },
      },
      _count: { id: true },
    });
    const clientsWithPrior = new Set(priorCounts.map((r) => r.clientId));
    for (const id of currentPeriodClientIds) {
      if (clientsWithPrior.has(id)) recurringClients++;
      else newClients++;
    }
  }
  const newVsRecurring = currentPeriodClientIds.length > 0
    ? {
        new: newClients,
        recurring: recurringClients,
        total: currentPeriodClientIds.length,
        newPct: Math.round((newClients / currentPeriodClientIds.length) * 100),
        recurringPct: Math.round((recurringClients / currentPeriodClientIds.length) * 100),
      }
    : null;

  // ── Cancelaciones por colaborador ─────────────────────────────────────────
  const cancelMap: Record<string, { name: string; cancelled: number; total: number }> = {};
  for (const apt of appointments) {
    const cid = apt.collaborator.id;
    if (!cancelMap[cid]) cancelMap[cid] = { name: apt.collaborator.name, cancelled: 0, total: 0 };
    cancelMap[cid].total++;
    if (apt.status === "CANCELLED" || apt.status === "NO_SHOW") cancelMap[cid].cancelled++;
  }
  const cancellationByCollaborator = Object.values(cancelMap)
    .filter((c) => c.total > 0)
    .map((c) => ({
      name: c.name,
      cancelled: c.cancelled,
      total: c.total,
      rate: Math.round((c.cancelled / c.total) * 100),
    }))
    .sort((a, b) => b.rate - a.rate);

  // ── Origen de citas ───────────────────────────────────────────────────────
  const ORIGIN_LABELS: Record<string, string> = {
    whatsapp:  "WhatsApp",
    phone:     "Teléfono",
    social:    "Redes Sociales",
    instagram: "Redes Sociales", // alias legacy
    walkin:    "Presencial",
  };
  const originMap: Record<string, number> = {};
  for (const apt of appointments) {
    // normalizar instagram → social para unificar métricas
    const raw = apt.origin ?? "walkin";
    const key = raw === "instagram" ? "social" : raw;
    originMap[key] = (originMap[key] ?? 0) + 1;
  }
  const originBreakdown = Object.entries(originMap)
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => ({
      id,
      label: ORIGIN_LABELS[id] ?? id,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

  // ── Mejor mes (solo relevante en this_year) ───────────────────────────────
  let bestMonth: { month: string; amount: number } | null = null;
  if (period === "this_year") {
    const best = [...dailyRevenue].sort((a, b) => b.amount - a.amount)[0];
    if (best && best.amount > 0) bestMonth = best;
  }

  return c.json({
    kpis: {
      totalAppointments: total,
      totalAppointmentsPrev: prevTotal,
      completedAppointments: completed.length,
      completedAppointmentsPrev: prevCompleted.length,
      cancelledCount: cancelled.length,
      noShowCount: noShow.length,
      rescheduledCount: rescheduled.length,
      serviceRevenue,
      tipRevenue,
      totalRevenue,
      totalRevenuePrev: prevRevenue,
      tipRevenuePrev: prevTipRevenue,
      noShowRate: Math.round(noShowRate * 10) / 10,
      noShowRatePrev: prevNoShowRate !== null ? Math.round(prevNoShowRate * 10) / 10 : null,
    },
    chartType: period === "this_month" ? "weekly" : period === "this_year" ? "monthly" : "daily",
    dailyRevenue,
    statusDistribution,
    topCollaborators,
    allCollaborators,
    topServices,
    topClients,
    heatmap,
    newVsRecurring,
    cancellationByCollaborator,
    bestMonth,
    originBreakdown,
  });
});

export default analytics;
