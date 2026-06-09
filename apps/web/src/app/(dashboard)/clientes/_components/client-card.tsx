import { useRouter } from "next/navigation";
import { MessageSquare, CalendarCheck, Banknote, Copy } from "lucide-react";

type Client = {
  id: string;
  name: string;
  lastName: string | null;
  phone: string | null;
  totalVisits: number;
  totalSpent: number;
};

// Genera un color de fondo distinto para el avatar según la inicial del nombre
const avatarColors = [
  "bg-[var(--color-primary-container)]/20 text-[var(--color-primary)]",
  "bg-[var(--color-secondary-container)]/20 text-[var(--color-secondary)]",
  "bg-[var(--color-tertiary-container)]/10 text-[var(--color-tertiary)]",
  "bg-[var(--color-error-container)]/20 text-[var(--color-error)]",
];

function getAvatarColor(name: string) {
  const index = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[index];
}

function getInitials(name: string, lastName?: string | null) {
  const first = name[0] ?? "";
  const last = lastName ? lastName[0] : (name.split(" ")[1]?.[0] ?? "");
  return (first + last).toUpperCase();
}

function getFullName(name: string, lastName?: string | null) {
  return lastName ? `${name} ${lastName}` : name;
}

function formatCurrency(amount: number) {
  return `S/${amount.toLocaleString("es-PE")}`;
}

export function ClientCard({ client, isDuplicate = false }: { client: Client; isDuplicate?: boolean }) {
  const router = useRouter();
  return (
    <div onClick={() => router.push(`/clientes/${client.id}`)} className={`bg-[var(--color-surface-container-lowest)] rounded-xl border shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer group ${isDuplicate ? "border-amber-400/60" : "border-[var(--color-outline-variant)]"}`}>
      {/* Header: avatar + nombre + botón chat */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-headline-sm font-semibold shrink-0 ${getAvatarColor(client.name)}`}
          >
            {getInitials(client.name, client.lastName)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-body-lg font-semibold text-[var(--color-on-surface)] group-hover:text-[var(--color-primary)] transition-colors">
                {getFullName(client.name, client.lastName)}
              </h3>
              {isDuplicate && (
                <span title="Posible duplicado">
                  <Copy size={12} strokeWidth={2} className="text-amber-500 shrink-0" />
                </span>
              )}
            </div>
            <p className="text-body-md text-[var(--color-on-surface-variant)]">
              {client.phone ?? "Sin teléfono"}
            </p>
          </div>
        </div>

        {/* Botón WhatsApp */}
        {client.phone ? (
          <a
            href={`https://wa.me/${client.phone.replace(/\D/g, "").replace(/^(?!51)/, "51")}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Abrir WhatsApp"
            className="w-10 h-10 rounded-full border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] flex items-center justify-center text-emerald-500 hover:bg-emerald-50 hover:border-emerald-300 transition-all shrink-0"
          >
            <MessageSquare size={18} strokeWidth={1.5} />
          </a>
        ) : (
          <span
            title="Sin número de contacto"
            className="w-10 h-10 rounded-full border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] flex items-center justify-center text-[var(--color-outline)] opacity-40 shrink-0 cursor-not-allowed"
          >
            <MessageSquare size={18} strokeWidth={1.5} />
          </span>
        )}
      </div>

      {/* Stats: visitas y gasto */}
      <div className="flex items-center gap-4 pt-3 border-t border-[var(--color-surface-container-highest)]">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">
            Visitas Totales
          </span>
          <span className="text-body-md font-medium text-[var(--color-on-surface)] flex items-center gap-1 mt-0.5">
            <CalendarCheck size={14} className="text-[var(--color-primary)]" strokeWidth={1.5} />
            {client.totalVisits}
          </span>
        </div>

        <div className="h-8 w-px bg-[var(--color-surface-container-highest)]" />

        <div className="flex flex-col">
          <span className="text-[10px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">
            Gasto Acumulado
          </span>
          <span className="text-body-md font-medium text-[var(--color-on-surface)] flex items-center gap-1 mt-0.5">
            <Banknote size={14} className="text-[var(--color-tertiary)]" strokeWidth={1.5} />
            {formatCurrency(client.totalSpent)}
          </span>
        </div>
      </div>
    </div>
  );
}
