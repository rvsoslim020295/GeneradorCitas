"use client";

import { useState } from "react";
import {
  Calendar, CheckCircle, Banknote, TrendingUp, TrendingDown,
  ChevronDown, AlertCircle, Gift, Trophy, Users, Scissors,
  UserX, Star, Flame, MessageCircle, Phone, Camera, PersonStanding,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { useAnalytics } from "@/lib/api/hooks";

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

function KpiDelta({ current, prev, isCount = false }: { current: number; prev: number; isCount?: boolean }) {
  if (prev === 0 && current === 0) {
    return <span className="mt-2 inline-block text-[10px] text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container)] px-2 py-0.5 rounded-full">Sin datos anteriores</span>;
  }
  const pct = prev === 0 ? 100 : ((current - prev) / prev) * 100;
  const up = pct >= 0;
  const label = isCount ? `${up ? "+" : ""}${Math.round(pct)}%` : `${up ? "+" : ""}${pct.toFixed(1)}%`;
  return (
    <div className={`mt-2 flex items-center gap-1 ${up ? "text-[var(--color-secondary-container)]" : "text-[var(--color-error)]"}`}>
      {up ? <TrendingUp size={12} strokeWidth={2} /> : <TrendingDown size={12} strokeWidth={2} />}
      <span className="text-[10px] font-semibold">{label} vs período ant.</span>
    </div>
  );
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const collabColors = [
  "bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]",
  "bg-[var(--color-secondary-fixed)] text-[var(--color-on-secondary-fixed)]",
  "bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]",
];

export default function ReportesPage() {
  const [period, setPeriod] = useState("this_week");
  const { data, isLoading, error } = useAnalytics(period);

  const maxDailyRevenue = data ? Math.max(...data.dailyRevenue.map((d: { amount: number }) => d.amount), 1) : 1;
  const maxHeatmapCount = data?.heatmap ? Math.max(...data.heatmap.map((h: { count: number }) => h.count), 1) : 1;

  function heatmapCount(day: number, hour: number) {
    return data?.heatmap?.find((h: { day: number; hour: number; count: number }) => h.day === day && h.hour === hour)?.count ?? 0;
  }

  function heatmapColor(count: number) {
    if (count === 0) return "bg-[var(--color-surface-container)]";
    const intensity = count / maxHeatmapCount;
    if (intensity < 0.25) return "bg-[var(--color-primary)]/20";
    if (intensity < 0.5)  return "bg-[var(--color-primary)]/40";
    if (intensity < 0.75) return "bg-[var(--color-primary)]/65";
    return "bg-[var(--color-primary)]";
  }

  return (
    <>
      <Sidebar activePath="/reportes" />
      <main className="flex-1 ml-64 flex flex-col h-full bg-[var(--color-background)] relative overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-y-auto pt-16" style={{ scrollbarWidth: "thin" }}>
          <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">

            {/* Header + filtro */}
            <div className="flex items-center justify-between">
              <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Resumen</h2>
              <div className="relative">
                <select value={period} onChange={(e) => setPeriod(e.target.value)}
                  className="appearance-none bg-[var(--color-surface)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] text-body-md rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer">
                  <option value="this_week">Esta Semana</option>
                  <option value="last_week">Semana Pasada</option>
                  <option value="this_month">Este Mes (4 semanas)</option>
                  <option value="this_year">Este Año</option>
                </select>
                <ChevronDown size={16} strokeWidth={1.5} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] pointer-events-none" />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-[var(--color-error)] bg-[var(--color-error-container)]/30 border border-[var(--color-error-container)] rounded-lg px-4 py-3 text-body-md">
                <AlertCircle size={16} strokeWidth={1.5} />
                No se pudo cargar las analíticas.
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1,2,3,4].map((i) => (
                  <div key={i} className={`bg-[var(--color-surface-container-lowest)] rounded-xl h-28 animate-pulse ${i >= 3 ? "col-span-2" : ""}`} />
                ))}
              </div>
            ) : data && (
              <>
                {/* ── KPIs principales ── */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 border border-[var(--color-outline-variant)] ambient-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase">Total Citas</span>
                      <div className="bg-[var(--color-primary-container)]/20 p-1.5 rounded-lg"><Calendar size={16} className="text-[var(--color-primary)]" strokeWidth={1.5} /></div>
                    </div>
                    <span className="text-display-lg font-bold text-[var(--color-on-surface)]">{data.kpis.totalAppointments}</span>
                    <KpiDelta current={data.kpis.totalAppointments} prev={data.kpis.totalAppointmentsPrev} isCount />
                    {((data.kpis.cancelledCount ?? 0) > 0 || (data.kpis.noShowCount ?? 0) > 0 || (data.kpis.rescheduledCount ?? 0) > 0) && (
                      <div className="mt-2 flex flex-col gap-0.5 border-t border-[var(--color-outline-variant)]/40 pt-2">
                        {(data.kpis.cancelledCount ?? 0) > 0 && (
                          <span className="text-[10px] text-[var(--color-error)]">
                            · {data.kpis.cancelledCount} cancelada{data.kpis.cancelledCount !== 1 ? "s" : ""}
                          </span>
                        )}
                        {(data.kpis.noShowCount ?? 0) > 0 && (
                          <span className="text-[10px] text-orange-500">
                            · {data.kpis.noShowCount} no se presentó{data.kpis.noShowCount !== 1 ? "n" : ""}
                          </span>
                        )}
                        {(data.kpis.rescheduledCount ?? 0) > 0 && (
                          <span className="text-[10px] text-[var(--color-on-surface-variant)]">
                            · {data.kpis.rescheduledCount} reagendada{data.kpis.rescheduledCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 border border-[var(--color-outline-variant)] ambient-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase">Completadas</span>
                      <div className="bg-[var(--color-secondary-container)]/20 p-1.5 rounded-lg"><CheckCircle size={16} className="text-[var(--color-secondary-container)]" strokeWidth={1.5} /></div>
                    </div>
                    <span className="text-display-lg font-bold text-[var(--color-on-surface)]">{data.kpis.completedAppointments}</span>
                    <KpiDelta current={data.kpis.completedAppointments} prev={data.kpis.completedAppointmentsPrev} isCount />
                  </div>

                  <div className="col-span-2 grid grid-cols-3 gap-3">
                    <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 border border-[var(--color-outline-variant)] ambient-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase">Por Servicios</span>
                        <div className="bg-[var(--color-primary-container)]/20 p-1.5 rounded-lg"><Banknote size={16} className="text-[var(--color-primary)]" strokeWidth={1.5} /></div>
                      </div>
                      <span className="text-display-md font-bold text-[var(--color-on-surface)]">S/{data.kpis.serviceRevenue.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                      <p className="text-[10px] text-[var(--color-on-surface-variant)] mt-1">Precio base completadas</p>
                    </div>
                    <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 border border-[var(--color-outline-variant)] ambient-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase">Propinas</span>
                        <div className="bg-emerald-100 p-1.5 rounded-lg"><Gift size={16} className="text-emerald-600" strokeWidth={1.5} /></div>
                      </div>
                      <span className="text-display-md font-bold text-emerald-600">S/{data.kpis.tipRevenue.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                      <KpiDelta current={data.kpis.tipRevenue} prev={data.kpis.tipRevenuePrev} />
                    </div>
                    <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 border border-[var(--color-primary)]/20 ambient-shadow relative overflow-hidden">
                      <div className="absolute -right-4 -top-4 w-20 h-20 bg-[var(--color-primary-container)] rounded-full opacity-10 blur-xl pointer-events-none" />
                      <div className="flex justify-between items-start mb-2 relative z-10">
                        <span className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase">Total</span>
                        <div className="bg-[var(--color-primary-container)] p-1.5 rounded-lg"><Banknote size={16} className="text-[var(--color-on-primary-container)]" strokeWidth={1.5} /></div>
                      </div>
                      <span className="text-display-md font-bold text-[var(--color-primary)] relative z-10">S/{data.kpis.totalRevenue.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                      <div className="relative z-10"><KpiDelta current={data.kpis.totalRevenue} prev={data.kpis.totalRevenuePrev} /></div>
                    </div>
                  </div>

                  {/* Tasa inasistencia + retención */}
                  <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 border border-[var(--color-outline-variant)] ambient-shadow flex items-center justify-between">
                    <div>
                      <span className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase block mb-1">Tasa de Inasistencia</span>
                      <span className="text-headline-md font-semibold text-[var(--color-on-surface)]">{data.kpis.noShowRate}%</span>
                    </div>
                    {data.kpis.noShowRatePrev === null ? (
                      <span className="text-[10px] text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container)] px-2 py-1 rounded-full">Sin datos ant.</span>
                    ) : data.kpis.noShowRate > data.kpis.noShowRatePrev ? (
                      <div className="flex items-center gap-1 text-[var(--color-error)] bg-[var(--color-error-container)] px-2 py-1 rounded-full">
                        <TrendingUp size={12} strokeWidth={2} /><span className="text-[10px] font-semibold">+{(data.kpis.noShowRate - data.kpis.noShowRatePrev).toFixed(1)}%</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[var(--color-secondary-container)] bg-[var(--color-secondary-container)]/20 px-2 py-1 rounded-full">
                        <TrendingDown size={12} strokeWidth={2} /><span className="text-[10px] font-semibold">-{(data.kpis.noShowRatePrev - data.kpis.noShowRate).toFixed(1)}%</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 border border-[var(--color-outline-variant)] ambient-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase">Nuevos vs Recurrentes</span>
                      <div className="p-2 rounded-xl bg-[var(--color-primary-container)]/20">
                        <Users size={18} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                      </div>
                    </div>
                    {data.newVsRecurring === null ? (
                      <p className="text-body-md text-[var(--color-on-surface-variant)]">Sin citas completadas en este período</p>
                    ) : (
                      <>
                        <div className="flex items-end gap-3 mb-2">
                          <div>
                            <span className="text-headline-md font-bold text-emerald-600">{data.newVsRecurring.new}</span>
                            <span className="text-[11px] text-[var(--color-on-surface-variant)] ml-1">nuevos ({data.newVsRecurring.newPct}%)</span>
                          </div>
                          <span className="text-[var(--color-outline)] mb-1">·</span>
                          <div>
                            <span className="text-headline-md font-bold text-[var(--color-primary)]">{data.newVsRecurring.recurring}</span>
                            <span className="text-[11px] text-[var(--color-on-surface-variant)] ml-1">recurrentes ({data.newVsRecurring.recurringPct}%)</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--color-surface-container-high)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${data.newVsRecurring.newPct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-[var(--color-on-surface-variant)] mt-1.5">
                          {data.newVsRecurring.total} clientes únicos atendidos
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* ── Mejor mes (solo en Este Año) ── */}
                {period === "this_year" && data.bestMonth && (
                  <div className="bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)] flex items-center justify-center shrink-0">
                      <Trophy size={22} className="text-[var(--color-on-primary)]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Tu mejor mes del año</p>
                      <p className="text-headline-sm font-bold text-[var(--color-on-surface)] capitalize">
                        {data.bestMonth.month} · <span className="text-[var(--color-primary)]">S/{data.bestMonth.amount.toLocaleString("es-PE")}</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Gráfico de ingresos ── */}
                <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 border border-[var(--color-outline-variant)] ambient-shadow">
                  <h3 className="text-body-lg font-semibold text-[var(--color-on-surface)] mb-4">
                    {data.chartType === "weekly" ? "Ingresos por Semana" : data.chartType === "monthly" ? "Ingresos por Mes" : "Ingresos por Día"}
                  </h3>
                  <div className="h-48 w-full flex items-stretch gap-2 px-1 relative">
                    <div className="absolute w-full border-t border-[var(--color-outline-variant)] opacity-30 bottom-[20%]" />
                    <div className="absolute w-full border-t border-[var(--color-outline-variant)] opacity-30 bottom-[50%]" />
                    <div className="absolute w-full border-t border-[var(--color-outline-variant)] opacity-30 bottom-[80%]" />
                    {data.dailyRevenue.map((day: { day: string; amount: number }, i: number) => {
                      const heightPct = maxDailyRevenue > 0 ? Math.max((day.amount / maxDailyRevenue) * 100, day.amount > 0 ? 5 : 2) : 2;
                      const isMax = day.amount === maxDailyRevenue && day.amount > 0;
                      return (
                        <div key={i} className="flex-1 flex flex-col justify-end relative group">
                          {day.amount > 0 && (
                            <div className="absolute bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2 bg-[var(--color-inverse-surface)] text-[var(--color-inverse-on-surface)] text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                              S/{day.amount.toLocaleString("es-PE")}
                            </div>
                          )}
                          <div
                            className={`w-full rounded-t-sm transition-colors ${isMax ? "bg-[var(--color-primary)] shadow-[0_0_8px_rgba(93,92,222,0.3)]" : "bg-[var(--color-primary-fixed)] hover:bg-[var(--color-primary-container)]"}`}
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-[var(--color-on-surface-variant)] mt-2 px-1">
                    {data.dailyRevenue.map((d: { day: string }, i: number) => <span key={i}>{d.day}</span>)}
                  </div>
                </div>

                {/* ── Top servicios ── */}
                {data.topServices && data.topServices.length > 0 && (
                  <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 border border-[var(--color-outline-variant)] ambient-shadow">
                    <div className="flex items-center gap-2 mb-4">
                      <Scissors size={16} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                      <h3 className="text-body-lg font-semibold text-[var(--color-on-surface)]">Top Servicios</h3>
                    </div>
                    <div className="space-y-3">
                      {data.topServices.map((s: { name: string; count: number; revenue: number; percentage: number }, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${i === 0 ? "bg-amber-100 text-amber-700" : "bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]"}`}>
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-body-md font-medium text-[var(--color-on-surface)] truncate">{s.name}</span>
                              <span className="text-[12px] font-semibold text-[var(--color-primary)] ml-2 shrink-0">S/{s.revenue.toFixed(0)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-[var(--color-surface-container)] rounded-full overflow-hidden">
                                <div className="h-full bg-[var(--color-primary)] rounded-full" style={{ width: `${s.percentage}%` }} />
                              </div>
                              <span className="text-[10px] text-[var(--color-on-surface-variant)] shrink-0">{s.count} citas · {s.percentage}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Citas por estado ── */}
                <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 border border-[var(--color-outline-variant)] ambient-shadow">
                  <h3 className="text-body-lg font-semibold text-[var(--color-on-surface)] mb-4">Citas por Estado</h3>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full relative shrink-0" style={{
                      background: `conic-gradient(var(--color-primary) 0% ${data.statusDistribution.completed}%, var(--color-secondary-container) ${data.statusDistribution.completed}% ${data.statusDistribution.completed + data.statusDistribution.pending}%, var(--color-error) ${data.statusDistribution.completed + data.statusDistribution.pending}% 100%)`
                    }}>
                      <div className="absolute inset-[8px] rounded-full bg-[var(--color-surface-container-lowest)] flex items-center justify-center flex-col">
                        <span className="text-headline-sm font-semibold text-[var(--color-on-surface)] leading-none">{data.kpis.totalAppointments}</span>
                        <span className="text-[8px] text-[var(--color-on-surface-variant)] uppercase">Total</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      {[
                        { label: "Completadas", pct: data.statusDistribution.completed, color: "bg-[var(--color-primary)]" },
                        { label: "Pendientes",  pct: data.statusDistribution.pending,   color: "bg-[var(--color-secondary-container)]" },
                        { label: "Canceladas",  pct: data.statusDistribution.cancelled, color: "bg-[var(--color-error)]" },
                      ].map(({ label, pct, color }) => (
                        <div key={label} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${color}`} />
                            <span className="text-[12px] text-[var(--color-on-surface)]">{label}</span>
                          </div>
                          <span className="text-label-md font-semibold text-[var(--color-on-surface)]">{pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Origen de citas ── */}
                {data.originBreakdown && data.originBreakdown.length > 0 && (
                  <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 border border-[var(--color-outline-variant)] ambient-shadow">
                    <h3 className="text-body-lg font-semibold text-[var(--color-on-surface)] mb-4">¿Cómo llegan tus clientes?</h3>
                    <div className="space-y-3">
                      {data.originBreakdown.map((o: { id: string; label: string; count: number; percentage: number }) => {
                        const icons: Record<string, React.ReactNode> = {
                          whatsapp:  <MessageCircle  size={16} className="text-emerald-500" strokeWidth={1.5} />,
                          phone:     <Phone          size={16} className="text-blue-500"    strokeWidth={1.5} />,
                          instagram: <Camera         size={16} className="text-pink-500"    strokeWidth={1.5} />,
                          walkin:    <PersonStanding size={16} className="text-amber-500"   strokeWidth={1.5} />,
                        };
                        const colors: Record<string, string> = {
                          whatsapp:  "bg-emerald-500",
                          phone:     "bg-blue-500",
                          instagram: "bg-pink-500",
                          walkin:    "bg-amber-500",
                        };
                        return (
                          <div key={o.id} className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-[var(--color-surface-container-high)] flex items-center justify-center shrink-0">
                              {icons[o.id]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-body-md font-medium text-[var(--color-on-surface)]">{o.label}</span>
                                <span className="text-[12px] font-semibold text-[var(--color-on-surface)] ml-2 shrink-0">
                                  {o.count} cita{o.count !== 1 ? "s" : ""} · {o.percentage}%
                                </span>
                              </div>
                              <div className="h-1.5 bg-[var(--color-surface-container)] rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${colors[o.id] ?? "bg-[var(--color-primary)]"}`} style={{ width: `${o.percentage}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Mapa de calor ── */}
                {data.heatmap && data.heatmap.length > 0 && (
                  <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 border border-[var(--color-outline-variant)] ambient-shadow">
                    <div className="flex items-center gap-2 mb-1">
                      <Flame size={16} className="text-orange-500" strokeWidth={1.5} />
                      <h3 className="text-body-lg font-semibold text-[var(--color-on-surface)]">Horas pico</h3>
                    </div>
                    <p className="text-[11px] text-[var(--color-on-surface-variant)] mb-4">Citas agendadas por día y hora</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr>
                            <th className="text-left text-[var(--color-on-surface-variant)] font-normal pr-2 pb-1 w-8">Hora</th>
                            {DAY_LABELS.map((d) => (
                              <th key={d} className="text-center text-[var(--color-on-surface-variant)] font-semibold pb-1 px-0.5">{d}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {HOURS.map((hour) => (
                            <tr key={hour}>
                              <td className="text-[var(--color-on-surface-variant)] pr-2 py-0.5">{hour}h</td>
                              {[0,1,2,3,4,5,6].map((day) => {
                                const count = heatmapCount(day, hour);
                                return (
                                  <td key={day} className="py-0.5 px-0.5">
                                    <div
                                      className={`w-full h-6 rounded-sm ${heatmapColor(count)} flex items-center justify-center transition-colors`}
                                      title={count > 0 ? `${count} cita${count !== 1 ? "s" : ""}` : ""}
                                    >
                                      {count > 0 && <span className="text-[9px] font-semibold text-[var(--color-on-surface)]">{count}</span>}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center gap-2 mt-3 justify-end">
                      <span className="text-[10px] text-[var(--color-on-surface-variant)]">Menos</span>
                      {["bg-[var(--color-surface-container)]","bg-[var(--color-primary)]/20","bg-[var(--color-primary)]/40","bg-[var(--color-primary)]/65","bg-[var(--color-primary)]"].map((c, i) => (
                        <div key={i} className={`w-4 h-4 rounded-sm ${c}`} />
                      ))}
                      <span className="text-[10px] text-[var(--color-on-surface-variant)]">Más</span>
                    </div>
                  </div>
                )}

                {/* ── Clientes más valiosos ── */}
                {data.topClients && data.topClients.length > 0 && (
                  <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 border border-[var(--color-outline-variant)] ambient-shadow">
                    <div className="flex items-center gap-2 mb-4">
                      <Star size={16} className="text-amber-500" strokeWidth={1.5} />
                      <h3 className="text-body-lg font-semibold text-[var(--color-on-surface)]">Clientes más valiosos</h3>
                    </div>
                    <div className="space-y-3">
                      {data.topClients.map((client: { name: string; visits: number; revenue: number }, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-label-md font-bold text-[11px] shrink-0 ${collabColors[i % collabColors.length]}`}>
                            {getInitials(client.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-body-md font-medium text-[var(--color-on-surface)] truncate">{client.name}</p>
                            <p className="text-[11px] text-[var(--color-on-surface-variant)]">{client.visits} visita{client.visits !== 1 ? "s" : ""} en el período</p>
                          </div>
                          <span className="text-[13px] font-semibold text-[var(--color-primary)] shrink-0">S/{client.revenue.toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Top colaboradores ── */}
                <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 border border-[var(--color-outline-variant)] ambient-shadow">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-body-lg font-semibold text-[var(--color-on-surface)]">Top 3 Colaboradores</h3>
                    <span className="text-[12px] text-[var(--color-on-surface-variant)]">Por servicios</span>
                  </div>
                  {data.topCollaborators.length === 0 ? (
                    <p className="text-body-md text-[var(--color-outline)] text-center py-4">Sin datos todavía</p>
                  ) : (
                    <div className="space-y-4">
                      {data.topCollaborators.map((collab: { name: string; appointmentCount: number; serviceRevenue: number; tipRevenue: number; percentage: number }, i: number) => (
                        <div key={collab.name} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-label-md font-bold text-sm shrink-0 ${collabColors[i] ?? collabColors[2]}`}>
                            {getInitials(collab.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-body-md font-medium text-[var(--color-on-surface)] leading-tight truncate">{collab.name}</h4>
                            <span className="text-[11px] text-[var(--color-on-surface-variant)]">{collab.appointmentCount} cita{collab.appointmentCount !== 1 ? "s" : ""}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[13px] font-semibold text-[var(--color-on-surface)] block">S/{collab.serviceRevenue.toFixed(2)}</span>
                            {collab.tipRevenue > 0 && <span className="text-[10px] text-emerald-600 font-semibold">+S/{collab.tipRevenue.toFixed(2)} propina</span>}
                            <span className={`text-[10px] block ${i === 0 ? "text-[var(--color-primary)]" : "text-[var(--color-on-surface-variant)]"}`}>{collab.percentage}% del servicio</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Cancelaciones por colaborador ── */}
                {data.cancellationByCollaborator && data.cancellationByCollaborator.length > 0 && (
                  <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 border border-[var(--color-outline-variant)] ambient-shadow">
                    <div className="flex items-center gap-2 mb-4">
                      <UserX size={16} className="text-[var(--color-error)]" strokeWidth={1.5} />
                      <h3 className="text-body-lg font-semibold text-[var(--color-on-surface)]">Cancelaciones por Colaborador</h3>
                    </div>
                    <div className="space-y-3">
                      {data.cancellationByCollaborator.map((c: { name: string; cancelled: number; total: number; rate: number }) => (
                        <div key={c.name} className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-body-md font-medium text-[var(--color-on-surface)] truncate">{c.name}</span>
                              <span className={`text-[12px] font-semibold ml-2 shrink-0 ${c.rate >= 30 ? "text-[var(--color-error)]" : c.rate >= 15 ? "text-amber-600" : "text-[var(--color-on-surface-variant)]"}`}>
                                {c.rate}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-[var(--color-surface-container)] rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${c.rate >= 30 ? "bg-[var(--color-error)]" : c.rate >= 15 ? "bg-amber-400" : "bg-[var(--color-outline)]"}`}
                                  style={{ width: `${c.rate}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-[var(--color-on-surface-variant)] shrink-0">{c.cancelled} de {c.total}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Tabla todos los colaboradores ── */}
                <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 border border-[var(--color-outline-variant)] ambient-shadow">
                  <h3 className="text-body-lg font-semibold text-[var(--color-on-surface)] mb-4">Todos los Colaboradores</h3>
                  {data.allCollaborators.length === 0 ? (
                    <p className="text-body-md text-[var(--color-outline)] text-center py-4">Sin datos todavía</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[var(--color-outline-variant)]">
                            <th className="text-left text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase py-2 pr-4">Colaborador</th>
                            <th className="text-right text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase py-2 px-4">Citas</th>
                            <th className="text-right text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase py-2 px-4">Servicios</th>
                            <th className="text-right text-[11px] font-semibold text-emerald-600 uppercase py-2 px-4">Propinas</th>
                            <th className="text-right text-[11px] font-semibold text-[var(--color-primary)] uppercase py-2 pl-4">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-outline-variant)]/50">
                          {data.allCollaborators.map((collab: { name: string; appointmentCount: number; serviceRevenue: number; tipRevenue: number; totalRevenue: number }, i: number) => (
                            <tr key={collab.name} className="hover:bg-[var(--color-surface-container-low)] transition-colors">
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-2">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${collabColors[i % collabColors.length]}`}>
                                    {getInitials(collab.name)}
                                  </div>
                                  <span className="text-[var(--color-on-surface)] font-medium">{collab.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right text-[var(--color-on-surface-variant)]">{collab.appointmentCount}</td>
                              <td className="py-3 px-4 text-right font-semibold text-[var(--color-on-surface)]">S/{collab.serviceRevenue.toFixed(2)}</td>
                              <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                                {collab.tipRevenue > 0 ? `S/${collab.tipRevenue.toFixed(2)}` : <span className="text-[var(--color-on-surface-variant)] font-normal">—</span>}
                              </td>
                              <td className="py-3 pl-4 text-right font-bold text-[var(--color-primary)]">S/{collab.totalRevenue.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-[var(--color-outline-variant)]">
                            <td className="py-2 pr-4 text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase">Total</td>
                            <td className="py-2 px-4 text-right text-[11px] font-semibold text-[var(--color-on-surface)]">{data.allCollaborators.reduce((s: number, c: { appointmentCount: number }) => s + c.appointmentCount, 0)}</td>
                            <td className="py-2 px-4 text-right text-[11px] font-semibold text-[var(--color-on-surface)]">S/{data.kpis.serviceRevenue.toFixed(2)}</td>
                            <td className="py-2 px-4 text-right text-[11px] font-semibold text-emerald-600">S/{data.kpis.tipRevenue.toFixed(2)}</td>
                            <td className="py-2 pl-4 text-right text-[11px] font-bold text-[var(--color-primary)]">S/{data.kpis.totalRevenue.toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>

              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
