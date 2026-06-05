"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  X, MessageSquare, Phone, Clock, User,
  CreditCard, CalendarClock, XCircle, UserX, History,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

type Appointment = {
  id: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  price: number;
  notes: string | null;
  client: { id: string; name: string; phone: string | null };
  collaborator: { id: string; name: string; role: string };
  service: { id: string; name: string; durationMin: number; category: string };
};

const statusConfig: Record<AppointmentStatus, { label: string; bg: string; dot: string; text: string }> = {
  PENDING:   { label: "Pendiente",  bg: "bg-[var(--color-tertiary-fixed)]/30 border-[var(--color-tertiary-fixed)]",   dot: "bg-[var(--color-tertiary)]",   text: "text-[var(--color-tertiary)]" },
  CONFIRMED: { label: "Confirmada", bg: "bg-[var(--color-secondary-fixed)]/30 border-[var(--color-secondary-fixed)]", dot: "bg-[var(--color-secondary)]", text: "text-[var(--color-secondary)]" },
  COMPLETED: { label: "Completada", bg: "bg-emerald-50 border-emerald-200",  dot: "bg-emerald-500", text: "text-emerald-700" },
  CANCELLED: { label: "Cancelada",  bg: "bg-[var(--color-error-container)]/30 border-[var(--color-error-container)]", dot: "bg-[var(--color-error)]",  text: "text-[var(--color-error)]" },
  NO_SHOW:   { label: "No se presentó", bg: "bg-[var(--color-surface-variant)] border-[var(--color-outline-variant)]", dot: "bg-[var(--color-outline)]", text: "text-[var(--color-on-surface-variant)]" },
};

