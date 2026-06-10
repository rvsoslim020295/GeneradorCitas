"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Save, User, ToggleLeft, ToggleRight,
  AlertCircle, Tag, Search, X, Check, ChevronRight, Phone,
} from "lucide-react";
import { RoleSelector } from "../_components/role-selector";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { useCreateCollaborator, useServices } from "@/lib/api/hooks";

export default function NuevoColaboradorPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");
  const [documentType, setDocumentType] = useState<"DNI" | "CE">("DNI");
  const [documentNumber, setDocumentNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [performsServices, setPerformsServices] = useState(true);

  const [panelOpen, setPanelOpen] = useState(false);
  const [specialtySearch, setSpecialtySearch] = useState("");
  const [customInput, setCustomInput] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const createCollaborator = useCreateCollaborator();
  const { data: servicesData } = useServices();
  const ALL_SPECIALTIES = (servicesData?.services ?? []).map((s) => s.name);

  useEffect(() => {
    if (panelOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [panelOpen]);

  function toggleSpecialty(s: string) {
    setSpecialties(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  function addCustom() {
    const v = customInput.trim();
    if (v && !specialties.includes(v)) setSpecialties(prev => [...prev, v]);
    setCustomInput("");
  }

  const filtered = ALL_SPECIALTIES.filter(s => s.toLowerCase().includes(specialtySearch.toLowerCase()));

  async function handleSave() {
    setError("");
    if (!firstName.trim() || firstName.trim().length < 2) { setError("El nombre debe tener al menos 2 caracteres."); return; }
    if (!lastName.trim() || lastName.trim().length < 2) { setError("El apellido debe tener al menos 2 caracteres."); return; }
    if (!role.trim() || role.trim().length < 2) { setError("El rol/cargo es obligatorio."); return; }

    try {
      await createCollaborator.mutateAsync({
        name: `${firstName.trim()} ${lastName.trim()}`,
        lastName: lastName.trim(),
        role: role.trim(),
        specialties,
        isActive,
        performsServices,
        ...(documentNumber.trim() && { documentType, documentNumber: documentNumber.trim() }),
        ...(phone.trim() && { phone: phone.trim() }),
      });
      router.push("/colaboradores");
    } catch (err) {
      const raw = (err as Error).message ?? "";
      try {
        const body = JSON.parse(raw);
        setError(`No se pudo guardar el colaborador: ${body.error ?? raw}`);
      } catch {
        setError(`No se pudo guardar el colaborador: ${raw || "Error desconocido"}`);
      }
    }
  }

  const inputClass = "w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all";
  const labelClass = "block text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1";
  const docMaxLength = documentType === "DNI" ? 8 : 12;

  return (
    <>
      <Sidebar activePath="/colaboradores" />

      {panelOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setPanelOpen(false)} />
          <aside className="fixed right-0 top-0 h-full w-[360px] bg-[var(--color-surface-container-lowest)] z-50 shadow-2xl border-l border-[var(--color-outline-variant)] flex flex-col">
            <div className="h-16 px-5 flex items-center justify-between border-b border-[var(--color-outline-variant)] shrink-0">
              <h3 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Especialidades</h3>
              <button onClick={() => setPanelOpen(false)} className="p-2 rounded-full hover:bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)] transition-colors">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            <div className="p-4 border-b border-[var(--color-outline-variant)]/50">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)]" strokeWidth={1.5} />
                <input ref={searchRef} value={specialtySearch} onChange={e => setSpecialtySearch(e.target.value)}
                  autoComplete="off" spellCheck={false}
                  className="w-full pl-9 pr-4 py-2 bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] rounded-lg text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
              {filtered.length === 0 ? (
                <p className="px-5 py-4 text-body-md text-[var(--color-on-surface-variant)]">Sin resultados</p>
              ) : filtered.map(s => {
                const selected = specialties.includes(s);
                return (
                  <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                    className={`w-full flex items-center justify-between px-5 py-3 transition-colors border-b border-[var(--color-outline-variant)]/30 last:border-0 ${selected ? "bg-[var(--color-primary-container)]/20 text-[var(--color-primary)]" : "text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)]"}`}>
                    <span className="text-body-md font-medium">{s}</span>
                    {selected && <Check size={16} strokeWidth={2} className="text-[var(--color-primary)] shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="p-4 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface)]/60 shrink-0">
              <p className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-2">Agregar personalizada</p>
              <div className="flex gap-2">
                <input value={customInput} onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
                  autoComplete="off" spellCheck={false}
                  className="flex-1 px-3 py-2 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all" />
                <button type="button" onClick={addCustom} disabled={!customInput.trim()}
                  className="px-4 py-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-lg text-label-md font-semibold hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors disabled:opacity-40">
                  Agregar
                </button>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface)] shrink-0">
              <button type="button" onClick={() => setPanelOpen(false)}
                className="w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold py-2.5 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors">
                Confirmar ({specialties.length} seleccionada{specialties.length !== 1 ? "s" : ""})
              </button>
            </div>
          </aside>
        </>
      )}

      <main className="flex-1 ml-64 flex flex-col h-full bg-[var(--color-background)] overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-y-auto pt-16" style={{ scrollbarWidth: "thin" }}>
          <div className="max-w-xl mx-auto px-6 py-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/colaboradores" className="p-2 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] rounded-full transition-colors">
                  <ArrowLeft size={20} strokeWidth={1.5} />
                </Link>
                <h1 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Nuevo Colaborador</h1>
              </div>
              <button onClick={handleSave} disabled={createCollaborator.isPending}
                className="flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold uppercase tracking-wider px-4 py-2.5 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors disabled:opacity-60">
                <Save size={14} strokeWidth={2} />
                {createCollaborator.isPending ? "Guardando..." : "Guardar"}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-[var(--color-error-container)]/30 border border-[var(--color-error-container)] rounded-lg px-4 py-3 text-body-md text-[var(--color-error)]">
                <AlertCircle size={16} strokeWidth={1.5} className="shrink-0" />
                {error}
              </div>
            )}

            <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5 space-y-4">
              <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Datos del Colaborador</h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Nombre *</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)]" strokeWidth={1.5} />
                    <input value={firstName} onChange={e => setFirstName(e.target.value)}
                      autoComplete="off" autoCorrect="off" spellCheck={false}
                      className={`${inputClass} pl-9`} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Apellido *</label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)}
                    autoComplete="off" autoCorrect="off" spellCheck={false}
                    className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Documento de identidad</label>
                <div className="flex gap-2">
                  <div className="flex rounded-lg border border-[var(--color-outline-variant)] overflow-hidden shrink-0">
                    {(["DNI", "CE"] as const).map((type) => (
                      <button key={type} type="button" onClick={() => { setDocumentType(type); setDocumentNumber(""); }}
                        className={`px-3 py-2.5 text-label-md font-semibold transition-colors ${type !== "DNI" ? "border-l border-[var(--color-outline-variant)]" : ""} ${documentType === type ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]" : "bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)]"}`}>
                        {type}
                      </button>
                    ))}
                  </div>
                  <input value={documentNumber}
                    onChange={e => setDocumentNumber(e.target.value.replace(/\D/g, "").slice(0, docMaxLength))}
                    autoComplete="off" spellCheck={false} inputMode="numeric"
                    className={inputClass} />
                </div>
                <p className="text-[11px] text-[var(--color-on-surface-variant)] mt-1">
                  {documentType === "DNI" ? "8 dígitos" : "Carné de extranjería — hasta 12 dígitos"}
                </p>
              </div>

              <div>
                <label className={labelClass}>Teléfono</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)]" strokeWidth={1.5} />
                  <input value={phone} onChange={e => setPhone(e.target.value)}
                    inputMode="tel" autoComplete="off" spellCheck={false}
                    className={`${inputClass} pl-9`} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Rol / Cargo *</label>
                <RoleSelector value={role} onChange={setRole} />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={labelClass}>Estado</label>
                  <button type="button" onClick={() => setIsActive(v => !v)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all ${isActive ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-[var(--color-surface-container-high)] border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)]"}`}>
                    {isActive ? <ToggleRight size={20} strokeWidth={1.5} className="text-emerald-500" /> : <ToggleLeft size={20} strokeWidth={1.5} />}
                    <span className="text-label-md font-semibold">{isActive ? "Activo" : "Inactivo"}</span>
                  </button>
                </div>
                <div className="flex-1">
                  <label className={labelClass}>Realiza servicios</label>
                  <button type="button" onClick={() => setPerformsServices(v => !v)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all ${performsServices ? "bg-[var(--color-primary-container)]/20 border-[var(--color-primary)]/30 text-[var(--color-primary)]" : "bg-[var(--color-surface-container-high)] border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)]"}`}>
                    {performsServices ? <ToggleRight size={20} strokeWidth={1.5} className="text-[var(--color-primary)]" /> : <ToggleLeft size={20} strokeWidth={1.5} />}
                    <span className="text-label-md font-semibold">{performsServices ? "Sí" : "No"}</span>
                  </button>
                  <p className="text-[10px] text-[var(--color-on-surface-variant)] mt-1">Aparece en agenda y citas</p>
                </div>
              </div>
            </section>

            <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Especialidades</h2>
                <button type="button" onClick={() => setPanelOpen(true)}
                  className="flex items-center gap-1.5 text-[var(--color-primary)] text-label-md font-semibold hover:underline">
                  <Tag size={14} strokeWidth={1.5} />
                  Gestionar
                  <ChevronRight size={14} strokeWidth={2} />
                </button>
              </div>

              {specialties.length === 0 ? (
                <button type="button" onClick={() => setPanelOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-6 border-2 border-dashed border-[var(--color-outline-variant)] rounded-lg text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors">
                  <Tag size={18} strokeWidth={1.5} />
                  <span className="text-body-md">Toca para agregar especialidades</span>
                </button>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {specialties.map(s => (
                    <span key={s} className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[var(--color-primary-container)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                      {s}
                      <button type="button" onClick={() => toggleSpecialty(s)} className="ml-0.5 hover:text-[var(--color-error)] transition-colors">
                        <X size={11} strokeWidth={2.5} />
                      </button>
                    </span>
                  ))}
                  <button type="button" onClick={() => setPanelOpen(true)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-dashed border-[var(--color-primary)]/40 text-[var(--color-primary)] hover:bg-[var(--color-primary-container)]/10 transition-colors">
                    + Agregar más
                  </button>
                </div>
              )}
            </section>

            <button onClick={handleSave} disabled={createCollaborator.isPending}
              className="w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-headline-sm font-semibold py-4 rounded-xl hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors shadow-md disabled:opacity-60 active:scale-[0.98] mb-4">
              {createCollaborator.isPending ? "Guardando..." : "Guardar Colaborador"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
