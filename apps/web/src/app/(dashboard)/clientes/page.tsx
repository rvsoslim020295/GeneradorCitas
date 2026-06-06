"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, UserPlus, RefreshCw, AlertCircle } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { ClientCard } from "./_components/client-card";
import { useClients } from "@/lib/api/hooks";
import { useDebounce } from "@/lib/hooks/use-debounce";

export default function ClientesPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data: clients = [], isLoading, error } = useClients(debouncedSearch || undefined);

  return (
    <>
      <Sidebar activePath="/clientes" />

      <main className="flex-1 ml-64 flex flex-col h-full bg-[var(--color-background)] relative overflow-hidden">
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

            {!isLoading && !error && clients.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clients.map((client) => (
                    <ClientCard key={client.id} client={client} />
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
    </>
  );
}
