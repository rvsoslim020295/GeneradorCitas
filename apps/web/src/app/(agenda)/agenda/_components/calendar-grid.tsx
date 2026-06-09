import Link from "next/link";
import { AppointmentCard, COLLAB_PALETTE } from "./appointment-card";
import type { AppointmentData } from "../page";
import type { ViewOption } from "./agenda-toolbar";

const PX_PER_HOUR = 64;
const START_HOUR = 8;
const HOURS = Array.from({ length: 14 }, (_, i) => i + START_HOUR); // 08:00 – 22:00

const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_ES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toTop(iso: string) {
  const d = new Date(iso);
  return (d.getHours() - START_HOUR) * PX_PER_HOUR + (d.getMinutes() / 60) * PX_PER_HOUR;
}
function toHeight(startIso: string, endIso: string) {
  const diff = (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000;
  return Math.max((diff / 60) * PX_PER_HOUR, 28);
}
function toStatus(s: string): "pending" | "confirmed" | "completed" {
  if (s === "COMPLETED") return "completed";
  if (s === "CONFIRMED") return "confirmed";
  return "pending";
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}
function getWeekStart(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // start on Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

const nowTop = (() => {
  const now = new Date();
  return (now.getHours() - START_HOUR) * PX_PER_HOUR + (now.getMinutes() / 60) * PX_PER_HOUR;
})();

// ─── Build collab color map ───────────────────────────────────────────────────

function buildCollabColorMap(appointments: AppointmentData[]): Map<string, number> {
  const map = new Map<string, number>();
  let idx = 0;
  for (const apt of appointments) {
    if (!map.has(apt.collaborator.id)) {
      map.set(apt.collaborator.id, idx % COLLAB_PALETTE.length);
      idx++;
    }
  }
  return map;
}

// ─── Buffer Block ─────────────────────────────────────────────────────────────

function BufferBlock({ topPx, heightPx }: { topPx: number; heightPx: number }) {
  if (heightPx < 4) return null;
  return (
    <div
      className="absolute left-0 right-0 pointer-events-none z-10"
      style={{
        top: topPx,
        height: heightPx,
        background: "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.06) 4px, rgba(0,0,0,0.06) 8px)",
        borderTop: "1px dashed var(--color-outline-variant)",
        opacity: 0.7,
      }}
    />
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

type Props = { appointments: AppointmentData[]; allAppointments?: AppointmentData[]; view: ViewOption; currentDate: Date };

export function CalendarGrid({ appointments, allAppointments, view, currentDate }: Props) {
  // La leyenda de colores usa TODOS los colaboradores para mantener colores estables al filtrar
  const collabColors = buildCollabColorMap(allAppointments ?? appointments);
  const gridHeight = HOURS.length * PX_PER_HOUR;

  if (view === "Día") return <DayView appointments={appointments} currentDate={currentDate} collabColors={collabColors} gridHeight={gridHeight} />;
  if (view === "Semana") return <WeekView appointments={appointments} currentDate={currentDate} collabColors={collabColors} gridHeight={gridHeight} />;
  return <MonthView appointments={appointments} currentDate={currentDate} collabColors={collabColors} />;
}

// ─── Legend (shared) ─────────────────────────────────────────────────────────

function CollabLegend({ appointments, collabColors }: { appointments: AppointmentData[]; collabColors: Map<string, number> }) {
  const seen = new Map<string, { name: string; colorIdx: number }>();
  for (const apt of appointments) {
    if (!seen.has(apt.collaborator.id)) {
      seen.set(apt.collaborator.id, { name: apt.collaborator.name, colorIdx: collabColors.get(apt.collaborator.id) ?? 0 });
    }
  }
  if (seen.size === 0) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--color-outline-variant)]/50 bg-[var(--color-surface)] flex-wrap shrink-0">
      {Array.from(seen.values()).map(({ name, colorIdx }) => {
        const color = COLLAB_PALETTE[colorIdx];
        return (
          <div key={name} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color.border }} />
            <span className="text-label-md text-[var(--color-on-surface-variant)]">{name}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Time Column (shared) ─────────────────────────────────────────────────────

function TimeColumn({ gridHeight }: { gridHeight: number }) {
  return (
    <div className="w-16 shrink-0 border-r border-[var(--color-outline-variant)] bg-[var(--color-surface)] relative z-0" style={{ height: gridHeight }}>
      {HOURS.map(h => (
        <div key={h} className="flex items-start justify-end pr-2 pt-1" style={{ height: PX_PER_HOUR }}>
          <span className="text-[10px] text-[var(--color-outline)] -mt-3 bg-[var(--color-surface)] px-0.5">
            {String(h).padStart(2, "0")}:00
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Hour grid lines (shared) ─────────────────────────────────────────────────

function GridLines({ gridHeight }: { gridHeight: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col z-0" style={{ height: gridHeight }}>
      {HOURS.map(h => (
        <div key={h} className="shrink-0" style={{ height: PX_PER_HOUR }}>
          <div className="h-1/2 w-full border-b border-dashed border-[var(--color-outline-variant)]/20" />
          <div className="h-1/2 w-full border-b border-[var(--color-outline-variant)]/40" />
        </div>
      ))}
    </div>
  );
}

// ─── Day View ────────────────────────────────────────────────────────────────

function DayView({ appointments, currentDate, collabColors, gridHeight }: {
  appointments: AppointmentData[]; currentDate: Date; collabColors: Map<string, number>; gridHeight: number;
}) {
  const dayApts = appointments.filter(a => isSameDay(new Date(a.startTime), currentDate)
    && !["CANCELLED", "NO_SHOW", "RESCHEDULED"].includes(a.status));

  // Group by collaborator
  const collabMap = new Map<string, { name: string; appointments: AppointmentData[] }>();
  for (const apt of dayApts) {
    const cid = apt.collaborator.id;
    if (!collabMap.has(cid)) collabMap.set(cid, { name: apt.collaborator.name, appointments: [] });
    collabMap.get(cid)!.appointments.push(apt);
  }
  const collabs = Array.from(collabMap.entries());
  const isToday = isSameDay(currentDate, new Date());

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <CollabLegend appointments={appointments} collabColors={collabColors} />

      {/* El header y el grid van en el mismo contenedor scrolleable para alinear columnas */}
      <div className="flex-1 overflow-auto" style={{ scrollbarWidth: "thin" }}>
        {/* Header colaboradores — sticky para mantenerse visible al hacer scroll vertical */}
        <div className="sticky top-0 z-30 flex bg-[var(--color-surface)] border-b border-[var(--color-outline-variant)] h-12">
          <div className="w-16 shrink-0 border-r border-[var(--color-outline-variant)]" />
          {collabs.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-body-md text-[var(--color-on-surface-variant)]">
              Sin citas para este día
            </div>
          ) : (
            collabs.map(([cid, collab], i) => {
              const colorIdx = collabColors.get(cid) ?? 0;
              const color = COLLAB_PALETTE[colorIdx];
              return (
                <div key={cid} className={`flex-1 flex items-center justify-center gap-2 ${i < collabs.length - 1 ? "border-r border-[var(--color-outline-variant)]" : ""}`}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ backgroundColor: color.border }}>
                    {getInitials(collab.name)}
                  </div>
                  <span className="text-label-md font-semibold text-[var(--color-on-surface)] truncate">{collab.name}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Cuerpo del grid */}
        <div className="flex" style={{ height: gridHeight }}>
          <TimeColumn gridHeight={gridHeight} />
          <div className="flex-1 flex relative">
            <GridLines gridHeight={gridHeight} />
            {/* Línea hora actual */}
            {isToday && nowTop >= 0 && nowTop <= gridHeight && (
              <div className="absolute w-full flex items-center z-20 pointer-events-none" style={{ top: nowTop }}>
                <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0" />
                <div className="h-px w-full bg-red-500" />
              </div>
            )}
            {collabs.length === 0 ? (
              <div className="flex-1 relative" />
            ) : (
              collabs.map(([cid, collab], i) => {
                const colorIdx = collabColors.get(cid) ?? 0;
                return (
                  <div key={cid} className={`flex-1 relative z-10 ${i < collabs.length - 1 ? "border-r border-[var(--color-outline-variant)]/50" : ""}`} style={{ height: gridHeight }}>
                    {collab.appointments.map(apt => {
                      const bufferPx = ((apt.service.bufferMinutes ?? 0) / 60) * PX_PER_HOUR;
                      return (
                        <div key={apt.id}>
                          <Link href={`/citas/${apt.id}`}>
                            <AppointmentCard
                              service={apt.service.name}
                              client={apt.client.name}
                              status={toStatus(apt.status)}
                              topPx={toTop(apt.startTime)}
                              heightPx={toHeight(apt.startTime, apt.endTime)}
                              collabColorIndex={colorIdx}
                              badge={apt.status === "COMPLETED" ? "Pagado" : undefined}
                            />
                          </Link>
                          <BufferBlock topPx={toTop(apt.startTime) + toHeight(apt.startTime, apt.endTime)} heightPx={bufferPx} />
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Week View ───────────────────────────────────────────────────────────────

function WeekView({ appointments, currentDate, collabColors, gridHeight }: {
  appointments: AppointmentData[]; currentDate: Date; collabColors: Map<string, number>; gridHeight: number;
}) {
  const weekStart = getWeekStart(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  const today = new Date();

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <CollabLegend appointments={appointments} collabColors={collabColors} />

      <div className="flex-1 overflow-auto" style={{ scrollbarWidth: "thin" }}>
        {/* Header días — sticky */}
        <div className="sticky top-0 z-30 flex bg-[var(--color-surface)] border-b border-[var(--color-outline-variant)] h-12">
          <div className="w-16 shrink-0 border-r border-[var(--color-outline-variant)]" />
          {days.map((day, i) => {
            const isToday = isSameDay(day, today);
            return (
              <div key={i} className={`flex-1 flex flex-col items-center justify-center border-r border-[var(--color-outline-variant)] last:border-0 ${isToday ? "bg-[var(--color-primary)]/5" : ""}`}>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${isToday ? "text-[var(--color-primary)]" : "text-[var(--color-on-surface-variant)]"}`}>
                  {DAYS_ES[day.getDay()]}
                </span>
                <span className={`text-label-md font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-on-surface)]"}`}>
                  {day.getDate()}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex" style={{ height: gridHeight }}>
          <TimeColumn gridHeight={gridHeight} />
          <div className="flex-1 flex relative">
            <GridLines gridHeight={gridHeight} />
            {/* Línea hora actual en el día de hoy */}
            {days.some(d => isSameDay(d, today)) && nowTop >= 0 && nowTop <= gridHeight && (() => {
              const todayIdx = days.findIndex(d => isSameDay(d, today));
              if (todayIdx === -1) return null;
              const pct = (todayIdx / 7) * 100;
              const w = 100 / 7;
              return (
                <div className="absolute flex items-center z-20 pointer-events-none" style={{ top: nowTop, left: `${pct}%`, width: `${w}%` }}>
                  <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0" />
                  <div className="h-px w-full bg-red-500" />
                </div>
              );
            })()}
            {days.map((day, i) => {
              const dayApts = appointments.filter(a =>
                isSameDay(new Date(a.startTime), day) && !["CANCELLED","NO_SHOW","RESCHEDULED"].includes(a.status));
              const isToday = isSameDay(day, today);
              return (
                <div key={i} className={`flex-1 relative z-10 border-r border-[var(--color-outline-variant)]/50 last:border-0 ${isToday ? "bg-[var(--color-primary)]/3" : ""}`} style={{ height: gridHeight }}>
                  {dayApts.map(apt => {
                    const bufferPx = ((apt.service.bufferMinutes ?? 0) / 60) * PX_PER_HOUR;
                    return (
                      <div key={apt.id}>
                        <Link href={`/citas/${apt.id}`}>
                          <AppointmentCard
                            service={apt.service.name}
                            client={apt.client.name}
                            status={toStatus(apt.status)}
                            topPx={toTop(apt.startTime)}
                            heightPx={toHeight(apt.startTime, apt.endTime)}
                            collabColorIndex={collabColors.get(apt.collaborator.id) ?? 0}
                            badge={apt.status === "COMPLETED" ? "Pagado" : undefined}
                          />
                        </Link>
                        <BufferBlock topPx={toTop(apt.startTime) + toHeight(apt.startTime, apt.endTime)} heightPx={bufferPx} />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Month View ───────────────────────────────────────────────────────────────

function MonthView({ appointments, currentDate, collabColors }: {
  appointments: AppointmentData[]; currentDate: Date; collabColors: Map<string, number>;
}) {
  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  // Start grid on Monday
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const cells: (Date | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startOffset + 1;
    if (dayNum < 1 || dayNum > daysInMonth) return null;
    return new Date(year, month, dayNum);
  });

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <CollabLegend appointments={appointments} collabColors={collabColors} />

      {/* Day headers */}
      <div className="grid grid-cols-7 shrink-0 bg-[var(--color-surface)] border-b border-[var(--color-outline-variant)]">
        {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map(d => (
          <div key={d} className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)] border-r border-[var(--color-outline-variant)] last:border-0">
            {d}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-auto" style={{ scrollbarWidth: "thin" }}>
        <div className="grid grid-cols-7 h-full" style={{ gridAutoRows: "minmax(100px, 1fr)" }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="border-r border-b border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-low)]/50 last:border-r-0" />;

            const dayApts = appointments.filter(a =>
              isSameDay(new Date(a.startTime), day) && !["CANCELLED","NO_SHOW","RESCHEDULED"].includes(a.status));
            const isToday = isSameDay(day, today);
            const isCurrentMonth = day.getMonth() === month;

            return (
              <div key={i} className={`border-r border-b border-[var(--color-outline-variant)]/40 p-1.5 flex flex-col gap-1 overflow-hidden last:border-r-0 ${isToday ? "bg-[var(--color-primary)]/5" : isCurrentMonth ? "bg-[var(--color-surface)]" : "bg-[var(--color-surface-container-low)]/30"}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-label-md font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-[var(--color-primary)] text-white text-[11px]" : "text-[var(--color-on-surface)]"}`}>
                    {day.getDate()}
                  </span>
                  {dayApts.length > 3 && (
                    <span className="text-[9px] text-[var(--color-on-surface-variant)] font-semibold">+{dayApts.length - 2}</span>
                  )}
                </div>
                {dayApts.slice(0, 3).map(apt => {
                  const colorIdx = collabColors.get(apt.collaborator.id) ?? 0;
                  const color = COLLAB_PALETTE[colorIdx];
                  return (
                    <Link key={apt.id} href={`/citas/${apt.id}`}>
                      <div
                        className="rounded px-1.5 py-0.5 text-[10px] font-semibold truncate hover:brightness-95 transition-all"
                        style={{ backgroundColor: color.bg, color: color.text, borderLeft: `2px solid ${color.border}` }}
                      >
                        {new Date(apt.startTime).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false })} {apt.client.name.split(" ")[0]}
                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
