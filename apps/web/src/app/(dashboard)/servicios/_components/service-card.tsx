import { Clock } from "lucide-react";

type Service = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  durationMin: number;
  price: number;
};

// Color del acento izquierdo según categoría
const categoryAccent: Record<string, string> = {
  "Peluquería": "bg-[var(--color-secondary)]",
  "Estética": "bg-[var(--color-tertiary)]",
  "Barbería": "bg-[var(--color-primary)]",
};

function getAccent(category: string) {
  return categoryAccent[category] ?? "bg-[var(--color-primary)]";
}

export function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="glass-panel rounded-xl p-4 hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer relative overflow-hidden">
      {/* Barra de color izquierda según categoría */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${getAccent(service.category)}`} />

      <div className="pl-3 space-y-2">
        {/* Nombre + precio */}
        <div className="flex justify-between items-start">
          <h3 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">
            {service.name}
          </h3>
          <span className="text-label-md font-semibold text-[var(--color-primary)] bg-[var(--color-primary-container)]/30 px-2.5 py-1 rounded-full shrink-0 ml-2">
            S/{service.price.toFixed(2)}
          </span>
        </div>

        {/* Descripción */}
        {service.description && (
          <p className="text-body-md text-[var(--color-on-surface-variant)] line-clamp-2">
            {service.description}
          </p>
        )}

        {/* Duración */}
        <div className="flex items-center gap-1 text-[var(--color-outline)] text-label-md">
          <Clock size={14} strokeWidth={1.5} />
          {service.durationMin} min
        </div>
      </div>
    </div>
  );
}
