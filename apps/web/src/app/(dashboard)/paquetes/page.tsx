"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { usePackages, useDeletePackage, type Package } from "@/lib/api/hooks";
import { Plus, Package as PackageIcon, Clock, Banknote, Pencil, Trash2, ChevronRight } from "lucide-react";

function totalDuration(pkg: Package) {
  return pkg.services.reduce((sum, ps) => sum + ps.service.durationMin, 0);
}

function totalOriginalPrice(pkg: Package) {
  return pkg.services.reduce((sum, ps) => sum + ps.service.price, 0);
}

export default function PaquetesPage() {
  const router = useRouter();
  const { data: packages = [], isLoading } = usePackages();
  const deletePackage = useDeletePackage();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    await deletePackage.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar activePath="/paquetes" />
      <div className="md:ml-64 flex flex-1 flex-col overflow-hidden">
        <TopBar hideSearch />
        <main className="flex-1 overflow-y-auto pt-16">

          {/* Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface)]">
            <div>
              <h1 className="font-headline-sm font-semibold text-[var(--color-on-surface)]">Paquetes</h1>
              <p className="text-[12px] text-[var(--color-on-surface-variant)] mt-0.5">
                Combos de servicios con precio especial
              </p>
            </div>
            <button
              onClick={() => router.push("/paquetes/nuevo")}
              className="flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold px-4 py-2.5 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors"
            >
              <Plus size={16} strokeWidth={2} />
              Nuevo paquete
            </button>
          </div>

          <div className="px-8 py-6 max-w-4xl">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : packages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary-container)]/20 flex items-center justify-center">
                  <PackageIcon size={28} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-headline-sm text-[var(--color-on-surface)]">Sin paquetes todavía</p>
                  <p className="text-body-md text-[var(--color-on-surface-variant)] mt-1">
                    Crea tu primer paquete combinando servicios con precio especial
                  </p>
                </div>
                <button
                  onClick={() => router.push("/paquetes/nuevo")}
                  className="flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold px-5 py-2.5 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors"
                >
                  <Plus size={16} strokeWidth={2} />
                  Crear paquete
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {packages.map((pkg) => {
                  const original = totalOriginalPrice(pkg);
                  const savings = original - pkg.price;
                  const duration = totalDuration(pkg);
                  return (
                    <div
                      key={pkg.id}
                      className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5 flex items-start gap-4 hover:shadow-sm transition-shadow"
                    >
                      {/* Icono */}
                      <div className="w-11 h-11 rounded-xl bg-[var(--color-primary-container)]/20 flex items-center justify-center shrink-0 mt-0.5">
                        <PackageIcon size={20} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-body-md text-[var(--color-on-surface)]">{pkg.name}</span>
                          {!pkg.isActive && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)] border border-[var(--color-outline-variant)]">
                              Inactivo
                            </span>
                          )}
                          {savings > 0 && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                              Ahorra S/{savings.toFixed(0)}
                            </span>
                          )}
                        </div>

                        {pkg.description && (
                          <p className="text-[12px] text-[var(--color-on-surface-variant)] mt-0.5">{pkg.description}</p>
                        )}

                        {/* Servicios incluidos */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {pkg.services.map((ps) => (
                            <span
                              key={ps.id}
                              className="text-[11px] px-2 py-0.5 rounded-full border"
                              style={{ borderColor: ps.service.color + "50", color: ps.service.color, backgroundColor: ps.service.color + "15" }}
                            >
                              {ps.service.name}
                            </span>
                          ))}
                        </div>

                        {/* Métricas */}
                        <div className="flex items-center gap-4 mt-2.5">
                          <div className="flex items-center gap-1 text-[12px] text-[var(--color-on-surface-variant)]">
                            <Clock size={12} strokeWidth={1.5} />
                            {duration} min
                          </div>
                          <div className="flex items-center gap-1 text-[12px] text-[var(--color-on-surface-variant)]">
                            <Banknote size={12} strokeWidth={1.5} />
                            <span className="line-through">S/{original.toFixed(0)}</span>
                            <span className="text-[var(--color-primary)] font-semibold ml-1">S/{pkg.price.toFixed(0)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => router.push(`/paquetes/${pkg.id}`)}
                          className="p-2 rounded-lg text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-primary)] transition-colors"
                        >
                          <Pencil size={16} strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: pkg.id, name: pkg.name })}
                          className="p-2 rounded-lg text-[var(--color-on-surface-variant)] hover:bg-[var(--color-error-container)]/20 hover:text-[var(--color-error)] transition-colors"
                        >
                          <Trash2 size={16} strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => router.push(`/paquetes/${pkg.id}`)}
                          className="p-2 rounded-lg text-[var(--color-outline)] hover:bg-[var(--color-surface-container-high)] transition-colors"
                        >
                          <ChevronRight size={16} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-error-container)]/30 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-[var(--color-error)]" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Eliminar paquete</h3>
                <p className="text-body-md text-[var(--color-on-surface-variant)] mt-1">¿Seguro que deseas eliminar <strong>&ldquo;{deleteTarget.name}&rdquo;</strong>? Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-lg border border-[var(--color-outline-variant)] text-body-md font-semibold text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)] transition-colors">Cancelar</button>
              <button onClick={handleDelete} disabled={deletePackage.isPending}
                className="flex-1 py-2.5 rounded-lg bg-[var(--color-error)] text-white text-body-md font-semibold hover:bg-[var(--color-error)]/90 transition-colors disabled:opacity-60">
                {deletePackage.isPending ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
