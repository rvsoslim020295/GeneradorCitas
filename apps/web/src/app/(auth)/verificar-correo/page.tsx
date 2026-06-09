"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Flower2, Mail, RefreshCw } from "lucide-react";


function VerificarCorreoContent() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";

  return (
    <main className="flex h-full w-full items-center justify-center overflow-y-auto bg-[var(--color-surface-container-low)] p-4">
      <div className="ambient-shadow relative w-full max-w-[480px] overflow-hidden rounded-xl border border-[var(--color-outline-variant)]/50 bg-[var(--color-surface-container-lowest)] p-8 text-center">
        <div className="absolute left-0 top-0 h-1 w-full bg-[var(--color-primary)]" />

        {/* Logo */}
        <div className="mb-6 flex items-center justify-center gap-2 text-[var(--color-primary)]">
          <Flower2 size={26} fill="currentColor" strokeWidth={1.8} />
          <span className="font-headline-md text-headline-md">GlowManager</span>
        </div>

        {/* Ícono de correo */}
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-container)]">
          <Mail size={30} className="text-[var(--color-primary)]" strokeWidth={1.5} />
        </div>

        <h2 className="mb-2 font-headline-sm text-headline-sm text-[var(--color-on-surface)]">
          Verifica tu correo
        </h2>

        <p className="mb-1 font-body-md text-body-md text-[var(--color-on-surface-variant)]">
          Te enviamos un enlace de verificación a:
        </p>
        {email && (
          <p className="mb-5 font-label-md text-label-md text-[var(--color-primary)]">
            {email}
          </p>
        )}

        <p className="mb-6 font-body-md text-body-md text-[var(--color-on-surface-variant)]">
          Haz clic en el enlace que aparece en ese correo para activar tu cuenta y continuar
          con la configuración de tu negocio.
        </p>

        <div className="rounded-lg bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] p-4 text-left mb-6">
          <p className="font-label-md text-label-md text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1">
            ¿No lo ves?
          </p>
          <p className="font-body-md text-body-md text-[var(--color-on-surface-variant)]">
            Revisa tu carpeta de spam o correo no deseado. El enlace expira en 24 horas.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-body-md text-[var(--color-on-surface-variant)]">
          <RefreshCw size={14} strokeWidth={1.5} />
          ¿Ya verificaste?{" "}
          <Link href="/login" className="font-label-md text-label-md text-[var(--color-primary)] hover:underline ml-1">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function VerificarCorreoPage() {
  return (
    <Suspense>
      <VerificarCorreoContent />
    </Suspense>
  );
}
