"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Flower2, LogOut, Building2, Clock, CheckCircle, XCircle, AlertTriangle, ChevronRight, RefreshCw, Sun, Moon, Search, X } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const PLAN_LABELS: Record<string, string> = { TRIAL: "Trial", BASIC: "Básico", PRO: "Pro", ENTERPRISE: "Enterprise" };
const PLAN_COLORS: Record<string, string> = {
  TRIAL: "bg-amber-50 text-amber-700 border-amber-200",
  BASIC: "bg-blue-50 text-blue-700 border-blue-200",
  PRO: "bg-[var(--color-primary-container)]/20 text-[var(--color-primary)] border-[var(--color-primary)]/30",
  ENTERPRISE: "bg-emerald-50 text-emerald-700 border-emerald-200",
};
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "text-emerald-600",
  EXPIRED: "text-[var(--color-error)]",
  SUSPENDED: "text-[var(--color-on-surface-variant)]",
};

type Business = {
  id: string;
  name: string;
  type: string;
  plan: string;
  planStatus: string;
  planExpiresAt: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  users: { name: string; email: string }[];
  _count: { appointments: number; clients: number; collaborators: number };
};

type Stats = { total: number; trial: number; active: number; expired: number; suspended: number };

export default function AdminDashboardPage() {
  const router = useRouter();
  const { theme, toggle: toggleTheme } = useTheme();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("Admin");
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("gm_token") ?? "";
      const headers = { Authorization: `Bearer ${token}` };
      const [bRes, sRes] = await Promise.all([
        fetch(`${API_URL}/admin/businesses`, { credentials: "include", headers }),
        fetch(`${API_URL}/admin/stats`, { credentials: "include", headers }),
      ]);

      if (bRes.status === 401 || sRes.status === 401) {
        router.push("/login");
        return;
      }

      const [bData, sData] = await Promise.all([bRes.json(), sRes.json()]);
      setBusinesses(bData);
      setStats(sData);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const raw = localStorage.getItem("gm_admin");
    if (raw) {
      try { setAdminName(JSON.parse(raw).name ?? "Admin"); } catch { /* ignore */ }
    }
    fetchData();
  }, [fetchData]);

  function handleLogout() {
    localStorage.removeItem("gm_admin");
    localStorage.removeItem("gm_admin_token");
    localStorage.removeItem("gm_token");
    window.location.href = "/api/logout";
  }

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        b.name.toLowerCase().includes(q) ||
        b.users[0]?.email.toLowerCase().includes(q) ||
        b.type.toLowerCase().includes(q);
      const matchPlan = filterPlan === "ALL" || b.plan === filterPlan;
      const matchStatus = filterStatus === "ALL" || b.planStatus === filterStatus;
      return matchSearch && matchPlan && matchStatus;
    });
  }, [businesses, search, filterPlan, filterStatus]);

  const expiresLabel = (b: Business) => {
    const date = b.planExpiresAt ?? b.trialEndsAt;
    if (!date) return null;
    const days = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return "Expirado";
    if (days === 0) return "Expira hoy";
    return `${days}d restantes`;
  };

  return (
    <main className="h-full overflow-y-auto bg-[var(--color-surface-container-low)]">
      {/* Topbar */}
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-outline-variant)] px-6 py-3 flex items-center justify-between">
        <button onClick={() => router.push("/admin/dashboard")} className="flex items-center gap-2 text-[var(--color-primary)] hover:opacity-80 transition-opacity">
          <Flower2 size={22} fill="currentColor" strokeWidth={1.8} />
          <span className="font-headline-sm font-bold">GlowManager</span>
          <span className="text-[var(--color-outline)] text-body-md font-normal ml-1">/ Admin</span>
        </button>
        <div className="flex items-center gap-4">
          <span className="text-body-md text-[var(--color-on-surface-variant)]">{adminName}</span>
          <button onClick={fetchData} className="p-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)] rounded-full transition-colors">
            <RefreshCw size={16} strokeWidth={1.5} />
          </button>
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="p-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)] rounded-full transition-colors"
          >
            {theme === "dark" ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
          </button>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-label-md font-semibold text-[var(--color-error)] hover:bg-[var(--color-error-container)]/20 px-3 py-1.5 rounded-lg transition-colors">
            <LogOut size={15} strokeWidth={1.5} />
            Salir
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <h1 className="font-headline-md text-headline-md text-[var(--color-on-surface)]">Panel de Control</h1>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: "Total negocios", value: stats.total, icon: Building2, color: "text-[var(--color-primary)]" },
              { label: "En trial", value: stats.trial, icon: Clock, color: "text-amber-600" },
              { label: "Activos", value: stats.active, icon: CheckCircle, color: "text-emerald-600" },
              { label: "Expirados", value: stats.expired, icon: AlertTriangle, color: "text-[var(--color-error)]" },
              { label: "Suspendidos", value: stats.suspended, icon: XCircle, color: "text-[var(--color-outline)]" },
            ].map((s) => (
              <div key={s.label} className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-4">
                <s.icon size={20} className={`${s.color} mb-2`} strokeWidth={1.5} />
                <p className="font-headline-sm text-headline-sm text-[var(--color-on-surface)]">{s.value}</p>
                <p className="text-[11px] text-[var(--color-on-surface-variant)] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Barra de búsqueda y filtros */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, email o tipo..."
              className="w-full pl-9 pr-9 py-2.5 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-colors placeholder:text-[var(--color-outline)]"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)] hover:text-[var(--color-on-surface)] transition-colors">
                <X size={14} strokeWidth={2} />
              </button>
            )}
          </div>
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="py-2.5 px-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          >
            <option value="ALL">Todos los planes</option>
            <option value="TRIAL">Trial</option>
            <option value="BASIC">Básico</option>
            <option value="PRO">Pro</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="py-2.5 px-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          >
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="EXPIRED">Expirados</option>
            <option value="SUSPENDED">Suspendidos</option>
          </select>
        </div>

        {/* Lista de negocios */}
        <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--color-outline-variant)] flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm text-[var(--color-on-surface)]">Negocios registrados</h2>
            <span className="text-[12px] text-[var(--color-on-surface-variant)]">{filteredBusinesses.length} de {businesses.length}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <p className="text-center text-body-md text-[var(--color-on-surface-variant)] py-12">
              {businesses.length === 0 ? "Sin negocios registrados." : "No hay resultados para esta búsqueda."}
            </p>
          ) : (
            <div className="divide-y divide-[var(--color-outline-variant)]">
              {filteredBusinesses.map((b) => (
                <button
                  key={b.id}
                  onClick={() => router.push(`/admin/negocios/${b.id}`)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[var(--color-surface-container-low)] transition-colors text-left"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-container)]/20 flex items-center justify-center shrink-0">
                    <Building2 size={18} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-body-md font-semibold text-[var(--color-on-surface)]">
                        {b.name || "Sin nombre"}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${PLAN_COLORS[b.plan]}`}>
                        {PLAN_LABELS[b.plan]}
                      </span>
                      <span className={`text-[11px] font-medium ${STATUS_COLORS[b.planStatus]}`}>
                        {b.planStatus === "ACTIVE" ? "Activo" : b.planStatus === "EXPIRED" ? "Expirado" : "Suspendido"}
                      </span>
                    </div>
                    <p className="text-[12px] text-[var(--color-on-surface-variant)] mt-0.5">
                      {b.users[0]?.email ?? "—"} · {b._count.clients} clientes · {b._count.appointments} citas
                    </p>
                    {expiresLabel(b) && (
                      <p className="text-[11px] text-[var(--color-outline)] mt-0.5">{expiresLabel(b)}</p>
                    )}
                  </div>

                  <ChevronRight size={18} className="text-[var(--color-outline)] shrink-0" strokeWidth={1.5} />
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
