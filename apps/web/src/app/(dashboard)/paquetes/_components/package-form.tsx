"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { useServices, useCreatePackage, useUpdatePackage, usePackage } from "@/lib/api/hooks";
import { ArrowLeft, Check, Clock, Banknote, AlertCircle, Package } from "lucide-react";

type Props = { packageId?: string };

export function PackageForm({ packageId }: Props) {
  const router = useRouter();
  const isEdit = !!packageId;

  const { data: servicesData } = useServices();
  const { data: existing } = usePackage(packageId ?? "");
  const createPackage = useCreatePackage();
  const updatePackage = useUpdatePackage(packageId ?? "");

  const services = (servicesData?.services ?? []).filter((s) => s.isActive !== false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setDescription(existing.description ?? "");
      setPrice(existing.price.toString());
      setSelectedIds(existing.services.map((ps) => ps.serviceId));
    }
  }, [existing]);

  const selectedServices = services.filter((s) => selectedIds.includes(s.id));
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMin, 0);
  const totalOriginal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const packagePrice = parseFloat(price) || 0;
  const savings = totalOriginal - packagePrice;

  function toggleService(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    setError("");
    if (!name.trim()) { setError("El nombre es obligatorio."); return; }
    if (selectedIds.length < 2) { setError("Selecciona al menos 2 servicios."); return; }
    if (!price || packagePrice <= 0) { setError("El precio debe ser mayor a 0."); return; }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        price: packagePrice,
        serviceIds: selectedIds,
      };

      if (isEdit) {
        await updatePackage.mutateAsync(payload);
      } else {
        await createPackage.mutateAsync(payload);
      }
      router.push("/paquetes");
    } catch (err) {
      try {
        const body = JSON.parse((err as Error).message);
        setError(body.error ?? "Error al guardar el paquete.");
      } catch {
        setError("Error al guardar el paquete.");
      }
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all";
  const labelClass = "block text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5";

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar activePath="/paquetes" />
      <div className="ml-64 flex flex-1 flex-col overflow-hidden">
        <TopBar hideSearch />
        <main className="flex-1 overflow-y-auto pt-16">

          {/* Header */}
          <div className="flex items-center gap-3 px-8 py-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface)]">
            <button onClick={() => router.push("/paquetes")} className="p-2 rounded-full hover:bg-[var(--color-surface-container-high)] transition-colors text-[var(--color-on-surface-variant)]">
              <ArrowLeft size={20} strokeWidth={1.5} />
            </button>
            <div>
              <h1 className="font-headline-sm font-semibold text-[var(--color-on-surface)]">
                {isEdit ? "Editar paquete" : "Nuevo paquete"}
              </h1>
              <p className="text-[12px] text-[var(--color-on-surface-variant)]">
                {isEdit ? "Modifica los datos del paquete" : "Combina servicios con precio especial"}
              </p>
            </div>
          </div>

          <div className="px-8 py-6 max-w-3xl space-y-6">

            {error && (
              <div className="flex items-center gap-2 bg-[var(--color-error-container)]/30 border border-[var(--color-error-container)] rounded-lg px-4 py-3 text-body-md text-[var(--color-error)]">
                <AlertCircle size={16} strokeWidth={1.5} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Datos básicos */}
            <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5 space-y-4">
              <h2 className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Información</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Nombre del paquete</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Paquete Novia, Combo Verano..." className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Descripción <span className="normal-case font-normal">(opcional)</span></label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Describe brevemente qué incluye este paquete..." className={inputClass + " resize-none"} />
                </div>
                <div>
                  <label className={labelClass}>Precio del paquete (S/)</label>
                  <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="0" step="0.50" placeholder="0.00" className={inputClass} />
                  {totalOriginal > 0 && packagePrice > 0 && (
                    <p className={`text-[12px] mt-1 ${savings >= 0 ? "text-emerald-600" : "text-[var(--color-error)]"}`}>
                      {savings >= 0
                        ? `✓ El cliente ahorra S/${savings.toFixed(2)} vs precio individual`
                        : `⚠ El paquete es más caro que los servicios individuales (S/${totalOriginal.toFixed(2)})`
                      }
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Selección de servicios */}
            <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">
                  Servicios incluidos
                </h2>
                <span className="text-[12px] text-[var(--color-on-surface-variant)]">
                  {selectedIds.length} seleccionado{selectedIds.length !== 1 ? "s" : ""}
                </span>
              </div>

              {services.length === 0 ? (
                <p className="text-body-md text-[var(--color-on-surface-variant)] py-4 text-center">
                  No hay servicios activos. Crea servicios primero.
                </p>
              ) : (
                <div className="space-y-2">
                  {services.map((s) => {
                    const selected = selectedIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleService(s.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                          selected
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                            : "border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-low)]"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          selected ? "bg-[var(--color-primary)] border-[var(--color-primary)]" : "border-[var(--color-outline-variant)]"
                        }`}>
                          {selected && <Check size={11} strokeWidth={3} className="text-[var(--color-on-primary)]" />}
                        </div>
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-body-md font-medium text-[var(--color-on-surface)]">{s.name}</p>
                          <p className="text-[11px] text-[var(--color-on-surface-variant)]">{s.category}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-[12px] text-[var(--color-on-surface-variant)]">
                          <span className="flex items-center gap-1"><Clock size={11} strokeWidth={1.5} />{s.durationMin} min</span>
                          <span className="flex items-center gap-1"><Banknote size={11} strokeWidth={1.5} />S/{s.price}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Resumen */}
            {selectedIds.length >= 2 && (
              <section className="bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-xl p-4 flex items-center gap-4">
                <Package size={22} className="text-[var(--color-primary)] shrink-0" strokeWidth={1.5} />
                <div className="flex-1 text-body-md">
                  <span className="text-[var(--color-on-surface)] font-medium">{selectedIds.length} servicios</span>
                  <span className="text-[var(--color-on-surface-variant)]"> · {totalDuration} min en total · </span>
                  <span className="text-[var(--color-on-surface-variant)]">precio individual S/{totalOriginal.toFixed(0)}</span>
                </div>
              </section>
            )}

            {/* Botón guardar */}
            <div className="flex gap-3">
              <button onClick={() => router.push("/paquetes")} className="px-5 py-2.5 rounded-lg border border-[var(--color-outline-variant)] text-label-md font-semibold text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors disabled:opacity-60">
                {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear paquete"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
