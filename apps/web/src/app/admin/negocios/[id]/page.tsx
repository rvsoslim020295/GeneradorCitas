"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Building2, Users, Calendar, Scissors, ShieldOff, ShieldCheck, Save } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const PLAN_OPTIONS = [
  { value: "TRIAL", label: "Trial (7 días gratis)" },
  { value: "BASIC", label: "Básico" },
  { value: "PRO", label: "Pro" },
  { value: "ENTERPRISE", label: "Enterprise" },
];

type BusinessDetail = {
  id: string;
  name: string;
  type: string;
  ruc: string | null;
  phone: string | null;
  plan: string;
  planStatus: string;
  planExpiresAt: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  users: { id: string; name: string; email: string; role: string }[];
  _count: { appointments: number; clients: number; collaborators: number; services: number };
};

export default function AdminNegocioDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [plan, setPlan] = useState("TRIAL");
  const [expiresAt, setExpiresAt] = useState("");

  const fetchBusiness = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/businesses/${id}`, { credentials: "include" });
      if (res.status === 401) { router.push("/admin/login"); return; }
      const data = await res.json();
      setBusiness(data);
      setPlan(data.plan);
      const date = data.planExpiresAt ?? data.trialEndsAt;
      setExpiresAt(date ? new Date(date).toISOString().split("T")[0] : "");
    } catch {
      router.push("/admin/dashboard");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchBusiness(); }, [fetchBusiness]);

  function showMsg(type: "success" | "error", msg: string) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  }

  async function handleSavePlan() {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/businesses/${id}/plan`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          planStatus: "ACTIVE",
          planExpiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      });
      if (!res.ok) throw new Error();
      showMsg("success", "Plan actualizado correctamente.");
      fetchBusiness();
    } catch {
      showMsg("error", "Error al actualizar el plan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleSuspend() {
    if (!business) return;
    const suspending = business.planStatus !== "SUSPENDED";
    const confirmMsg = suspending
      ? `¿Suspender el acceso de "${business.name}"? No podrán iniciar sesión.`
      : `¿Reactivar el acceso de "${business.name}"?`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`${API_URL}/admin/businesses/${id}/suspend`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspend: suspending }),
      });
      if (!res.ok) throw new Error();
      showMsg("success", suspending ? "Cuenta suspendida." : "Cuenta reactivada.");
      fetchBusiness();
    } catch {
      showMsg("error", "Error al cambiar el estado.");
    }
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--color-surface-container-low)]">
      <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
    </main>
  );

  if (!business) return null;

  const isSuspended = business.planStatus === "SUSPENDED";

  return (
    <main className="min-h-screen bg-[var(--color-surface-container-low)]">
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-outline-variant)] px-6 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/admin/dashboard")} className="p-2 rounded-full hover:bg-[var(--color-surface-container-high)] transition-colors text-[var(--color-on-surface-variant)]">
          <ArrowLeft size={20} strokeWidth={1.5} />
        </button>
        <h1 className="font-headline-sm font-semibold text-[var(--color-on-surface)]">{business.name || "Sin nombre"}</h1>
        <span className="text-body-md text-[var(--color-on-surface-variant)]">· {business.type || "—"}</span>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {feedback && (
          <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-body-md border ${
            feedback.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-[var(--color-error-container)]/30 border-[var(--color-error-container)] text-[var(--color-error)]"
          }`}>
            {feedback.msg}
          </div>
        )}

        {/* Stats rápidas */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Citas", value: business._count.appointments, icon: Calendar },
            { label: "Clientes", value: business._count.clients, icon: Users },
            { label: "Colaboradores", value: business._count.collaborators, icon: Users },
            { label: "Servicios", value: business._count.services, icon: Scissors },
          ].map((s) => (
            <div key={s.label} className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-4 text-center">
              <p className="font-headline-sm text-headline-sm text-[var(--color-on-surface)]">{s.value}</p>
              <p className="text-[11px] text-[var(--color-on-surface-variant)] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Info del dueño */}
        <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5 space-y-3">
          <h2 className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider flex items-center gap-2">
            <Building2 size={14} strokeWidth={2} />
            Información del negocio
          </h2>
          <div className="space-y-1.5 text-body-md">
            <p><span className="text-[var(--color-on-surface-variant)]">RUC:</span> <span className="text-[var(--color-on-surface)]">{business.ruc ?? "—"}</span></p>
            <p><span className="text-[var(--color-on-surface-variant)]">Teléfono:</span> <span className="text-[var(--color-on-surface)]">{business.phone ?? "—"}</span></p>
            <p><span className="text-[var(--color-on-surface-variant)]">Registrado:</span> <span className="text-[var(--color-on-surface)]">{new Date(business.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}</span></p>
          </div>
          <div className="pt-2 border-t border-[var(--color-outline-variant)]">
            <p className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-2">Usuarios</p>
            {business.users.map((u) => (
              <div key={u.id} className="flex items-center justify-between text-body-md">
                <span className="text-[var(--color-on-surface)]">{u.name}</span>
                <span className="text-[var(--color-on-surface-variant)]">{u.email}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Gestión de plan */}
        <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5 space-y-4">
          <h2 className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Gestión de plan</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Plan</label>
              <select
                value={plan} onChange={(e) => setPlan(e.target.value)}
                className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
              >
                {PLAN_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Vence el</label>
              <input
                type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
              />
            </div>
          </div>

          <button onClick={handleSavePlan} disabled={saving}
            className="flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold px-4 py-2.5 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors disabled:opacity-60">
            <Save size={15} strokeWidth={1.5} />
            {saving ? "Guardando..." : "Guardar plan"}
          </button>
        </section>

        {/* Suspender / Reactivar */}
        <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5">
          <h2 className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-3">Acceso a la plataforma</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-md font-semibold text-[var(--color-on-surface)]">
                {isSuspended ? "Cuenta suspendida" : "Cuenta activa"}
              </p>
              <p className="text-body-md text-[var(--color-on-surface-variant)] text-[12px]">
                {isSuspended ? "El negocio no puede iniciar sesión." : "El negocio tiene acceso normal."}
              </p>
            </div>
            <button onClick={handleToggleSuspend}
              className={`flex items-center gap-2 text-label-md font-semibold px-4 py-2.5 rounded-lg border transition-colors ${
                isSuspended
                  ? "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                  : "text-[var(--color-error)] border-[var(--color-error)]/30 hover:bg-[var(--color-error-container)]/20"
              }`}>
              {isSuspended ? <ShieldCheck size={15} strokeWidth={1.5} /> : <ShieldOff size={15} strokeWidth={1.5} />}
              {isSuspended ? "Reactivar" : "Suspender"}
            </button>
          </div>
        </section>

      </div>
    </main>
  );
}
