"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronDown, Check, Plus, X } from "lucide-react";

export const DEFAULT_ROLES = [
  "Administrador",
  "Cajero",
  "Recepcionista",
  "Barbero",
  "Estilista",
  "Colorista",
  "Manicurista",
  "Pedicurista",
  "Masajista",
  "Esteticista",
  "Maquillista",
  "Instructor",
];

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};

export function RoleSelector({ value, onChange, placeholder = "Selecciona un rol..." }: Props) {
  const [open, setOpen] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function selectRole(r: string) {
    onChange(r);
    setOpen(false);
    setCustomInput("");
  }

  function addCustom() {
    const v = customInput.trim();
    if (v) { selectRole(v); }
  }

  const inputClass = "w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all";

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-body-md transition-all ${
          value
            ? "bg-[var(--color-surface-container-lowest)] border-[var(--color-outline-variant)] text-[var(--color-on-surface)]"
            : "bg-[var(--color-surface-container-lowest)] border-[var(--color-outline-variant)] text-[var(--color-outline-variant)]"
        } focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20`}
      >
        <span>{value || placeholder}</span>
        <div className="flex items-center gap-1">
          {value && (
            <span
              role="button"
              onClick={e => { e.stopPropagation(); onChange(""); }}
              className="text-[var(--color-outline)] hover:text-[var(--color-error)] transition-colors p-0.5"
            >
              <X size={14} strokeWidth={2} />
            </span>
          )}
          <ChevronDown size={16} strokeWidth={1.5} className={`text-[var(--color-outline)] transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Lista de roles predefinidos */}
          <div className="max-h-52 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
            {DEFAULT_ROLES.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => selectRole(r)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-label-md transition-colors border-b border-[var(--color-outline-variant)]/30 last:border-0 ${
                  value === r
                    ? "bg-[var(--color-primary-container)]/20 text-[var(--color-primary)] font-semibold"
                    : "text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)]"
                }`}
              >
                {r}
                {value === r && <Check size={14} strokeWidth={2} />}
              </button>
            ))}
          </div>

          {/* Agregar rol personalizado */}
          <div className="p-3 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]/50">
            <p className="text-[10px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-2">
              Agregar rol personalizado
            </p>
            <div className="flex gap-2">
              <input
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
                autoComplete="off" spellCheck={false}
                placeholder="Ej: Depiladora, Instructor..."
                className={`${inputClass} py-2 text-[13px] flex-1`}
              />
              <button
                type="button"
                onClick={addCustom}
                disabled={!customInput.trim()}
                className="px-3 py-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors disabled:opacity-40"
              >
                <Plus size={16} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
