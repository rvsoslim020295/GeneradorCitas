"use client";

import { useState } from "react";
import { Store, Scissors, ChevronDown, ArrowRight, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api/client";

type Props = {
  onNext: () => void;
};

export function SalonProfileForm({ onNext }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;
    const name = (form.elements.namedItem("salonName") as HTMLInputElement).value;
    const type = (form.elements.namedItem("businessType") as HTMLSelectElement).value;

    if (!type) {
      setError("Selecciona el tipo de negocio.");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/settings/business", {
        method: "PATCH",
        body: JSON.stringify({ name, type }),
      });
      onNext();
    } catch {
      setError("Error al guardar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl space-y-6">
      {error && (
        <div className="flex items-center gap-2 text-[var(--color-error)] text-body-md">
          <AlertCircle size={14} strokeWidth={1.5} />
          {error}
        </div>
      )}

      {/* Nombre del Negocio */}
      <div className="space-y-1">
        <label htmlFor="salonName"
          className="block text-label-md font-semibold text-[var(--color-on-surface)] uppercase tracking-wider">
          Nombre del Negocio
        </label>
        <div className="input-glow-wrap relative rounded-lg bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] flex items-center overflow-hidden transition-all duration-200 focus-within:border-[var(--color-primary)] focus-within:shadow-[0_0_0_3px_rgb(68_65_196_/_0.15)]">
          <Store className="ml-3 text-[var(--color-outline)] shrink-0" size={20} strokeWidth={1.5} />
          <input
            id="salonName" name="salonName" type="text"
            placeholder="Ej. Studio Elegance" required
            className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-body-md text-[var(--color-on-surface)] py-3 px-3 placeholder:text-[var(--color-outline-variant)]"
          />
        </div>
      </div>

      {/* Tipo de Negocio */}
      <div className="space-y-1">
        <label htmlFor="businessType"
          className="block text-label-md font-semibold text-[var(--color-on-surface)] uppercase tracking-wider">
          Tipo de Negocio
        </label>
        <div className="input-glow-wrap relative rounded-lg bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] flex items-center overflow-hidden transition-all duration-200 focus-within:border-[var(--color-primary)] focus-within:shadow-[0_0_0_3px_rgb(68_65_196_/_0.15)]">
          <Scissors className="ml-3 text-[var(--color-outline)] shrink-0" size={20} strokeWidth={1.5} />
          <select
            id="businessType" name="businessType" defaultValue=""
            className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-body-md text-[var(--color-on-surface)] py-3 px-3 appearance-none cursor-pointer"
          >
            <option value="" disabled>Selecciona una categoría...</option>
            <option value="Peluquería / Salón de Belleza">Peluquería / Salón de Belleza</option>
            <option value="Barbería">Barbería</option>
            <option value="Spa / Centro de Estética">Spa / Centro de Estética</option>
            <option value="Nail Bar">Nail Bar</option>
            <option value="Otro">Otro</option>
          </select>
          <ChevronDown className="mr-3 text-[var(--color-outline)] pointer-events-none shrink-0" size={20} strokeWidth={1.5} />
        </div>
      </div>

      {/* Continuar */}
      <div className="pt-4">
        <button type="submit" disabled={loading}
          className="w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold uppercase tracking-wider py-3 px-4 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm disabled:opacity-60">
          {loading ? "Guardando..." : "Continuar"}
          {!loading && <ArrowRight size={16} strokeWidth={2} />}
        </button>
      </div>
    </form>
  );
}
