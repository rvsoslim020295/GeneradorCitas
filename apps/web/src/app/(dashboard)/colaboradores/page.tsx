"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Plus, AlertCircle } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { CollaboratorCard } from "./_components/collaborator-card";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Collaborator = {
  id: string;
  name: string;
  role: string;
  specialties: string[];
  isActive: boolean;
};

export default function ColaboradoresPage() {
  const router = useRouter();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchCollaborators = useCallback(async (query = "") => {
    const token = localStorage.getItem("gm_token");
    if (!token) { router.push("/login"); return; }

    setLoading(true);
    setError("");

    try {
      const url = query
        ? `${API_URL}/collaborators?search=${encodeURIComponent(query)}`
        : `${API_URL}/collaborators`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) { router.push("/login"); return; }
      if (!res.ok) throw new Error();

      setCollaborators(await res.json());
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchCollaborators(); }, [fetchCollaborators]);

  useEffect(() => {
    const t = setTimeout(() => fetchCollaborators(search), 300);
    return () => clearTimeout(t);
  }, [search, fetchCollaborators]);

  const active = collaborators.filter((c) => c.isActive).length;
  const inactive = collaborators.filter((c) => !c.isActive).length;

  return (
    <>
      <Sidebar activePath="/colaboradores" />

      <main className="flex-1 ml-64 flex flex-col h-full bg-[var(--color-background)] relative overflow-hidden">
        <TopBar />

        <div className="flex flex-col flex-1 overflow-hidden pt-16">
          {/* Header con título, stats y botón nuevo */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-outline-variant)] bg-[var(--color-background)]">
            <div>
              <h1 className="text-headline-md font-semibold text-[var(--color-on-surface)]">Equipo</h1>
              {!loading && (
                <p className="text-body-md text-[var(--color-on-surface-variant)] mt-0.5">
                  {active} activo{active !== 1 ? "s" : ""} · {inactive} inactivo{inactive !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <Link href="/colaboradores/nuevo" className="flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold uppercase tracking-wider px-4 py-2.5 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors shadow-sm">
              <Plus size={16} strokeWidth={2} />
              Nuevo
            </Link>
          </div>

          {/* Buscador */}
          <div className="px-6 py-4 bg-[var(--color-background)]">
            <div className="relative w-96 group">
              <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] group-focus-within:text-[var(--color-primary)] transition-colors" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar colaboradores..."
                className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl py-3 pl-9 pr-4 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all shadow-sm placeholder:text-[var(--color-on-surface-variant)]"
              />
            </div>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto px-6 pb-8" style={{ scrollbarWidth: "thin" }}>
            {error && (
              <div className="flex items-center gap-2 text-[var(--color-error)] bg-[var(--color-error-container)]/30 border border-[var(--color-error-container)] rounded-lg px-4 py-3 mb-4 text-body-md">
                <AlertCircle size={16} strokeWidth={1.5} />
                {error}
              </div>
            )}

            {loading && (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] h-28 animate-pulse" />
                ))}
              </div>
            )}

            {!loading && !error && collaborators.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-[var(--color-on-surface-variant)]">
                <p className="text-body-lg font-semibold">
                  {search ? `Sin resultados para "${search}"` : "Aún no hay colaboradores"}
                </p>
              </div>
            )}

            {!loading && !error && collaborators.length > 0 && (
              <div className="flex flex-col gap-3 max-w-2xl">
                {collaborators.map((c) => (
                  <CollaboratorCard key={c.id} collaborator={c} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
