"use client";

import {
  LayoutDashboard, Calendar, Users, BadgeCheck,
  Scissors, BarChart2, Settings, Plus, Sparkles, Zap, Package,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRole } from "@/hooks/use-role";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const allNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, ownerOnly: false },
  { label: "Agenda", href: "/agenda", icon: Calendar, ownerOnly: false },
  { label: "Clientes", href: "/clientes", icon: Users, ownerOnly: false },
  { label: "Colaboradores", href: "/colaboradores", icon: BadgeCheck, ownerOnly: false },
  { label: "Servicios", href: "/servicios", icon: Scissors, ownerOnly: false },
  { label: "Paquetes", href: "/paquetes", icon: Package, ownerOnly: true },
  { label: "Reportes", href: "/reportes", icon: BarChart2, ownerOnly: true },
  { label: "Configuración", href: "/configuracion", icon: Settings, ownerOnly: true },
];

type SidebarProps = {
  activePath: string;
};

// Duración total del trial en días
const TRIAL_DAYS = 7;

export function Sidebar({ activePath }: SidebarProps) {
  const role = useRole();
  const navItems = allNavItems.filter((item) => !item.ownerOnly || role === "OWNER" || role === null);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.business?.trialDaysLeft !== undefined) {
          setTrialDaysLeft(data.business.trialDaysLeft);
        }
      })
      .catch(() => {});
  }, []);

  const showTrialBanner = trialDaysLeft !== null && trialDaysLeft >= 0;
  const progressPct = trialDaysLeft !== null
    ? Math.max(0, Math.round((trialDaysLeft / TRIAL_DAYS) * 100))
    : 0;

  return (
    <nav className="bg-[var(--color-surface)] h-full w-64 fixed left-0 top-0 border-r border-[var(--color-outline-variant)] shadow-sm flex flex-col py-2 px-3 z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-1 py-3 mb-6">
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
  );
}
