import { Clock, User, ArrowRight } from "lucide-react";

export function NextAppointmentWidget() {
  return (
    <div className="col-span-4 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] p-6 flex flex-col justify-between relative overflow-hidden group hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] transition-shadow">
      {/* Decoración de fondo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)]/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />

      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 text-[var(--color-primary)] text-label-md font-semibold uppercase tracking-wider">
          <Clock size={16} strokeWidth={1.5} />
          Próxima Cita
        </div>
        <div className="bg-[var(--color-primary)] text-[var(--color-on-primary)] text-headline-md font-semibold px-3 py-1 rounded-lg tabular-nums animate-pulse">
          14:20
        </div>
      </div>

      {/* Cliente */}
      <div className="flex items-center gap-3 mt-3">
        <div className="w-12 h-12 rounded-full bg-[var(--color-primary-container)] border-2 border-[var(--color-surface)] flex items-center justify-center shrink-0">
          <span className="text-label-md font-bold text-[var(--color-primary)]">CR</span>
        </div>
        <div>
          <h3 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">
            Carlos Ruiz
          </h3>
          <p className="text-body-md text-[var(--color-on-surface-variant)]">
            Corte Clásico + Barba
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-[var(--color-outline-variant)] pt-3">
        <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] text-label-md">
          <User size={14} strokeWidth={1.5} />
          Con: Diego (Silla 2)
        </div>
        <button className="text-[var(--color-primary)] hover:text-[var(--color-primary-container)] transition-colors">
          <ArrowRight size={20} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
