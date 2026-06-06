"use client";

import { useState } from "react";
import { ArrowRight, Clock, Scissors } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Props = {
  onNext: () => void;
};

export function StepPrimerServicio({ onNext }: Props) {
  const [loading, setLoading] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("60");

  async function handleNext() {
    if (!name || !price) return;
    const token = localStorage.getItem("gm_token");
    if (!token) { onNext(); return; }
    setLoading(true);
    try {
      await fetch(`${API_URL}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, price: parseFloat(price), durationMin: parseInt(duration), category: "General" }),
      });
    } catch {
      // continuar aunque falle
    } finally {
      setLoading(false);
    }
    onNext();
  }

  function handleSkip() {
    setSkipping(true);
    onNext();
  }

  const inputClass = "w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-3 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all placeholder:text-[var(--color-outline-variant)]";

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-5">
      <p className="text-body-md text-[var(--color-on-surface-variant)]">
        Agrega el primer servicio de tu catálogo. Podrás añadir más después.
      </p>

      {/* Nombre del servicio */}
      <div className="space-y-1">
        <label className="block text-label-md font-semibold text-[var(--color-on-surface)] uppercase tracking-wider">
          Nombre del Servicio
        </label>
        <div className="relative flex items-center bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg overflow-hidden focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20 transition-all">
          <Scissors className="ml-3 text-[var(--color-outline)] shrink-0" size={18} strokeWidth={1.5} />
          <input
            type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Corte de cabello, Manicura..."
            className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-body-md text-[var(--color-on-surface)] py-3 px-3 placeholder:text-[var(--color-outline-variant)]"
          />
        </div>
      </div>

      {/* Precio y duración */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-label-md font-semibold text-[var(--color-on-surface)] uppercase tracking-wider">
            Precio
          </label>
          <div className="relative flex items-center bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg overflow-hidden focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20 transition-all">
            <span className="ml-3 text-body-md text-[var(--color-outline)] shrink-0 font-medium">S/</span>
            <input
              type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-body-md text-[var(--color-on-surface)] py-3 px-2 placeholder:text-[var(--color-outline-variant)]"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="block text-label-md font-semibold text-[var(--color-on-surface)] uppercase tracking-wider">
            Duración
          </label>
          <div className="relative flex items-center bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg overflow-hidden focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20 transition-all">
            <Clock className="ml-3 text-[var(--color-outline)] shrink-0" size={16} strokeWidth={1.5} />
            <select value={duration} onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-body-md text-[var(--color-on-surface)] py-3 px-2 cursor-pointer appearance-none">
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">60 min</option>
              <option value="90">90 min</option>
              <option value="120">2 horas</option>
            </select>
          </div>
        </div>
      </div>

      <div className="pt-2 space-y-3">
        <button type="button" onClick={handleNext} disabled={loading || !name || !price}
          className="w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold uppercase tracking-wider py-3 px-4 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm disabled:opacity-60">
          {loading ? "Guardando..." : "Continuar"}
          {!loading && <ArrowRight size={16} strokeWidth={2} />}
        </button>
        <button type="button" onClick={handleSkip} disabled={skipping}
          className="w-full text-label-md font-semibold text-[var(--color-on-surface-variant)] py-2 hover:text-[var(--color-on-surface)] transition-colors">
          Agregar después
        </button>
      </div>
    </div>
  );
}
