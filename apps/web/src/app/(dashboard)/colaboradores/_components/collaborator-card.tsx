import Link from "next/link";
import { Pencil, Scissors } from "lucide-react";

type Collaborator = {
  id: string;
  name: string;
  role: string;
  specialties: string[];
  isActive: boolean;
};

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export function CollaboratorCard({ collaborator }: { collaborator: Collaborator }) {
  return (
    <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Header: avatar + info + badge estado + botón editar */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Avatar con iniciales */}
          <div className="w-12 h-12 rounded-full bg-[var(--color-primary-container)]/20 flex items-center justify-center text-[var(--color-primary)] font-semibold text-headline-sm shrink-0">
            {getInitials(collaborator.name)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-body-lg font-semibold text-[var(--color-on-surface)] truncate">
                {collaborator.name}
              </h3>
              {/* Badge activo / inactivo */}
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                  collaborator.isActive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]"
                }`}
              >
                {collaborator.isActive ? "• Activo" : "• Inactivo"}
              </span>
            </div>
            <div className="flex items-center gap-1 text-body-md text-[var(--color-on-surface-variant)] mt-0.5">
              <Scissors size={12} strokeWidth={1.5} />
              {collaborator.role}
            </div>
          </div>
        </div>

        {/* Botón editar */}
        <Link
          href={`/colaboradores/${collaborator.id}`}
          className="w-9 h-9 rounded-full border border-[var(--color-outline-variant)] flex items-center justify-center text-[var(--color-on-surface-variant)] hover:bg-[var(--color-primary-container)]/20 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all shrink-0"
        >
          <Pencil size={15} strokeWidth={1.5} />
        </Link>
      </div>

      {/* Chips de especialidades */}
      {collaborator.specialties.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {collaborator.specialties.map((s) => (
            <span
              key={s}
              className="text-[11px] font-semibold text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] px-2.5 py-1 rounded-full"
            >
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
