"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Plus, Trash2, ShieldCheck, UserCog,
  Eye, EyeOff, AlertCircle, CheckCircle, X, ChevronDown, Link2,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { apiFetch } from "@/lib/api/client";

// Los roles que se pueden asignar al crear/editar usuarios (OWNER no es asignable)
const ASSIGNABLE_ROLES = [
  { value: "ADMIN", label: "Administrador", description: "Gestión de citas y clientes" },
  { value: "COLLABORATOR", label: "Colaborador", description: "Solo su agenda del día" },
] as const;

// Todos los roles para mostrar en la guía y los badges
const ALL_ROLES = [
  { value: "OWNER", label: "Dueño", description: "Acceso total al sistema" },
  ...ASSIGNABLE_ROLES,
] as const;

type SystemRole = "OWNER" | "ADMIN" | "COLLABORATOR";

type SystemUser = {
  id: string;
  name: string;
  email: string;
  role: SystemRole;
  emailVerified: boolean;
};

export default function UsuariosSistemaPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<SystemRole>("ADMIN");
  const [newCollaboratorId, setNewCollaboratorId] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<SystemUser | null>(null);

  // Role selector dropdown
  const [roleDropdown, setRoleDropdown] = useState<string | null>(null);

  function showMsg(type: "success" | "error", msg: string) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  }

  // ─── Queries ────────────────────────────────────────────────────────────────

  type Collaborator = { id: string; name: string; lastName: string | null };

  const { data: collaborators = [] } = useQuery<Collaborator[]>({
    queryKey: ["collaborators-list"],
    queryFn: () => apiFetch<Collaborator[]>("/collaborators"),
  });

  const { data: users = [], isLoading } = useQuery<SystemUser[]>({
    queryKey: ["system-users"],
    queryFn: () => apiFetch<SystemUser[]>("/users"),
    throwOnError: false,
    // Si el fetch falla (401 o sin permisos), redirigir
    // El 401 ya lo maneja apiFetch redirigiendo a /login
  });

  const createUser = useMutation({
    mutationFn: (body: { name: string; email: string; password: string; role: SystemRole; collaboratorId?: string }) =>
      apiFetch<SystemUser>("/users", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (created) => {
      qc.setQueryData<SystemUser[]>(["system-users"], (prev = []) => [...prev, created]);
      setNewName(""); setNewEmail(""); setNewPassword(""); setNewRole("ADMIN"); setNewCollaboratorId("");
      setShowForm(false);
      showMsg("success", "Usuario creado correctamente.");
    },
    onError: (e) => showMsg("error", e.message || "Error al crear usuario."),
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: SystemRole }) =>
      apiFetch<SystemUser>(`/users/${id}`, { method: "PATCH", body: JSON.stringify({ role }) }),
    onSuccess: (updated) => {
      qc.setQueryData<SystemUser[]>(["system-users"], (prev = []) =>
        prev.map((u) => u.id === updated.id ? updated : u)
      );
      setRoleDropdown(null);
    },
    onError: () => showMsg("error", "No se pudo actualizar el rol."),
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => apiFetch(`/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.setQueryData<SystemUser[]>(["system-users"], (prev = []) =>
        prev.filter((u) => u.id !== deleteTarget?.id)
      );
      showMsg("success", "Usuario eliminado.");
      setDeleteTarget(null);
    },
    onError: () => {
      showMsg("error", "No se pudo eliminar el usuario.");
      setDeleteTarget(null);
    },
  });

  // ─── Handlers ────────────────────────────────────────────────────────────────

  function handleCreate() {
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
    createUser.mutate({
      name: newName.trim(),
      email: newEmail.trim(),
      password: newPassword,
      role: newRole,
      ...(newRole === "COLLABORATOR" && newCollaboratorId ? { collaboratorId: newCollaboratorId } : {}),
    });
  }

  // ─── UI helpers ─────────────────────────────────────────────────────────────

  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      OWNER: "bg-[var(--color-primary-container)]/30 text-[var(--color-primary)]",
      ADMIN: "bg-[var(--color-secondary-container)]/30 text-[var(--color-secondary)]",
      COLLABORATOR: "bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]",
    };
    const labels: Record<string, string> = { OWNER: "Dueño", ADMIN: "Administrador", COLLABORATOR: "Colaborador" };
    return (
      <span className={`text-label-md font-semibold px-2.5 py-1 rounded-full ${map[role] ?? ""}`}>
        {labels[role] ?? role}
      </span>
    );
  };

  if (isLoading) return (
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
        <div className="flex-1 overflow-y-auto overflow-x-visible pt-16" style={{ scrollbarWidth: "thin" }}>
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
                {ALL_ROLES.map((r) => (
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
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Nombre del usuario"
                      className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all placeholder:text-[var(--color-outline-variant)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Email</label>
                    <input
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      type="email"
                      autoComplete="off"
                      className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all placeholder:text-[var(--color-outline-variant)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Contraseña temporal</label>
                    <div className="relative">
                      <input
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Mín. 8 caracteres"
                        className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 pr-10 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all placeholder:text-[var(--color-outline-variant)]"
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)] hover:text-[var(--color-on-surface)] transition-colors">
                        {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                      </button>
                    </div>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Rol</label>
                    <div className="flex gap-2">
                      {ASSIGNABLE_ROLES.map((r) => (
                        <button key={r.value} type="button" onClick={() => { setNewRole(r.value); setNewCollaboratorId(""); }}
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

                  {newRole === "COLLABORATOR" && (
                    <div className="col-span-2 space-y-1">
                      <label className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider flex items-center gap-1">
                        <Link2 size={12} strokeWidth={2} />
                        Vincular a colaborador <span className="font-normal normal-case">(opcional)</span>
                      </label>
                      <div className="relative">
                        <select
                          value={newCollaboratorId}
                          onChange={(e) => setNewCollaboratorId(e.target.value)}
                          className="w-full appearance-none bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 pr-9 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                        >
                          <option value="">Sin vincular</option>
                          {collaborators.map((col) => (
                            <option key={col.id} value={col.id}>
                              {col.name}{col.lastName ? ` ${col.lastName}` : ""}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} strokeWidth={2} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]" />
                      </div>
                      <p className="text-[11px] text-[var(--color-on-surface-variant)]">
                        Al vincularlo, este usuario solo verá las citas asignadas a ese colaborador.
                      </p>
                    </div>
                  )}
                </div>

                <button onClick={handleCreate} disabled={createUser.isPending}
                  className="w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold uppercase tracking-wider py-3 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors disabled:opacity-60">
                  {createUser.isPending ? "Creando usuario..." : "Crear Usuario"}
                </button>
              </section>
            )}

            {/* Lista de usuarios */}
            <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl">
              {users.length === 0 ? (
                <div className="px-5 py-10 text-center text-body-md text-[var(--color-on-surface-variant)]">
                  No hay usuarios registrados.
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-outline-variant)]">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center gap-4 px-5 py-4">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-label-md font-bold shrink-0 bg-[var(--color-primary-container)]/20 text-[var(--color-primary)]">
                        {user.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-body-md font-semibold text-[var(--color-on-surface)]">{user.name}</span>
                          {roleBadge(user.role)}
                          {!user.emailVerified && (
                            <span className="text-label-md text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Sin verificar</span>
                          )}
                        </div>
                        <p className="text-[12px] text-[var(--color-on-surface-variant)] mt-0.5">{user.email}</p>
                      </div>

                      {/* Acciones */}
                      {user.role !== "OWNER" && (
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Selector de rol */}
                          <div className="relative">
                            <button
                              onClick={() => setRoleDropdown(roleDropdown === user.id ? null : user.id)}
                              title="Cambiar rol"
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-label-md font-semibold border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)] transition-colors bg-[var(--color-surface-container-lowest)]"
                            >
                              <ShieldCheck size={14} strokeWidth={1.5} />
                              Rol
                              <ChevronDown size={12} strokeWidth={2} />
                            </button>
                            {roleDropdown === user.id && (
                              <div className="absolute right-0 bottom-full mb-1 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl shadow-lg z-50 min-w-[180px] overflow-hidden">
                                {ASSIGNABLE_ROLES.map((r) => (
                                  <button
                                    key={r.value}
                                    onClick={() => updateRole.mutate({ id: user.id, role: r.value })}
                                    disabled={user.role === r.value || updateRole.isPending}
                                    className={`w-full text-left px-4 py-3 text-body-md transition-colors ${
                                      user.role === r.value
                                        ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold cursor-default"
                                        : "hover:bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)]"
                                    }`}
                                  >
                                    <div className="font-semibold">{r.label}</div>
                                    <div className="text-[11px] text-[var(--color-on-surface-variant)]">{r.description}</div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => setDeleteTarget(user)}
                            title="Eliminar usuario"
                            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-outline)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-container)]/20 transition-colors"
                          >
                            <Trash2 size={16} strokeWidth={1.5} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>
        </div>
      </main>

      {/* Modal confirmación eliminar */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-error-container)]/30 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-[var(--color-error)]" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Eliminar usuario</h3>
                <p className="text-body-md text-[var(--color-on-surface-variant)] mt-1">
                  ¿Eliminar el acceso de <span className="font-semibold text-[var(--color-on-surface)]">{deleteTarget.name}</span>? Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-lg border border-[var(--color-outline-variant)] text-body-md font-semibold text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteUser.mutate(deleteTarget.id)}
                disabled={deleteUser.isPending}
                className="flex-1 py-2.5 rounded-lg bg-[var(--color-error)] text-white text-body-md font-semibold hover:bg-[var(--color-error)]/90 transition-colors disabled:opacity-60"
              >
                {deleteUser.isPending ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cerrar dropdown al hacer click fuera */}
      {roleDropdown && (
        <div className="fixed inset-0 z-10" onClick={() => setRoleDropdown(null)} />
      )}
    </>
  );
}
