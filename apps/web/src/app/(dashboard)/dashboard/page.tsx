"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Clock, User, Banknote, TrendingUp, AlertTriangle, Hourglass, CheckCircle, CheckCheck, XCircle, Users, UserX, Check, ChevronRight } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Appointment = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  price: number;
  client: { name: string; lastName: string | null; phone: string | null };
  collaborator: { name: string };
  service: { name: string };
};

function fullName(c: { name: string; lastName: string | null }) {
  return [c.name, c.lastName].filter(Boolean).join(" ");
}

function initials(c: { name: string; lastName: string | null }) {
  return [c.name[0], c.lastName ? c.lastName[0] : c.name.split(" ")[1]?.[0]]
    .filter(Boolean).join("").toUpperCase();
}

type Analytics = {
  kpis: { totalAppointments: number; completedAppointments: number; totalRevenue: number; noShowRate: number };
};

type UserData = { name: string; business: { name: string } };

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function today() {
  return new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "short", year: "numeric" });
}

export default function DashboardPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmingAll, setConfirmingAll] = useState(false);
  const [statusDrawer, setStatusDrawer] = useState<{ status: string; label: string } | null>(null);

  const loadData = useCallback(async () => {
    const token = localStorage.getItem("gm_token");
    if (!token) { router.push("/login"); return; }
    try {
      const h = { Authorization: `Bearer ${token}` };
      const [aptsRes, analRes, userRes] = await Promise.all([
        fetch(`${API_URL}/appointments`, { headers: h }),
        fetch(`${API_URL}/analytics`, { headers: h }),
        fetch(`${API_URL}/auth/me`, { headers: h }),
      ]);
      // Solo redirigir al login si el token expiró (401)
      if (aptsRes.status === 401 || userRes.status === 401) {
        localStorage.removeItem("gm_token");
        localStorage.removeItem("gm_user");
        router.push("/login");
        return;
      }
      const [apts, anal, user] = await Promise.all([
        aptsRes.ok ? aptsRes.json() : [],
        analRes.ok ? analRes.json() : null,
        userRes.ok ? userRes.json() : null,
      ]);
      setAppointments(Array.isArray(apts) ? apts : []);
      if (anal) setAnalytics(anal);
      if (user) setUserData(user);
    } catch {
      // Error de red — no redirigir, la app sigue funcionando con datos vacíos
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  async function confirmAll() {
    const token = localStorage.getItem("gm_token");
    if (!token || pendingUpcoming.length === 0) return;
    setConfirmingAll(true);
    try {
      await Promise.all(
        pendingUpcoming.map((apt) =>
          fetch(`${API_URL}/appointments/${apt.id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status: "CONFIRMED" }),
          })
        )
      );
      await loadData();
    } finally {
      setConfirmingAll(false);
    }
  }

  async function confirmAppointment(id: string) {
    const token = localStorage.getItem("gm_token");
    if (!token) return;
    setConfirmingId(id);
    try {
      const res = await fetch(`${API_URL}/appointments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "CONFIRMED" }),
      });
      if (res.ok) await loadData();
    } finally {
      setConfirmingId(null);
    }
  }

  const now = new Date();
  const todayApts = appointments.filter(a => {
    const d = new Date(a.startTime);
    return d.toDateString() === now.toDateString();
  });

  // Próxima cita: la más cercana en el futuro de cualquier día, no cancelada/completada
  const nextApt = appointments
    .filter(a => new Date(a.startTime) >= now && !["CANCELLED","NO_SHOW","COMPLETED"].includes(a.status))
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0] ?? null;

  const pending   = appointments.filter(a => a.status === "PENDING").length;
  const confirmed = appointments.filter(a => a.status === "CONFIRMED").length;
  const completed = appointments.filter(a => a.status === "COMPLETED").length;
  const cancelled = appointments.filter(a => a.status === "CANCELLED").length;

  // Alertas: citas PENDING en los próximos 2 días que aún no están confirmadas
  const in2Days = new Date(now);
  in2Days.setDate(in2Days.getDate() + 2);
  const pendingUpcoming = appointments.filter(a => {
    const d = new Date(a.startTime);
    return d > now && d <= in2Days && a.status === "PENDING";
  });

  function handleCounterClick(status: string, label: string, count: number) {
    if (count === 0) return;
    const filtered = appointments.filter(a => a.status === status);
    if (filtered.length === 1) {
      router.push(`/citas/${filtered[0].id}`);
    } else {
      setStatusDrawer({ status, label });
    }
  }

  const drawerApts = statusDrawer
    ? appointments.filter(a => a.status === statusDrawer.status)
    : [];

  if (loading) {
    return (
      <>
        <Sidebar activePath="/dashboard" />
        <main className="flex-1 ml-64 flex items-center justify-center bg-[var(--color-background)]">
          <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </main>
      </>
    );
  }

  return (
    <>
      <Sidebar activePath="/dashboard" />
      <main className="flex-1 ml-64 flex flex-col h-full bg-[var(--color-background)] relative">
        <TopBar />

        {/* Panel lateral de citas por estado */}
        {statusDrawer && (
          <>
            <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setStatusDrawer(null)} />
            <aside className="fixed right-0 top-0 h-full w-[380px] bg-[var(--color-surface-container-lowest)] z-50 shadow-2xl border-l border-[var(--color-outline-variant)] flex flex-col">
              <div className="h-16 px-6 flex items-center justify-between border-b border-[var(--color-outline-variant)] shrink-0">
                <h3 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">
                  Citas {statusDrawer.label} <span className="text-[var(--color-primary)]">({drawerApts.length})</span>
                </h3>
                <button onClick={() => setStatusDrawer(null)} className="p-2 rounded-full hover:bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)] transition-colors">
                  <XCircle size={20} strokeWidth={1.5} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: "thin" }}>
                {drawerApts
                  .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                  .map(apt => (
                    <Link key={apt.id} href={`/citas/${apt.id}`} onClick={() => setStatusDrawer(null)}
                      className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-surface-container-low)] transition-all">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-primary-container)]/20 flex items-center justify-center text-[var(--color-primary)] text-[11px] font-bold shrink-0">
                        {initials(apt.client)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-md font-semibold text-[var(--color-on-surface)] truncate">{fullName(apt.client)}</p>
                        <p className="text-[11px] text-[var(--color-on-surface-variant)] truncate">{apt.service.name} · {apt.collaborator.name}</p>
                        <p className="text-[11px] text-[var(--color-primary)] mt-0.5">
                          {new Date(apt.startTime).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })} · {formatTime(apt.startTime)}
                        </p>
                      </div>
                      <ChevronRight size={16} strokeWidth={1.5} className="text-[var(--color-outline)] shrink-0" />
                    </Link>
                  ))}
              </div>
            </aside>
          </>
        )}

        <div className="flex-1 overflow-y-auto pt-[88px] px-8 pb-8" style={{ scrollbarWidth: "thin" }}>

          {/* Header */}
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-display-lg font-bold text-[var(--color-on-surface)] mb-1">
                Resumen Operativo
              </h2>
              <p className="text-body-lg text-[var(--color-on-surface-variant)]">
                Bienvenido{userData?.name ? `, ${userData.name.split(" ")[0]}` : ""}. Aquí tienes un vistazo de tu día.
              </p>
            </div>
            <div className="text-label-md text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container)] rounded-lg px-3 py-1 flex items-center gap-2 capitalize">
              <CalendarDays size={16} strokeWidth={1.5} />
              {today()}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Próxima cita */}
            <div className="col-span-4 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] shadow-sm p-6 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)]/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 text-[var(--color-primary)] text-label-md font-semibold uppercase tracking-wider">
                  <Clock size={16} strokeWidth={1.5} /> Próxima Cita
                </div>
                {nextApt && (
                  <div className="bg-[var(--color-primary)] text-[var(--color-on-primary)] text-headline-md font-semibold px-3 py-1 rounded-lg tabular-nums animate-pulse">
                    {formatTime(nextApt.startTime)}
                  </div>
                )}
              </div>
              {nextApt ? (
                <>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-primary-container)]/20 flex items-center justify-center text-[var(--color-primary)] font-semibold shrink-0">
                      {initials(nextApt.client)}
                    </div>
                    <div>
                      <h3 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">{fullName(nextApt.client)}</h3>
                      <p className="text-body-md text-[var(--color-on-surface-variant)]">{nextApt.service.name}</p>
                      {new Date(nextApt.startTime).toDateString() !== now.toDateString() && (
                        <p className="text-[11px] text-[var(--color-tertiary)] font-semibold mt-0.5">
                          {new Date(nextApt.startTime).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 border-t border-[var(--color-outline-variant)] pt-3 text-label-md text-[var(--color-on-surface-variant)]">
                    <User size={14} strokeWidth={1.5} /> Con: {nextApt.collaborator.name}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-24 text-[var(--color-on-surface-variant)]">
                  <CheckCircle size={24} strokeWidth={1.5} className="text-emerald-500 mb-1" />
                  <p className="text-body-md">Sin citas próximas</p>
                </div>
              )}
            </div>

            {/* Ingresos del día */}
            <div className="col-span-4 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] shadow-sm p-6 flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] text-label-md font-semibold uppercase tracking-wider">
                <Banknote size={16} strokeWidth={1.5} /> Ingresos Totales
              </div>
              <div className="text-[3.5rem] font-bold text-[var(--color-on-surface)] leading-none tracking-tight">
                S/{(analytics?.kpis.totalRevenue ?? 0).toLocaleString("es-PE")}
              </div>
              <div className="bg-[var(--color-surface-container-high)] text-label-md px-3 py-1 rounded-full flex items-center gap-1">
                <TrendingUp size={12} className="text-[var(--color-tertiary)]" strokeWidth={2} />
                {analytics?.kpis.completedAppointments ?? 0} cobradas
              </div>
            </div>

            {/* Alertas */}
            <div className="col-span-4 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] shadow-sm p-6 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-[var(--color-error)] text-label-md font-semibold uppercase tracking-wider">
                  <AlertTriangle size={16} strokeWidth={1.5} /> Acción Requerida
                </div>
                {pendingUpcoming.length > 1 && (
                  <button
                    onClick={confirmAll}
                    disabled={confirmingAll}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-primary)] border border-[var(--color-primary)]/30 bg-[var(--color-primary-container)]/10 px-2.5 py-1 rounded-lg hover:bg-[var(--color-primary-container)]/20 transition-colors disabled:opacity-60"
                  >
                    <CheckCheck size={13} strokeWidth={2} />
                    {confirmingAll ? "Confirmando..." : "Confirmar todas"}
                  </button>
                )}
              </div>
              {pendingUpcoming.length > 0 ? (
                <div className="space-y-2 overflow-y-auto max-h-40" style={{ scrollbarWidth: "thin" }}>
                  {pendingUpcoming.map(apt => (
                    <div key={apt.id} className="bg-[var(--color-error-container)]/30 border border-[var(--color-error-container)] rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-body-md font-semibold text-[var(--color-on-surface)] truncate">{apt.client.name}</p>
                        <p className="text-[11px] text-[var(--color-on-surface-variant)] truncate">
                          {apt.service.name} · {new Date(apt.startTime).toLocaleDateString("es-MX", { weekday: "short", day: "numeric" })} {formatTime(apt.startTime)}
                        </p>
                      </div>
                      <button
                        onClick={() => confirmAppointment(apt.id)}
                        disabled={confirmingId === apt.id}
                        className="shrink-0 flex items-center gap-1 bg-[var(--color-primary)] text-[var(--color-on-primary)] text-[11px] font-semibold px-2 py-1 rounded-md hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors disabled:opacity-60"
                      >
                        <Check size={12} strokeWidth={2} />
                        {confirmingId === apt.id ? "..." : "Confirmar"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 gap-2 text-[var(--color-on-surface-variant)]">
                  <CheckCircle size={36} strokeWidth={1.5} className="text-emerald-500" />
                  <p className="text-headline-sm font-semibold text-emerald-600">Todo en orden</p>
                  <p className="text-body-md text-[var(--color-on-surface-variant)]">Sin citas pendientes de confirmar</p>
                </div>
              )}
            </div>

            {/* Contadores */}
            <div className="col-span-12 grid grid-cols-4 gap-6 mt-3">
              {[
                { label: "Pendientes", status: "PENDING",   count: pending,   icon: Hourglass,  bg: "bg-[var(--color-surface-container-high)]",  color: "text-[var(--color-on-surface-variant)]", accent: null,                              opacity: "" },
                { label: "Confirmadas", status: "CONFIRMED", count: confirmed, icon: CheckCircle, bg: "bg-[var(--color-secondary-fixed)]",          color: "text-[var(--color-on-secondary-container)]", accent: "bg-[var(--color-secondary-container)]", opacity: "" },
                { label: "Completadas", status: "COMPLETED", count: completed, icon: CheckCheck,  bg: "bg-[var(--color-primary)]/20",               color: "text-[var(--color-primary)]",            accent: "bg-[var(--color-primary)]",               opacity: "" },
                { label: "Canceladas",  status: "CANCELLED", count: cancelled, icon: XCircle,     bg: "bg-[var(--color-error-container)]/50",        color: "text-[var(--color-error)]",              accent: null,                              opacity: "opacity-75" },
              ].map(({ label, status, count, icon: Icon, bg, color, accent, opacity }) => (
                <button
                  key={label}
                  onClick={() => handleCounterClick(status, label, count)}
                  disabled={count === 0}
                  className={`bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-3 flex items-center gap-3 transition-all relative overflow-hidden text-left ${opacity} ${count > 0 ? "hover:border-[var(--color-primary)]/50 hover:shadow-md hover:-translate-y-0.5 cursor-pointer" : "cursor-default"}`}
                >
                  {accent && <div className={`absolute left-0 top-0 bottom-0 w-1 ${accent}`} />}
                  <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center shrink-0`}>
                    <Icon size={22} strokeWidth={1.5} className={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-display-lg font-bold text-[var(--color-on-surface)] leading-none">{count}</div>
                    <div className="text-label-md text-[var(--color-on-surface-variant)]">{label}</div>
                  </div>
                  {count > 0 && <ChevronRight size={16} strokeWidth={1.5} className="text-[var(--color-outline)] shrink-0" />}
                </button>
              ))}
            </div>

            {/* Equipo activo hoy */}
            <div className="col-span-12 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] shadow-sm mt-3 p-6">
              <div className="flex justify-between items-center mb-6 border-b border-[var(--color-outline-variant)] pb-3">
                <h3 className="text-headline-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
                  <Users size={20} className="text-[var(--color-primary)]" strokeWidth={1.5} /> Citas de Hoy
                </h3>
                <span className="text-label-md text-[var(--color-on-surface-variant)]">{todayApts.length} cita{todayApts.length !== 1 ? "s" : ""}</span>
              </div>
              {todayApts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-20 text-[var(--color-on-surface-variant)]">
                  <UserX size={24} strokeWidth={1.5} className="mb-1" />
                  <p className="text-body-md">Sin citas programadas para hoy</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {todayApts.map(apt => (
                    <Link
                      key={apt.id}
                      href={`/citas/${apt.id}`}
                      className="border border-[var(--color-outline-variant)] rounded-lg p-3 flex items-center gap-3 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-surface-container-low)] transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-[var(--color-primary-container)]/20 flex items-center justify-center text-[var(--color-primary)] text-[11px] font-bold shrink-0">
                        {initials(apt.client)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-label-md font-semibold text-[var(--color-on-surface)] truncate">{fullName(apt.client)}</p>
                        <p className="text-[11px] text-[var(--color-on-surface-variant)] truncate">{apt.service.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-[11px] text-[var(--color-primary)]">{formatTime(apt.startTime)}</p>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                            apt.status === "CONFIRMED"  ? "bg-[var(--color-secondary-fixed)]/40 text-[var(--color-secondary)]" :
                            apt.status === "COMPLETED"  ? "bg-emerald-100 text-emerald-700" :
                            apt.status === "CANCELLED"  ? "bg-[var(--color-error-container)]/40 text-[var(--color-error)]" :
                            apt.status === "NO_SHOW"    ? "bg-[var(--color-surface-container-high)] text-[var(--color-outline)]" :
                            "bg-[var(--color-tertiary-fixed)]/30 text-[var(--color-tertiary)]"
                          }`}>
                            {apt.status === "CONFIRMED" ? "Confirmada"  :
                             apt.status === "COMPLETED" ? "Completada"  :
                             apt.status === "CANCELLED" ? "Cancelada"   :
                             apt.status === "NO_SHOW"   ? "No se presentó" :
                             "Pendiente"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
