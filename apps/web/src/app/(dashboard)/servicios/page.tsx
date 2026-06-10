"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus, Scissors, Sparkles, AlertCircle } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { ServiceCard } from "./_components/service-card";
import { useServices } from "@/lib/api/hooks";
import { useDebounce } from "@/lib/hooks/use-debounce";

const categoryMeta: Record<string, { icon: typeof Scissors; color: string }> = {
  "Peluquería": { icon: Scissors, color: "text-[var(--color-secondary)]" },
  "Estética": { icon: Sparkles, color: "text-[var(--color-tertiary)]" },
  "Barbería": { icon: Scissors, color: "text-[var(--color-primary)]" },
};

export default function ServiciosPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, error } = useServices(debouncedSearch || undefined);
  const grouped = data?.grouped ?? {};
  const total = data?.services.length ?? 0;
  const categories = Object.keys(grouped);

  return (
    <>
      <Sidebar activePath="/servicios" />

      <main className="flex-1 md:ml-64 flex flex-col h-full bg-[var(--color-background)] relative overflow-hidden">
        <TopBar hideSearch />

        <div className="flex flex-col flex-1 overflow-hidden pt-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-5 border-b border-[var(--color-outline-variant)] bg-[var(--color-background)]">
            <div>
              <h1 className="text-headline-md font-semibold text-[var(--color-on-surface)]">Servicios</h1>
              <p className="text-body-md text-[var(--color-on-surface-variant)]">
                Gestiona el catálogo de tu negocio
              </p>
            </div>
            <div className="relative w-full md:w-80 group">
              <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)] group-focus-within:text-[var(--color-primary)] transition-colors" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar servicio..."
                className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg pl-9 pr-4 py-2 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all shadow-sm placeholder:text-[var(--color-outline)]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8" style={{ scrollbarWidth: "thin" }}>
            {error && (
              <div className="flex items-center gap-2 text-[var(--color-error)] bg-[var(--color-error-container)]/30 border border-[var(--color-error-container)] rounded-lg px-4 py-3 text-body-md">
                <AlertCircle size={16} strokeWidth={1.5} />
                No se pudo conectar con el servidor.
              </div>
            )}

            {isLoading && (
              <div className="space-y-6">
                {[1, 2].map((s) => (
                  <div key={s}>
                    <div className="h-7 w-32 bg-[var(--color-surface-container)] rounded mb-3 animate-pulse" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3].map((c) => (
                        <div key={c} className="h-28 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] animate-pulse" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && !error && total === 0 && (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-[var(--color-on-surface-variant)]">
                <Scissors size={40} strokeWidth={1} />
                <p className="text-body-lg font-semibold">
                  {search ? `Sin resultados para "${search}"` : "Aún no hay servicios registrados"}
                </p>
              </div>
            )}

            {!isLoading && !error && categories.map((category) => {
              const meta = categoryMeta[category] ?? categoryMeta["Peluquería"];
              const Icon = meta.icon;
              return (
                <section key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={20} strokeWidth={1.5} className={meta.color} />
                    <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">
                      {category}
                    </h2>
                    <span className="text-label-md text-[var(--color-on-surface-variant)]">
                      ({grouped[category].length})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {grouped[category].map((service) => (
                      <ServiceCard key={service.id} service={service} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <Link
          href="/servicios/nuevo"
          className="fixed bottom-8 right-8 w-14 h-14 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-xl shadow-lg flex items-center justify-center hover:bg-[var(--color-on-primary-fixed-variant)] hover:-translate-y-1 transition-all z-50"
          aria-label="Nuevo Servicio"
        >
          <Plus size={24} strokeWidth={2} />
        </Link>
      </main>
    </>
  );
}