const MOCK_TIMELINE = [
  { label: "Cita Confirmada",      detail: "Hoy, 09:15 AM • Vía WhatsApp", active: true },
  { label: "Recordatorio enviado", detail: "Ayer, 10:00 AM • SMS Automático", active: false },
  { label: "Cita Creada",          detail: "Hace 3 días • Por Recepción",   active: false },
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function CitaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("gm_token");
    if (!token) { router.push("/login"); return; }

    fetch(`${API_URL}/appointments/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setAppointment)
      .catch(() => router.push("/agenda"))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function updateStatus(status: AppointmentStatus, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    const token = localStorage.getItem("gm_token");
    if (!token || updating) return;

    setUpdating(true);
    setActionError("");
    try {
      const res = await fetch(`${API_URL}/appointments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAppointment(data);
        if (status === "CANCELLED" || status === "NO_SHOW") {
          setTimeout(() => router.push("/agenda"), 800);
        }
      } else {
        setActionError(data.error ?? "No se pudo actualizar la cita.");
      }
    } catch {
      setActionError("No se pudo conectar con el servidor.");
    } finally {
      setUpdating(false);
    }
  }

  function handleReprogramar() {
    if (!appointment) return;
    router.push(`/nueva-cita?clientId=${appointment.client.id}`);
  }

  const status = appointment ? statusConfig[appointment.status] : null;

  return (
    <>
      <Sidebar activePath="/agenda" />

      <main className="flex-1 ml-64 flex flex-col h-full bg-[var(--color-surface-bright)] relative overflow-hidden">
        <TopBar searchPlaceholder="Buscar citas, clientes..." />

        {/* Fondo agenda difuminado */}
        <div className="flex flex-col flex-1 overflow-hidden pt-16 opacity-40 blur-sm pointer-events-none select-none">
          <div className="px-6 py-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface)]">
            <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Agenda Semanal</h2>
          </div>
          <div className="flex-1 m-6 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] flex items-center justify-center">
            <p className="text-body-md text-[var(--color-outline)]">Vista de Agenda Principal</p>
          </div>
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-[var(--color-on-background)]/10 backdrop-blur-[2px] z-30" />

        {/* Drawer panel */}
        <aside className="absolute right-0 top-0 h-full w-[420px] bg-[var(--color-surface-container-lowest)] z-40 shadow-[-8px_0_24px_rgba(0,0,0,0.06)] border-l border-[var(--color-outline-variant)] flex flex-col">
          {/* Header del drawer */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-[var(--color-outline-variant)] bg-[var(--color-surface)]/50 backdrop-blur-md shrink-0">
            <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">
              Detalle de Cita
            </h2>
            <Link
              href="/agenda"
              className="p-2 rounded-full text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] transition-colors"
            >
              <X size={20} strokeWidth={1.5} />
            </Link>
          </div>

          {/* Contenido scrolleable */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : appointment && status ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: "thin" }}>

              {/* Estado + Ref */}
              <div className="flex items-center justify-between">
                <div className={`${status.bg} border rounded-full px-4 py-1.5 flex items-center gap-2`}>
                  <div className={`w-2 h-2 rounded-full ${status.dot}`} />
                  <span className={`text-label-md font-semibold uppercase tracking-wider ${status.text}`}>
                    {status.label}
                  </span>
                </div>
                <span className="text-label-md text-[var(--color-on-surface-variant)]">
                  Ref: #{appointment.id.slice(-6).toUpperCase()}
                </span>
              </div>

              {/* Tarjeta de cliente */}
              <div className="bg-[var(--color-surface)] rounded-xl p-3 border border-[var(--color-outline-variant)] shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-primary-container)]/20 flex items-center justify-center text-[var(--color-primary)] font-semibold text-headline-sm shrink-0">
                    {getInitials(appointment.client.name)}
                  </div>
                  <div>
                    <h3 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">
                      {appointment.client.name}
                    </h3>
                    <p className="text-body-md text-[var(--color-on-surface-variant)] mt-0.5">
                      {appointment.client.phone ?? "Sin teléfono"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="w-10 h-10 rounded-full bg-[var(--color-surface-container-low)] hover:bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] flex items-center justify-center text-[var(--color-primary)] transition-colors shadow-sm">
                    <MessageSquare size={18} strokeWidth={1.5} />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-[var(--color-surface-container-low)] hover:bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] flex items-center justify-center text-[var(--color-primary)] transition-colors shadow-sm">
                    <Phone size={18} strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Detalles del servicio */}
              <div className="space-y-2">
                <h4 className="text-label-md font-semibold text-[var(--color-outline)] uppercase tracking-widest">
                  Información del Servicio
                </h4>
                <div className="bg-[var(--color-surface-container-low)] rounded-xl p-5 border border-[var(--color-outline-variant)]/50 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-headline-sm font-semibold text-[var(--color-on-surface)]">
                        {appointment.service.name}
                      </p>
                      <p className="text-body-md text-[var(--color-on-surface-variant)] mt-0.5">
                        {appointment.service.category}
                      </p>
                    </div>
                    <span className="text-headline-md font-semibold text-[var(--color-on-surface)]">
                      S/{appointment.price.toLocaleString("es-PE")}
                    </span>
                  </div>
                  <hr className="border-[var(--color-outline-variant)]/50" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-label-md text-[var(--color-outline)] mb-1">Horario</p>
                      <div className="flex items-center gap-2 text-[var(--color-on-surface)]">
                        <Clock size={16} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                        <span className="text-body-md font-medium">
                          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                        </span>
                      </div>
                      <p className="text-label-md text-[var(--color-on-surface-variant)] mt-1 ml-6">
                        {appointment.service.durationMin} min de duración
                      </p>
                    </div>
                    <div>
                      <p className="text-label-md text-[var(--color-outline)] mb-1">Colaborador</p>
                      <div className="flex items-center gap-2 text-[var(--color-on-surface)]">
                        <User size={16} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                        <span className="text-body-md font-medium">
                          {appointment.collaborator.name.split(" ")[0]} {appointment.collaborator.name.split(" ").slice(-1)[0][0]}.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              {!["COMPLETED", "CANCELLED", "NO_SHOW"].includes(appointment.status) && (
                <div className="space-y-3 pt-1">
                  {actionError && (
                    <div className="text-body-md text-[var(--color-error)] bg-[var(--color-error-container)]/30 border border-[var(--color-error-container)] rounded-lg px-3 py-2">
                      {actionError}
                    </div>
                  )}

                  {/* Completar y Cobrar */}
                  <Link
                    href={`/citas/${appointment.id}/cobrar`}
                    className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-on-primary-fixed-variant)] text-[var(--color-on-primary)] text-headline-sm font-semibold py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <CreditCard size={20} strokeWidth={1.5} />
                    Completar y Cobrar
                  </Link>

                  {/* Reprogramar + Cancelar */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleReprogramar}
                      disabled={updating}
                      className="w-full bg-[var(--color-surface-container)] hover:bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] border border-[var(--color-outline-variant)] text-label-md font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <CalendarClock size={16} strokeWidth={1.5} />
                      Reprogramar
                    </button>
                    <button
                      onClick={() => updateStatus("CANCELLED", "¿Cancelar esta cita? El cliente será notificado.")}
                      disabled={updating}
                      className="w-full bg-[var(--color-surface-container)] hover:bg-[var(--color-surface-container-high)] text-[var(--color-error)] border border-[var(--color-outline-variant)] text-label-md font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <XCircle size={16} strokeWidth={1.5} />
                      {updating ? "..." : "Cancelar Cita"}
                    </button>
                  </div>

                  {/* No se presentó */}
                  <button
                    onClick={() => updateStatus("NO_SHOW", "¿Marcar al cliente como no presentado?")}
                    disabled={updating}
                    className="w-full bg-transparent hover:bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)] text-label-md font-semibold py-2 rounded-lg transition-colors border border-transparent hover:border-[var(--color-outline-variant)] flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <UserX size={15} strokeWidth={1.5} />
                    {updating ? "Actualizando..." : "Cliente no se presentó"}
                  </button>
                </div>
              )}

              {/* Timeline */}
              <div className="pt-4 border-t border-[var(--color-outline-variant)]">
                <h4 className="text-label-md font-semibold text-[var(--color-outline)] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <History size={14} strokeWidth={1.5} />
                  Historial de la Cita
                </h4>
                <div className="relative pl-4 space-y-5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[var(--color-outline-variant)]/30">
                  {MOCK_TIMELINE.map((event) => (
                    <div key={event.label} className="relative">
                      <div className={`absolute -left-[17px] top-1 w-[10px] h-[10px] rounded-full ring-4 ring-[var(--color-surface-container-lowest)] ${event.active ? "bg-[var(--color-secondary)]" : "bg-[var(--color-outline-variant)]"}`} />
                      <p className="text-body-md text-[var(--color-on-surface)]">{event.label}</p>
                      <p className="text-label-md text-[var(--color-on-surface-variant)] mt-0.5">{event.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </aside>
      </main>
    </>
  );
}
