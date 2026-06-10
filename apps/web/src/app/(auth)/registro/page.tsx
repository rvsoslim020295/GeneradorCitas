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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function validate(fields: Record<string, string>) {
    const errors: Record<string, string> = {};
    if (!fields.name) errors.name = "El nombre es obligatorio.";
    if (!fields.lastName) errors.lastName = "Los apellidos son obligatorios.";

    if (!fields.phone) {
      errors.phone = "El teléfono es obligatorio.";
    } else if (!/^\d{9}$/.test(fields.phone)) {
      errors.phone = "El teléfono debe tener exactamente 9 dígitos numéricos.";
    }

    if (!fields.email) {
      errors.email = "El correo electrónico es obligatorio.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      errors.email = "Ingresa un correo electrónico válido.";
    }

    if (!fields.password) {
      errors.password = "La contraseña es obligatoria.";
    } else if (fields.password.length < 6) {
      errors.password = "La contraseña debe tener al menos 6 caracteres.";
    }

    // DNI y RUC son opcionales — solo validar si se llenaron
    if (fields.dni && !/^\d{8}$/.test(fields.dni)) {
      errors.dni = "El DNI debe tener 8 dígitos numéricos.";
    }
    if (fields.ruc && !/^\d{11}$/.test(fields.ruc)) {
      errors.ruc = "El RUC debe tener 11 dígitos numéricos.";
    }

    return errors;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const form = e.currentTarget;
    const fields = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value.trim(),
      lastName: (form.elements.namedItem("lastName") as HTMLInputElement).value.trim(),
      dni: (form.elements.namedItem("dni") as HTMLInputElement).value.trim(),
      ruc: (form.elements.namedItem("ruc") as HTMLInputElement).value.trim(),
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem("email") as HTMLInputElement).value.trim(),
      password: (form.elements.namedItem("password") as HTMLInputElement).value,
    };

    const errors = validate(fields);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fields.name,
          lastName: fields.lastName,
          dni: fields.dni || undefined,
          ruc: fields.ruc || undefined,
          phone: fields.phone,
          email: fields.email,
          password: fields.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al crear la cuenta.");
        return;
      }

      // Redirigir a pantalla de "verifica tu correo"
      router.push(`/verificar-correo?email=${encodeURIComponent(fields.email)}`);
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
          {/* Nombres + Apellidos */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Nombres <span className="text-[var(--color-error)]">*</span></label>
              <div className={`${inputWrap} ${fieldErrors.name ? "border-[var(--color-error)]" : ""}`}>
                <User className={iconWrap} size={18} strokeWidth={1.5} />
                <input name="name" type="text" autoComplete="off" className={inputBase} />
              </div>
              {fieldErrors.name && <p className="mt-1 text-[11px] text-[var(--color-error)]">{fieldErrors.name}</p>}
            </div>
            <div>
              <label className={labelClass}>Apellidos <span className="text-[var(--color-error)]">*</span></label>
              <div className={`${inputWrap} ${fieldErrors.lastName ? "border-[var(--color-error)]" : ""}`}>
                <User className={iconWrap} size={18} strokeWidth={1.5} />
                <input name="lastName" type="text" autoComplete="off" className={inputBase} />
              </div>
              {fieldErrors.lastName && <p className="mt-1 text-[11px] text-[var(--color-error)]">{fieldErrors.lastName}</p>}
            </div>
          </div>

          {/* DNI + RUC — opcionales */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>DNI <span className="text-[var(--color-on-surface-variant)] text-[10px] normal-case">(opcional)</span></label>
              <div className={`${inputWrap} ${fieldErrors.dni ? "border-[var(--color-error)]" : ""}`}>
                <CreditCard className={iconWrap} size={18} strokeWidth={1.5} />
                <input name="dni" type="text" maxLength={8} autoComplete="off" className={inputBase} placeholder="8 dígitos" />
              </div>
              {fieldErrors.dni && <p className="mt-1 text-[11px] text-[var(--color-error)]">{fieldErrors.dni}</p>}
            </div>
            <div>
              <label className={labelClass}>RUC <span className="text-[var(--color-on-surface-variant)] text-[10px] normal-case">(opcional)</span></label>
              <div className={`${inputWrap} ${fieldErrors.ruc ? "border-[var(--color-error)]" : ""}`}>
                <Building2 className={iconWrap} size={18} strokeWidth={1.5} />
                <input name="ruc" type="text" maxLength={11} autoComplete="off" className={inputBase} placeholder="11 dígitos" />
              </div>
              {fieldErrors.ruc && <p className="mt-1 text-[11px] text-[var(--color-error)]">{fieldErrors.ruc}</p>}
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label className={labelClass}>Número de teléfono <span className="text-[var(--color-error)]">*</span></label>
            <div className={`${inputWrap} ${fieldErrors.phone ? "border-[var(--color-error)]" : ""}`}>
              <Phone className={iconWrap} size={18} strokeWidth={1.5} />
              <input name="phone" type="tel" maxLength={9} autoComplete="off" className={inputBase} placeholder="9 dígitos" />
            </div>
            {fieldErrors.phone
              ? <p className="mt-1 text-[11px] text-[var(--color-error)]">{fieldErrors.phone}</p>
              : <p className="mt-1 text-[11px] text-[var(--color-on-surface-variant)]">Exactamente 9 dígitos</p>
            }
          </div>

          {/* Email */}
          <div>
            <label className={labelClass}>Correo electrónico <span className="text-[var(--color-error)]">*</span></label>
            <div className={`${inputWrap} ${fieldErrors.email ? "border-[var(--color-error)]" : ""}`}>
              <Mail className={iconWrap} size={18} strokeWidth={1.5} />
              <input name="email" type="text" autoComplete="new-email" className={inputBase} placeholder="ejemplo@correo.com" />
            </div>
            {fieldErrors.email && <p className="mt-1 text-[11px] text-[var(--color-error)]">{fieldErrors.email}</p>}
          </div>

          {/* Contraseña */}
          <div>
            <label className={labelClass}>Contraseña <span className="text-[var(--color-error)]">*</span></label>
            <div className={`${inputWrap} pr-10 ${fieldErrors.password ? "border-[var(--color-error)]" : ""}`}>
              <Lock className={iconWrap} size={18} strokeWidth={1.5} />
              <input
                name="password" type={showPassword ? "text" : "password"}
                autoComplete="new-password" className={inputBase}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--color-outline)] hover:text-[var(--color-primary)]">
                {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
              </button>
            </div>
            {fieldErrors.password
              ? <p className="mt-1 text-[11px] text-[var(--color-error)]">{fieldErrors.password}</p>
              : <p className="mt-1 text-[11px] text-[var(--color-on-surface-variant)]">Mínimo 6 caracteres</p>
            }
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
