"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Save, Scissors, CalendarDays, CalendarX,
  Plus, Trash2, AlertCircle, CheckCircle, X, Camera,
} from "lucide-react";
import { RoleSelector } from "../_components/role-selector";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const DAY_KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS: Record<string, string> = {
  Mon: "Lun", Tue: "Mar", Wed: "Mié", Thu: "Jue", Fri: "Vie", Sat: "Sáb", Sun: "Dom",
};

const ALL_SPECIALTIES = [
  "Corte Hombre", "Corte Mujer", "Barba", "Coloración", "Balayage",
  "Mechas", "Tintes", "Tratamiento", "Uñas", "Peinado", "Extensiones",
  "Depilación", "Maquillaje", "Masaje", "Facial", "Alisado",
  "Permanente", "Keratina", "Hidratación", "Cejas", "Pestañas",
];

type DaySchedule = { enabled: boolean; start: string; end: string };
type Schedule = Record<string, DaySchedule>;
type Absence = { id: string; label: string; startDate: string; endDate: string; isFullDay: boolean };

type Collaborator = {
  id: string;
  name: string;
  role: string;
  specialties: string[];
  isActive: boolean;
  schedule?: Schedule;
  avatarUrl?: string;
};

const defaultSchedule = (): Schedule =>
  Object.fromEntries(
    DAY_KEYS.map((d) => [d, { enabled: ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(d), start: "09:00", end: "18:00" }])
  );

