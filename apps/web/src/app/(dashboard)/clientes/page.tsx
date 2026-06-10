"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, UserPlus, RefreshCw, AlertCircle, Copy, Merge, X, Check } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { ClientCard } from "./_components/client-card";
import { useClients } from "@/lib/api/hooks";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

type Client = { id: string; name: string; lastName: string | null; phone: string | null; totalVisits: number; totalSpent: number };

export default function ClientesPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [mergeGroup, setMergeGroup] = useState<Client[] | null>(null);
  const [keepId, setKeepId] = useState<string>("");
  const qc = useQueryClient();

  const { data: clients = [], isLoading, error } = useClients(debouncedSearch || undefined);

  const merge = useMutation({
    mutationFn: ({ keepId, deleteId }: { keepId: string; deleteId: string }) =>
      apiFetch("/clients/merge", { method: "POST", body: JSON.stringify({ keepId, deleteId }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      setMergeGroup(null);
      setKeepId("");
    },
  });

  function openMerge(name: string) {
    const group = clients.filter(c => `${c.name} ${c.lastName ?? ""}`.trim().toLowerCase() === name);
    setMergeGroup(group);
    setKeepId(group[0]?.id ?? "");
  }

  // Detectar nombres duplicados (misma combinación nombre+apellido, ignorando mayúsculas)
  const duplicateNames = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of clients) {
      const key = `${c.name} ${c.lastName ?? ""}`.trim().toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const dupes = new Set<string>();
    for (const [key, count] of counts) {
      if (count > 1) dupes.add(key);
    }
    return dupes;
  }, [clients]);

  return (
    <>
      <Sidebar activePath="/clientes" />

      <main className="flex-1 md:ml-64 flex flex-col h-full bg-[var(--color-background)] relative overflow-hidden">
        <TopBar hideSearch />

        <div className="flex flex-col flex-1 overflow-hidden pt-16">
          <div className="flex items-center justify-between px-6 py-4 bg-[var(--color-background)] border-b border-[var(--color-outline-variant)]">
            <div className="relative w-96 group">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] group-focus-within:text-[var(--color-primary)] transition-colors"
                strokeWidth={1.5}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o teléfono..."
                className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg pl-9 pr-4 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all shadow-sm placeholder:text-[var(--color-outline-variant)]"
              />
            </div>
            <p className="text-label-md text-[var(--color-on-surface-variant)]">
              {!isLoading && `${clients.length} cliente${clients.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6" style={{ scrollbarWidth: "thin" }}>
            {error && (
              <div className="flex items-center gap-2 text-[var(--color-error)] bg-[var(--color-error-container)]/30 border border-[var(--color-error-container)] rounded-lg px-4 py-3 mb-4 text-body-md">
                <AlertCircle size={16} strokeWidth={1.5} />
                No se pudo conectar con el servidor.
              </div>
            )}

            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] h-[120px] animate-pulse"
                  />
                ))}
              </div>
            )}

            {!isLoading && !error && clients.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-[var(--color-on-surface-variant)]">
                <Search size={40} strokeWidth={1} />
                <p className="text-body-lg font-semibold">
                  {search ? `Sin resultados para "${search}"` : "Aún no hay clientes registrados"}
                </p>
                <p className="text-body-md">
                  {search ? "Intenta con otro nombre o teléfono" : "Agrega tu primer cliente con el botón +"}
                </p>
              </div>
            )}

            {!isLoading && !error && duplicateNames.size > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 mb-2 space-y-2">
                <div className="flex items-center gap-2 text-body-md text-amber-600">
                  <Copy size={16} strokeWidth={1.5} className="shrink-0" />
                  <span className="font-semibold">Posibles duplicados detectados</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.from(duplicateNames).map(name => {
                    const label = name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                    return (
                      <button key={name} onClick={() => openMerge(name)}
                        className="flex items-center gap-1.5 text-label-md font-semibold text-amber-700 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition-colors">
                        <Merge size={13} strokeWidth={2} />
                        Fusionar: {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!isLoading && !error && clients.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clients.map((client) => (
                    <ClientCard key={client.id} client={client} isDuplicate={duplicateNames.has(`${client.name} ${client.lastName ?? ""}`.trim().toLowerCase())} />
                  ))}
                </div>
                <div className="py-6 flex justify-center items-center gap-2 text-[var(--color-on-surface-variant)]">
                  <RefreshCw size={16} strokeWidth={1.5} />
                  <span className="text-label-md">
                    {clients.length} cliente{clients.length !== 1 ? "s" : ""} en total
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <Link href="/clientes/nuevo" className="fixed bottom-8 right-8 w-14 h-14 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-2xl shadow-lg flex items-center justify-center hover:bg-[var(--color-on-primary-fixed-variant)] hover:-translate-y-1 transition-all z-50 group">
          <UserPlus size={22} strokeWidth={1.5} />
          <span className="absolute right-full mr-4 bg-[var(--color-inverse-surface)] text-[var(--color-inverse-on-surface)] text-label-md px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Nuevo Cliente
          </span>
        </Link>
      </main>

      {/* Modal fusionar duplicados */}
      {mergeGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Merge size={18} className="text-amber-600" strokeWidth={1.5} />
                <h3 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Fusionar clientes duplicados</h3>
              </div>
              <button onClick={() => setMergeGroup(null)} className="text-[var(--color-outline)] hover:text-[var(--color-on-surface)] transition-colors">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <p className="text-body-md text-[var(--color-on-surface-variant)]">
              Selecciona el registro que quieres <span className="font-semibold text-[var(--color-on-surface)]">conservar</span>. Las citas del otro se moverán a este y el duplicado será eliminado.
            </p>

            <div className="space-y-2">
              {mergeGroup.map((c) => (
                <button key={c.id} onClick={() => setKeepId(c.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${keepId === c.id ? "border-[var(--color-primary)] bg-[var(--color-primary-container)]/10" : "border-[var(--color-outline-variant)] hover:border-[var(--color-primary)]/40"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-label-md font-bold shrink-0 ${keepId === c.id ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]" : "bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]"}`}>
                    {keepId === c.id ? <Check size={14} strokeWidth={2.5} /> : c.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-md font-semibold text-[var(--color-on-surface)]">{c.name}{c.lastName ? ` ${c.lastName}` : ""}</p>
                    <p className="text-[12px] text-[var(--color-on-surface-variant)]">{c.phone ?? "Sin teléfono"} · {c.totalVisits} visita{c.totalVisits !== 1 ? "s" : ""} · S/{c.totalSpent.toLocaleString("es-PE")}</p>
                  </div>
                  {keepId === c.id && <span className="text-[11px] font-semibold text-[var(--color-primary)] bg-[var(--color-primary-container)]/20 px-2 py-0.5 rounded-full shrink-0">Conservar</span>}
                </button>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[12px] text-amber-700">
              ⚠ El registro no seleccionado será <strong>eliminado permanentemente</strong> junto con sus datos de contacto. Sus citas pasarán al registro conservado.
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setMergeGroup(null)}
                className="flex-1 py-2.5 rounded-lg border border-[var(--color-outline-variant)] text-body-md font-semibold text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)] transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => {
                  const deleteId = mergeGroup.find(c => c.id !== keepId)?.id;
                  if (deleteId) merge.mutate({ keepId, deleteId });
                }}
                disabled={!keepId || merge.isPending}
                className="flex-1 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-body-md font-semibold transition-colors disabled:opacity-60">
                {merge.isPending ? "Fusionando..." : "Fusionar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
