"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Save, PenLine, SlidersHorizontal,
  Users, ChevronDown, AlertCircle, CheckCircle, Timer, Trash2,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { useService, useUpdateService, useDeleteService, useCollaborators } from "@/lib/api/hooks";
import { useRouter } from "next/navigation";

const CATEGORIES = ["Peluquería", "Estética", "Barbería", "Nail Bar", "Spa", "Otro"];
const DURATIONS = [15, 20, 30, 45, 60, 90, 120, 150, 180];
const BUFFERS = [0, 5, 10, 15, 20, 30];
const PALETTE = [
  "#4441c4", "#006591", "#854300", "#16a34a", "#dc2626",
  "#9333ea", "#0891b2", "#d97706", "#be185d", "#475569",
];

export default function EditarServicioPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [durationMin, setDurationMin] = useState(30);
  const [bufferMin, setBufferMin] = useState(0);
  const [maxConcurrent, setMaxConcurrent] = useState<string>("");
  const [color, setColor] = useState("#4441c4");
  const [price, setPrice] = useState("");
  const [selectedCollabs, setSelectedCollabs] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  const { data: service, isLoading } = useService(id);
  const { data: collabsData } = useCollaborators();
  const collaborators = collabsData ?? [];
  const updateService = useUpdateService(id);
  const deleteService = useDeleteService();

  useEffect(() => {
    if (service && !initialized) {
      setName(service.name ?? "");
      setDescription(service.description ?? "");
      setCategory(service.category ?? "");
      setDurationMin(service.durationMin ?? 30);
      setBufferMin(service.bufferMinutes ?? 0);
      setMaxConcurrent(service.maxConcurrent != null ? String(service.maxConcurrent) : "");
      setColor(service.color ?? "#4441c4");
      setPrice(service.price?.toString() ?? "");
      setInitialized(true);
    }
  }, [service, initialized]);

  function toggleCollab(collabId: string) {
    setSelectedCollabs((prev) => prev.includes(collabId) ? prev.filter((c) => c !== collabId) : [...prev, collabId]);
  }

  async function handleSave() {
    if (!name || !category || !price) {
      setFeedback({ type: "error", msg: "Nombre, categoría y precio son obligatorios." });
      return;
    }
    setFeedback(null);
    try {
      await updateService.mutateAsync({ name, description: description || undefined, category, durationMin, bufferMinutes: bufferMin, maxConcurrent: maxConcurrent !== "" ? parseInt(maxConcurrent) : null, color, price: parseFloat(price) } as never);
      setFeedback({ type: "success", msg: "Servicio actualizado correctamente" });
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback({ type: "error", msg: "Error al guardar. Intenta de nuevo." });
    }
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar este servicio? Esta acción no se puede deshacer.")) return;
    try {
      await deleteService.mutateAsync(id);
      router.push("/servicios");
    } catch {
      setFeedback({ type: "error", msg: "No se pudo eliminar el servicio." });
    }
  }

  if (isLoading) return (
    <>
      <Sidebar activePath="/servicios" />
      <main className="flex-1 ml-64 flex items-center justify-center bg-[var(--color-background)]">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </main>
    </>
  );

  return (
    <>
      <Sidebar activePath="/servicios" />
      <main className="flex-1 ml-64 flex flex-col h-full bg-[var(--color-background)] overflow-hidden">
        <TopBar />
        <div className="flex flex-col flex-1 overflow-y-auto pt-16" style={{ scrollbarWidth: "thin" }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface)] sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <Link href="/servicios" className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">
                <ArrowLeft size={20} strokeWidth={1.5} />
              </Link>
              <h1 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Editar Servicio</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleDelete} disabled={deleteService.isPending}
                className="flex items-center gap-2 border border-[var(--color-error)] text-[var(--color-error)] text-label-md font-semibold uppercase tracking-wider px-4 py-2.5 rounded-lg hover:bg-[var(--color-error-container)]/20 transition-colors disabled:opacity-60">
                <Trash2 size={14} strokeWidth={2} />
                {deleteService.isPending ? "Eliminando..." : "Eliminar"}
              </button>
              <button onClick={handleSave} disabled={updateService.isPending}
                className="flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold uppercase tracking-wider px-4 py-2.5 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors disabled:opacity-60">
                <Save size={14} strokeWidth={2} />
                {updateService.isPending ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>

          {feedback && (
            <div className={`mx-6 mt-4 flex items-center gap-2 rounded-lg px-4 py-3 text-body-md border ${
              feedback.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-[var(--color-error-container)]/30 border-[var(--color-error-container)] text-[var(--color-error)]"
            }`}>
              {feedback.type === "success" ? <CheckCircle size={16} strokeWidth={1.5} /> : <AlertCircle size={16} strokeWidth={1.5} />}
              {feedback.msg}
            </div>
          )}

          <div className="px-6 py-6 max-w-2xl space-y-6">
            <section className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-5 space-y-4">
              <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
                <PenLine size={18} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                Información General
              </h2>
              <div className="space-y-1">
                <label className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Nombre del servicio</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Descripción</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                  className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all resize-none" />
              </div>
            </section>

            <section className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-5 space-y-4">
              <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                Logística
              </h2>

              {[
                { label: "Categoría", value: category, onChange: setCategory, options: CATEGORIES.map(c => ({ v: c, l: c })) },
                { label: "Duración", value: durationMin, onChange: (v: string) => setDurationMin(Number(v)), options: DURATIONS.map(d => ({ v: d, l: `${d} min` })) },
              ].map(({ label, value, onChange, options }) => (
                <div key={label} className="space-y-1">
                  <label className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">{label}</label>
                  <div className="relative">
                    <select value={value} onChange={(e) => onChange(e.target.value)}
                      className="w-full appearance-none bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all cursor-pointer">
                      {label === "Categoría" && <option value="">Selecciona una categoría</option>}
                      {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                    <ChevronDown size={16} strokeWidth={1.5} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)] pointer-events-none" />
                  </div>
                </div>
              ))}

              <div className="space-y-1">
                <label className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider flex items-center gap-1.5">
                  <Timer size={13} strokeWidth={2} /> Buffer post-servicio
                </label>
                <p className="text-[11px] text-[var(--color-outline)]">Tiempo de limpieza o preparación entre citas.</p>
                <div className="relative">
                  <select value={bufferMin} onChange={(e) => setBufferMin(Number(e.target.value))}
                    className="w-full appearance-none bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all cursor-pointer">
                    {BUFFERS.map((b) => <option key={b} value={b}>{b === 0 ? "Sin buffer" : `${b} min`}</option>)}
                  </select>
                  <ChevronDown size={16} strokeWidth={1.5} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)] pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={13} strokeWidth={2} />
                  Capacidad máxima simultánea
                </label>
                <p className="text-[11px] text-[var(--color-outline)]">¿Cuántas personas pueden recibir este servicio al mismo tiempo? Ej: 3 sillas de corte. Déjalo vacío para sin límite.</p>
                <input
                  type="number" min="1" step="1"
                  value={maxConcurrent}
                  onChange={(e) => setMaxConcurrent(e.target.value)}
                  placeholder="Sin límite"
                  className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all placeholder:text-[var(--color-outline-variant)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Color en el calendario</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PALETTE.map((c) => (
                    <button key={c} type="button" onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-[var(--color-on-surface)] scale-110" : "hover:scale-105"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                    className="w-7 h-7 rounded-full cursor-pointer border border-[var(--color-outline-variant)] p-0.5 bg-transparent" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: color }} />
                  <span className="text-[11px] text-[var(--color-outline)] font-mono">{color}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Precio Base</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-body-md text-[var(--color-outline)]">S/</span>
                  <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg pl-7 pr-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all" />
                </div>
              </div>
            </section>

            <section className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-5 space-y-4">
              <div>
                <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
                  <Users size={18} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                  Colaboradores
                </h2>
                <p className="text-body-md text-[var(--color-on-surface-variant)] mt-1">Selecciona quién puede realizar este servicio.</p>
              </div>
              {collaborators.length === 0 ? (
                <p className="text-body-md text-[var(--color-outline)]">No hay colaboradores registrados.</p>
              ) : (
                <div className="space-y-2">
                  {collaborators.map((collab) => (
                    <label key={collab.id} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-outline-variant)] cursor-pointer hover:bg-[var(--color-surface-container-low)] transition-colors">
                      <input type="checkbox" checked={selectedCollabs.includes(collab.id)} onChange={() => toggleCollab(collab.id)}
                        className="w-4 h-4 rounded border-[var(--color-outline-variant)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]/20" />
                      <div className="w-9 h-9 rounded-full bg-[var(--color-primary-container)]/20 flex items-center justify-center text-[var(--color-primary)] text-[11px] font-bold shrink-0">
                        {collab.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                      </div>
                      <div>
                        <p className="text-body-md font-semibold text-[var(--color-on-surface)]">{collab.name}</p>
                        <p className="text-[12px] text-[var(--color-on-surface-variant)]">{collab.role}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </section>

            <button onClick={handleSave} disabled={updateService.isPending}
              className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold uppercase tracking-wider py-3.5 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors shadow-md disabled:opacity-60 active:scale-[0.98] mb-8">
              <Save size={16} strokeWidth={2} />
              {updateService.isPending ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
