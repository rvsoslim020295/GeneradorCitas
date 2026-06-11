// Utilidades de zona horaria (auditoría Sprint 4).
// Toda la lógica de agenda debe calcular en la zona horaria del negocio
// (business.timezone), no en la del proceso Node (UTC en Railway).
//
// Nota: el algoritmo de offset es exacto salvo en la hora exacta de un cambio
// de horario de verano (DST). América/Lima no tiene DST, así que es exacto.

// Minutos desde medianoche de un instante, expresados en la zona `tz`.
export function minutesInZone(date: Date, tz: string): number {
  const [h, m] = date
    .toLocaleTimeString("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit" })
    .split(":")
    .map(Number);
  return h * 60 + m;
}

// Offset en ms entre la hora de pared en `tz` y UTC, para el instante dado.
function tzOffsetMs(instant: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const p: Record<string, string> = {};
  for (const part of dtf.formatToParts(instant)) p[part.type] = part.value;
  // "24" puede aparecer a medianoche en algunos entornos; normalizar a 0.
  const hour = p.hour === "24" ? "0" : p.hour;
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +hour, +p.minute, +p.second);
  // Los offsets de zona horaria son siempre minutos enteros; redondeamos para
  // eliminar el error introducido por los milisegundos descartados de `instant`.
  return Math.round((asUTC - instant.getTime()) / 60000) * 60000;
}

// Convierte una hora de pared (fecha YYYY-MM-DD + h/m/s/ms) en `tz` al instante UTC.
export function zonedWallTimeToUtc(
  dateStr: string,
  h: number, m: number, s: number, ms: number,
  tz: string,
): Date {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, m, s, ms);
  const offset = tzOffsetMs(new Date(guess), tz);
  return new Date(guess - offset);
}

// Rango [start, end] en UTC del día calendario `dateStr` (YYYY-MM-DD) en `tz`.
export function zonedDayRange(dateStr: string, tz: string): { start: Date; end: Date } {
  return {
    start: zonedWallTimeToUtc(dateStr, 0, 0, 0, 0, tz),
    end: zonedWallTimeToUtc(dateStr, 23, 59, 59, 999, tz),
  };
}

// Fecha local "YYYY-MM-DD" del instante en `tz`.
export function zonedDateStr(date: Date, tz: string): string {
  return date.toLocaleDateString("en-CA", { timeZone: tz }); // en-CA → YYYY-MM-DD
}

// Día de la semana (0=Dom … 6=Sáb) del instante en `tz`.
export function zonedWeekday(date: Date, tz: string): number {
  const wd = date.toLocaleDateString("en-US", { timeZone: tz, weekday: "short" });
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
}

// Hora (0-23) del instante en `tz`.
export function zonedHour(date: Date, tz: string): number {
  const h = date.toLocaleTimeString("en-GB", { timeZone: tz, hour: "2-digit", hour12: false }).slice(0, 2);
  return +h % 24;
}
