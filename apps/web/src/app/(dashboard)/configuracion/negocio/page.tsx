"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, CheckCircle, AlertCircle, ChevronDown } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const CATEGORIES = ["Peluquería / Salón de Belleza", "Barbería", "Spa / Centro de Estética", "Nail Bar", "Otro"];

type Business = {
  name: string;
  type: string;
  phone: string | null;
  address: string | null;
};

export default function NegocioConfigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [customType, setCustomType] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("gm_token");
    if (!token) { router.push("/login"); return; }

    fetch(`${API_URL}/settings`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(({ business }: { business: Business }) => {
        setName(business.name);
        const isKnown = CATEGORIES.slice(0, -1).includes(business.type);
        if (isKnown) {
          setType(business.type);
        } else {
          setType("Otro");
          setCustomType(business.type ?? "");
        }
        setPhone(business.phone ?? "");
        setAddress(business.address ?? "");
      })
      .catch(() => router.push("/configuracion"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSave() {
    const token = localStorage.getItem("gm_token");
    if (!token) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_URL}/settings/business`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name,
          type: type === "Otro" ? (customType.trim() || "Otro") : type,
          phone: phone || undefined,
          address: address || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      setFeedback({ type: "success", msg: "Cambios guardados correctamente" });
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback({ type: "error", msg: "Error al guardar. Intenta de nuevo." });
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all";
  const labelClass = "block text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1";

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
          <div className="max-w-xl mx-auto px-6 py-6 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/configuracion" className="p-2 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] rounded-full transition-colors">
                  <ArrowLeft size={20} strokeWidth={1.5} />
                </Link>
                <h1 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Datos del Negocio</h1>
              </div>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold uppercase tracking-wider px-4 py-2.5 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors disabled:opacity-60">
                <Save size={14} strokeWidth={2} />
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>

            {feedback && (
              <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-body-md border ${feedback.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-[var(--color-error-container)]/30 border-[var(--color-error-container)] text-[var(--color-error)]"}`}>
                {feedback.type === "success" ? <CheckCircle size={16} strokeWidth={1.5} /> : <AlertCircle size={16} strokeWidth={1.5} />}
                {feedback.msg}
              </div>
            )}

            <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5 space-y-4">
              <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Información del Negocio</h2>

              {/* Nombre */}
              <div>
                <label className={labelClass}>Nombre *</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  autoComplete="off" spellCheck={false}
                  className={inputClass} />
              </div>

              {/* Categoría */}
              <div>
                <label className={labelClass}>Categoría</label>
                <div className="relative">
                  <select value={type} onChange={(e) => { setType(e.target.value); if (e.target.value !== "Otro") setCustomType(""); }}
                    className={`${inputClass} appearance-none pr-8 cursor-pointer`}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={16} strokeWidth={1.5} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)] pointer-events-none" />
                </div>
                {type === "Otro" && (
                  <input value={customType} onChange={(e) => setCustomType(e.target.value)}
                    className={`${inputClass} mt-2`} autoFocus />
                )}
              </div>

              {/* Teléfono */}
              <div>
                <label className={labelClass}>Teléfono</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel" autoComplete="off"
                  className={inputClass} />
              </div>

              {/* Dirección */}
              <div>
                <label className={labelClass}>Dirección</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)}
                  rows={2} className={`${inputClass} resize-none`} />
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
