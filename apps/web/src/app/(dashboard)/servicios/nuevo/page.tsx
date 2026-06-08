"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Save, PenLine, SlidersHorizontal,
  Users, ChevronDown, AlertCircle, CheckCircle, Timer,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { useCollaborators, useCreateService } from "@/lib/api/hooks";

const CATEGORIES = ["Peluquería", "Estética", "Barbería", "Nail Bar", "Spa", "Otro"];
const DURATIONS = [15, 20, 30, 45, 60, 90, 120, 150, 180];
const BUFFERS = [0, 5, 10, 15, 20, 30];
const PALETTE = [
  "#4441c4", "#006591", "#854300", "#16a34a", "#dc2626",
  "#9333ea", "#0891b2", "#d97706", "#be185d", "#475569",
];

export default function NuevoServicioPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [durationMin, setDurationMin] = useState(30);
  const [bufferMin, setBufferMin] = useState(0);
  const [maxConcurrent, setMaxConcurrent] = useState<string>("");
  const [color, setColor] = useState("#4441c4");
  const [price, setPrice] = useState("");
  const [selectedCollabs, setSelectedCollabs] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const { data: servicesData } = useCollaborators();
  const collaborators = servicesData ?? [];
  const createService = useCreateService();

  function toggleCollab(id: string) {
    setSelectedCollabs((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !category || !price) {
      setFeedback({ type: "error", msg: "Nombre, categoría y precio son obligatorios." });
      return;
    }
    setFeedback(null);
    try {
      await createService.mutateAsync({
        name,
        description: description || undefined,
        category,
        durationMin,
        bufferMinutes: bufferMin,
        maxConcurrent: maxConcurrent !== "" ? parseInt(maxConcurrent) : null,
        color,
        price: parseFloat(price),
      } as never);
      setFeedback({ type: "success", msg: "Servicio creado correctamente" });
      setTimeout(() => router.push("/servicios"), 1200);
    } catch {
      setFeedback({ type: "error", msg: "Error al guardar el servicio. Intenta de nuevo." });
    }
  }

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
              <h1 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Nuevo Servicio</h1>
            </div>
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

          <form onSubmit={handleSubmit} className="px-6 py-6 max-w-2xl space-y-6">
            <section className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-5 space-y-4">
              <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
                <PenLine size={18} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                Información General
              </h2>
              <div className="space-y-1">
                <label className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Nombre del servicio</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all placeholder:text-[var(--color-outline-variant)]" />
              </div>
              <div className="space-y-1">
                <label className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Descripción</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                  className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all resize-none placeholder:text-[var(--color-outline-variant)]" />
              </div>
            </section>

            <section className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-5 space-y-4">
              <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                Logística
              </h2>

              <div className="space-y-1">
                <label className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Categoría</label>
                <div className="relative">
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full appearance-none bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all cursor-pointer">
                    <option value="">Selecciona una categoría</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={16} strokeWidth={1.5} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)] pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Duración</label>
                <div className="relative">
                  <select value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))}
                    className="w-full appearance-none bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all cursor-pointer">
                    {DURATIONS.map((d) => <option key={d} value={d}>{d} min</option>)}
                  </select>
                  <ChevronDown size={16} strokeWidth={1.5} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)] pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider flex items-center gap-1.5">
                  <Timer size={13} strokeWidth={2} />
                  Buffer post-servicio
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
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: color }} />
                  <span className="text-[11px] text-[var(--color-outline)] font-mono">{color}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Precio Base</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-body-md text-[var(--color-outline)]">S/</span>
                  <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg pl-7 pr-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all placeholder:text-[var(--color-outline-variant)]" />
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
                    <label key={collab.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-outline-variant)] cursor-pointer hover:bg-[var(--color-surface-container-low)] transition-colors">
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

            <button type="submit" disabled={createService.isPending}
              className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold uppercase tracking-wider py-3.5 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors shadow-md disabled:opacity-60 active:scale-[0.98] mb-8">
              <Save size={16} strokeWidth={2} />
              {createService.isPending ? "Guardando..." : "Guardar Servicio"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
