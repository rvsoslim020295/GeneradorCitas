"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flower2, Lock, Mail, LogIn, AlertCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    try {
      const res = await fetch(`${API_URL}/admin/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Credenciales incorrectas");
        return;
      }

      localStorage.setItem("gm_admin", JSON.stringify({ name: data.name, email: data.email }));
      router.push("/admin/dashboard");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--color-surface-container-low)] p-4">
      <div className="w-full max-w-[420px] bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/50 rounded-2xl overflow-hidden shadow-xl">
        <div className="h-1 w-full bg-[var(--color-primary)]" />
        <div className="p-8">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-2 text-[var(--color-primary)] mb-2">
              <Flower2 size={26} fill="currentColor" strokeWidth={1.8} />
              <span className="font-headline-md text-headline-md">GlowManager</span>
            </div>
            <h1 className="font-headline-sm text-headline-sm text-[var(--color-on-surface)] mt-4">Panel Administrativo</h1>
            <p className="text-body-md text-[var(--color-on-surface-variant)] mt-1">Acceso exclusivo para administradores</p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-[var(--color-error-container)]/30 border border-[var(--color-error-container)] px-3 py-2 text-body-md text-[var(--color-error)]">
              <AlertCircle size={16} strokeWidth={1.5} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)]" size={18} />
                <input
                  name="email" type="email" required
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)]" size={18} />
                <input
                  name="password" type="password" required
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold py-3 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors disabled:opacity-60 mt-2"
            >
              {loading ? "Ingresando..." : "Ingresar"}
              {!loading && <LogIn size={18} />}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
