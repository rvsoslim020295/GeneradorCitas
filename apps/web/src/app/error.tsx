"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-[var(--color-surface-container-low)] flex items-center justify-center p-6">
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-[var(--color-outline-variant)]/50 w-full max-w-sm p-8 flex flex-col items-center text-center gap-6"
        style={{ background: "linear-gradient(135deg, #fff 60%, #ffdad620 100%)" }}>

        {/* Icono */}
        <div className="w-24 h-24 rounded-full bg-[var(--color-error-container)]/40 flex items-center justify-center">
          <AlertCircle size={44} className="text-[var(--color-error)]" strokeWidth={1.5} />
        </div>

        {/* Texto */}
        <div className="space-y-3">
          <h1 className="text-headline-md font-bold text-[var(--color-on-surface)]">
            Algo salió mal
          </h1>
          <p className="text-body-md text-[var(--color-on-surface-variant)]">
            Estamos experimentando dificultades técnicas. Por favor, intenta de nuevo en unos momentos.
          </p>
        </div>

        {/* Botones */}
        <div className="w-full space-y-3">
          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold uppercase tracking-wider py-4 rounded-xl hover:bg-[var(--color-on-primary-fixed-variant)] transition-all shadow-md active:scale-[0.98]"
          >
            <RefreshCw size={18} strokeWidth={1.5} />
            Reintentar
          </button>
          <button className="text-label-md font-semibold text-[var(--color-primary)] hover:underline">
            Contactar a Soporte
          </button>
        </div>
      </div>
    </main>
  );
}
