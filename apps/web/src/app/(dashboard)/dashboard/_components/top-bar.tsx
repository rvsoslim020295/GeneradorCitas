import { Search, Bell, HelpCircle, ChevronDown } from "lucide-react";

export function TopBar() {
  return (
    <header className="bg-[var(--color-surface)]/80 backdrop-blur-md fixed top-0 right-0 w-[calc(100%-16rem)] h-16 border-b border-[var(--color-outline-variant)] flex justify-between items-center px-6 z-30">
      {/* Búsqueda */}
      <div className="relative w-96 group">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] group-focus-within:text-[var(--color-primary)] transition-colors"
        />
        <input
          type="text"
          placeholder="Buscar cliente, servicio o cita..."
          className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg pl-9 pr-4 py-2 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-colors placeholder:text-[var(--color-outline-variant)]"
        />
      </div>

      {/* Acciones y perfil */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          {/* Notificaciones */}
          <button className="w-10 h-10 rounded-full text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] transition-all flex items-center justify-center relative">
            <Bell size={20} strokeWidth={1.5} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--color-error)] rounded-full border border-[var(--color-surface)]" />
          </button>
          {/* Ayuda */}
          <button className="w-10 h-10 rounded-full text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] transition-all flex items-center justify-center">
            <HelpCircle size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className="h-8 w-px bg-[var(--color-outline-variant)]" />

        {/* Perfil */}
        <button className="flex items-center gap-2 hover:bg-[var(--color-surface-container-low)] transition-all rounded-full p-1 pr-3">
          <div className="w-8 h-8 rounded-full bg-[var(--color-primary-container)] flex items-center justify-center shrink-0">
            <span className="text-label-md font-bold text-[var(--color-primary)]">AM</span>
          </div>
          <span className="text-label-md font-semibold text-[var(--color-on-surface)]">Ana M.</span>
          <ChevronDown size={16} className="text-[var(--color-on-surface-variant)]" />
        </button>
      </div>
    </header>
  );
}
