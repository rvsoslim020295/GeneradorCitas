"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Phone, CalendarPlus, MessageSquare,
  CalendarCheck, Banknote, Scissors, User,
  StickyNote, Pencil, Check, X, History, ChevronRight,
  TrendingUp, Trash2, FlaskConical, Plus, ChevronDown, ChevronUp,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { useClient, useUpdateClient, useDeleteClient } from "@/lib/api/hooks";
import { apiFetch } from "@/lib/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED" | "IN_PROGRESS";

type ClientRecord = {
  id: string; date: string; treatment: string;
  colorFormula?: string | null; allergies?: string | null; notes?: string | null;
};

type HistoryItem = {
  id: string; startTime: string; status: AppointmentStatus;
  price: number; service: { name: string }; collaborator: { name: string };
};

type ClientProfile = {
  id: string; name: string; lastName: string | null; phone: string | null;
  email: string | null; notes: string | null; totalVisits: number; totalSpent: number;
  appointments: HistoryItem[];
  metrics: { topService: string | null; topCollaborator: string | null };
};

const statusBadge: Record<AppointmentStatus, { label: string; className: string }> = {
  COMPLETED:   { label: "Completado",  className: "bg-[var(--color-primary-container)]/30 text-[var(--color-primary)] border border-[var(--color-primary-fixed)]" },
  CANCELLED:   { label: "Cancelado",   className: "bg-[var(--color-error-container)] text-[var(--color-on-error-container)]" },
  CONFIRMED:   { label: "Confirmada",  className: "bg-[var(--color-secondary-fixed)]/40 text-[var(--color-secondary)]" },
  PENDING:     { label: "Pendiente",   className: "bg-[var(--color-tertiary-fixed)]/40 text-[var(--color-tertiary)]" },
  NO_SHOW:     { label: "No-show",     className: "bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)]" },
  RESCHEDULED: { label: "Reagendada", className: "bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]" },
  IN_PROGRESS: { label: "En curso",   className: "bg-[var(--color-secondary-fixed)]/20 text-[var(--color-secondary)]" },
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

  const [editingContact, setEditingContact] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [contactError, setContactError] = useState("");

  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [deleteError, setDeleteError] = useState("");

  // Fichas técnicas
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ClientRecord | null>(null);
  const [recordDeleteTarget, setRecordDeleteTarget] = useState<string | null>(null);
  const [showDeleteClientConfirm, setShowDeleteClientConfirm] = useState(false);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [rTreatment, setRTreatment] = useState("");
  const [rColorFormula, setRColorFormula] = useState("");
  const [rAllergies, setRAllergies] = useState("");
  const [rNotes, setRNotes] = useState("");
  const [rDate, setRDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: client, isLoading } = useQuery<ClientProfile>({
    queryKey: ["clients", "detail", id],
    queryFn: () => apiFetch<ClientProfile>(`/clients/${id}`),
    enabled: !!id,
  });

  const updateClient = useUpdateClient(id);
  const deleteClient = useDeleteClient();
  const qc = useQueryClient();

  const { data: records = [] } = useQuery<ClientRecord[]>({
    queryKey: ["client-records", id],
    queryFn: () => apiFetch<ClientRecord[]>(`/clients/${id}/records`),
    enabled: !!id,
  });

  const createRecord = useMutation({
    mutationFn: (body: Omit<ClientRecord, "id">) =>
      apiFetch<ClientRecord>(`/clients/${id}/records`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["client-records", id] }); resetRecordForm(); },
  });

  const updateRecord = useMutation({
    mutationFn: ({ recordId, body }: { recordId: string; body: Partial<ClientRecord> }) =>
      apiFetch<ClientRecord>(`/clients/${id}/records/${recordId}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["client-records", id] }); resetRecordForm(); },
  });

  const deleteRecord = useMutation({
    mutationFn: (recordId: string) =>
      apiFetch(`/clients/${id}/records/${recordId}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["client-records", id] }); setRecordDeleteTarget(null); },
  });

  function resetRecordForm() {
    setShowRecordForm(false); setEditingRecord(null);
    setRTreatment(""); setRColorFormula(""); setRAllergies(""); setRNotes("");
    setRDate(new Date().toISOString().slice(0, 10));
  }

  function openEditRecord(r: ClientRecord) {
    setEditingRecord(r);
    setRTreatment(r.treatment); setRColorFormula(r.colorFormula ?? "");
    setRAllergies(r.allergies ?? ""); setRNotes(r.notes ?? "");
    setRDate(r.date.slice(0, 10));
    setShowRecordForm(true);
  }

  function handleSaveRecord() {
    if (!rTreatment.trim()) return;
    const body = { treatment: rTreatment.trim(), colorFormula: rColorFormula || undefined, allergies: rAllergies || undefined, notes: rNotes || undefined, date: new Date(rDate).toISOString() };
    if (editingRecord) updateRecord.mutate({ recordId: editingRecord.id, body });
    else createRecord.mutate(body as Omit<ClientRecord, "id">);
  }

  useEffect(() => {
    if (client) {
      setNotesValue(client.notes ?? "");
      setEditName(client.name);
      setEditLastName(client.lastName ?? "");
      // Normalizar teléfono al formato +51 XXXXXXXXX
      const rawPhone = client.phone ?? "";
      const digits = rawPhone.replace(/\D/g, "");
      const local = digits.startsWith("51") ? digits.slice(2) : digits;
      setEditPhone(local ? `+51 ${local.slice(0, 9)}` : "+51 ");
      setEditEmail(client.email ?? "");
    }
  }, [client]);

  async function handleDelete() {
    setDeleteError("");
    try {
      await deleteClient.mutateAsync(id);
      router.push("/clientes");
    } catch {
      setDeleteError("No se pudo eliminar.");
    }
  }

  async function saveContact() {
    setContactError("");
    if (!editName.trim()) { setContactError("El nombre es obligatorio."); return; }
    if (editEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail.trim())) {
      setContactError("El email no tiene un formato válido."); return;
    }
    try {
      await updateClient.mutateAsync({
        name: editName.trim(),
        lastName: editLastName.trim() || undefined,
        phone: editPhone.trim() || undefined,
        email: editEmail.trim() || undefined,
      } as never);
      setEditingContact(false);
    } catch {
      setContactError("Error al guardar. Intenta de nuevo.");
    }
  }

  async function saveNotes() {
    try {
      await updateClient.mutateAsync({ notes: notesValue } as never);
      setEditingNotes(false);
    } catch { /* silencioso */ }
  }

  if (isLoading) return (
    <>
      <Sidebar activePath="/clientes" />
      <main className="flex-1 ml-64 flex items-center justify-center bg-[var(--color-background)]">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </main>
    </>
  );

  if (!client) return null;

  const metrics = [
    { icon: CalendarCheck, iconColor: "text-[var(--color-on-surface-variant)]", value: client.totalVisits.toString(), label: "Visitas Totales", badge: "+12%" },
    { icon: Banknote, iconColor: "text-[var(--color-primary)]", value: `S/${client.totalSpent.toLocaleString("es-PE")}`, label: "Gasto Acumulado", valueColor: "text-[var(--color-primary)]" },
    { icon: Scissors, iconColor: "text-[var(--color-on-surface-variant)]", value: client.metrics.topService ?? "—", label: "Servicio Frecuente" },
    { icon: User, iconColor: "text-[var(--color-on-surface-variant)]", value: client.metrics.topCollaborator ? shortName(client.metrics.topCollaborator) : "—", label: "Estilista Favorito" },
  ];

  return (
    <>
      <Sidebar activePath="/clientes" />
      <main className="flex-1 ml-64 flex flex-col h-full bg-[var(--color-surface-container-low)] overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-y-auto pt-16" style={{ scrollbarWidth: "thin" }}>
          <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link href="/clientes" className="p-2 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] rounded-full transition-colors">
                  <ArrowLeft size={20} strokeWidth={1.5} />
                </Link>
                <h1 className="text-headline-md font-semibold text-[var(--color-on-surface)]">Perfil del Cliente</h1>
              </div>
            </div>

            <section className="bg-[var(--color-surface)] rounded-xl shadow-sm border border-[var(--color-outline-variant)] p-6 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary-fixed-dim)] rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              <div className="w-28 h-28 rounded-full bg-[var(--color-primary-container)]/20 flex items-center justify-center text-[var(--color-primary)] font-bold shrink-0 relative z-10 border-4 border-[var(--color-surface)] shadow-sm" style={{ fontSize: "2rem" }}>
                {getInitials([client.name, client.lastName].filter(Boolean).join(" "))}
              </div>

              <div className="flex-1 text-center md:text-left z-10 w-full">
                {editingContact ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Nombre *", value: editName, setter: setEditName },
                        { label: "Apellidos", value: editLastName, setter: setEditLastName },
                        { label: "Email", value: editEmail, setter: setEditEmail, type: "email" },
                      ].map(({ label, value, setter, type }) => (
                        <div key={label}>
                          <label className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">{label}</label>
                          <input value={value} onChange={(e) => setter(e.target.value)} type={type}
                            className="w-full mt-1 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all" />
                        </div>
                      ))}
                      <div>
                        <label className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Teléfono</label>
                        <input
                          value={editPhone}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (!v.startsWith("+51 ")) { setEditPhone("+51 "); return; }
                            const suffix = v.slice(4).replace(/\D/g, "").slice(0, 9);
                            setEditPhone("+51 " + suffix);
                          }}
                          onFocus={(e) => {
                            if (e.target.value === "+51 ") setTimeout(() => e.target.setSelectionRange(4, 4), 0);
                          }}
                          inputMode="tel"
                          className="w-full mt-1 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                        />
                      </div>
                    </div>
                    {contactError && <p className="text-body-md text-[var(--color-error)]">{contactError}</p>}
                    <div className="flex gap-2">
                      <button onClick={saveContact} disabled={updateClient.isPending}
                        className="flex items-center gap-1.5 bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold px-4 py-2 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors disabled:opacity-60">
                        <Check size={14} strokeWidth={2} />
                        {updateClient.isPending ? "Guardando..." : "Guardar"}
                      </button>
                      <button onClick={() => { setEditingContact(false); setContactError(""); }}
                        className="flex items-center gap-1.5 border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] text-label-md font-semibold px-4 py-2 rounded-lg hover:bg-[var(--color-surface-container-low)] transition-colors">
                        <X size={14} strokeWidth={2} /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-center md:justify-between gap-2 mb-1">
                      <h2 className="text-display-lg font-bold text-[var(--color-on-surface)]">
                        {[client.name, client.lastName].filter(Boolean).join(" ")}
                      </h2>
                      <button onClick={() => setEditingContact(true)} title="Editar datos"
                        className="shrink-0 p-1.5 text-[var(--color-primary)] hover:bg-[var(--color-surface-container-high)] rounded-lg transition-colors">
                        <Pencil size={16} strokeWidth={1.5} />
                      </button>
                    </div>
                    {client.phone && (
                      <div className="flex items-center justify-center md:justify-start gap-2 text-[var(--color-on-surface-variant)] text-body-lg mb-1">
                        <Phone size={18} strokeWidth={1.5} />
                        {client.phone}
                      </div>
                    )}
                    {client.email && <p className="text-body-md text-[var(--color-on-surface-variant)] mb-4">{client.email}</p>}
                    {!client.phone && !client.email && <div className="mb-4" />}
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      <Link href={`/nueva-cita?clientId=${client.id}`}
                        className="flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold uppercase tracking-wider px-5 py-3 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-all shadow-sm active:scale-95">
                        <CalendarPlus size={16} strokeWidth={1.5} />
                        Agendar Nueva Cita
                      </Link>
                      {client.phone ? (
                        <a
                          href={`https://wa.me/${client.phone.replace(/\D/g, "").replace(/^(?!51)/, "51")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-label-md font-semibold uppercase tracking-wider px-4 py-3 rounded-lg hover:bg-[var(--color-surface-container-high)] transition-all active:scale-95">
                          <MessageSquare size={16} strokeWidth={1.5} className="text-emerald-500" />
                          WhatsApp
                        </a>
                      ) : (
                        <button disabled
                          className="flex items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-label-md font-semibold uppercase tracking-wider px-4 py-3 rounded-lg opacity-40 cursor-not-allowed"
                          title="Este cliente no tiene número de contacto">
                          <MessageSquare size={16} strokeWidth={1.5} className="text-[var(--color-outline)]" />
                          WhatsApp
                        </button>
                      )}
                      <button onClick={() => setShowDeleteClientConfirm(true)} disabled={deleteClient.isPending}
                        className="flex items-center gap-2 bg-[var(--color-error-container)]/20 border border-[var(--color-error-container)] text-[var(--color-error)] text-label-md font-semibold uppercase tracking-wider px-4 py-3 rounded-lg hover:bg-[var(--color-error-container)]/40 transition-all active:scale-95 disabled:opacity-60">
                        <Trash2 size={16} strokeWidth={1.5} />
                        {deleteClient.isPending ? "Eliminando..." : "Eliminar"}
                      </button>
                      {deleteError && <p className="w-full text-body-md text-[var(--color-error)] mt-1">{deleteError}</p>}
                    </div>
                  </>
                )}
              </div>
            </section>

            <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {metrics.map((m) => (
                <div key={m.label} className="bg-[var(--color-surface)] border border-[var(--color-outline-variant)] rounded-xl p-3 flex flex-col justify-between shadow-sm hover:-translate-y-1 transition-transform duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <m.icon size={20} strokeWidth={1.5} className={m.iconColor} />
                    {m.badge && (
                      <span className="bg-[var(--color-secondary-fixed)] text-[var(--color-on-secondary-fixed)] text-label-md px-2 py-0.5 rounded-full flex items-center gap-1">
                        <TrendingUp size={10} strokeWidth={2} />{m.badge}
                      </span>
                    )}
                  </div>
                  <div className={`text-headline-md font-semibold truncate ${(m as { valueColor?: string }).valueColor ?? "text-[var(--color-on-surface)]"}`}>{m.value}</div>
                  <div className="text-label-md text-[var(--color-on-surface-variant)]">{m.label}</div>
                </div>
              ))}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-4 shadow-sm h-full">
                  <div className="flex items-center justify-between mb-3 border-b border-[var(--color-outline-variant)] pb-2">
                    <h3 className="text-headline-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
                      <StickyNote size={18} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                      Notas Internas
                    </h3>
                    {!editingNotes && (
                      <button onClick={() => setEditingNotes(true)} className="text-[var(--color-primary)] hover:bg-[var(--color-surface-container-high)] p-1 rounded transition-colors">
                        <Pencil size={18} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                  {editingNotes ? (
                    <div className="space-y-2">
                      <textarea value={notesValue} onChange={(e) => setNotesValue(e.target.value)} rows={4}
                        className="w-full bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 resize-none transition-all" />
                      <div className="flex gap-2">
                        <button onClick={saveNotes} disabled={updateClient.isPending}
                          className="flex items-center gap-1 bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold px-3 py-1.5 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors disabled:opacity-60">
                          <Check size={14} strokeWidth={2} />
                          {updateClient.isPending ? "Guardando..." : "Guardar"}
                        </button>
                        <button onClick={() => { setEditingNotes(false); setNotesValue(client.notes ?? ""); }}
                          className="flex items-center gap-1 text-[var(--color-on-surface-variant)] border border-[var(--color-outline-variant)] text-label-md font-semibold px-3 py-1.5 rounded-lg hover:bg-[var(--color-surface-container-low)] transition-colors">
                          <X size={14} strokeWidth={2} /> Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[var(--color-surface-container-low)] rounded-lg p-3 text-body-md text-[var(--color-on-surface-variant)] italic min-h-[60px]">
                      {client.notes ? `"${client.notes}"` : <span className="not-italic text-[var(--color-outline)]">Sin notas. Click en editar para agregar.</span>}
                    </div>
                  )}
                </section>
              </div>

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
                        const badge = statusBadge[apt.status] ?? { label: apt.status, className: "bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)]" };
                        const isCancelled = apt.status === "CANCELLED" || apt.status === "NO_SHOW";
                        return (
                          <div key={apt.id} className="relative flex items-start gap-4 py-3">
                            <div className={`w-6 h-6 rounded-full border-2 border-[var(--color-surface)] flex items-center justify-center shrink-0 z-10 shadow ${isCancelled ? "bg-[var(--color-surface-dim)]" : "bg-[var(--color-primary)]"}`}>
                              {isCancelled ? <X size={12} strokeWidth={2} className="text-[var(--color-on-surface-variant)]" /> : <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <div className={`flex-1 p-3 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] hover:shadow-md transition-shadow cursor-pointer ${isCancelled ? "opacity-75" : ""}`}>
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <span className="text-label-md text-[var(--color-on-surface-variant)] block">{formatDate(apt.startTime)}</span>
                                  <h4 className={`text-body-lg font-semibold text-[var(--color-on-surface)] ${isCancelled ? "line-through decoration-[var(--color-outline-variant)]" : ""}`}>{apt.service.name}</h4>
                                </div>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide ${badge.className}`}>{badge.label}</span>
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

            {/* Ficha Técnica */}
            <section className="bg-[var(--color-surface)] rounded-xl shadow-sm border border-[var(--color-outline-variant)] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
                  <FlaskConical size={18} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                  Ficha Técnica
                </h2>
                <button onClick={() => { resetRecordForm(); setShowRecordForm(true); }}
                  className="flex items-center gap-1.5 text-label-md font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary-container)]/20 px-3 py-1.5 rounded-lg transition-colors">
                  <Plus size={15} strokeWidth={2} /> Nueva ficha
                </button>
              </div>

              {/* Formulario nueva/editar ficha */}
              {showRecordForm && (
                <div className="bg-[var(--color-surface-container-low)] border border-[var(--color-primary)]/30 rounded-xl p-4 space-y-3">
                  <h3 className="text-label-md font-semibold text-[var(--color-on-surface)]">{editingRecord ? "Editar ficha" : "Nueva ficha"}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Fecha</label>
                      <input type="date" value={rDate} onChange={(e) => setRDate(e.target.value)}
                        className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Tratamiento *</label>
                      <input value={rTreatment} onChange={(e) => setRTreatment(e.target.value)} placeholder="Ej: Tinte, corte, keratina..."
                        className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all placeholder:text-[var(--color-outline)]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Fórmula / Color</label>
                      <input value={rColorFormula} onChange={(e) => setRColorFormula(e.target.value)} placeholder="Ej: 7.3 + oxidante 20vol..."
                        className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all placeholder:text-[var(--color-outline)]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Alergias / Advertencias</label>
                      <input value={rAllergies} onChange={(e) => setRAllergies(e.target.value)} placeholder="Ej: Alérgica a la amoniaca..."
                        className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all placeholder:text-[var(--color-outline)]" />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Notas adicionales</label>
                      <textarea value={rNotes} onChange={(e) => setRNotes(e.target.value)} rows={2} placeholder="Observaciones, próximos pasos..."
                        className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all placeholder:text-[var(--color-outline)] resize-none" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={resetRecordForm} className="flex-1 py-2 rounded-lg border border-[var(--color-outline-variant)] text-body-md font-semibold text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)] transition-colors">Cancelar</button>
                    <button onClick={handleSaveRecord} disabled={!rTreatment.trim() || createRecord.isPending || updateRecord.isPending}
                      className="flex-1 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-on-primary)] text-body-md font-semibold hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors disabled:opacity-60">
                      {createRecord.isPending || updateRecord.isPending ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de fichas */}
              {records.length === 0 && !showRecordForm ? (
                <p className="text-body-md text-[var(--color-on-surface-variant)] text-center py-4">Sin fichas técnicas. Agrega la primera.</p>
              ) : (
                <div className="space-y-2">
                  {records.map((r) => (
                    <div key={r.id} className="border border-[var(--color-outline-variant)] rounded-xl overflow-hidden">
                      <button onClick={() => setExpandedRecord(expandedRecord === r.id ? null : r.id)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--color-surface-container-low)] transition-colors text-left">
                        <div className="flex items-center gap-3">
                          <FlaskConical size={15} className="text-[var(--color-primary)] shrink-0" strokeWidth={1.5} />
                          <div>
                            <p className="text-body-md font-semibold text-[var(--color-on-surface)]">{r.treatment}</p>
                            <p className="text-[12px] text-[var(--color-on-surface-variant)]">{new Date(r.date).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={(e) => { e.stopPropagation(); openEditRecord(r); }}
                            className="p-1.5 rounded-lg text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-container-high)] transition-colors">
                            <Pencil size={14} strokeWidth={1.5} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setRecordDeleteTarget(r.id); }}
                            className="p-1.5 rounded-lg text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-container)]/20 transition-colors">
                            <Trash2 size={14} strokeWidth={1.5} />
                          </button>
                          {expandedRecord === r.id ? <ChevronUp size={15} className="text-[var(--color-outline)] ml-1" /> : <ChevronDown size={15} className="text-[var(--color-outline)] ml-1" />}
                        </div>
                      </button>
                      {expandedRecord === r.id && (
                        <div className="px-4 pb-4 pt-1 grid grid-cols-2 gap-3 bg-[var(--color-surface-container-lowest)] border-t border-[var(--color-outline-variant)]">
                          {r.colorFormula && <div><p className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-0.5">Fórmula / Color</p><p className="text-body-md text-[var(--color-on-surface)]">{r.colorFormula}</p></div>}
                          {r.allergies && <div><p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider mb-0.5">⚠ Alergias</p><p className="text-body-md text-[var(--color-on-surface)]">{r.allergies}</p></div>}
                          {r.notes && <div className="col-span-2"><p className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-0.5">Notas</p><p className="text-body-md text-[var(--color-on-surface)]">{r.notes}</p></div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>
        </div>
      </main>

      {/* Modal confirmar eliminar cliente */}
      {showDeleteClientConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-error-container)]/30 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-[var(--color-error)]" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Eliminar cliente</h3>
                <p className="text-body-md text-[var(--color-on-surface-variant)] mt-1">¿Seguro que deseas eliminar este cliente? Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowDeleteClientConfirm(false)} className="flex-1 py-2.5 rounded-lg border border-[var(--color-outline-variant)] text-body-md font-semibold text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)] transition-colors">Cancelar</button>
              <button onClick={handleDelete} disabled={deleteClient.isPending}
                className="flex-1 py-2.5 rounded-lg bg-[var(--color-error)] text-white text-body-md font-semibold hover:bg-[var(--color-error)]/90 transition-colors disabled:opacity-60">
                {deleteClient.isPending ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar ficha */}
      {recordDeleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-error-container)]/30 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-[var(--color-error)]" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Eliminar ficha técnica</h3>
                <p className="text-body-md text-[var(--color-on-surface-variant)] mt-1">¿Seguro que deseas eliminar esta ficha? No se puede deshacer.</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setRecordDeleteTarget(null)} className="flex-1 py-2.5 rounded-lg border border-[var(--color-outline-variant)] text-body-md font-semibold text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)] transition-colors">Cancelar</button>
              <button onClick={() => deleteRecord.mutate(recordDeleteTarget)} disabled={deleteRecord.isPending}
                className="flex-1 py-2.5 rounded-lg bg-[var(--color-error)] text-white text-body-md font-semibold hover:bg-[var(--color-error)]/90 transition-colors disabled:opacity-60">
                {deleteRecord.isPending ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
