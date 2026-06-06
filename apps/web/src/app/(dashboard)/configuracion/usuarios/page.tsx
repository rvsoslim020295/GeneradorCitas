"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Plus, Trash2, ShieldCheck, UserCog,
  Eye, EyeOff, AlertCircle, CheckCircle, X,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const ROLES = [
  { value: "OWNER", label: "Dueño", description: "Acceso total al sistema" },
  { value: "RECEPTIONIST", label: "Recepcionista", description: "Gestión de citas y clientes" },
  { value: "STAFF", label: "Colaborador", description: "Solo su agenda del día" },
];

type SystemUser = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "RECEPTIONIST" | "STAFF";
  isActive: boolean;
  lastLoginAt: string | null;
};

export default function UsuariosSistemaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  // New user form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"OWNER" | "RECEPTIONIST" | "STAFF">("RECEPTIONIST");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/users`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setUsers)
      .catch(() => router.push("/configuracion"))
      .finally(() => setLoading(false));
  }, [router]);

  function showMsg(type: "success" | "error", msg: string) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  }

  async function handleCreate() {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      showMsg("error", "Nombre, email y contraseña son obligatorios.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      showMsg("error", "El email no tiene un formato válido.");
      return;
    }
    if (newPassword.length < 8) {
      showMsg("error", "La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), email: newEmail.trim(), password: newPassword, role: newRole }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Error al crear usuario.");
      }
      const created: SystemUser = await res.json();
      setUsers((prev) => [...prev, created]);
      setNewName(""); setNewEmail(""); setNewPassword(""); setNewRole("RECEPTIONIST");
      setShowForm(false);
      showMsg("success", "Usuario creado correctamente.");
    } catch (e: unknown) {
      showMsg("error", e instanceof Error ? e.message : "Error al crear usuario.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user: SystemUser) {
    try {
      const res = await fetch(`${API_URL}/users/${user.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (!res.ok) throw new Error();
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
    } catch {
      showMsg("error", "No se pudo actualizar el usuario.");
    }
  }

  async function handleDelete(user: SystemUser) {
    if (!confirm(`¿Eliminar el acceso de ${user.name}? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch(`${API_URL}/users/${user.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showMsg("success", "Usuario eliminado.");
    } catch {
      showMsg("error", "No se pudo eliminar el usuario.");
    }
  }

  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      OWNER: "bg-[var(--color-primary-container)]/30 text-[var(--color-primary)]",
      RECEPTIONIST: "bg-[var(--color-secondary-container)]/30 text-[var(--color-secondary)]",
      STAFF: "bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]",
    };
    const labels: Record<string, string> = { OWNER: "Dueño", RECEPTIONIST: "Recepcionista", STAFF: "Colaborador" };
    return (
      <span className={`text-label-md font-semibold px-2.5 py-1 rounded-full ${map[role] ?? ""}`}>
        {labels[role] ?? role}
      </span>
    );
  };

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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/configuracion" className="p-2 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] rounded-full transition-colors">
                  <ArrowLeft size={20} strokeWidth={1.5} />
                </Link>
                <div>
                  <h1 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Usuarios del Sistema</h1>
                  <p className="text-body-md text-[var(--color-on-surface-variant)]">Gestiona el acceso al panel administrativo.</p>
                </div>
              </div>
              <button onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold uppercase tracking-wider px-4 py-2.5 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors shadow-sm">
                <Plus size={16} strokeWidth={2} />
                Nuevo Usuario
              </button>
            </div>

            {feedback && (
              <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-body-md border ${
                feedback.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-[var(--color-error-container)]/30 border-[var(--color-error-container)] text-[var(--color-error)]"
              }`}>
                {feedback.type === "success" ? <CheckCircle size={16} strokeWidth={1.5} /> : <AlertCircle size={16} strokeWidth={1.5} />}
                {feedback.msg}
              </div>
            )}

            {/* Guía de roles */}
            <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5 space-y-3">
              <h2 className="text-label-md font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck size={15} strokeWidth={2} className="text-[var(--color-primary)]" />
                Roles disponibles
              </h2>
              <div className="space-y-2">
                {ROLES.map((r) => (
                  <div key={r.value} className="flex items-center gap-3">
                    {roleBadge(r.value)}
                    <span className="text-body-md text-[var(--color-on-surface-variant)]">{r.description}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Formulario nuevo usuario */}
            {showForm && (
              <section className="bg-[var(--color-surface-container-low)] border border-[var(--color-primary)]/30 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
                    <UserCog size={18} className="text-[var(--color-primary)]" strokeWidth={1.5} />
                    Nuevo Usuario
                  </h2>
                  <button onClick={() => setShowForm(false)} className="text-[var(--color-outline)] hover:text-[var(--color-on-surface)] transition-colors">
                    <X size={18} strokeWidth={1.5} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Nombre completo</label>
                    <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ana García"
                      className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all placeholder:text-[var(--color-outline-variant)]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Email</label>
                    <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="ana@negocio.com" type="email"
                      className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all placeholder:text-[var(--color-outline-variant)]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Contraseña temporal</label>
                    <div className="relative">
                      <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        type={showPassword ? "text" : "password"} placeholder="Mín. 8 caracteres"
                        className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 pr-10 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all placeholder:text-[var(--color-outline-variant)]" />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)] hover:text-[var(--color-on-surface)] transition-colors">
                        {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                      </button>
                    </div>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Rol</label>
                    <div className="flex gap-2">
                      {ROLES.map((r) => (
                        <button key={r.value} type="button" onClick={() => setNewRole(r.value as typeof newRole)}
                          className={`flex-1 py-2.5 px-3 rounded-lg border text-body-md font-semibold transition-all text-left ${
                            newRole === r.value
                              ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] border-[var(--color-primary)]"
                              : "bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] border-[var(--color-outline-variant)] hover:border-[var(--color-primary)]/50"
                          }`}>
                          <div>{r.label}</div>
                          <div className={`text-[11px] font-normal mt-0.5 ${newRole === r.value ? "text-[var(--color-on-primary)]/80" : "text-[var(--color-on-surface-variant)]"}`}>{r.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button onClick={handleCreate} disabled={saving}
                  className="w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold uppercase tracking-wider py-3 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors disabled:opacity-60">
                  {saving ? "Creando usuario..." : "Crear Usuario"}
                </button>
              </section>
            )}

            {/* Lista de usuarios */}
            <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl overflow-hidden">
              {users.length === 0 ? (
                <div className="px-5 py-10 text-center text-body-md text-[var(--color-on-surface-variant)]">
                  No hay usuarios registrados.
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-outline-variant)]">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center gap-4 px-5 py-4">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-label-md font-bold shrink-0 ${
                        user.isActive
                          ? "bg-[var(--color-primary-container)]/20 text-[var(--color-primary)]"
                          : "bg-[var(--color-surface-container-high)] text-[var(--color-outline)]"
                      }`}>
                        {user.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-body-md font-semibold ${user.isActive ? "text-[var(--color-on-surface)]" : "text-[var(--color-outline)] line-through"}`}>
                            {user.name}
                          </span>
                          {roleBadge(user.role)}
                          {!user.isActive && (
                            <span className="text-label-md text-[var(--color-outline)] bg-[var(--color-surface-container-high)] px-2 py-0.5 rounded-full">Desactivado</span>
                          )}
                        </div>
                        <p className="text-[12px] text-[var(--color-on-surface-variant)] mt-0.5">{user.email}</p>
                        {user.lastLoginAt && (
                          <p className="text-[11px] text-[var(--color-outline)] mt-0.5">
                            Último acceso: {new Date(user.lastLoginAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => toggleActive(user)} title={user.isActive ? "Desactivar acceso" : "Activar acceso"}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                            user.isActive
                              ? "text-[var(--color-primary)] hover:bg-[var(--color-primary-container)]/20"
                              : "text-[var(--color-outline)] hover:bg-[var(--color-surface-container-high)]"
                          }`}>
                          <ShieldCheck size={18} strokeWidth={1.5} />
                        </button>
                        {user.role !== "OWNER" && (
                          <button onClick={() => handleDelete(user)} title="Eliminar usuario"
                            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-outline)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-container)]/20 transition-colors">
                            <Trash2 size={16} strokeWidth={1.5} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>
        </div>
      </main>
    </>
  );
}
