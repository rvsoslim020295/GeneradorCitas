"use client";

import {
  LayoutDashboard, Calendar, Users, BadgeCheck,
  Scissors, BarChart2, Settings, Plus, Sparkles, Zap, Package, X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useRole } from "@/hooks/use-role";
import { apiFetch } from "@/lib/api/client";
import { useSidebar } from "@/hooks/use-sidebar";

const allNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, ownerOnly: false, collaboratorHidden: true },
  { label: "Agenda", href: "/agenda", icon: Calendar, ownerOnly: false, collaboratorHidden: false },
  { label: "Clientes", href: "/clientes", icon: Users, ownerOnly: false, collaboratorHidden: true },
  { label: "Colaboradores", href: "/colaboradores", icon: BadgeCheck, ownerOnly: false, collaboratorHidden: true },
  { label: "Servicios", href: "/servicios", icon: Scissors, ownerOnly: false, collaboratorHidden: true },
  { label: "Paquetes", href: "/paquetes", icon: Package, ownerOnly: true, collaboratorHidden: true },
  { label: "Reportes", href: "/reportes", icon: BarChart2, ownerOnly: true, collaboratorHidden: true },
  { label: "Configuración", href: "/configuracion", icon: Settings, ownerOnly: true, collaboratorHidden: true },
];

type SidebarProps = {
  activePath: string;
};

// Duración total del trial en días
const TRIAL_DAYS = 7;

export function Sidebar({ activePath }: SidebarProps) {
  const role = useRole();
  const { isOpen, close } = useSidebar();
  const pathname = usePathname();

  // Cerrar sidebar al navegar en móvil
  useEffect(() => { close(); }, [pathname, close]);
  const navItems = allNavItems.filter((item) => {
    if (item.ownerOnly && role !== "OWNER" && role !== null) return false;
    if (item.collaboratorHidden && role === "COLLABORATOR") return false;
    return true;
  });
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<{ business?: { trialDaysLeft?: number } }>("/auth/me")
      .then((data) => {
        if (data?.business?.trialDaysLeft !== undefined) {
          setTrialDaysLeft(data.business.trialDaysLeft);
        }
      })
      .catch(() => {});
  }, []);

  const showTrialBanner = trialDaysLeft !== null && trialDaysLeft >= 0 && (role === "OWNER" || role === null);
  const progressPct = trialDaysLeft !== null
    ? Math.max(0, Math.round((trialDaysLeft / TRIAL_DAYS) * 100))
    : 0;

  return (
    <>
      {/* Overlay móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={close}
        />
      )}

    <nav className={`bg-[var(--color-surface)] h-full w-64 fixed left-0 top-0 border-r border-[var(--color-outline-variant)] shadow-sm flex flex-col py-2 px-3 z-50
      transition-transform duration-300 ease-in-out
      ${isOpen ? "translate-x-0" : "-translate-x-full"}
      md:translate-x-0`}>
      {/* Logo + botón cerrar en móvil */}
      <div className="flex items-center gap-3 px-1 py-3 mb-6">
        <button
          onClick={close}
          className="md:hidden ml-auto p-1.5 rounded-lg text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] transition-colors absolute right-3 top-3"
        >
          <X size={20} strokeWidth={1.5} />
        </button>
        <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-container)] flex items-center justify-center shrink-0">
          <Sparkles size={20} className="text-[var(--color-on-primary-container)]" />
        </div>
        <div>
          <h1 className="text-headline-md font-bold text-[var(--color-primary)] leading-tight">
            GlowManager
          </h1>
          <p className="text-label-md text-[var(--color-on-surface-variant)] font-normal">
            Premium Salon Suite
          </p>
        </div>
      </div>

      {/* Nav links */}
      <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = activePath === href;
          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-label-md font-semibold uppercase tracking-wider transition-all duration-150 ${
                active
                  ? "text-[var(--color-primary)] bg-[var(--color-primary)]/10"
                  : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.5} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Banner de trial gratuito */}
      {showTrialBanner && (
        <div className={`mx-1 mb-3 rounded-xl p-3 border ${
          trialDaysLeft === 0
            ? "bg-[var(--color-error-container)]/30 border-[var(--color-error-container)]"
            : trialDaysLeft !== null && trialDaysLeft <= 2
            ? "bg-[var(--color-tertiary-fixed)]/30 border-[var(--color-tertiary-fixed-dim)]"
            : "bg-[var(--color-primary-container)]/10 border-[var(--color-primary-fixed)]"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} strokeWidth={2} className={
              trialDaysLeft === 0
                ? "text-[var(--color-error)]"
                : trialDaysLeft !== null && trialDaysLeft <= 2
                ? "text-[var(--color-tertiary)]"
                : "text-[var(--color-primary)]"
            } />
            <span className={`text-label-md font-semibold ${
              trialDaysLeft === 0
                ? "text-[var(--color-error)]"
                : trialDaysLeft !== null && trialDaysLeft <= 2
                ? "text-[var(--color-tertiary)]"
                : "text-[var(--color-primary)]"
            }`}>
              {trialDaysLeft === 0
                ? "Trial expirado"
                : `${trialDaysLeft} día${trialDaysLeft !== 1 ? "s" : ""} restante${trialDaysLeft !== 1 ? "s" : ""}`
              }
            </span>
          </div>

          {/* Barra de progreso */}
          <div className="w-full h-1.5 bg-[var(--color-surface-variant)] rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all ${
                trialDaysLeft === 0
                  ? "bg-[var(--color-error)]"
                  : trialDaysLeft !== null && trialDaysLeft <= 2
                  ? "bg-[var(--color-tertiary)]"
                  : "bg-[var(--color-primary)]"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <p className="text-[10px] text-[var(--color-on-surface-variant)] mb-2">
            {trialDaysLeft === 0
              ? "Actualiza tu plan para continuar."
              : "Prueba gratuita de 7 días"
            }
          </p>

          <Link href="/planes" className="block w-full text-center text-[10px] font-semibold bg-[var(--color-primary)] text-[var(--color-on-primary)] py-1.5 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors">
            Actualizar Plan
          </Link>
        </div>
      )}

      {/* CTA */}
      <div className="pt-2 pb-1">
        <Link
          href="/nueva-cita"
          className="w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold uppercase tracking-wider py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors shadow-md"
        >
          <Plus size={18} strokeWidth={2} />
          Nueva Cita Rápida
        </Link>
      </div>
    </nav>
    </>
  );
}
