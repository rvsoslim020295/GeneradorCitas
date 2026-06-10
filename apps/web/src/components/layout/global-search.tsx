"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, User, Scissors, CalendarCheck, X, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type ClientResult  = { id: string; name: string; phone: string | null; email: string | null };
type ServiceResult = { id: string; name: string; category: string; price: number };
type ApptResult    = { id: string; startTime: string; client: { name: string }; service: { name: string } };

type Results = {
  clients: ClientResult[];
  services: ServiceResult[];
  appointments: ApptResult[];
};

const EMPTY: Results = { clients: [], services: [], appointments: [] };

function useDebounce(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function GlobalSearch({ placeholder = "Buscar cliente, servicio o cita..." }: { placeholder?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("search") ?? "");
  const [results, setResults] = useState<Results>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults(EMPTY); setLoading(false); return; }
    setLoading(true);
    try {
      const enc = encodeURIComponent(q);
      const [clients, servicesRes, appointments] = await Promise.all([
        fetch(`${API_URL}/clients?search=${enc}`, { credentials: "include" }).then(r => r.ok ? r.json() : []),
        fetch(`${API_URL}/services?search=${enc}`, { credentials: "include" }).then(r => r.ok ? r.json() : []),
        fetch(`${API_URL}/appointments?search=${enc}`, { credentials: "include" }).then(r => r.ok ? r.json() : []),
      ]);
      // /services devuelve { services, grouped } — extraemos el array plano
      const serviceList = Array.isArray(servicesRes) ? servicesRes : (servicesRes?.services ?? []);
      setResults({
        clients: (Array.isArray(clients) ? clients : []).slice(0, 5),
        services: (Array.isArray(serviceList) ? serviceList : []).slice(0, 5),
        appointments: (Array.isArray(appointments) ? appointments : []).slice(0, 5),
      });
      setOpen(true);
    } catch {
      setResults(EMPTY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      search(debouncedQuery);
    } else {
      setResults(EMPTY);
      setOpen(false);
    }
  }, [debouncedQuery, search]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
  }

  function navigate(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  const hasResults = results.clients.length + results.services.length + results.appointments.length > 0;

  return (
    <div ref={wrapRef} className="relative w-full max-w-xs md:w-80 group">
      {/* Input */}
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] group-focus-within:text-[var(--color-primary)] transition-colors pointer-events-none"
      />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => hasResults && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-full pl-9 pr-8 py-2 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-colors placeholder:text-[var(--color-outline-variant)] shadow-sm"
      />
      {/* Clear / Spinner */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {loading
          ? <Loader2 size={14} className="animate-spin text-[var(--color-outline)]" />
          : query
            ? <button onClick={() => { setQuery(""); setResults(EMPTY); setOpen(false); }} className="text-[var(--color-outline)] hover:text-[var(--color-on-surface)] transition-colors">
                <X size={14} />
              </button>
            : null
        }
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl shadow-xl z-50 overflow-hidden">
          {!hasResults ? (
            <p className="px-4 py-5 text-center text-body-md text-[var(--color-on-surface-variant)]">Sin resultados para &ldquo;{query}&rdquo;</p>
          ) : (
            <div className="py-1 max-h-80 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>

              {/* Clientes */}
              {results.clients.length > 0 && (
                <Section label="Clientes">
                  {results.clients.map(c => (
                    <ResultRow key={c.id} icon={<User size={14} />} title={c.name} subtitle={c.phone ?? c.email ?? ""} onClick={() => navigate(`/clientes/${c.id}`)} />
                  ))}
                </Section>
              )}

              {/* Servicios */}
              {results.services.length > 0 && (
                <Section label="Servicios">
                  {results.services.map(s => (
                    <ResultRow key={s.id} icon={<Scissors size={14} />} title={s.name} subtitle={s.category} onClick={() => navigate(`/servicios/${s.id}`)} />
                  ))}
                </Section>
              )}

              {/* Citas */}
              {results.appointments.length > 0 && (
                <Section label="Citas">
                  {results.appointments.map(a => (
                    <ResultRow
                      key={a.id}
                      icon={<CalendarCheck size={14} />}
                      title={a.client.name}
                      subtitle={`${a.service.name} · ${new Date(a.startTime).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}`}
                      onClick={() => navigate(`/citas/${a.id}`)}
                    />
                  ))}
                </Section>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-outline)]">{label}</p>
      {children}
    </div>
  );
}

function ResultRow({ icon, title, subtitle, onClick }: { icon: React.ReactNode; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-[var(--color-surface-container-low)] transition-colors"
    >
      <span className="text-[var(--color-outline)] shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-body-md text-[var(--color-on-surface)] truncate">{title}</p>
        {subtitle && <p className="text-[11px] text-[var(--color-on-surface-variant)] truncate">{subtitle}</p>}
      </div>
    </button>
  );
}
