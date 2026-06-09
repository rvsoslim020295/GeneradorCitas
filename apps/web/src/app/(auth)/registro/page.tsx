"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Flower2, Mail, Lock, User, CreditCard, Building2, Phone,
  LogIn, AlertCircle, Eye, EyeOff,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function RegistroPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const lastName = (form.elements.namedItem("lastName") as HTMLInputElement).value.trim();
    const dni = (form.elements.namedItem("dni") as HTMLInputElement).value.trim();
    const ruc = (form.elements.namedItem("ruc") as HTMLInputElement).value.trim();
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    if (ruc.length !== 11) {
      setError("El RUC debe tener exactamente 11 dígitos.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, lastName, dni, ruc, phone, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al crear la cuenta.");
        return;
      }

      // Redirigir a pantalla de "verifica tu correo"
      router.push(`/verificar-correo?email=${encodeURIComponent(email)}`);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  const inputWrap = "input-glow-wrap relative rounded-lg bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] flex items-center overflow-hidden transition-all duration-200 focus-within:border-[var(--color-primary)] focus-within:shadow-[0_0_0_3px_rgb(68_65_196_/_0.15)]";
  const inputBase = "w-full bg-transparent border-none focus:ring-0 focus:outline-none text-body-md text-[var(--color-on-surface)] py-[10px] px-3";
  const iconWrap = "ml-3 text-[var(--color-outline)] shrink-0";
  const labelClass = "block font-label-md text-label-md uppercase tracking-wider text-[var(--color-on-surface-variant)] mb-1";

  return (
    <main className="flex h-full w-full overflow-y-auto items-start justify-center bg-[var(--color-surface-container-low)] p-4 py-10">
      <div className="ambient-shadow relative w-full max-w-[500px] overflow-hidden rounded-xl border border-[var(--color-outline-variant)]/50 bg-[var(--color-surface-container-lowest)] p-8">
        <div className="absolute left-0 top-0 h-1 w-full bg-[var(--color-primary)]" />

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="mb-2 flex items-center justify-center gap-2 font-headline-md text-headline-md text-[var(--color-primary)]">
            <Flower2 size={26} fill="currentColor" strokeWidth={1.8} />
            GlowManager
          </h1>
          <h2 className="font-headline-sm text-headline-sm text-[var(--color-on-surface)]">
            Crea tu cuenta gratis
          </h2>
          <p className="mt-1 font-body-md text-body-md text-[var(--color-on-surface-variant)]">
            7 días de prueba gratuita · Sin tarjeta de crédito
          </p>
        </div>

        {/* Badge trial */}
        <div className="mb-5 flex items-center justify-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-label-md font-semibold text-emerald-700 uppercase tracking-wider">
            Prueba gratis por 7 días
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-[var(--color-error-container)]/30 border border-[var(--color-error-container)] px-3 py-2 text-body-md text-[var(--color-error)]">
            <AlertCircle size={16} strokeWidth={1.5} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {/* Nombres + Apellidos en fila */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Nombres</label>
              <div className={inputWrap}>
                <User className={iconWrap} size={18} strokeWidth={1.5} />
                <input name="name" type="text" required autoComplete="off" className={inputBase} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Apellidos</label>
              <div className={inputWrap}>
                <User className={iconWrap} size={18} strokeWidth={1.5} />
                <input name="lastName" type="text" required autoComplete="off" className={inputBase} />
              </div>
            </div>
          </div>

          {/* DNI + RUC en fila */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>DNI</label>
              <div className={inputWrap}>
                <CreditCard className={iconWrap} size={18} strokeWidth={1.5} />
                <input name="dni" type="text" required minLength={8} maxLength={8}
                  pattern="\d{8}" title="DNI: 8 dígitos"
                  autoComplete="off" className={inputBase} />
              </div>
            </div>
            <div>
              <label className={labelClass}>RUC</label>
              <div className={inputWrap}>
                <Building2 className={iconWrap} size={18} strokeWidth={1.5} />
                <input name="ruc" type="text" required minLength={11} maxLength={11}
                  pattern="\d{11}" title="RUC: 11 dígitos"
                  autoComplete="off" className={inputBase} />
              </div>
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label className={labelClass}>Número de teléfono</label>
            <div className={inputWrap}>
              <Phone className={iconWrap} size={18} strokeWidth={1.5} />
              <input name="phone" type="tel" required autoComplete="off" className={inputBase} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className={labelClass}>Correo electrónico</label>
            <div className={inputWrap}>
              <Mail className={iconWrap} size={18} strokeWidth={1.5} />
              <input name="email" type="email" required autoComplete="new-email" className={inputBase} />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label className={labelClass}>Contraseña</label>
            <div className={`${inputWrap} pr-10`}>
              <Lock className={iconWrap} size={18} strokeWidth={1.5} />
              <input
                name="password" type={showPassword ? "text" : "password"}
                required minLength={6}
                autoComplete="new-password"
                className={inputBase}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--color-outline)] hover:text-[var(--color-primary)]">
                {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
              </button>
            </div>
            <p className="mt-1 text-body-sm text-[var(--color-outline)]">Mínimo 6 caracteres</p>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button type="submit" disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-3 font-label-md text-label-md text-[var(--color-on-primary)] shadow-sm transition-all duration-200 hover:bg-[var(--color-on-primary-fixed-variant)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed uppercase tracking-wider">
              {loading ? "Creando cuenta..." : "Comenzar prueba gratis"}
              {!loading && <LogIn size={16} strokeWidth={1.5} />}
            </button>
          </div>
        </form>

        {/* Link a login */}
        <p className="mt-5 text-center font-body-md text-body-md text-[var(--color-on-surface-variant)]">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-label-md text-label-md text-[var(--color-primary)] hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
