"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Phone, CalendarPlus, MessageSquare,
  CalendarCheck, Banknote, Scissors, User,
  StickyNote, Pencil, Check, X, History, ChevronRight,
  TrendingUp, Trash2,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

type HistoryItem = {
  id: string;
  startTime: string;
  status: AppointmentStatus;
  price: number;
  service: { name: string };
  collaborator: { name: string };
};

type ClientProfile = {
  id: string;
  name: string;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  totalVisits: number;
  totalSpent: number;
  appointments: HistoryItem[];
  metrics: { topService: string | null; topCollaborator: string | null };
};

const statusBadge: Record<AppointmentStatus, { label: string; className: string }> = {
  COMPLETED: { label: "Completado", className: "bg-[var(--color-primary-container)]/30 text-[var(--color-primary)] border border-[var(--color-primary-fixed)]" },
  CANCELLED: { label: "Cancelado",  className: "bg-[var(--color-error-container)] text-[var(--color-on-error-container)]" },
  CONFIRMED: { label: "Confirmada", className: "bg-[var(--color-secondary-fixed)]/40 text-[var(--color-secondary)]" },
  PENDING:   { label: "Pendiente",  className: "bg-[var(--color-tertiary-fixed)]/40 text-[var(--color-tertiary)]" },
  NO_SHOW:   { label: "No-show",    className: "bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)]" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) +
    " • " + new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function shortName(name: string) {
  const parts = name.split(" ");
  return parts[0] + (parts[1] ? " " + parts[1][0] + "." : "");
}

export default function ClientProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [client, setClient] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("gm_token");
    if (!token) { router.push("/login"); return; }

    fetch(`${API_URL}/clients/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data: ClientProfile) => {
        setClient(data);
        setNotesValue(data.notes ?? "");
      })
      .catch(() => router.push("/clientes"))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleDelete() {
    if (!confirm("¿Eliminar este cliente? Esta acción no se puede deshacer.")) return;
    const token = localStorage.getItem("gm_token");
    if (!token) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`${API_URL}/clients/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setDeleteError(d.error ?? "No se pudo eliminar."); return; }
      router.push("/clientes");
    } finally {
      setDeleting(false);
    }
  }

  async function saveNotes() {
    const token = localStorage.getItem("gm_token");
    if (!token) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`${API_URL}/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes: notesValue }),
      });
      if (res.ok) {
        const updated = await res.json();
        setClient((prev) => prev ? { ...prev, notes: updated.notes } : prev);
        setEditingNotes(false);
      }
    } finally {
      setSavingNotes(false);
    }
  }

  if (loading) {
    return (
      <>
        <Sidebar activePath="/clientes" />
        <main className="flex-1 ml-64 flex items-center justify-center bg-[var(--color-background)]">
          <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </main>
      </>
    );
  }

  if (!client) return null;

  const metrics = [
    {
      icon: CalendarCheck,
      iconColor: "text-[var(--color-on-surface-variant)]",
      value: client.totalVisits.toString(),
      label: "Visitas Totales",
      badge: "+12%",
    },
    {
      icon: Banknote,
      iconColor: "text-[var(--color-primary)]",
      value: `S/${client.totalSpent.toLocaleString("es-PE")}`,
      label: "Gasto Acumulado",
      valueColor: "text-[var(--color-primary)]",
    },
    {
      icon: Scissors,
      iconColor: "text-[var(--color-on-surface-variant)]",
      value: client.metrics.topService ?? "—",
      label: "Servicio Frecuente",
    },
    {
      icon: User,
      iconColor: "text-[var(--color-on-surface-variant)]",
      value: client.metrics.topCollaborator ? shortName(client.metrics.topCollaborator) : "—",
      label: "Estilista Favorito",
    },
  ];

  return (
    <>
      <Sidebar activePath="/clientes" />

      <main className="flex-1 ml-64 flex flex-col h-full bg-[var(--color-surface-container-low)] overflow-hidden">
        <TopBar />

        <div className="flex-1 overflow-y-auto pt-16" style={{ scrollbarWidth: "thin" }}>
          <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">

            {/* Breadcrumb */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link href="/clientes" className="p-2 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] rounded-full transition-colors">
                  <ArrowLeft size={20} strokeWidth={1.5} />
                </Link>
                <h1 className="text-headline-md font-semibold text-[var(--color-on-surface)]">
                  Perfil del Cliente
                </h1>
              </div>
            </div>

            {/* Hero */}
            <section className="bg-[var(--color-surface)] rounded-xl shadow-sm border border-[var(--color-outline-variant)] p-6 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
              {/* Orb decorativo */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary-fixed-dim)] rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/2 -translate-y-1/2 pointer-events-none" />

              {/* Avatar */}
              <div className="w-28 h-28 rounded-full bg-[var(--color-primary-container)]/20 flex items-center justify-center text-[var(--color-primary)] font-bold shrink-0 relative z-10 border-4 border-[var(--color-surface)] shadow-sm"
                style={{ fontSize: "2rem" }}>
                {getInitials([client.name, client.lastName].filter(Boolean).join(" "))}
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left z-10">
                <h2 className="text-display-lg font-bold text-[var(--color-on-surface)] mb-1">
                  {[client.name, client.lastName].filter(Boolean).join(" ")}
                </h2>
                {client.phone && (
                  <div className="flex items-center justify-center md:justify-start gap-2 text-[var(--color-on-surface-variant)] text-body-lg mb-4">
                    <Phone size={18} strokeWidth={1.5} />
                    {client.phone}
                  </div>
                )}

                {/* Acciones */}
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  <Link
                    href={`/nueva-cita?clientId=${client.id}`}
                    className="flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold uppercase tracking-wider px-5 py-3 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-all shadow-sm active:scale-95"
                  >
                    <CalendarPlus size={16} strokeWidth={1.5} />
                    Agendar Nueva Cita
                  </Link>
                  <button className="flex items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-label-md font-semibold uppercase tracking-wider px-4 py-3 rounded-lg hover:bg-[var(--color-surface-container-high)] transition-all active:scale-95">
                    <MessageSquare size={16} strokeWidth={1.5} className="text-emerald-500" />
                    WhatsApp
                  </button>
                  <button className="flex items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-label-md font-semibold uppercase tracking-wider px-4 py-3 rounded-lg hover:bg-[var(--color-surface-container-high)] transition-all active:scale-95">
                    <Phone size={16} strokeWidth={1.5} />
                    Llamar
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-2 bg-[var(--color-error-container)]/20 border border-[var(--color-error-container)] text-[var(--color-error)] text-label-md font-semibold uppercase tracking-wider px-4 py-3 rounded-lg hover:bg-[var(--color-error-container)]/40 transition-all active:scale-95 disabled:opacity-60"
                  >
                    <Trash2 size={16} strokeWidth={1.5} />
                    {deleting ? "Eliminando..." : "Eliminar"}
                  </button>
                  {deleteError && (
                    <p className="w-full text-body-md text-[var(--color-error)] mt-1">{deleteError}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Métricas */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {metrics.map((m) => (
                <div key={m.label} className="bg-[var(--color-surface)] border border-[var(--color-outline-variant)] rounded-xl p-3 flex flex-col justify-between shadow-sm hover:-translate-y-1 transition-transform duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <m.icon size={20} strokeWidth={1.5} className={m.iconColor} />
                    {m.badge && (
                      <span className="bg-[var(--color-secondary-fixed)] text-[var(--color-on-secondary-fixed)] text-label-md px-2 py-0.5 rounded-full flex items-center gap-1">
                        <TrendingUp size={10} strokeWidth={2} />
                        {m.badge}
                      </span>
                    )}
                  </div>
                  <div className={`text-headline-md font-semibold truncate ${m.valueColor ?? "text-[var(--color-on-surface)]"}`}>
                    {m.value}
                  </div>
                  <div className="text-label-md text-[var(--color-on-surface-variant)]">{m.label}</div>
                </div>
              ))}
            </section>

            {/* Notas + Historial */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Notas Internas */}
              <div className="lg:col-span-1">
                <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-4 shadow-sm h-full">
                  <div className="flex items-center justify-between mb-3 border-b border-[var(--color-outline-variant)] pb-2">
                    <h3 className="text-headline-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
                      <StickyNote size={18} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                      Notas Internas
                    </h3>
                    {!editingNotes && (
                      <button
                        onClick={() => setEditingNotes(true)}
                        className="text-[var(--color-primary)] hover:bg-[var(--color-surface-container-high)] p-1 rounded transition-colors"
                      >
                        <Pencil size={18} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>

                  {editingNotes ? (
                    <div className="space-y-2">
                      <textarea
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        rows={4}
                        className="w-full bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 resize-none transition-all"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={saveNotes}
                          disabled={savingNotes}
                          className="flex items-center gap-1 bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold px-3 py-1.5 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors disabled:opacity-60"
                        >
                          <Check size={14} strokeWidth={2} />
                          {savingNotes ? "Guardando..." : "Guardar"}
                        </button>
                        <button
                          onClick={() => { setEditingNotes(false); setNotesValue(client.notes ?? ""); }}
                          className="flex items-center gap-1 text-[var(--color-on-surface-variant)] border border-[var(--color-outline-variant)] text-label-md font-semibold px-3 py-1.5 rounded-lg hover:bg-[var(--color-surface-container-low)] transition-colors"
                        >
                          <X size={14} strokeWidth={2} />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[var(--color-surface-container-low)] rounded-lg p-3 text-body-md text-[var(--color-on-surface-variant)] italic min-h-[60px]">
                      {client.notes
                        ? `"${client.notes}"`
                        : <span className="not-italic text-[var(--color-outline)]">Sin notas. Click en editar para agregar.</span>
                      }
                    </div>
                  )}
                </section>
              </div>

              {/* Historial de Citas */}
              <div className="lg:col-span-2">
                <section className="bg-[var(--color-surface)] border border-[var(--color-outline-variant)] rounded-xl p-6 shadow-sm h-full">
                  <div className="flex items-center justify-between mb-4 border-b border-[var(--color-outline-variant)] pb-3">
                    <h3 className="text-headline-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
                      <History size={18} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                      Historial de Citas
                    </h3>
                    <button className="text-[var(--color-primary)] text-label-md font-semibold hover:underline flex items-center gap-1">
                      Ver todo <ChevronRight size={14} strokeWidth={2} />
                    </button>
                  </div>

                  {client.appointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-[var(--color-on-surface-variant)]">
                      <p className="text-body-md">Sin citas registradas</p>
                    </div>
                  ) : (
                    <div className="space-y-1 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[var(--color-outline-variant)] before:to-transparent">
                      {client.appointments.slice(0, 5).map((apt) => {
                        const badge = statusBadge[apt.status];
                        const isCancelled = apt.status === "CANCELLED" || apt.status === "NO_SHOW";
                        return (
                          <div key={apt.id} className="relative flex items-start gap-4 py-3">
                            {/* Dot */}
                            <div className={`w-6 h-6 rounded-full border-2 border-[var(--color-surface)] flex items-center justify-center shrink-0 z-10 shadow ${isCancelled ? "bg-[var(--color-surface-dim)]" : "bg-[var(--color-primary)]"}`}>
                              {isCancelled
                                ? <X size={12} strokeWidth={2} className="text-[var(--color-on-surface-variant)]" />
                                : <div className="w-2 h-2 rounded-full bg-white" />
                              }
                            </div>

                            {/* Card */}
                            <div className={`flex-1 p-3 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] hover:shadow-md transition-shadow cursor-pointer ${isCancelled ? "opacity-75" : ""}`}>
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <span className="text-label-md text-[var(--color-on-surface-variant)] block">
                                    {formatDate(apt.startTime)}
                                  </span>
                                  <h4 className={`text-body-lg font-semibold text-[var(--color-on-surface)] ${isCancelled ? "line-through decoration-[var(--color-outline-variant)]" : ""}`}>
                                    {apt.service.name}
                                  </h4>
                                </div>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide ${badge.className}`}>
                                  {badge.label}
                                </span>
                              </div>
                              <div className="flex items-center justify-between border-t border-[var(--color-outline-variant)] pt-2 mt-1">
                                <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] text-body-md">
                                  <User size={14} strokeWidth={1.5} />
                                  {shortName(apt.collaborator.name)}
                                </div>
                                <div className={`text-body-lg font-semibold ${isCancelled ? "text-[var(--color-on-surface-variant)]" : "text-[var(--color-primary)]"}`}>
                                  {isCancelled ? "—" : `S/${apt.price.toLocaleString("es-PE")}`}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
