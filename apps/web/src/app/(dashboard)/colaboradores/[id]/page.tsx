"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Save, Scissors, CalendarDays, CalendarX,
  Plus, Trash2, AlertCircle, CheckCircle, X, Camera, Phone,
} from "lucide-react";
import { RoleSelector } from "../_components/role-selector";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import {
  useCollaborator, useCollaboratorAbsences,
  useUpdateCollaborator, useDeleteCollaborator,
  useAddAbsence, useDeleteAbsence,
  useSettings, useServices,
} from "@/lib/api/hooks";
import { useRouter } from "next/navigation";

const DAY_KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS: Record<string, string> = {
  Mon: "Lun", Tue: "Mar", Wed: "Mié", Thu: "Jue", Fri: "Vie", Sat: "Sáb", Sun: "Dom",
};

type DaySchedule = { enabled: boolean; start: string; end: string };
type Schedule = Record<string, DaySchedule>;

const defaultSchedule = (): Schedule =>
  Object.fromEntries(
    DAY_KEYS.map((d) => [d, { enabled: ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(d), start: "09:00", end: "18:00" }])
  );

export default function CollaboratorProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [role, setRole] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [performsServices, setPerformsServices] = useState(true);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<Schedule>(defaultSchedule());
  const [documentType, setDocumentType] = useState<"DNI" | "CE">("DNI");
  const [documentNumber, setDocumentNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [initialized, setInitialized] = useState(false);

  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [absLabel, setAbsLabel] = useState("");
  const [absStart, setAbsStart] = useState("");
  const [absEnd, setAbsEnd] = useState("");
  const [absFullDay, setAbsFullDay] = useState(true);

  const { data: settings } = useSettings();
  const { data: servicesData } = useServices();
  const ALL_SPECIALTIES = (servicesData?.services ?? []).map((s) => s.name);
  const bizOpen  = settings?.openTime  ?? "00:00";
  const bizClose = settings?.closeTime ?? "23:59";

  const { data: collaborator, isLoading } = useCollaborator(id);
  const { data: absences = [] } = useCollaboratorAbsences(id);
  const updateCollaborator = useUpdateCollaborator(id);
  const deleteCollaborator = useDeleteCollaborator();
  const addAbsence = useAddAbsence(id);
  const deleteAbsence = useDeleteAbsence(id);

  useEffect(() => {
    if (collaborator && !initialized) {
      if (collaborator.lastName) {
        const parts = collaborator.name.split(" ");
        setFirstName(parts[0] ?? collaborator.name);
        setLastName(collaborator.lastName);
      } else {
        const parts = collaborator.name.split(" ");
        setFirstName(parts[0] ?? "");
        setLastName(parts.slice(1).join(" "));
      }
      setRole(collaborator.role);
      setIsActive(collaborator.isActive);
      setPerformsServices(collaborator.performsServices ?? true);
      setAvatarUrl(collaborator.avatarUrl ?? "");
      setSpecialties(collaborator.specialties ?? []);
      if (collaborator.documentType) setDocumentType(collaborator.documentType as "DNI" | "CE");
      setDocumentNumber(collaborator.documentNumber ?? "");
      setPhone(collaborator.phone ?? "");
      if (collaborator.schedule) {
        setSchedule((prev) => {
          const merged = { ...prev };
          for (const key of DAY_KEYS) {
            const s = collaborator.schedule as Schedule | null;
            if (s && s[key]) merged[key] = { ...prev[key], ...s[key] };
          }
          return merged;
        });
      }
      setInitialized(true);
    }
  }, [collaborator, initialized]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  function updateDay(day: string, field: keyof DaySchedule, value: string | boolean) {
    setSchedule((prev) => {
      const current = prev[day];

      // Al activar el día, ajustar al horario del negocio si está fuera
      if (field === "enabled" && value === true) {
        const clampedStart = current.start < bizOpen  ? bizOpen  : current.start > bizClose ? bizOpen  : current.start;
        const clampedEnd   = current.end   > bizClose ? bizClose : current.end   < bizOpen  ? bizClose : current.end;
        return { ...prev, [day]: { enabled: true, start: clampedStart, end: clampedEnd } };
      }

      // Al cambiar hora de inicio, no permitir salir del rango del negocio
      if (field === "start") {
        const clamped = (value as string) < bizOpen ? bizOpen : (value as string) >= bizClose ? bizOpen : value as string;
        const newEnd  = clamped >= current.end ? bizClose : current.end;
        return { ...prev, [day]: { ...current, start: clamped, end: newEnd } };
      }

      // Al cambiar hora de fin, no permitir salir del rango del negocio
      if (field === "end") {
        const clamped = (value as string) > bizClose ? bizClose : (value as string) <= current.start ? bizClose : value as string;
        return { ...prev, [day]: { ...current, end: clamped } };
      }

      return { ...prev, [day]: { ...current, [field]: value } } as Schedule;
    });
  }

  async function handleSave() {
    setFeedback(null);
    try {
      await updateCollaborator.mutateAsync({
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        lastName: lastName.trim() || undefined,
        role,
        isActive,
        performsServices,
        specialties,
        schedule,
        avatarUrl: avatarUrl || undefined,
        documentType: documentNumber.trim() ? documentType : undefined,
        documentNumber: documentNumber.trim() || undefined,
        phone: phone.trim() || undefined,
      } as never);
      setFeedback({ type: "success", msg: "Perfil guardado correctamente" });
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback({ type: "error", msg: "Error al guardar. Intenta de nuevo." });
    }
  }

  async function handleAddAbsence() {
    if (!absLabel.trim() || !absStart) return;
    try {
      await addAbsence.mutateAsync({ startDate: absStart, endDate: absEnd || absStart, reason: absLabel.trim() });
      setAbsLabel(""); setAbsStart(""); setAbsEnd(""); setAbsFullDay(true);
      setShowAbsenceForm(false);
    } catch {
      setFeedback({ type: "error", msg: "No se pudo agregar la ausencia." });
    }
  }

  async function handleDeleteAbsence(absId: string) {
    try {
      await deleteAbsence.mutateAsync(absId);
    } catch {
      setFeedback({ type: "error", msg: "No se pudo eliminar la ausencia." });
    }
  }

  async function handleDelete() {
    try {
      await deleteCollaborator.mutateAsync(id);
      router.push("/colaboradores");
    } catch {
      setFeedback({ type: "error", msg: "No se pudo eliminar el perfil." });
    }
  }

  if (isLoading) return (
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

          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface)] sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <Link href="/colaboradores" className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">
                <ArrowLeft size={20} strokeWidth={1.5} />
              </Link>
              <h1 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Editar Perfil</h1>
            </div>
            <button onClick={handleSave} disabled={updateCollaborator.isPending}
              className="flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold uppercase tracking-wider px-5 py-2.5 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors shadow-sm disabled:opacity-60">
              <Save size={15} strokeWidth={2} />
              {updateCollaborator.isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>

          {feedback && (
            <div className={`mx-6 mt-4 flex items-center gap-2 rounded-lg px-4 py-3 text-body-md border ${
              feedback.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-[var(--color-error-container)]/30 border-[var(--color-error-container)] text-[var(--color-error)]"
            }`}>
              {feedback.type === "success" ? <CheckCircle size={16} strokeWidth={1.5} /> : <AlertCircle size={16} strokeWidth={1.5} />}
              {feedback.msg}
            </div>
          )}

          <div className="px-6 py-6 max-w-2xl space-y-8">

            {/* Avatar */}
            <div className="flex flex-col items-center gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="relative w-24 h-24 rounded-full group focus:outline-none" title="Cambiar foto">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={`${firstName} ${lastName}`} className="w-24 h-24 rounded-full object-cover" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[var(--color-primary-container)]/20 flex items-center justify-center text-[var(--color-primary)] text-display-lg font-bold">
                    {[firstName, lastName].filter(Boolean).map((w) => w[0]).join("").toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={22} className="text-white" />
                </div>
              </button>
              <span className="text-[11px] text-[var(--color-on-surface-variant)]">Click para cambiar foto</span>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* Datos básicos */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Nombre *", value: firstName, setter: setFirstName },
                  { label: "Apellido *", value: lastName, setter: setLastName },
                ].map(({ label, value, setter }) => (
                  <div key={label} className="space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">{label}</label>
                    <input value={value} onChange={(e) => setter(e.target.value)} autoComplete="off" spellCheck={false}
                      className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all" />
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Documento de identidad</label>
                <div className="flex gap-2">
                  <div className="flex rounded-lg border border-[var(--color-outline-variant)] overflow-hidden shrink-0">
                    {(["DNI", "CE"] as const).map((type) => (
                      <button key={type} type="button" onClick={() => { setDocumentType(type); setDocumentNumber(""); }}
                        className={`px-3 py-2.5 text-label-md font-semibold transition-colors ${type !== "DNI" ? "border-l border-[var(--color-outline-variant)]" : ""} ${documentType === type ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]" : "bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)]"}`}>
                        {type}
                      </button>
                    ))}
                  </div>
                  <input value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value.replace(/\D/g, "").slice(0, documentType === "DNI" ? 8 : 12))}
                    inputMode="numeric" autoComplete="off" spellCheck={false}
                    className="flex-1 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all" />
                </div>
                <p className="text-[11px] text-[var(--color-on-surface-variant)] mt-0.5">
                  {documentType === "DNI" ? "8 dígitos" : "Carné de extranjería — hasta 12 dígitos"}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Teléfono</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)]" strokeWidth={1.5} />
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="off" spellCheck={false}
                    className="w-full pl-9 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Cargo / Rol</label>
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

              <div onClick={() => setPerformsServices(v => !v)}
                className={`flex items-center justify-between gap-4 p-3 rounded-lg border cursor-pointer transition-all select-none ${
                  performsServices ? "bg-emerald-50 border-emerald-200" : "bg-[var(--color-surface-container-lowest)] border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-low)]"
                }`}>
                <div>
                  <span className={`text-body-md font-medium ${performsServices ? "text-emerald-700" : "text-[var(--color-on-surface-variant)]"}`}>Realiza servicios</span>
                  <p className="text-[10px] text-[var(--color-on-surface-variant)] mt-0.5">Aparece como opción al crear citas</p>
                </div>
                <div className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${performsServices ? "bg-emerald-500" : "bg-[var(--color-surface-variant)]"}`}>
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${performsServices ? "translate-x-6" : "translate-x-1"}`} />
                </div>
              </div>
            </div>

            {/* Especialidades */}
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
              <div className="flex items-center justify-between">
                <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
                  <CalendarDays size={18} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                  Horario Laboral Regular
                </h2>
                {settings && (
                  <span className="text-[11px] text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container)] px-2.5 py-1 rounded-full border border-[var(--color-outline-variant)]">
                    Rango del local: {bizOpen} – {bizClose}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {DAY_KEYS.map((key) => {
                  const { enabled, start, end } = schedule[key];
                  return (
                    <div key={key} className="flex items-center gap-3 p-3 bg-[var(--color-surface-container-lowest)] rounded-lg border border-[var(--color-outline-variant)]">
                      <button type="button" onClick={() => updateDay(key, "enabled", !enabled)}
                        className={`relative inline-flex shrink-0 items-center w-11 h-6 rounded-full overflow-hidden transition-colors focus:outline-none ${enabled ? "bg-[var(--color-primary)]" : "bg-[var(--color-surface-variant)]"}`}>
                        <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-1"}`} />
                      </button>
                      <span className="w-12 shrink-0 text-body-md font-semibold text-[var(--color-on-surface)]">{DAY_LABELS[key]}</span>
                      {enabled ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input type="time" value={start} min={bizOpen} max={bizClose}
                            onChange={(e) => updateDay(key, "start", e.target.value)}
                            className="bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] rounded-md px-2 py-1 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all" />
                          <span className="text-[var(--color-outline)]">—</span>
                          <input type="time" value={end} min={bizOpen} max={bizClose}
                            onChange={(e) => updateDay(key, "end", e.target.value)}
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

            {/* Ausencias */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
                  <CalendarX size={18} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                  Ausencias y Bloqueos
                </h2>
                <button onClick={() => setShowAbsenceForm(true)}
                  className="flex items-center gap-1 text-label-md font-semibold text-[var(--color-primary)] border border-[var(--color-primary)]/30 bg-[var(--color-primary-container)]/10 px-3 py-1.5 rounded-lg hover:bg-[var(--color-primary-container)]/20 transition-colors">
                  <Plus size={14} strokeWidth={2} /> Nuevo
                </button>
              </div>

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
                    {[{ label: "Desde", val: absStart, setter: setAbsStart }, { label: "Hasta", val: absEnd, setter: setAbsEnd }].map(({ label, val, setter }) => (
                      <div key={label}>
                        <label className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">{label}</label>
                        <input type={absFullDay ? "date" : "datetime-local"} value={val} onChange={(e) => setter(e.target.value)}
                          className="w-full mt-1 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all" />
                      </div>
                    ))}
                  </div>
                  <div onClick={() => setAbsFullDay(v => !v)} className="flex items-center gap-2 cursor-pointer select-none w-fit">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${absFullDay ? "bg-[var(--color-primary)] border-[var(--color-primary)]" : "border-[var(--color-outline-variant)]"}`}>
                      {absFullDay && <span className="text-white text-[10px] font-bold">✓</span>}
                    </div>
                    <span className="text-body-md text-[var(--color-on-surface-variant)]">Día(s) completo(s)</span>
                  </div>
                  <button onClick={handleAddAbsence} disabled={addAbsence.isPending || !absLabel.trim() || !absStart}
                    className="w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold uppercase tracking-wider py-2.5 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors disabled:opacity-60">
                    {addAbsence.isPending ? "Guardando..." : "Agregar Ausencia"}
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
                      <p className="text-body-md font-semibold text-[var(--color-on-surface)]">{absence.reason ?? "Sin motivo"}</p>
                      <p className="text-[12px] text-[var(--color-on-surface-variant)]">
                        {absence.startDate}{absence.endDate && absence.endDate !== absence.startDate ? ` — ${absence.endDate}` : ""}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteAbsence(absence.id)} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)] transition-colors p-1">
                      <Trash2 size={15} strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pb-8">
              <button onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-2 border border-[var(--color-error)] text-[var(--color-error)] text-label-md font-semibold uppercase tracking-wider py-3 rounded-lg hover:bg-[var(--color-error-container)]/20 transition-colors">
                <Trash2 size={15} strokeWidth={1.5} />
                Eliminar Perfil de Staff
              </button>
            </div>
          </div>
        </div>
      </main>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-error-container)]/30 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-[var(--color-error)]" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Eliminar colaborador</h3>
                <p className="text-body-md text-[var(--color-on-surface-variant)] mt-1">¿Seguro que deseas eliminar este perfil? Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 rounded-lg border border-[var(--color-outline-variant)] text-body-md font-semibold text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)] transition-colors">Cancelar</button>
              <button onClick={handleDelete} disabled={deleteCollaborator.isPending}
                className="flex-1 py-2.5 rounded-lg bg-[var(--color-error)] text-white text-body-md font-semibold hover:bg-[var(--color-error)]/90 transition-colors disabled:opacity-60">
                {deleteCollaborator.isPending ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
