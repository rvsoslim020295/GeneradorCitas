import Link from "next/link";
import { Scissors, X, LayoutDashboard, Flower2 } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[var(--color-surface-container-low)] flex flex-col items-center justify-center p-6">
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-[var(--color-outline-variant)]/50 w-full max-w-sm p-8 flex flex-col items-center text-center gap-6">

        {/* Icono */}
        <div className="relative">
          {/* Número 404 fantasma de fondo */}
          <div className="absolute inset-0 flex items-center justify-center text-[80px] font-black text-[var(--color-surface-container)] select-none pointer-events-none leading-none">
            404
          </div>
          <div className="w-24 h-24 rounded-full bg-[var(--color-surface-container)] flex items-center justify-center relative z-10">
            <Scissors size={40} className="text-[var(--color-primary)]" strokeWidth={1.5} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[var(--color-error-container)] flex items-center justify-center z-20 border-2 border-[var(--color-surface-container-lowest)]">
            <X size={14} className="text-[var(--color-error)]" strokeWidth={2.5} />
          </div>
        </div>

        {/* Texto */}
        <div className="space-y-2">
          <h1 className="text-headline-md font-bold text-[var(--color-on-surface)]">
            Página no encontrada
          </h1>
          <p className="text-body-md text-[var(--color-on-surface-variant)]">
            Parece que el enlace que buscas no existe o fue movido.
          </p>
        </div>

        {/* Botón */}
        <Link
          href="/dashboard"
          className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold uppercase tracking-wider py-4 rounded-xl hover:bg-[var(--color-on-primary-fixed-variant)] transition-all shadow-md active:scale-[0.98]"
        >
          <LayoutDashboard size={18} strokeWidth={1.5} />
          Volver al Dashboard
        </Link>
      </div>

      {/* Logo footer */}
      <div className="mt-8 flex items-center gap-2 text-[var(--color-outline)] text-label-md uppercase tracking-widest">
        <Flower2 size={16} strokeWidth={1.5} />
        GlowManager
      </div>
    </main>
  );
}
