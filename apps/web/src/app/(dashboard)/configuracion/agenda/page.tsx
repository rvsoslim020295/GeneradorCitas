"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, CalendarCheck, Clock, CheckCircle, AlertCircle, Save, ChevronDown, Minus, Plus } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

const DAYS = [
  { id: "Mon", label: "Lun" },
  { id: "Tue", label: "Mar" },
  { id: "Wed", label: "Mié" },
  { id: "Thu", label: "Jue" },
  { id: "Fri", label: "Vie" },
  { id: "Sat", label: "Sáb" },
  { id: "Sun", label: "Dom" },
];

// Genera opciones de tiempo de 00:00 a 23:30 en pasos de 30 min
function timeOptions() {
  const opts: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      opts.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return opts;
}

const TIME_OPTIONS = timeOptions();

function fmt12(time: string) {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

type BusinessSettings = {
  cancellationHours: number;
  reschedulingHours: number;
  operatingDays: string[];
  openTime: string;
  closeTime: string;
};

export default function AgendaConfigPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [initialized, setInitialized] = useState(false);

  const [cancellationHours, setCancellationHours] = useState(24);
  const [reschedulingHours, setReschedulingHours] = useState(12);
  const [operatingDays, setOperatingDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("18:00");

  const { data: settings, isLoading } = useQuery<{ business: BusinessSettings }>({
    queryKey: ["settings"],
    queryFn: () => apiFetch<{ business: BusinessSettings }>("/settings"),
  });

  useEffect(() => {
    if (settings?.business && !initialized) {
      const b = settings.business;
      setCancellationHours(b.cancellationHours ?? 24);
      setReschedulingHours(b.reschedulingHours ?? 12);
      setOperatingDays(b.operatingDays ?? ["Mon", "Tue", "Wed", "Thu", "Fri"]);
      setOpenTime(b.openTime ?? "09:00");
      setCloseTime(b.closeTime ?? "18:00");
      setInitialized(true);
    }
  }, [settings, initialized]);

  const saveMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch("/settings/agenda", { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      setFeedback({ type: "success", msg: "Configuración guardada correctamente" });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: () => setFeedback({ type: "error", msg: "Error al guardar. Intenta de nuevo." }),
  });

  function toggleDay(day: string) {
    setOperatingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function handleSave() {
    if (openTime >= closeTime) {
      setFeedback({ type: "error", msg: "La hora de apertura debe ser anterior a la hora de cierre." });
      return;
    }
    saveMutation.mutate({ cancellationHours, reschedulingHours, operatingDays, openTime, closeTime });
  }

  const saving = saveMutation.isPending;

  const inputClass = "w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all appearance-none cursor-pointer";
  const labelClass = "block text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1";

  if (isLoading) return (
    <>
      <Sidebar activePath="/configuracion" />
      <main className="flex-1 ml-64 flex items-center justify-center bg-[var(--color-background)]">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </main>
    </>
  );

  return (
    <>
      <Sidebar activePath="/configuracion" />
      <main className="flex-1 ml-64 flex flex-col h-full bg-[var(--color-background)] overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-y-auto pt-16" style={{ scrollbarWidth: "thin" }}>
          <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/configuracion" className="p-2 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] rounded-full transition-colors">
                  <ArrowLeft size={20} strokeWidth={1.5} />
                </Link>
                <div>
                  <h1 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Agenda y Políticas</h1>
                  <p className="text-body-md text-[var(--color-on-surface-variant)]">Configura cómo funciona tu calendario.</p>
                </div>
              </div>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold uppercase tracking-wider px-4 py-2.5 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors disabled:opacity-60">
                <Save size={14} strokeWidth={2} />
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>

            {feedback && (
              <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-body-md border ${feedback.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-[var(--color-error-container)]/30 border-[var(--color-error-container)] text-[var(--color-error)]"}`}>
                {feedback.type === "success" ? <CheckCircle size={16} strokeWidth={1.5} /> : <AlertCircle size={16} strokeWidth={1.5} />}
                {feedback.msg}
              </div>
            )}

            {/* Días de Operación */}
            <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <CalendarCheck size={20} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Días de Operación</h2>
              </div>
              <p className="text-body-md text-[var(--color-on-surface-variant)]">
                Selecciona los días en que tu negocio acepta citas.
              </p>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(({ id, label }) => {
                  const active = operatingDays.includes(id);
                  return (
                    <button key={id} type="button" onClick={() => toggleDay(id)}
                      className={`px-4 py-2 rounded-full text-body-md font-semibold transition-all ${
                        active
                          ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm"
                          : "bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)]/50"
                      }`}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Horario de Atención */}
            <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Horario de Atención</h2>
              </div>
              <p className="text-body-md text-[var(--color-on-surface-variant)]">
                Rango de horas en que tu negocio atiende clientes, aplicado a todos los días de operación.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Apertura */}
                <div>
                  <label className={labelClass}>Hora de apertura</label>
                  <div className="relative">
                    <select value={openTime} onChange={(e) => setOpenTime(e.target.value)} className={inputClass + " pr-9"}>
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>{fmt12(t)}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} strokeWidth={1.5} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]" />
                  </div>
                </div>

                {/* Cierre */}
                <div>
                  <label className={labelClass}>Hora de cierre</label>
                  <div className="relative">
                    <select value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className={inputClass + " pr-9"}>
                      {TIME_OPTIONS.filter((t) => t > openTime).map((t) => (
                        <option key={t} value={t}>{fmt12(t)}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} strokeWidth={1.5} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]" />
                  </div>
                </div>
              </div>

              {/* Resumen visual */}
              <div className="rounded-lg bg-[var(--color-primary)]/8 border border-[var(--color-primary)]/20 px-4 py-3 flex items-center gap-3">
                <Clock size={16} className="text-[var(--color-primary)] shrink-0" strokeWidth={1.5} />
                <p className="text-body-md text-[var(--color-on-surface)]">
                  Tu negocio atiende de{" "}
                  <span className="font-semibold text-[var(--color-primary)]">{fmt12(openTime)}</span>
                  {" "}a{" "}
                  <span className="font-semibold text-[var(--color-primary)]">{fmt12(closeTime)}</span>
                  {" "}·{" "}
                  <span className="text-[var(--color-on-surface-variant)]">
                    {(() => {
                      const [oh, om] = openTime.split(":").map(Number);
                      const [ch, cm] = closeTime.split(":").map(Number);
                      const mins = (ch * 60 + cm) - (oh * 60 + om);
                      const h = Math.floor(mins / 60);
                      const m = mins % 60;
                      return m > 0 ? `${h}h ${m}min` : `${h}h`;
                    })()}
                  </span>
                </p>
              </div>
            </section>

            {/* Política de Cancelación */}
            <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldAlert size={20} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Política de Cancelación</h2>
              </div>
              <p className="text-body-md text-[var(--color-on-surface-variant)]">
                Horas mínimas de anticipación para cancelar una cita. Si se intenta cancelar dentro de ese plazo, el sistema lo bloqueará.
              </p>
              <div>
                <label className={labelClass}>Horas de anticipación para cancelar</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-[var(--color-outline-variant)] rounded-lg overflow-hidden bg-[var(--color-surface-container-lowest)]">
                    <button type="button" onClick={() => setCancellationHours(h => Math.max(0, h - 1))}
                      className="px-3 py-2.5 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)] transition-colors border-r border-[var(--color-outline-variant)]">
                      <Minus size={14} strokeWidth={2} />
                    </button>
                    <input type="number" min={0} max={168} value={cancellationHours}
                      onChange={(e) => setCancellationHours(Math.min(168, Math.max(0, Number(e.target.value))))}
                      className="w-16 text-center bg-transparent py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                    <button type="button" onClick={() => setCancellationHours(h => Math.min(168, h + 1))}
                      className="px-3 py-2.5 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)] transition-colors border-l border-[var(--color-outline-variant)]">
                      <Plus size={14} strokeWidth={2} />
                    </button>
                  </div>
                  <span className="text-body-md text-[var(--color-on-surface-variant)]">
                    {cancellationHours === 0 ? "Sin restricción" : `${cancellationHours} h antes de la cita`}
                  </span>
                </div>
              </div>

              <div className="border-t border-[var(--color-outline-variant)]/40 pt-4 space-y-3">
                <h3 className="text-body-md font-semibold text-[var(--color-on-surface)]">Política de Reagendamiento</h3>
                <p className="text-body-md text-[var(--color-on-surface-variant)]">
                  Horas mínimas de anticipación para reagendar una cita. Puede ser distinto al de cancelación.
                </p>
                <div>
                  <label className={labelClass}>Horas de anticipación para reagendar</label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-[var(--color-outline-variant)] rounded-lg overflow-hidden bg-[var(--color-surface-container-lowest)]">
                      <button type="button" onClick={() => setReschedulingHours(h => Math.max(0, h - 1))}
                        className="px-3 py-2.5 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)] transition-colors border-r border-[var(--color-outline-variant)]">
                        <Minus size={14} strokeWidth={2} />
                      </button>
                      <input type="number" min={0} max={168} value={reschedulingHours}
                        onChange={(e) => setReschedulingHours(Math.min(168, Math.max(0, Number(e.target.value))))}
                        className="w-16 text-center bg-transparent py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      <button type="button" onClick={() => setReschedulingHours(h => Math.min(168, h + 1))}
                        className="px-3 py-2.5 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)] transition-colors border-l border-[var(--color-outline-variant)]">
                        <Plus size={14} strokeWidth={2} />
                      </button>
                    </div>
                    <span className="text-body-md text-[var(--color-on-surface-variant)]">
                      {reschedulingHours === 0 ? "Sin restricción" : `${reschedulingHours} h antes de la cita`}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <button onClick={handleSave} disabled={saving}
              className="w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-headline-sm font-semibold py-4 rounded-xl hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors shadow-md disabled:opacity-60 active:scale-[0.98] mb-4">
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
