"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, KeyRound, Mail, AlertCircle } from "lucide-react";
import { FormEvent, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function RecuperarContrasenaPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex h-screen w-full items-center justify-center bg-[var(--color-surface-container-low)] p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--color-outline-variant)]/50 bg-[var(--color-surface-container-lowest)] p-8 shadow-sm">
        {/* Ícono */}
        <div className="mb-6 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]">
            <KeyRound size={28} strokeWidth={1.8} />
          </div>
          <h1 className="font-headline-md text-headline-md text-[var(--color-on-surface)]">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="mt-1 text-body-md text-[var(--color-on-surface-variant)]">
            Ingresa tu correo y te enviaremos un enlace para restablecerla.
          </p>
        </div>

        {!sent ? (
          <>
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-[var(--color-error-container)]/30 border border-[var(--color-error-container)] px-3 py-2 text-body-md text-[var(--color-error)]">
                <AlertCircle size={16} strokeWidth={1.5} className="shrink-0" />
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-label-md font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">
                  Correo electrónico
                </label>
                <div className="relative rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] flex items-center focus-within:border-[var(--color-primary)] focus-within:shadow-[0_0_0_3px_rgb(68_65_196_/_0.15)] transition-all">
                  <Mail className="ml-3 shrink-0 text-[var(--color-outline)]" size={20} strokeWidth={1.5} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-body-md text-[var(--color-on-surface)] py-3 px-3 placeholder:text-[var(--color-outline-variant)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center rounded-lg bg-[var(--color-primary)] px-4 py-3 text-label-md font-semibold uppercase tracking-wider text-[var(--color-on-primary)] transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? "Enviando..." : "Enviar enlace de recuperación"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-4 py-4">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={26} fill="currentColor" strokeWidth={2} />
            </div>
            <h3 className="font-headline-sm text-headline-sm text-[var(--color-on-surface)]">
              ¡Correo enviado!
            </h3>
            <p className="text-body-md text-[var(--color-on-surface-variant)]">
              Revisa tu bandeja de entrada en <strong>{email}</strong>. Si no lo ves, revisa la carpeta de spam.
            </p>
            <p className="text-[12px] text-[var(--color-on-surface-variant)]">
              El enlace expira en 1 hora.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="w-full rounded-lg border border-[var(--color-outline-variant)] px-4 py-2 text-label-md font-semibold text-[var(--color-primary)] hover:bg-[var(--color-surface-container-low)] transition-colors"
            >
              Intentar con otro correo
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-body-md text-[var(--color-primary)] hover:underline"
          >
            <ArrowLeft size={16} />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </main>
  );
}
