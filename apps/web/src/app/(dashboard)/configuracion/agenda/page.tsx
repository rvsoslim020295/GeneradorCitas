"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, CalendarCheck, CheckCircle, AlertCircle } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const DAYS = [
  { id: "Mon", label: "Lun" },
  { id: "Tue", label: "Mar" },
  { id: "Wed", label: "Mié" },
  { id: "Thu", label: "Jue" },
  { id: "Fri", label: "Vie" },
  { id: "Sat", label: "Sáb" },
  { id: "Sun", label: "Dom" },
];

export default function AgendaConfigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [cancellationHours, setCancellationHours] = useState(24);
  const [operatingDays, setOperatingDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);

  useEffect(() => {
    const token = localStorage.getItem("gm_token");
    if (!token) { router.push("/login"); return; }

    fetch(`${API_URL}/settings`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(({ business }: { business: { cancellationHours: number; operatingDays: string[] } }) => {
        setCancellationHours(business.cancellationHours);
        setOperatingDays(business.operatingDays);
      })
      .catch(() => router.push("/configuracion"))
      .finally(() => setLoading(false));
  }, [router]);

  function toggleDay(day: string) {
    setOperatingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSave() {
    const token = localStorage.getItem("gm_token");
    if (!token) return;
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch(`${API_URL}/settings/agenda`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cancellationHours, operatingDays }),
      });
      if (!res.ok) throw new Error();
      setFeedback({ type: "success", msg: "Configuración guardada correctamente" });
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback({ type: "error", msg: "Error al guardar. Intenta de nuevo." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <>
      <Sidebar activePath="/configuracion" />
      <main className="flex-1 ml-64 flex items-center justify-center bg-[var(--color-background)]">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </main>
    </>
  );

  return (
    <>
      <Sidebar activePath="/configuracion" />
      <main className="flex-1 ml-64 flex flex-col h-full bg-[var(--color-background)] overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-y-auto pt-16" style={{ scrollbarWidth: "thin" }}>
          <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">

            {/* Header */}
            <div className="flex items-center gap-3">
              <Link href="/configuracion" className="p-2 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] rounded-full transition-colors">
                <ArrowLeft size={20} strokeWidth={1.5} />
              </Link>
              <div>
                <h1 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Agenda y Políticas</h1>
                <p className="text-body-md text-[var(--color-on-surface-variant)]">Configura cómo funciona tu calendario.</p>
              </div>
            </div>

            {feedback && (
              <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-body-md border ${feedback.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-[var(--color-error-container)]/30 border-[var(--color-error-container)] text-[var(--color-error)]"}`}>
                {feedback.type === "success" ? <CheckCircle size={16} strokeWidth={1.5} /> : <AlertCircle size={16} strokeWidth={1.5} />}
                {feedback.msg}
              </div>
            )}

            {/* Cancellation Policy */}
            <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldAlert size={20} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Política de Cancelación</h2>
              </div>
              <p className="text-body-md text-[var(--color-on-surface-variant)]">
                Horas mínimas que requiere un cliente para cancelar o reagendar.
              </p>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--color-primary)] uppercase tracking-wider mb-1">
                  Horas
                </label>
                <input type="number" min={0} value={cancellationHours}
                  onChange={(e) => setCancellationHours(Number(e.target.value))}
                  className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-primary)]/40 rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all" />
              </div>
            </section>

            {/* Operating Days */}
            <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <CalendarCheck size={20} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Días de Operación</h2>
              </div>
              <p className="text-body-md text-[var(--color-on-surface-variant)]">
                Selecciona los días en que tu salón acepta citas.
              </p>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(({ id, label }) => {
                  const active = operatingDays.includes(id);
                  return (
                    <button key={id} onClick={() => toggleDay(id)}
                      className={`px-4 py-2 rounded-full text-body-md font-semibold transition-all ${
                        active
                          ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm"
                          : "bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)]/50"
                      }`}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </section>

            <button onClick={handleSave} disabled={saving}
              className="w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-headline-sm font-semibold py-4 rounded-xl hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors shadow-md disabled:opacity-60 active:scale-[0.98] mb-4">
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
