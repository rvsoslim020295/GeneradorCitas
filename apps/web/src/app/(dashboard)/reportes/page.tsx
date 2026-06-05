"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar, CheckCircle, Banknote, TrendingUp,
  TrendingDown, ChevronDown, AlertCircle,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { useRole } from "@/hooks/use-role";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Analytics = {
  kpis: {
    totalAppointments: number;
    completedAppointments: number;
    totalRevenue: number;
    noShowRate: number;
  };
  dailyRevenue: { day: string; amount: number }[];
  statusDistribution: { completed: number; pending: number; cancelled: number };
  topCollaborators: { name: string; revenue: number; appointmentCount: number; percentage: number }[];
};

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const collabColors = [
  "bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]",
  "bg-[var(--color-secondary-fixed)] text-[var(--color-on-secondary-fixed)]",
  "bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]",
];

export default function ReportesPage() {
  const router = useRouter();
  const role = useRole();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("today");

  useEffect(() => {
    const token = localStorage.getItem("gm_token");
    if (!token) { router.push("/login"); return; }
    const stored = localStorage.getItem("gm_user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u.role && u.role !== "OWNER") { router.replace("/dashboard"); return; }
      } catch { /* ignore */ }
    }

    setLoading(true);
    setError("");
    fetch(`${API_URL}/analytics?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setData)
      .catch(() => setError("No se pudo cargar las analíticas."))
      .finally(() => setLoading(false));
  }, [router, period]);

  const maxDailyRevenue = data
    ? Math.max(...data.dailyRevenue.map((d) => d.amount), 1)
    : 1;

  return (
    <>
      <Sidebar activePath="/reportes" />

      <main className="flex-1 ml-64 flex flex-col h-full bg-[var(--color-background)] relative overflow-hidden">
        <TopBar />

        <div className="flex-1 overflow-y-auto pt-16" style={{ scrollbarWidth: "thin" }}>
          <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">

            {/* Controles */}
            <div className="flex items-center justify-between">
              <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Resumen</h2>
              <div className="relative">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="appearance-none bg-[var(--color-surface)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] text-body-md rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer"
                >
                  <option value="today">Este Día</option>
                  <option value="this_week">Esta Semana</option>
                  <option value="last_week">Semana Pasada</option>
                  <option value="last_30_days">Últimos 30 días</option>
                  <option value="this_year">Este Año</option>
                </select>
                <ChevronDown size={16} strokeWidth={1.5} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] pointer-events-none" />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-[var(--color-error)] bg-[var(--color-error-container)]/30 border border-[var(--color-error-container)] rounded-lg px-4 py-3 text-body-md">
                <AlertCircle size={16} strokeWidth={1.5} />
                {error}
              </div>
            )}

            {/* KPIs */}
            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`bg-[var(--color-surface-container-lowest)] rounded-xl h-28 animate-pulse ${i === 3 || i === 4 ? "col-span-2" : ""}`} />
                ))}
              </div>
            ) : data && (
              <div className="grid grid-cols-2 gap-4">
                {/* Total Citas */}
                <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 border border-[#E2E8F0] ambient-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase">Total Citas</span>
                    <div className="bg-[var(--color-primary-container)]/20 p-1.5 rounded-lg">
                      <Calendar size={16} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                    </div>
                  </div>
                  <span className="text-display-lg font-bold text-[var(--color-on-surface)]">
                    {data.kpis.totalAppointments}
                  </span>
                  <div className="mt-2 flex items-center gap-1 text-[var(--color-secondary-container)]">
                    <TrendingUp size={12} strokeWidth={2} />
                    <span className="text-[10px] font-semibold">+12% vs mes ant.</span>
                  </div>
                </div>

                {/* Completadas */}
                <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 border border-[#E2E8F0] ambient-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase">Completadas</span>
                    <div className="bg-[var(--color-secondary-container)]/20 p-1.5 rounded-lg">
                      <CheckCircle size={16} className="text-[var(--color-secondary-container)]" strokeWidth={1.5} />
                    </div>
                  </div>
                  <span className="text-display-lg font-bold text-[var(--color-on-surface)]">
                    {data.kpis.completedAppointments}
                  </span>
                  <div className="mt-2 flex items-center gap-1 text-[var(--color-secondary-container)]">
                    <TrendingUp size={12} strokeWidth={2} />
                    <span className="text-[10px] font-semibold">+5% vs mes ant.</span>
                  </div>
                </div>

                {/* Ingresos Totales */}
                <div className="col-span-2 bg-[var(--color-surface-container-lowest)] rounded-xl p-4 border border-[#E2E8F0] ambient-shadow relative overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-[var(--color-primary-container)] rounded-full opacity-10 blur-xl pointer-events-none" />
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <span className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase">Ingresos Totales</span>
                    <div className="bg-[var(--color-primary-container)] p-1.5 rounded-lg">
                      <Banknote size={16} className="text-[var(--color-on-primary-container)]" strokeWidth={1.5} />
                    </div>
                  </div>
                  <span className="text-display-lg font-bold text-[var(--color-primary)] relative z-10">
                    S/{data.kpis.totalRevenue.toLocaleString("es-PE")}
                  </span>
                  <div className="mt-2 flex items-center gap-1 text-[var(--color-secondary-container)] relative z-10">
                    <TrendingUp size={12} strokeWidth={2} />
                    <span className="text-[10px] font-semibold">+18.2% vs mes ant.</span>
                  </div>
                </div>

                {/* Tasa No-Show */}
                <div className="col-span-2 bg-[var(--color-surface-container-lowest)] rounded-xl p-4 border border-[#E2E8F0] ambient-shadow flex items-center justify-between">
                  <div>
                    <span className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase block mb-1">Tasa de Inasistencia</span>
                    <span className="text-headline-md font-semibold text-[var(--color-on-surface)]">
                      {data.kpis.noShowRate}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[var(--color-error)] bg-[var(--color-error-container)] px-2 py-1 rounded-full">
                    <TrendingDown size={12} strokeWidth={2} />
                    <span className="text-[10px] font-semibold">-1.2%</span>
                  </div>
                </div>
              </div>
            )}

            {data && (
              <>
                {/* Gráfica de barras — Ingresos por día */}
                <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 border border-[#E2E8F0] ambient-shadow">
                  <div className="mb-4">
                    <h3 className="text-body-lg font-semibold text-[var(--color-on-surface)]">Ingresos</h3>
                    <p className="text-[11px] text-[var(--color-on-surface-variant)] mt-0.5">
                      {period === "today"       ? "Por hora — hoy"              :
                       period === "this_week"   ? "Por día — esta semana"       :
                       period === "last_week"   ? "Por día — semana pasada"     :
                       period === "last_30_days"? "Por semana — últimos 30 días":
                                                  "Por mes — este año"}
                    </p>
                  </div>
                  <div className="h-48 w-full flex items-stretch gap-2 px-1 relative">
                    {/* Líneas horizontales de referencia */}
                    <div className="absolute w-full border-t border-[var(--color-outline-variant)] opacity-30 bottom-[20%]" />
                    <div className="absolute w-full border-t border-[var(--color-outline-variant)] opacity-30 bottom-[50%]" />
                    <div className="absolute w-full border-t border-[var(--color-outline-variant)] opacity-30 bottom-[80%]" />

                    {data.dailyRevenue.map((day, i) => {
                      const heightPct = maxDailyRevenue > 0
                        ? Math.max((day.amount / maxDailyRevenue) * 100, day.amount > 0 ? 5 : 2)
                        : 2;
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
                  <div className="flex justify-between mt-2 px-1">
                    {data.dailyRevenue.map((d, i) => (
                      <div key={i} className="flex-1 flex items-start justify-center min-w-0 px-0.5">
                        <span className="text-[9px] text-[var(--color-on-surface-variant)] text-center leading-tight whitespace-nowrap">
                          {d.day}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Donut — Citas por estado */}
                <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 border border-[#E2E8F0] ambient-shadow">
                  <h3 className="text-body-lg font-semibold text-[var(--color-on-surface)] mb-4">Citas por Estado</h3>
                  <div className="flex items-center gap-6">
                    {/* Donut CSS simplificado */}
                    <div className="w-24 h-24 rounded-full relative shrink-0" style={{
                      background: `conic-gradient(
                        var(--color-primary) 0% ${data.statusDistribution.completed}%,
                        var(--color-secondary-container) ${data.statusDistribution.completed}% ${data.statusDistribution.completed + data.statusDistribution.pending}%,
                        var(--color-error) ${data.statusDistribution.completed + data.statusDistribution.pending}% 100%
                      )`
                    }}>
                      <div className="absolute inset-[8px] rounded-full bg-[var(--color-surface-container-lowest)] flex items-center justify-center flex-col">
                        <span className="text-headline-sm font-semibold text-[var(--color-on-surface)] leading-none">
                          {data.kpis.totalAppointments}
                        </span>
                        <span className="text-[8px] text-[var(--color-on-surface-variant)] uppercase">Total</span>
                      </div>
                    </div>

                    {/* Leyenda */}
                    <div className="flex-1 space-y-2">
                      {[
                        { label: "Completadas", pct: data.statusDistribution.completed, color: "bg-[var(--color-primary)]" },
                        { label: "Pendientes", pct: data.statusDistribution.pending, color: "bg-[var(--color-secondary-container)]" },
                        { label: "Canceladas", pct: data.statusDistribution.cancelled, color: "bg-[var(--color-error)]" },
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

                {/* Top 3 colaboradores */}
                <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 border border-[#E2E8F0] ambient-shadow">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-body-lg font-semibold text-[var(--color-on-surface)]">Top 3 Colaboradores</h3>
                    <span className="text-[12px] text-[var(--color-on-surface-variant)]">Por ingresos</span>
                  </div>

                  {data.topCollaborators.length === 0 ? (
                    <p className="text-body-md text-[var(--color-outline)] text-center py-4">
                      Sin datos de colaboradores todavía
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {data.topCollaborators.map((collab, i) => (
                        <div key={collab.name} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-label-md font-bold text-sm shrink-0 ${collabColors[i] ?? collabColors[2]}`}>
                            {getInitials(collab.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-body-md font-medium text-[var(--color-on-surface)] leading-tight truncate">
                              {collab.name}
                            </h4>
                            <span className="text-[11px] text-[var(--color-on-surface-variant)]">
                              {collab.appointmentCount} cita{collab.appointmentCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-label-md text-[14px] text-[var(--color-on-surface)] block">
                              S/{collab.revenue.toLocaleString("es-PE")}
                            </span>
                            <span className={`text-[10px] font-semibold ${i === 0 ? "text-[var(--color-secondary-container)]" : "text-[var(--color-on-surface-variant)]"}`}>
                              {collab.percentage}% del total
                            </span>
                          </div>
                        </div>
                      ))}
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
