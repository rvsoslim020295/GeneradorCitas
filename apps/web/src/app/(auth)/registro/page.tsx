"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Flower2, Mail, Lock, User, Store, Scissors,
  ChevronDown, LogIn, AlertCircle, Eye, EyeOff,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const BUSINESS_TYPES = [
  { value: "salon", label: "Peluquería / Salón de Belleza" },
  { value: "barbershop", label: "Barbería" },
  { value: "spa", label: "Spa / Centro de Estética" },
  { value: "nails", label: "Nail Bar" },
  { value: "other", label: "Otro" },
];

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
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const businessName = (form.elements.namedItem("businessName") as HTMLInputElement).value;
    const businessType = (form.elements.namedItem("businessType") as HTMLSelectElement).value;

    if (!businessType) {
      setError("Selecciona el tipo de negocio.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, businessName, businessType }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al crear la cuenta.");
        return;
      }

      // Guardamos el token y redirigimos al dashboard
      // El negocio ya quedó creado con nombre y tipo desde este formulario
      localStorage.setItem("gm_token", data.token);
      localStorage.setItem("gm_user", JSON.stringify(data.user));
      router.push("/onboarding");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "block w-full rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] py-[10px] pl-10 pr-3 font-body-md text-body-md text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] transition-colors duration-200 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20";

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[var(--color-surface-container-low)] p-4">
      <div className="ambient-shadow relative w-full max-w-[480px] overflow-hidden rounded-xl border border-[var(--color-outline-variant)]/50 bg-[var(--color-surface-container-lowest)] p-8">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre completo */}
          <div>
            <label className="mb-1 block font-label-md text-label-md uppercase text-[var(--color-on-surface-variant)]">
              Nombre completo
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <User className="text-[var(--color-outline)]" size={18} strokeWidth={1.5} />
              </div>
              <input name="name" type="text" required placeholder="Ana Martínez" className={inputClass} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="mb-1 block font-label-md text-label-md uppercase text-[var(--color-on-surface-variant)]">
              Email
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="text-[var(--color-outline)]" size={18} strokeWidth={1.5} />
              </div>
              <input name="email" type="email" required placeholder="ana@tunegocio.com" className={inputClass} />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label className="mb-1 block font-label-md text-label-md uppercase text-[var(--color-on-surface-variant)]">
              Contraseña
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="text-[var(--color-outline)]" size={18} strokeWidth={1.5} />
              </div>
              <input
                name="password" type={showPassword ? "text" : "password"}
                required minLength={6} placeholder="Mínimo 6 caracteres"
                className={`${inputClass} pr-10`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--color-outline)] hover:text-[var(--color-primary)]">
                {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          {/* Separador */}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-outline-variant)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[var(--color-surface-container-lowest)] px-3 text-label-md text-[var(--color-outline)]">
                Tu negocio
              </span>
            </div>
          </div>

          {/* Nombre del negocio */}
          <div>
            <label className="mb-1 block font-label-md text-label-md uppercase text-[var(--color-on-surface-variant)]">
              Nombre del negocio
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Store className="text-[var(--color-outline)]" size={18} strokeWidth={1.5} />
              </div>
              <input name="businessName" type="text" required placeholder="Studio Elegance" className={inputClass} />
            </div>
          </div>

          {/* Tipo de negocio */}
          <div>
            <label className="mb-1 block font-label-md text-label-md uppercase text-[var(--color-on-surface-variant)]">
              Tipo de negocio
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Scissors className="text-[var(--color-outline)]" size={18} strokeWidth={1.5} />
              </div>
              <select name="businessType" defaultValue=""
                className={`${inputClass} appearance-none pr-8 cursor-pointer`}>
                <option value="" disabled>Selecciona una categoría...</option>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronDown className="text-[var(--color-outline)]" size={16} strokeWidth={1.5} />
              </div>
            </div>
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
