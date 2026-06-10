"use client";

import { ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, AlertCircle } from "lucide-react";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Validaciones visuales en tiempo real
  const hasLength = password.length >= 6;
  const hasMatch = password === confirm && confirm.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!hasLength) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (!hasMatch) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!token) {
      setError("El enlace no es válido. Solicita uno nuevo.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al restablecer la contraseña.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-error-container)]/30 text-[var(--color-error)]">
          <AlertCircle size={24} strokeWidth={1.5} />
        </div>
        <h2 className="font-headline-sm text-[var(--color-on-surface)]">Enlace inválido</h2>
        <p className="text-body-md text-[var(--color-on-surface-variant)]">
          Este enlace no es válido o ha expirado.
        </p>
        <Link href="/recuperar-contrasena"
          className="inline-block mt-2 text-[var(--color-primary)] text-body-md hover:underline">
          Solicitar un nuevo enlace →
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 size={26} fill="currentColor" strokeWidth={2} />
        </div>
        <h3 className="font-headline-sm text-[var(--color-on-surface)]">¡Contraseña actualizada!</h3>
        <p className="text-body-md text-[var(--color-on-surface-variant)]">
          Tu contraseña fue restablecida correctamente. Serás redirigido al inicio de sesión en unos segundos...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-[var(--color-error-container)]/30 border border-[var(--color-error-container)] px-3 py-2 text-body-md text-[var(--color-error)]">
          <AlertCircle size={16} strokeWidth={1.5} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Nueva contraseña */}
      <div>
        <label className="mb-1 block text-label-md font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">
          Nueva contraseña
        </label>
        <div className="relative rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] flex items-center focus-within:border-[var(--color-primary)] focus-within:shadow-[0_0_0_3px_rgb(68_65_196_/_0.15)] transition-all pr-10">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-body-md text-[var(--color-on-surface)] py-3 px-4 placeholder:text-[var(--color-outline-variant)]"
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-[var(--color-outline)] hover:text-[var(--color-primary)]">
            {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Confirmar contraseña */}
      <div>
        <label className="mb-1 block text-label-md font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">
          Confirmar contraseña
        </label>
        <div className="relative rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] flex items-center focus-within:border-[var(--color-primary)] focus-within:shadow-[0_0_0_3px_rgb(68_65_196_/_0.15)] transition-all pr-10">
          <input
            type={showConfirm ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repite la contraseña"
            className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-body-md text-[var(--color-on-surface)] py-3 px-4 placeholder:text-[var(--color-outline-variant)]"
          />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 text-[var(--color-outline)] hover:text-[var(--color-primary)]">
            {showConfirm ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Indicadores visuales */}
      <div className="rounded-lg bg-[var(--color-surface-container-low)] p-3 space-y-1.5">
        <div className={`flex items-center gap-2 text-[12px] ${hasLength ? "text-emerald-600" : "text-[var(--color-on-surface-variant)]"}`}>
          <CheckCircle2 size={14} strokeWidth={2} className={hasLength ? "text-emerald-500" : "text-[var(--color-outline)]"} />
          Mínimo 6 caracteres
        </div>
        <div className={`flex items-center gap-2 text-[12px] ${hasMatch ? "text-emerald-600" : "text-[var(--color-on-surface-variant)]"}`}>
          <CheckCircle2 size={14} strokeWidth={2} className={hasMatch ? "text-emerald-500" : "text-[var(--color-outline)]"} />
          Las contraseñas coinciden
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-3 text-label-md font-semibold uppercase tracking-wider text-[var(--color-on-primary)] transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? "Actualizando..." : "Actualizar contraseña"}
        {!loading && <ArrowRight size={16} strokeWidth={2} />}
      </button>
    </form>
  );
}

export default function ResetearContrasenaPage() {
  return (
    <main className="flex h-screen w-full items-center justify-center bg-[var(--color-surface-container-low)] p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--color-outline-variant)]/50 bg-[var(--color-surface-container-lowest)] p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]">
            <KeyRound size={28} strokeWidth={1.8} />
          </div>
          <h1 className="font-headline-md text-headline-md text-[var(--color-on-surface)]">
            Restablecer contraseña
          </h1>
          <p className="mt-1 text-body-md text-[var(--color-on-surface-variant)]">
            Crea una nueva contraseña para tu cuenta.
          </p>
        </div>

        <Suspense fallback={<div className="h-40 flex items-center justify-center text-[var(--color-on-surface-variant)]">Cargando...</div>}>
          <ResetForm />
        </Suspense>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-body-md text-[var(--color-primary)] hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </main>
  );
}
