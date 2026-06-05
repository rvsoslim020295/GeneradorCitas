import { AlertTriangle, AlertCircle, ClipboardList, ChevronRight } from "lucide-react";

const alerts = [
  {
    icon: AlertCircle,
    iconColor: "text-[var(--color-error)]",
    bg: "bg-[var(--color-error-container)]/30 border-[var(--color-error-container)]",
    chevronColor: "text-[var(--color-error)] hover:bg-[var(--color-error-container)]",
    title: "2 citas sin confirmar",
    description: "Para mañana en la mañana.",
  },
  {
    icon: ClipboardList,
    iconColor: "text-[var(--color-tertiary-container)]",
    bg: "bg-[var(--color-tertiary-fixed)]/30 border-[var(--color-tertiary-fixed)]",
    chevronColor: "text-[var(--color-tertiary-container)] hover:bg-[var(--color-tertiary-fixed)]",
    title: "1 cita completada sin cobro",
    description: "María P. (Terminó hace 10m).",
  },
];

export function AlertsWidget() {
  return (
    <div className="col-span-4 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 text-[var(--color-error)] text-label-md font-semibold uppercase tracking-wider mb-3">
        <AlertTriangle size={16} strokeWidth={1.5} />
        Acción Requerida
      </div>

      {/* Alertas */}
      <div className="flex flex-col gap-2 flex-1">
        {alerts.map((alert) => (
          <div
            key={alert.title}
            className={`${alert.bg} border rounded-lg p-3 flex items-start gap-2`}
          >
            <alert.icon size={18} strokeWidth={1.5} className={`${alert.iconColor} mt-0.5 shrink-0`} />
            <div className="flex-1 min-w-0">
              <p className="text-label-md font-semibold text-[var(--color-on-surface)]">
                {alert.title}
              </p>
              <p className="text-body-md text-[var(--color-on-surface-variant)] text-[12px]">
                {alert.description}
              </p>
            </div>
            <button className={`${alert.chevronColor} p-1 rounded transition-colors shrink-0`}>
              <ChevronRight size={16} strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
