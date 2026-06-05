import { Banknote, TrendingUp } from "lucide-react";

const bars = [
  { height: "30%", filled: true, dim: true },
  { height: "50%", filled: true, dim: true },
  { height: "40%", filled: true, dim: false },
  { height: "80%", filled: true, dim: false, highlight: true },
  { height: "20%", filled: true, dim: true },
  { height: "10%", filled: false },
  { height: "10%", filled: false },
];

export function RevenueWidget() {
  return (
    <div className="col-span-4 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] p-6 flex flex-col justify-between">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] text-label-md font-semibold uppercase tracking-wider">
          <Banknote size={16} strokeWidth={1.5} />
          Ingresos de Hoy
        </div>
        <div className="bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] text-label-md px-2 py-1 rounded-full flex items-center gap-1">
          <TrendingUp size={14} className="text-[var(--color-tertiary-container)]" strokeWidth={2} />
          +12%
        </div>
      </div>

      {/* Monto */}
      <div className="mt-auto">
        <div className="text-display-lg font-bold text-[var(--color-on-surface)] mb-2">
          S/1,240.50
        </div>

        {/* Mini bar chart */}
        <div className="h-12 flex items-end gap-1 w-full mt-3 border-b border-[var(--color-outline-variant)]/50 pb-1">
          {bars.map((bar, i) =>
            bar.filled ? (
              <div
                key={i}
                className={`w-full rounded-t-sm transition-colors ${
                  bar.highlight
                    ? "bg-[var(--color-primary)] hover:bg-[var(--color-primary-container)]"
                    : bar.dim
                    ? "bg-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/40"
                    : "bg-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/60"
                }`}
                style={{ height: bar.height }}
              />
            ) : (
              <div
                key={i}
                className="w-full rounded-t-sm bg-[var(--color-surface-container-high)] border border-dashed border-[var(--color-outline-variant)]"
                style={{ height: bar.height }}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
