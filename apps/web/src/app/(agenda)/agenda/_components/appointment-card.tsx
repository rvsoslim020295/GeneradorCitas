import { Clock, CheckCircle, CheckCheck } from "lucide-react";

// Paleta de 8 colores distintos para colaboradores
export const COLLAB_PALETTE = [
  { bg: "#eef2ff", border: "#6366f1", text: "#4338ca" }, // indigo
  { bg: "#ecfdf5", border: "#10b981", text: "#065f46" }, // emerald
  { bg: "#fffbeb", border: "#f59e0b", text: "#92400e" }, // amber
  { bg: "#fff1f2", border: "#f43f5e", text: "#9f1239" }, // rose
  { bg: "#ecfeff", border: "#06b6d4", text: "#155e75" }, // cyan
  { bg: "#f5f3ff", border: "#8b5cf6", text: "#4c1d95" }, // violet
  { bg: "#fff7ed", border: "#f97316", text: "#7c2d12" }, // orange
  { bg: "#f0fdf4", border: "#22c55e", text: "#14532d" }, // green
];

type AppointmentStatus = "pending" | "confirmed" | "completed";

const statusIcon: Record<AppointmentStatus, React.FC<{ size: number; strokeWidth: number }>> = {
  pending: Clock,
  confirmed: CheckCircle,
  completed: CheckCheck,
};

type AppointmentCardProps = {
  service: string;
  client: string;
  status: AppointmentStatus;
  topPx: number;
  heightPx: number;
  collabColorIndex?: number;
  badge?: string;
};

export function AppointmentCard({
  service, client, status, topPx, heightPx, collabColorIndex = 0, badge,
}: AppointmentCardProps) {
  const color = COLLAB_PALETTE[collabColorIndex % COLLAB_PALETTE.length];
  const Icon = statusIcon[status];
  const isCompact = heightPx <= 36;

  return (
    <div
      className="absolute left-1 right-1 rounded-md overflow-hidden hover:brightness-95 transition-all cursor-pointer shadow-sm hover:shadow-md"
      style={{
        top: `${topPx}px`,
        height: `${heightPx}px`,
        backgroundColor: color.bg,
        borderTopWidth: "1px",
        borderRightWidth: "1px",
        borderBottomWidth: "1px",
        borderLeftWidth: "3px",
        borderStyle: "solid",
        borderColor: `${color.border}33`,
        borderLeftColor: color.border,
      }}
    >
      <div className={isCompact ? "flex items-center gap-1 px-2 h-full" : "p-2 flex flex-col gap-0.5"}>
        <p
          className="text-[11px] font-semibold truncate flex-1"
          style={{ color: color.text }}
        >
          {service}
        </p>
        {!isCompact && (
          <p className="text-[10px] truncate" style={{ color: color.text, opacity: 0.75 }}>
            {client}
          </p>
        )}
        {!isCompact && badge && (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full self-start mt-0.5"
            style={{ backgroundColor: `${color.border}22`, color: color.text }}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="absolute top-1 right-1">
        <Icon size={isCompact ? 10 : 12} strokeWidth={2} />
      </div>
    </div>
  );
}
