"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, ArrowRight, Clock } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const DAYS = [
  { id: "Mon", label: "Lun" },
  { id: "Tue", label: "Mar" },
  { id: "Wed", label: "Mié" },
  { id: "Thu", label: "Jue" },
  { id: "Fri", label: "Vie" },
  { id: "Sat", label: "Sáb" },
  { id: "Sun", label: "Dom" },
];

const SLOT_OPTIONS = [15, 30, 60];

type Props = {
  onNext: () => void;
};

export function StepHorario({ onNext }: Props) {
  const [loading, setLoading] = useState(false);
  const [operatingDays, setOperatingDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [slotMinutes, setSlotMinutes] = useState(30);

  function toggleDay(day: string) {
    setOperatingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleNext() {
    const token = localStorage.getItem("gm_token");
    if (!token) return;
    setLoading(true);
    try {
      await fetch(`${API_URL}/settings/agenda`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slotMinutes, cancellationHours: 24, operatingDays }),
      });
    } catch {
      // continuar aunque falle
    } finally {
      setLoading(false);
    }
    onNext();
  }

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-6">
      {/* Días de operación */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarCheck size={18} className="text-[var(--color-primary)]" strokeWidth={1.5} />
          <label className="block text-label-md font-semibold text-[var(--color-on-surface)] uppercase tracking-wider">
            Días de Operación
          </label>
        </div>
        <p className="text-body-md text-[var(--color-on-surface-variant)]">
          Selecciona los días en que tu negocio atiende.
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
      </div>

      {/* Duración de slots */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-[var(--color-primary)]" strokeWidth={1.5} />
          <label className="block text-label-md font-semibold text-[var(--color-on-surface)] uppercase tracking-wider">
            Duración de Citas
          </label>
        </div>
        <p className="text-body-md text-[var(--color-on-surface-variant)]">
          Duración predeterminada de los bloques de tiempo.
        </p>
        <div className="flex gap-2">
          {SLOT_OPTIONS.map((opt) => (
            <button key={opt} type="button" onClick={() => setSlotMinutes(opt)}
              className={`flex-1 py-2.5 rounded-lg border text-body-md font-semibold transition-all ${
                slotMinutes === opt
                  ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] border-[var(--color-primary)] shadow-sm"
                  : "bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] border-[var(--color-outline-variant)] hover:border-[var(--color-primary)]/50"
              }`}>
              {opt} min
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <button type="button" onClick={handleNext} disabled={loading || operatingDays.length === 0}
          className="w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold uppercase tracking-wider py-3 px-4 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm disabled:opacity-60">
          {loading ? "Guardando..." : "Continuar"}
          {!loading && <ArrowRight size={16} strokeWidth={2} />}
        </button>
      </div>
    </div>
  );
}
