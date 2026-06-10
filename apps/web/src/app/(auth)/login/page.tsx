"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Flower2, Lock, LogIn, Mail, AlertCircle } from "lucide-react";

const heroImageUrl =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCsXuxXAPTc7kutLtbxCXLCQ-0pVwI472LARw_Qz1wUl72Lqjxc0u-TEoWgq1ACzKiSE7Jnk9yFEBP5ouCtch1ZjBolNddRCoih6WgXnMtr3o_6SvhCcpMOMdqhUifJHzdRiv8XRro3gdnenpNxMB1dKvr5ac63nsjydUyMIMRu0QvIsdMty24bb5sKUbabMBQBL9POzXaMJaXPHY_iWi7r2rWFMfeAWqXShwFEPZaHcepbDXpLMmqDez1YHniH7anUltHTKUlotjw";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();

      if (res.status === 403) {
        setError("Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.");
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "Error al iniciar sesión");
        return;
      }

      localStorage.setItem("gm_token", data.token);
      localStorage.setItem("gm_user", JSON.stringify(data.user));
      if (data.user.role === "SUPER_ADMIN") {
        localStorage.setItem("gm_admin", JSON.stringify(data.user));
      }

      if (data.user.role === "SUPER_ADMIN") {
        router.push("/admin/dashboard");
      } else {
        const planStatus = data.user.business?.planStatus;
        if (planStatus === "EXPIRED" || planStatus === "SUSPENDED") {
          router.push("/plan-vencido");
        } else {
          router.push("/dashboard");
        }
      }
    } catch {
      setError("No se pudo conectar con el servidor. ¿Está corriendo la API?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex h-screen w-full overflow-hidden bg-surface font-body-md text-on-surface">
      <section className="hidden w-7/12 overflow-hidden bg-surface-container-high lg:flex lg:h-full">
        <div className="relative h-full w-full">
          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-tr from-on-surface/40 to-transparent mix-blend-multiply" />
          <div
            aria-label="Interior de salón de belleza"
            className="absolute inset-0 bg-cover bg-center"
            role="img"
            style={{ backgroundImage: `url(${heroImageUrl})` }}
          />
        </div>
      </section>

      <section className="relative flex w-full flex-col items-center justify-center overflow-y-auto p-gutter-desktop sm:p-margin-page lg:w-5/12">
        <div className="ambient-shadow relative w-full max-w-[420px] overflow-hidden rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-stack-lg md:p-margin-page">
          <div className="absolute left-0 top-0 h-1 w-full bg-primary" />

          <div className="mb-stack-lg text-center sm:text-left">
            <h1 className="mb-stack-sm flex items-center justify-center gap-2 font-headline-md text-headline-md text-primary sm:justify-start">
              <Flower2 size={26} fill="currentColor" strokeWidth={1.8} />
              GlowManager
            </h1>
            <h2 className="mt-stack-md font-headline-md text-headline-md text-on-surface">
              Bienvenido de nuevo
            </h2>
            <p className="mt-stack-sm font-body-md text-body-md text-on-surface-variant">
              Inicia sesión para gestionar tu agenda y clientes.
            </p>
          </div>

          {/* Error de login */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-error-container/30 border border-error-container px-3 py-2 text-body-md text-error">
              <AlertCircle size={16} strokeWidth={1.5} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-stack-md" autoComplete="off">
            <div>
              <label
                className="mb-stack-sm block font-label-md text-label-md uppercase text-on-surface-variant"
                htmlFor="email"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="text-outline" size={20} />
                </div>
                <input
                  className="input-glow block w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-[10px] pl-10 pr-3 font-body-md text-body-md text-on-surface placeholder:text-outline transition-colors duration-200"
                  id="email"
                  name="email"
                  required
                  type="email"
                  autoComplete="off"
                />
              </div>
            </div>

            <div>
              <label
                className="mb-stack-sm block font-label-md text-label-md uppercase text-on-surface-variant"
                htmlFor="password"
              >
                Contraseña
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="text-outline" size={20} />
                </div>
                <input
                  className="input-glow block w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-[10px] pl-10 pr-3 font-body-md text-body-md text-on-surface placeholder:text-outline transition-colors duration-200"
                  id="password"
                  name="password"
                  required
                  type="password"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-stack-sm">
              <div className="flex items-center">
                <input
                  className="h-4 w-4 cursor-pointer rounded border-outline-variant bg-surface-container-lowest text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-container-lowest"
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label
                  className="ml-2 block cursor-pointer font-body-md text-body-md text-on-surface"
                  htmlFor="remember-me"
                >
                  Recordarme
                </label>
              </div>
              <Link
                className="font-label-md text-label-md text-primary transition-colors hover:text-primary-container"
                href="/recuperar-contrasena"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <div className="pt-stack-md">
              <button
                disabled={loading}
                className="flex w-full items-center justify-center rounded-lg border border-transparent bg-primary px-4 py-3 font-label-md text-label-md text-on-primary shadow-sm transition-all duration-200 hover:bg-surface-tint focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                type="submit"
              >
                {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                {!loading && <LogIn className="ml-2" size={18} />}
              </button>
            </div>
          </form>
        </div>

        {/* Link a registro */}
        <div className="mt-4 text-center">
          <p className="font-body-md text-body-md text-on-surface-variant">
            ¿No tienes cuenta?{" "}
            <Link
              href="/registro"
              className="font-label-md text-label-md text-primary underline-offset-4 transition-all hover:underline"
            >
              Registrarse gratis →
            </Link>
          </p>
        </div>

      </section>
    </main>
  );
}
