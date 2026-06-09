"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Flower2, CheckCircle, XCircle, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function VerificarEmailContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de verificación no encontrado.");
      return;
    }

    fetch(`${API_URL}/auth/verify-email?token=${token}`, { credentials: "include" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setMessage(data.error ?? "El enlace es inválido o ya fue utilizado.");
          return;
        }
        // Token viene como httpOnly cookie — solo guardamos datos de display
        localStorage.setItem("gm_user", JSON.stringify(data.user));
        setStatus("success");
        setTimeout(() => router.push("/onboarding"), 2000);
      })
      .catch(() => {
        setStatus("error");
        setMessage("No se pudo conectar con el servidor.");
      });
  }, [token, router]);

  return (
    <main className="flex h-full w-full items-center justify-center overflow-y-auto bg-[var(--color-surface-container-low)] p-4">
      <div className="ambient-shadow relative w-full max-w-[440px] overflow-hidden rounded-xl border border-[var(--color-outline-variant)]/50 bg-[var(--color-surface-container-lowest)] p-8 text-center">
        <div className="absolute left-0 top-0 h-1 w-full bg-[var(--color-primary)]" />

        {/* Logo */}
        <div className="mb-6 flex items-center justify-center gap-2 text-[var(--color-primary)]">
          <Flower2 size={26} fill="currentColor" strokeWidth={1.8} />
          <span className="font-headline-md text-headline-md">GlowManager</span>
        </div>

        {status === "loading" && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-container-high)]">
              <Loader2 size={30} className="text-[var(--color-primary)] animate-spin" strokeWidth={1.5} />
            </div>
            <h2 className="font-headline-sm text-headline-sm text-[var(--color-on-surface)]">
              Verificando tu cuenta...
            </h2>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle size={30} className="text-emerald-600" strokeWidth={1.5} />
            </div>
            <h2 className="mb-2 font-headline-sm text-headline-sm text-[var(--color-on-surface)]">
              ¡Cuenta verificada!
            </h2>
            <p className="font-body-md text-body-md text-[var(--color-on-surface-variant)]">
              Redirigiendo a la configuración de tu negocio...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-error-container)]/30">
              <XCircle size={30} className="text-[var(--color-error)]" strokeWidth={1.5} />
            </div>
            <h2 className="mb-2 font-headline-sm text-headline-sm text-[var(--color-on-surface)]">
              Enlace inválido
            </h2>
            <p className="mb-5 font-body-md text-body-md text-[var(--color-on-surface-variant)]">
              {message}
            </p>
            <a href="/registro"
              className="inline-block rounded-lg bg-[var(--color-primary)] px-6 py-2.5 font-label-md text-label-md text-[var(--color-on-primary)] hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors uppercase tracking-wider">
              Volver al registro
            </a>
          </>
        )}
      </div>
    </main>
  );
}

export default function VerificarEmailPage() {
  return (
    <Suspense>
      <VerificarEmailContent />
    </Suspense>
  );
}
