"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Save, Scissors, CalendarDays, CalendarX,
  Plus, Trash2, AlertCircle, CheckCircle,
} from "lucide-react";
import { RoleSelector } from "../_components/role-selector";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const ALL_SPECIALTIES = [
  "Corte Hombre", "Corte Mujer", "Barba", "Coloración", "Balayage",
  "Mechas", "Tintes", "Tratamiento", "Uñas", "Peinado", "Extensiones",
  "Depilación", "Maquillaje", "Masaje", "Facial", "Alisado",
  "Permanente", "Keratina", "Hidratación", "Cejas", "Pestañas",
];

const MOCK_ABSENCES = [
  { id: "1", label: "Vacaciones Anuales", icon: "vacation", date: "12 Oct - 20 Oct" },
  { id: "2", label: "Cita Médica", icon: "medical", date: "24 Oct, 09:00 - 11:30" },
];

type Collaborator = {
  id: string;
  name: string;
  role: string;
  specialties: string[];
  isActive: boolean;
};

export default function CollaboratorProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [collaborator, setCollaborator] = useState<Collaborator | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [enabledDays, setEnabledDays] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const token = localStorage.getItem("gm_token");
    if (!token) { router.push("/login"); return; }

    fetch(`${API_URL}/collaborators/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: Collaborator) => {
        setCollaborator(data);
        setName(data.name);
        setRole(data.role);
        setIsActive(data.isActive);
        setSpecialties(data.specialties ?? []);
        setEnabledDays({ Lun: true, Mar: true, Mié: true, Jue: true, Vie: true, Sáb: false, Dom: false });
      })
      .catch(() => router.push("/colaboradores"))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleSave() {
    const token = localStorage.getItem("gm_token");
    if (!token) return;

    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch(`${API_URL}/collaborators/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, role, isActive, specialties }),
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

  if (loading) {
    return (
      <>
        <Sidebar activePath="/colaboradores" />
        <main className="flex-1 ml-64 flex items-center justify-center bg-[var(--color-background)]">
          <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </main>
      </>
    );
  }

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
              <h1 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">
                Editar Perfil
              </h1>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold uppercase tracking-wider px-5 py-2.5 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors shadow-sm disabled:opacity-60"
            >
              <Save size={15} strokeWidth={2} />
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`mx-6 mt-4 flex items-center gap-2 rounded-lg px-4 py-3 text-body-md border ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-[var(--color-error-container)]/30 border-[var(--color-error-container)] text-[var(--color-error)]"
            }`}>
              {feedback.type === "success"
                ? <CheckCircle size={16} strokeWidth={1.5} />
                : <AlertCircle size={16} strokeWidth={1.5} />}
              {feedback.msg}
            </div>
          )}

          <div className="px-6 py-6 max-w-2xl space-y-8">
            {/* Avatar */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-[var(--color-primary-container)]/20 flex items-center justify-center text-[var(--color-primary)] text-display-lg font-bold">
                {name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
              </div>
            </div>

            {/* Datos básicos */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">
                  Nombre Completo
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">
                  Cargo / Rol
                </label>
                <RoleSelector value={role} onChange={setRole} />
              </div>
              {/* Toggle estado activo */}
              <div
                onClick={() => setIsActive(v => !v)}
                className={`flex items-center justify-between gap-4 p-3 rounded-lg border cursor-pointer transition-all select-none ${
                  isActive
                    ? "bg-[var(--color-primary-container)]/10 border-[var(--color-primary)]/30"
                    : "bg-[var(--color-surface-container-lowest)] border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-low)]"
                }`}
              >
                <span className={`text-body-md font-medium ${isActive ? "text-[var(--color-primary)]" : "text-[var(--color-on-surface-variant)]"}`}>
                  Estado activo
                </span>
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
                <span className="text-label-md text-[var(--color-on-surface-variant)]">
                  {specialties.length} activo{specialties.length !== 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-on-surface-variant)]">
                Activa los servicios que este colaborador puede realizar.
              </p>
              <div className="space-y-2">
                {/* Primero los que ya tiene activos, luego el resto */}
                {[...ALL_SPECIALTIES].sort((a, b) => {
                  const aOn = specialties.includes(a);
                  const bOn = specialties.includes(b);
                  if (aOn && !bOn) return -1;
                  if (!aOn && bOn) return 1;
                  return 0;
                }).map((service) => {
                  const enabled = specialties.includes(service);
                  return (
                    <div
                      key={service}
                      onClick={() => setSpecialties(prev =>
                        prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
                      )}
                      className={`flex items-center justify-between gap-4 p-3 rounded-lg border cursor-pointer transition-all select-none ${
                        enabled
                          ? "bg-[var(--color-primary-container)]/10 border-[var(--color-primary)]/30"
                          : "bg-[var(--color-surface-container-lowest)] border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-low)]"
                      }`}
                    >
                      <span className={`text-body-md font-medium ${enabled ? "text-[var(--color-primary)]" : "text-[var(--color-on-surface-variant)]"}`}>
                        {service}
                      </span>
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
                {DAYS.map((day) => {
                  const enabled = enabledDays[day] ?? false;
                  return (
                    <div key={day} className="flex items-center gap-4 p-3 bg-[var(--color-surface-container-lowest)] rounded-lg border border-[var(--color-outline-variant)]">
                      <button
                        onClick={() => setEnabledDays((prev) => ({ ...prev, [day]: !prev[day] }))}
                        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${enabled ? "bg-[var(--color-primary)]" : "bg-[var(--color-surface-variant)]"}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                      <span className="w-8 text-body-md font-semibold text-[var(--color-on-surface)]">{day}</span>
                      {enabled ? (
                        <div className="flex items-center gap-2 text-body-md text-[var(--color-on-surface-variant)]">
                          <span>09:00</span>
                          <span>—</span>
                          <span>18:00</span>
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
                <button className="flex items-center gap-1 text-label-md font-semibold text-[var(--color-primary)] border border-[var(--color-primary)]/30 bg-[var(--color-primary-container)]/10 px-3 py-1.5 rounded-lg hover:bg-[var(--color-primary-container)]/20 transition-colors">
                  <Plus size={14} strokeWidth={2} />
                  Nuevo
                </button>
              </div>
              <div className="space-y-2">
                {MOCK_ABSENCES.map((absence) => (
                  <div key={absence.id} className="flex items-center justify-between p-3 bg-[var(--color-surface-container-lowest)] rounded-lg border border-[var(--color-outline-variant)]">
                    <div>
                      <p className="text-body-md font-semibold text-[var(--color-on-surface)]">{absence.label}</p>
                      <p className="text-[12px] text-[var(--color-on-surface-variant)]">{absence.date}</p>
                    </div>
                    <button className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)] transition-colors p-1">
                      <Trash2 size={15} strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Eliminar perfil */}
            <div className="pb-8">
              <button className="w-full flex items-center justify-center gap-2 border border-[var(--color-error)] text-[var(--color-error)] text-label-md font-semibold uppercase tracking-wider py-3 rounded-lg hover:bg-[var(--color-error-container)]/20 transition-colors">
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
