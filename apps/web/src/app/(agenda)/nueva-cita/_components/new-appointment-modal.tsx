"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarCheck, X, Search, UserPlus, ChevronDown,
  Clock, Banknote, CalendarDays, CheckCircle, AlertCircle, Loader2,
} from "lucide-react";
import { OriginSelector } from "./origin-selector";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Client = { id: string; name: string; lastName: string | null; phone: string | null };

function clientFullName(c: Client) {
  return [c.name, c.lastName].filter(Boolean).join(" ");
}
type Service = { id: string; name: string; durationMin: number; bufferMinutes: number; price: number };
type Collaborator = { id: string; name: string };

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export function NewAppointmentModal({ preselectedClientId }: { preselectedClientId?: string }) {
  const router = useRouter();

  // Data from API
  const [services, setServices] = useState<Service[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);

  // Form state
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [serviceId, setServiceId] = useState("");
  const [collaboratorId, setCollaboratorId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [origin, setOrigin] = useState("walk-in");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [conflictId, setConflictId] = useState<string | null>(null);

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsReady, setSlotsReady] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  const selectedService = services.find(s => s.id === serviceId) ?? null;

  useEffect(() => {
    const token = localStorage.getItem("gm_token");
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API_URL}/services`, { headers: h }).then(r => r.json()),
      fetch(`${API_URL}/collaborators`, { headers: h }).then(r => r.json()),
      fetch(`${API_URL}/clients`, { headers: h }).then(r => r.json()),
    ]).then(([svcs, cols, cls]) => {
      setServices(Array.isArray(svcs) ? svcs : (svcs?.services ?? []));
      const allCols = Array.isArray(cols) ? cols : [];
      setCollaborators(allCols.filter((c: Collaborator & { isActive?: boolean }) => c.isActive !== false));
      const allClients: Client[] = Array.isArray(cls) ? cls : [];
      setClients(allClients);
      // Pre-seleccionar cliente si viene de la página de perfil
      if (preselectedClientId) {
        const match = allClients.find(c => c.id === preselectedClientId);
        if (match) setSelectedClient(match);
      }
    });
  }, [preselectedClientId]);

  // Consultar disponibilidad cuando colaborador + servicio + fecha están listos
  const fetchSlots = useCallback(async (collabId: string, svcId: string, d: string) => {
    const token = localStorage.getItem("gm_token");
    if (!token || !collabId || !svcId || !d) { setAvailableSlots([]); setSlotsReady(false); return; }
    setSlotsLoading(true);
    setSlotsReady(false);
    setTime("");
    try {
      const res = await fetch(
        `${API_URL}/availability/slots?collaboratorId=${collabId}&serviceId=${svcId}&date=${d}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setAvailableSlots(data.slots ?? []);
        setSlotsReady(true);
      } else {
        setAvailableSlots([]);
      }
    } catch {
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (collaboratorId && serviceId && date) {
      fetchSlots(collaboratorId, serviceId, date);
    } else {
      setAvailableSlots([]);
      setSlotsReady(false);
    }
  }, [collaboratorId, serviceId, date, fetchSlots]);

  // Filtrar clientes al escribir
  useEffect(() => {
    if (!clientSearch.trim()) { setFilteredClients([]); return; }
    const q = clientSearch.toLowerCase();
    setFilteredClients(
      clients.filter(c =>
        clientFullName(c).toLowerCase().includes(q) || c.phone?.includes(q)
      ).slice(0, 6)
    );
  }, [clientSearch, clients]);

  // Cerrar dropdown al click fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleSubmit() {
    setError("");
    setConflictId(null);
    if (!selectedClient) { setError("Selecciona un cliente."); return; }
    if (!serviceId) { setError("Selecciona un servicio."); return; }
    if (!time) { setError("Selecciona una hora."); return; }

    const token = localStorage.getItem("gm_token");
    if (!token) return;

    const svc = services.find(s => s.id === serviceId)!;
    const startTime = new Date(`${date}T${time}:00`).toISOString();
    const endDate = new Date(`${date}T${time}:00`);
    endDate.setMinutes(endDate.getMinutes() + svc.durationMin);
    const endTime = endDate.toISOString();

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          clientId: selectedClient.id,
          collaboratorId: collaboratorId || collaborators[0]?.id,
          serviceId,
          startTime,
          endTime,
          price: svc.price,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Error al agendar la cita.");
        if (d.conflictId) setConflictId(d.conflictId);
        return;
      }

      router.push("/agenda");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full pl-9 pr-4 py-2.5 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-md text-body-md text-[var(--color-on-surface)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none transition-all shadow-sm";

  return (
    <div className="bg-[var(--color-surface-container-lowest)] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-full max-w-2xl flex flex-col border border-[var(--color-outline-variant)]/50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-outline-variant)]/30 bg-[var(--color-surface)]/50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <CalendarCheck size={22} className="text-[var(--color-primary)]" strokeWidth={1.5} />
          <h2 className="text-headline-sm font-semibold text-[var(--color-on-background)]">Nueva Cita</h2>
        </div>
        <Link href="/agenda" className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)] transition-colors rounded-full p-1 hover:bg-[var(--color-error-container)]/20">
          <X size={20} strokeWidth={1.5} />
        </Link>
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-12rem)]" style={{ scrollbarWidth: "none" }}>

        {error && (
          <div className="flex items-start gap-2 bg-[var(--color-error-container)]/30 border border-[var(--color-error-container)] rounded-lg px-3 py-2 text-body-md text-[var(--color-error)]">
            <AlertCircle size={15} strokeWidth={1.5} className="shrink-0 mt-0.5" />
            <div>
              <p>{error}</p>
              {conflictId && (
                <Link href={`/citas/${conflictId}`} className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold underline hover:opacity-80">
                  Ver cita en conflicto →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* 1. Cliente */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <label className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Cliente</label>
            <Link href="/clientes/nuevo" className="text-[var(--color-primary)] text-label-md font-semibold hover:underline flex items-center gap-1">
              <UserPlus size={14} strokeWidth={1.5} />
              Nuevo
            </Link>
          </div>

          {selectedClient ? (
            <div className="flex items-center justify-between bg-[var(--color-primary-container)]/20 border border-[var(--color-primary)]/30 rounded-md px-3 py-2">
              <div>
                <p className="text-body-md font-semibold text-[var(--color-on-surface)]">{clientFullName(selectedClient)}</p>
                {selectedClient.phone && <p className="text-[11px] text-[var(--color-on-surface-variant)]">{selectedClient.phone}</p>}
              </div>
              <button type="button" onClick={() => { setSelectedClient(null); setClientSearch(""); }}
                className="text-[var(--color-outline)] hover:text-[var(--color-error)] transition-colors">
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>
          ) : (
            <div className="relative" ref={searchRef}>
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)]" strokeWidth={1.5} />
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => { setClientSearch(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Buscar por nombre o teléfono..."
                className={inputClass}
              />
              {showDropdown && filteredClients.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg shadow-lg overflow-hidden">
                  {filteredClients.map(c => (
                    <button key={c.id} type="button"
                      onClick={() => { setSelectedClient(c); setClientSearch(""); setShowDropdown(false); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-[var(--color-surface-container-low)] transition-colors border-b border-[var(--color-outline-variant)]/30 last:border-0">
                      <p className="text-body-md font-semibold text-[var(--color-on-surface)]">{clientFullName(c)}</p>
                      {c.phone && <p className="text-[11px] text-[var(--color-on-surface-variant)]">{c.phone}</p>}
                    </button>
                  ))}
                </div>
              )}
              {showDropdown && clientSearch.trim() && filteredClients.length === 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg shadow-lg px-4 py-3 text-body-md text-[var(--color-on-surface-variant)]">
                  No se encontró ningún cliente
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2 & 3. Servicio + Colaborador */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Servicio</label>
            <div className="relative">
              <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}
                className="w-full appearance-none pl-3 pr-10 py-2.5 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-md text-body-md text-[var(--color-on-surface)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none transition-all shadow-sm cursor-pointer">
                <option value="" disabled>Selecciona un servicio</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)] pointer-events-none" strokeWidth={1.5} />
            </div>
            {selectedService && (
              <div className="flex items-center gap-2 px-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]">
                  <Clock size={12} strokeWidth={1.5} /> {selectedService.durationMin} min
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--color-primary-container)]/20 text-[var(--color-primary)]">
                  <Banknote size={12} strokeWidth={1.5} /> S/{selectedService.price.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Colaborador</label>
            <div className="relative">
              <select value={collaboratorId} onChange={(e) => setCollaboratorId(e.target.value)}
                className="w-full appearance-none pl-3 pr-10 py-2.5 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-md text-body-md text-[var(--color-on-surface)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none transition-all shadow-sm cursor-pointer">
                <option value="">Cualquiera disponible</option>
                {collaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)] pointer-events-none" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* 4. Fecha + Hora */}
        <div className="space-y-3 bg-[var(--color-surface-container-low)]/50 p-4 rounded-lg border border-[var(--color-outline-variant)]/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Fecha</label>
              <div className="relative">
                <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)]" strokeWidth={1.5} />
                <input
                  type="date"
                  value={date}
                  min={todayISO()}
                  onChange={(e) => { setDate(e.target.value); setTime(""); }}
                  className="w-full pl-9 pr-4 py-2.5 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-md text-body-md text-[var(--color-on-surface)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider flex items-center justify-between">
                Hora
                {slotsReady && (
                  <span className="text-[10px] font-normal text-[var(--color-outline)] normal-case tracking-normal">
                    {availableSlots.length} slots disponibles
                  </span>
                )}
              </label>

              {/* Estado: falta seleccionar colaborador o servicio */}
              {!collaboratorId || !serviceId ? (
                <p className="text-[11px] text-[var(--color-on-surface-variant)] py-1">
                  Selecciona colaborador y servicio para ver disponibilidad
                </p>
              ) : slotsLoading ? (
                <div className="flex items-center gap-2 py-1 text-[var(--color-on-surface-variant)]">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-[11px]">Consultando disponibilidad...</span>
                </div>
              ) : slotsReady && availableSlots.length === 0 ? (
                <p className="text-[11px] text-[var(--color-error)] py-1">
                  Sin disponibilidad para esta fecha. Prueba otro día o colaborador.
                </p>
              ) : slotsReady ? (
                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                  {availableSlots.map((slot) => (
                    <button key={slot} type="button" onClick={() => setTime(slot)}
                      className={`px-3 py-1.5 rounded-md border text-label-md font-semibold transition-colors shadow-sm ${
                        time === slot
                          ? "border-[var(--color-primary)] bg-[var(--color-primary-container)]/10 text-[var(--color-primary)]"
                          : "border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                      }`}>
                      {slot}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* 5 & 6. Notas + Origen */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
          <div className="space-y-2">
            <label className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Notas (Opcional)</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Cliente prefiere un corte clásico..."
              className="w-full px-3 py-2 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-md text-body-md text-[var(--color-on-surface)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none transition-all shadow-sm resize-none placeholder:text-[var(--color-outline-variant)]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Origen</label>
            <OriginSelector />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[var(--color-outline-variant)]/30 bg-[var(--color-surface)]/50 rounded-b-xl flex justify-end gap-3 items-center">
        <Link href="/agenda"
          className="px-5 py-2.5 rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] text-label-md font-semibold hover:bg-[var(--color-surface-container-low)] transition-colors">
          Cancelar
        </Link>
        <button type="button" onClick={handleSubmit} disabled={saving}
          className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold hover:bg-[var(--color-on-primary-fixed-variant)] transition-all shadow-[0_2px_10px_rgb(68,65,196,0.3)] active:scale-[0.98] flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
          <CheckCircle size={16} strokeWidth={1.5} />
          {saving ? "Agendando..." : "Agendar Cita"}
        </button>
      </div>
    </div>
  );
}