export default function CollaboratorProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [role, setRole] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<Schedule>(defaultSchedule());

  // Absences
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const [absLabel, setAbsLabel] = useState("");
  const [absStart, setAbsStart] = useState("");
  const [absEnd, setAbsEnd] = useState("");
  const [absFullDay, setAbsFullDay] = useState(true);
  const [savingAbsence, setSavingAbsence] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("gm_token");
    if (!token) { router.push("/login"); return; }

    Promise.all([
      fetch(`${API_URL}/collaborators/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${API_URL}/collaborators/${id}/absences`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.ok ? r.json() : []).catch(() => []),
    ]).then(([data, abs]: [Collaborator, Absence[]]) => {
      setName(data.name);
      setRole(data.role);
      setIsActive(data.isActive);
      setAvatarUrl(data.avatarUrl ?? "");
      setSpecialties(data.specialties ?? []);
      // Merge server schedule over defaults so any missing day keeps defaults
      if (data.schedule) {
        setSchedule((prev) => {
          const merged = { ...prev };
          for (const key of DAY_KEYS) {
            if (data.schedule![key]) merged[key] = { ...prev[key], ...data.schedule![key] };
          }
          return merged;
        });
      }
      setAbsences(abs ?? []);
    }).catch(() => router.push("/colaboradores"))
      .finally(() => setLoading(false));
  }, [id, router]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  function updateDay(day: string, field: keyof DaySchedule, value: string | boolean) {
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  async function handleSave() {
    const token = localStorage.getItem("gm_token");
    if (!token) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_URL}/collaborators/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, role, isActive, specialties, schedule, avatarUrl: avatarUrl || undefined }),
      });
      if (!res.ok) throw new Error();
      setFeedback({ type: "success", msg: "Perfil guardado correctamente" });
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback({ type: "error", msg: "Error al guardar. Intenta de nuevo." });
    } finally {
      setSaving(false);
    }
  }

  async function handleAddAbsence() {
    if (!absLabel.trim() || !absStart) return;
    const token = localStorage.getItem("gm_token");
    if (!token) return;
    setSavingAbsence(true);
    try {
      const res = await fetch(`${API_URL}/collaborators/${id}/absences`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ label: absLabel.trim(), startDate: absStart, endDate: absEnd || absStart, isFullDay: absFullDay }),
      });
      if (!res.ok) throw new Error();
      const created: Absence = await res.json();
      setAbsences((prev) => [...prev, created]);
      setAbsLabel(""); setAbsStart(""); setAbsEnd(""); setAbsFullDay(true);
      setShowAbsenceForm(false);
    } catch {
      setFeedback({ type: "error", msg: "No se pudo agregar la ausencia." });
    } finally {
      setSavingAbsence(false);
    }
  }

  async function handleDeleteAbsence(absId: string) {
    const token = localStorage.getItem("gm_token");
    if (!token) return;
    try {
      await fetch(`${API_URL}/collaborators/${id}/absences/${absId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setAbsences((prev) => prev.filter((a) => a.id !== absId));
    } catch {
      setFeedback({ type: "error", msg: "No se pudo eliminar la ausencia." });
    }
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar este colaborador? Esta acción no se puede deshacer.")) return;
    const token = localStorage.getItem("gm_token");
    if (!token) return;
    try {
      await fetch(`${API_URL}/collaborators/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      router.push("/colaboradores");
    } catch {
      setFeedback({ type: "error", msg: "No se pudo eliminar el perfil." });
    }
  }

  if (loading) return (
    <>
      <Sidebar activePath="/colaboradores" />
      <main className="flex-1 ml-64 flex items-center justify-center bg-[var(--color-background)]">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </main>
    </>
  );

  return (
    <>
      <Sidebar activePath="/colaboradores" />
      <main className="flex-1 ml-64 flex flex-col h-full bg-[var(--color-background)] overflow-hidden">
        <TopBar />
        <div className="flex flex-col flex-1 overflow-y-auto pt-16" style={{ scrollbarWidth: "thin" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface)] sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <Link href="/colaboradores" className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">
                <ArrowLeft size={20} strokeWidth={1.5} />
              </Link>
              <h1 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Editar Perfil</h1>
            </div>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold uppercase tracking-wider px-5 py-2.5 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors shadow-sm disabled:opacity-60">
              <Save size={15} strokeWidth={2} />
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>

          {feedback && (
            <div className={`mx-6 mt-4 flex items-center gap-2 rounded-lg px-4 py-3 text-body-md border ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-[var(--color-error-container)]/30 border-[var(--color-error-container)] text-[var(--color-error)]"
            }`}>
              {feedback.type === "success" ? <CheckCircle size={16} strokeWidth={1.5} /> : <AlertCircle size={16} strokeWidth={1.5} />}
              {feedback.msg}
            </div>
          )}

          <div className="px-6 py-6 max-w-2xl space-y-8">

            {/* Avatar */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-24 h-24 rounded-full group focus:outline-none"
                title="Cambiar foto"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={name} className="w-24 h-24 rounded-full object-cover" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[var(--color-primary-container)]/20 flex items-center justify-center text-[var(--color-primary)] text-display-lg font-bold">
                    {name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={22} className="text-white" />
                </div>
              </button>
              <span className="text-[11px] text-[var(--color-on-surface-variant)]">Click para cambiar foto</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* Datos básicos */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Nombre Completo</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Cargo / Rol</label>
                <RoleSelector value={role} onChange={setRole} />
              </div>
              <div onClick={() => setIsActive(v => !v)}
                className={`flex items-center justify-between gap-4 p-3 rounded-lg border cursor-pointer transition-all select-none ${
                  isActive ? "bg-[var(--color-primary-container)]/10 border-[var(--color-primary)]/30" : "bg-[var(--color-surface-container-lowest)] border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-low)]"
                }`}>
                <span className={`text-body-md font-medium ${isActive ? "text-[var(--color-primary)]" : "text-[var(--color-on-surface-variant)]"}`}>Estado activo</span>
                <div className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${isActive ? "bg-[var(--color-primary)]" : "bg-[var(--color-surface-variant)]"}`}>
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isActive ? "translate-x-6" : "translate-x-1"}`} />
                </div>
              </div>
            </div>

            {/* Servicios asignados */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
                  <Scissors size={18} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                  Servicios Asignados
                </h2>
                <span className="text-label-md text-[var(--color-on-surface-variant)]">{specialties.length} activo{specialties.length !== 1 ? "s" : ""}</span>
              </div>
              <p className="text-[11px] text-[var(--color-on-surface-variant)]">Activa los servicios que este colaborador puede realizar.</p>
              <div className="space-y-2">
                {[...ALL_SPECIALTIES].sort((a, b) => {
                  const aOn = specialties.includes(a), bOn = specialties.includes(b);
                  return aOn === bOn ? 0 : aOn ? -1 : 1;
                }).map((service) => {
                  const enabled = specialties.includes(service);
                  return (
                    <div key={service} onClick={() => setSpecialties(prev => prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service])}
                      className={`flex items-center justify-between gap-4 p-3 rounded-lg border cursor-pointer transition-all select-none ${
                        enabled ? "bg-[var(--color-primary-container)]/10 border-[var(--color-primary)]/30" : "bg-[var(--color-surface-container-lowest)] border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-low)]"
                      }`}>
                      <span className={`text-body-md font-medium ${enabled ? "text-[var(--color-primary)]" : "text-[var(--color-on-surface-variant)]"}`}>{service}</span>
                      <div className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${enabled ? "bg-[var(--color-primary)]" : "bg-[var(--color-surface-variant)]"}`}>
                        <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Horario laboral */}
            <div className="space-y-3">
              <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
                <CalendarDays size={18} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                Horario Laboral Regular
              </h2>
              <div className="space-y-2">
                {DAY_KEYS.map((key) => {
                  const { enabled, start, end } = schedule[key];
                  return (
                    <div key={key} className="flex items-center gap-3 p-3 bg-[var(--color-surface-container-lowest)] rounded-lg border border-[var(--color-outline-variant)]">
                      {/* Toggle */}
                      <button onClick={() => updateDay(key, "enabled", !enabled)}
                        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${enabled ? "bg-[var(--color-primary)]" : "bg-[var(--color-surface-variant)]"}`}>
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>

                      {/* Día */}
                      <span className="w-8 text-body-md font-semibold text-[var(--color-on-surface)]">{DAY_LABELS[key]}</span>

                      {enabled ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input type="time" value={start} onChange={(e) => updateDay(key, "start", e.target.value)}
                            className="bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] rounded-md px-2 py-1 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all" />
                          <span className="text-[var(--color-outline)]">—</span>
                          <input type="time" value={end} onChange={(e) => updateDay(key, "end", e.target.value)}
                            className="bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] rounded-md px-2 py-1 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all" />
                        </div>
                      ) : (
                        <span className="text-label-md text-[var(--color-outline)] uppercase tracking-wider">Descanso</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ausencias y bloqueos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
                  <CalendarX size={18} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                  Ausencias y Bloqueos
                </h2>
                <button onClick={() => setShowAbsenceForm(true)}
                  className="flex items-center gap-1 text-label-md font-semibold text-[var(--color-primary)] border border-[var(--color-primary)]/30 bg-[var(--color-primary-container)]/10 px-3 py-1.5 rounded-lg hover:bg-[var(--color-primary-container)]/20 transition-colors">
                  <Plus size={14} strokeWidth={2} />
                  Nuevo
                </button>
              </div>

              {/* Formulario inline para nueva ausencia */}
              {showAbsenceForm && (
                <div className="bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-label-md font-semibold text-[var(--color-on-surface)] uppercase tracking-wider">Nueva Ausencia</span>
                    <button onClick={() => setShowAbsenceForm(false)} className="text-[var(--color-outline)] hover:text-[var(--color-on-surface)] transition-colors">
                      <X size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                  <input value={absLabel} onChange={(e) => setAbsLabel(e.target.value)} placeholder="Ej. Vacaciones, Cita médica..."
                    className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all placeholder:text-[var(--color-outline-variant)]" />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Desde</label>
                      <input type={absFullDay ? "date" : "datetime-local"} value={absStart} onChange={(e) => setAbsStart(e.target.value)}
                        className="w-full mt-1 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all" />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Hasta</label>
                      <input type={absFullDay ? "date" : "datetime-local"} value={absEnd} onChange={(e) => setAbsEnd(e.target.value)}
                        className="w-full mt-1 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all" />
                    </div>
                  </div>
                  <div onClick={() => setAbsFullDay(v => !v)}
                    className="flex items-center gap-2 cursor-pointer select-none w-fit">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${absFullDay ? "bg-[var(--color-primary)] border-[var(--color-primary)]" : "border-[var(--color-outline-variant)]"}`}>
                      {absFullDay && <span className="text-white text-[10px] font-bold">✓</span>}
                    </div>
                    <span className="text-body-md text-[var(--color-on-surface-variant)]">Día(s) completo(s)</span>
                  </div>
                  <button onClick={handleAddAbsence} disabled={savingAbsence || !absLabel.trim() || !absStart}
                    className="w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold uppercase tracking-wider py-2.5 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors disabled:opacity-60">
                    {savingAbsence ? "Guardando..." : "Agregar Ausencia"}
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {absences.length === 0 && !showAbsenceForm && (
                  <p className="text-body-md text-[var(--color-outline)] py-2">Sin ausencias registradas.</p>
                )}
                {absences.map((absence) => (
                  <div key={absence.id} className="flex items-center justify-between p-3 bg-[var(--color-surface-container-lowest)] rounded-lg border border-[var(--color-outline-variant)]">
                    <div>
                      <p className="text-body-md font-semibold text-[var(--color-on-surface)]">{absence.label}</p>
                      <p className="text-[12px] text-[var(--color-on-surface-variant)]">
                        {absence.startDate}{absence.endDate && absence.endDate !== absence.startDate ? ` — ${absence.endDate}` : ""}
                        {absence.isFullDay ? " · Día completo" : ""}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteAbsence(absence.id)} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)] transition-colors p-1">
                      <Trash2 size={15} strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Eliminar perfil */}
            <div className="pb-8">
              <button onClick={handleDelete}
                className="w-full flex items-center justify-center gap-2 border border-[var(--color-error)] text-[var(--color-error)] text-label-md font-semibold uppercase tracking-wider py-3 rounded-lg hover:bg-[var(--color-error-container)]/20 transition-colors">
                <Trash2 size={15} strokeWidth={1.5} />
                Eliminar Perfil de Staff
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
