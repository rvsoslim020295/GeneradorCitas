import { Users, UserX } from "lucide-react";

const collaborators = [
  {
    name: "Diego F.",
    initials: "DF",
    occupancy: 85,
    label: "85% Ocupado",
    status: "En cita (Termina 14:15)",
    statusColor: "bg-[var(--color-error)]",
    barColor: "bg-[var(--color-primary)]",
    offline: false,
  },
  {
    name: "Sofía M.",
    initials: "SM",
    occupancy: 40,
    label: "40% Ocupada",
    status: "Libre hasta 15:00",
    statusColor: "bg-[var(--color-secondary-container)]",
    barColor: "bg-[var(--color-secondary-container)]",
    offline: false,
  },
  {
    name: "Luis G.",
    initials: "LG",
    occupancy: 0,
    label: "",
    status: "Día Libre",
    statusColor: "",
    barColor: "",
    offline: true,
  },
];

export function ActiveTeam() {
  return (
    <div className="col-span-12 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] mt-3 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-[var(--color-outline-variant)] pb-3">
        <h3 className="text-headline-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
          <Users size={20} className="text-[var(--color-primary)]" strokeWidth={1.5} />
          Equipo Activo Hoy
        </h3>
        <button className="text-[var(--color-primary)] text-label-md font-semibold hover:underline">
          Ver Agenda Completa
        </button>
      </div>

      {/* Tarjetas de colaboradores */}
      <div className="grid grid-cols-3 gap-6">
        {collaborators.map((collab) => (
          <div
            key={collab.name}
            className={`border border-[var(--color-outline-variant)] rounded-lg p-3 flex items-center gap-3 ${
              collab.offline ? "opacity-60" : ""
            }`}
          >
            {collab.offline ? (
              <div className="w-12 h-12 rounded-full bg-[var(--color-surface-container-high)] flex items-center justify-center shrink-0">
                <UserX size={20} className="text-[var(--color-on-surface-variant)]" strokeWidth={1.5} />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-[var(--color-primary-container)] flex items-center justify-center shrink-0">
                <span className="text-label-md font-bold text-[var(--color-primary)]">
                  {collab.initials}
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-label-md font-semibold text-[var(--color-on-surface)]">
                  {collab.name}
                </span>
                {collab.label && (
                  <span className="text-body-md text-[var(--color-on-surface-variant)] text-[12px]">
                    {collab.label}
                  </span>
                )}
              </div>

              {!collab.offline && (
                <div className="w-full bg-[var(--color-surface-container-high)] h-2 rounded-full overflow-hidden mb-1">
                  <div
                    className={`${collab.barColor} h-full rounded-full`}
                    style={{ width: `${collab.occupancy}%` }}
                  />
                </div>
              )}

              <div className="text-body-md text-[var(--color-on-surface-variant)] text-[12px] flex items-center gap-1">
                {collab.statusColor && (
                  <span className={`w-2 h-2 rounded-full shrink-0 ${collab.statusColor}`} />
                )}
                {collab.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
