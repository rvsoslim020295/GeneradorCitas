"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Filter, ChevronDown, Check, X } from "lucide-react";
import type { CollaboratorData } from "../page";

export const viewOptions = ["Día", "Semana", "Mes"] as const;
export type ViewOption = typeof viewOptions[number];

const MONTHS_ES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const DAYS_ES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

function formatDate(date: Date, view: ViewOption): string {
  if (view === "Día") {
    return `${DAYS_ES[date.getDay()]} ${date.getDate()} de ${MONTHS_ES[date.getMonth()]} ${date.getFullYear()}`;
  }
  if (view === "Semana") {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay() + 1);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} – ${end.getDate()} de ${MONTHS_ES[start.getMonth()]} ${start.getFullYear()}`;
    }
    return `${start.getDate()} ${MONTHS_ES[start.getMonth()]} – ${end.getDate()} ${MONTHS_ES[end.getMonth()]} ${start.getFullYear()}`;
  }
  return `${MONTHS_ES[date.getMonth()]} ${date.getFullYear()}`;
}

type Props = {
  activeView: ViewOption;
  currentDate: Date;
  onViewChange?: (v: ViewOption) => void;
  onDateChange: (d: Date) => void;
  collaborators: CollaboratorData[];
  filteredCollabId: string | null;
  onFilterCollab: (id: string | null) => void;
  lockedToDayView?: boolean;
};

export function AgendaToolbar({
  activeView, currentDate, onViewChange, onDateChange,
  collaborators, filteredCollabId, onFilterCollab, lockedToDayView = false,
}: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al click fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function goToday() { onDateChange(new Date()); }

  function goBack() {
    const d = new Date(currentDate);
    if (activeView === "Día") d.setDate(d.getDate() - 1);
    else if (activeView === "Semana") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    onDateChange(d);
  }

  function goForward() {
    const d = new Date(currentDate);
    if (activeView === "Día") d.setDate(d.getDate() + 1);
    else if (activeView === "Semana") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    onDateChange(d);
  }

  const activeCollab = filteredCollabId
    ? collaborators.find(c => c.id === filteredCollabId)
    : null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface)] shrink-0 gap-4">
      {/* Navegación de fecha */}
      <div className="flex items-center gap-4">
        <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)] min-w-[220px] capitalize">
          {formatDate(currentDate, activeView)}
        </h2>
        <div className="flex gap-1 bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] rounded-lg p-1 shadow-sm">
          <button onClick={goBack} className="w-8 h-8 rounded flex items-center justify-center text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] transition-colors">
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>
          <button onClick={goToday} className="px-4 h-8 text-label-md font-semibold rounded hover:bg-[var(--color-surface-container-high)] transition-colors text-[var(--color-on-surface)] flex items-center justify-center">
            Hoy
          </button>
          <button onClick={goForward} className="w-8 h-8 rounded flex items-center justify-center text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] transition-colors">
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Filtros y selector de vista */}
      <div className="flex items-center gap-4">

        {/* Dropdown filtro colaboradores */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-label-md font-semibold transition-colors shadow-sm ${
              filteredCollabId
                ? "bg-[var(--color-primary-container)]/20 border-[var(--color-primary)]/40 text-[var(--color-primary)]"
                : "bg-[var(--color-surface-container-lowest)] border-[var(--color-outline-variant)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)]"
            }`}
          >
            <Filter size={15} strokeWidth={1.5} />
            <span className="max-w-[140px] truncate">
              {activeCollab ? activeCollab.name : "Todos los Colaboradores"}
            </span>
            {filteredCollabId ? (
              <span
                role="button"
                onClick={e => { e.stopPropagation(); onFilterCollab(null); }}
                className="ml-1 text-[var(--color-primary)] hover:text-[var(--color-error)] transition-colors cursor-pointer"
              >
                <X size={14} strokeWidth={2} />
              </span>
            ) : (
              <ChevronDown size={15} strokeWidth={1.5} className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl shadow-lg z-50 overflow-hidden">
              {/* Opción "Todos" */}
              <button
                onClick={() => { onFilterCollab(null); setDropdownOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-label-md font-semibold transition-colors border-b border-[var(--color-outline-variant)]/40 ${
                  !filteredCollabId
                    ? "bg-[var(--color-primary-container)]/20 text-[var(--color-primary)]"
                    : "text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)]"
                }`}
              >
                Todos los colaboradores
                {!filteredCollabId && <Check size={14} strokeWidth={2} />}
              </button>

              {collaborators.length === 0 ? (
                <p className="px-4 py-3 text-body-md text-[var(--color-on-surface-variant)]">Sin colaboradores activos</p>
              ) : (
                collaborators.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { onFilterCollab(c.id); setDropdownOpen(false); }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors ${
                      filteredCollabId === c.id
                        ? "bg-[var(--color-primary-container)]/20 text-[var(--color-primary)]"
                        : "text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)]"
                    }`}
                  >
                    <div className="text-left">
                      <p className="text-label-md font-semibold">{c.name}</p>
                      <p className="text-[11px] text-[var(--color-on-surface-variant)]">{c.role}</p>
                    </div>
                    {filteredCollabId === c.id && <Check size={14} strokeWidth={2} />}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Selector de vista Día|Semana|Mes — oculto para colaboradores */}
        {!lockedToDayView && onViewChange && (
          <div className="flex bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] rounded-lg p-1 shadow-sm">
            {viewOptions.map((view) => (
              <button
                key={view}
                onClick={() => onViewChange(view)}
                className={`px-4 py-1.5 text-label-md font-semibold rounded transition-colors ${
                  activeView === view
                    ? "bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] shadow-sm"
                    : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
