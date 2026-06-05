import { Hourglass, CheckCircle, CheckCheck, XCircle } from "lucide-react";

const statuses = [
  {
    label: "Pendientes",
    count: 8,
    icon: Hourglass,
    iconBg: "bg-[var(--color-surface-container-high)]",
    iconColor: "text-[var(--color-on-surface-variant)]",
    accent: null,
    opacity: "",
  },
  {
    label: "Confirmadas",
    count: 14,
    icon: CheckCircle,
    iconBg: "bg-[var(--color-secondary-fixed)]",
    iconColor: "text-[var(--color-on-secondary-container)]",
    accent: "bg-[var(--color-secondary-container)]",
    opacity: "",
  },
  {
    label: "Completadas",
    count: 5,
    icon: CheckCheck,
    iconBg: "bg-[var(--color-primary)]/20",
    iconColor: "text-[var(--color-primary)]",
    accent: "bg-[var(--color-primary)]",
    opacity: "",
  },
  {
    label: "Canceladas",
    count: 2,
    icon: XCircle,
    iconBg: "bg-[var(--color-error-container)]/50",
    iconColor: "text-[var(--color-error)]",
    accent: null,
    opacity: "opacity-75",
  },
];

export function StatusSummary() {
  return (
    <div className="col-span-12 grid grid-cols-4 gap-6 mt-3">
      {statuses.map(({ label, count, icon: Icon, iconBg, iconColor, accent, opacity }) => (
        <div
          key={label}
          className={`bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] p-3 flex items-center gap-3 hover:border-[var(--color-outline)] transition-colors relative overflow-hidden ${opacity}`}
        >
          {accent && (
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${accent}`} />
          )}
          <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center`}>
            <Icon size={22} strokeWidth={1.5} className={iconColor} />
          </div>
          <div>
            <div className="text-display-lg font-bold text-[var(--color-on-surface)] leading-none">
              {count}
            </div>
            <div className="text-label-md text-[var(--color-on-surface-variant)]">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
