import {
  LayoutDashboard,
  Calendar,
  Users,
  BadgeCheck,
  Scissors,
  BarChart2,
  Settings,
  Plus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, active: true },
  { label: "Agenda", href: "#", icon: Calendar },
  { label: "Clientes", href: "#", icon: Users },
  { label: "Colaboradores", href: "#", icon: BadgeCheck },
  { label: "Servicios", href: "#", icon: Scissors },
  { label: "Reportes", href: "#", icon: BarChart2 },
  { label: "Configuración", href: "#", icon: Settings },
];

export function Sidebar() {
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
        {navItems.map(({ label, href, icon: Icon, active }) => (
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
        ))}
      </div>

      {/* CTA */}
      <div className="mt-auto pt-6">
        <button className="w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold uppercase tracking-wider py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors shadow-md">
          <Plus size={18} strokeWidth={2} />
          Nueva Cita Rápida
        </button>
      </div>
    </nav>
  );
}
