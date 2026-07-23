// Días hábiles con calendario de festivos de Colombia (Ley 51 de 1983, "Ley Emiliani").
// Todo el cálculo se hace en UTC sobre componentes de fecha (sin horas) para que
// no dependa de la zona horaria del servidor.

const DAY_MS = 24 * 60 * 60 * 1000;

function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day));
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Domingo de Pascua (computus de Meeus/Jones/Butcher). */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=marzo, 4=abril
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utcDate(year, month - 1, day);
}

/** Traslado Emiliani: si no cae lunes, pasa al lunes siguiente. */
function nextMonday(d: Date): Date {
  const shift = (8 - d.getUTCDay()) % 7;
  return new Date(d.getTime() + shift * DAY_MS);
}

const holidayCache = new Map<number, Set<string>>();

/** Festivos de Colombia del año, como set de 'YYYY-MM-DD'. */
export function colombianHolidays(year: number): Set<string> {
  const cached = holidayCache.get(year);
  if (cached) return cached;

  const easter = easterSunday(year);
  const fromEaster = (days: number) => new Date(easter.getTime() + days * DAY_MS);

  const fixed = [
    utcDate(year, 0, 1),   // Año Nuevo
    utcDate(year, 4, 1),   // Día del Trabajo
    utcDate(year, 6, 20),  // Independencia
    utcDate(year, 7, 7),   // Batalla de Boyacá
    utcDate(year, 11, 8),  // Inmaculada Concepción
    utcDate(year, 11, 25), // Navidad
  ];
  const emiliani = [
    utcDate(year, 0, 6),   // Reyes Magos
    utcDate(year, 2, 19),  // San José
    utcDate(year, 5, 29),  // San Pedro y San Pablo
    utcDate(year, 7, 15),  // Asunción de la Virgen
    utcDate(year, 9, 12),  // Día de la Raza
    utcDate(year, 10, 1),  // Todos los Santos
    utcDate(year, 10, 11), // Independencia de Cartagena
  ].map(nextMonday);
  const easterBased = [
    fromEaster(-3),  // Jueves Santo
    fromEaster(-2),  // Viernes Santo
    fromEaster(43),  // Ascensión del Señor (lunes)
    fromEaster(64),  // Corpus Christi (lunes)
    fromEaster(71),  // Sagrado Corazón (lunes)
  ];

  const set = new Set<string>([...fixed, ...emiliani, ...easterBased].map(ymd));
  holidayCache.set(year, set);
  return set;
}

/** Día hábil = lunes a viernes y no festivo en Colombia. */
export function isBusinessDay(date: Date): boolean {
  const day = date.getUTCDay();
  if (day === 0 || day === 6) return false;
  return !colombianHolidays(date.getUTCFullYear()).has(ymd(date));
}

function startOfUtcDay(date: Date): Date {
  return utcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/** Suma `days` días hábiles a partir de `from` (sin contar el propio `from`). */
export function addBusinessDays(from: Date, days: number): Date {
  let current = startOfUtcDay(from);
  let remaining = days;
  while (remaining > 0) {
    current = new Date(current.getTime() + DAY_MS);
    if (isBusinessDay(current)) remaining--;
  }
  return current;
}

/** Días hábiles entre dos fechas (exclusivo `from`, inclusivo `to`). Negativo si to < from. */
export function businessDaysBetween(from: Date, to: Date): number {
  let a = startOfUtcDay(from);
  const b = startOfUtcDay(to);
  if (b.getTime() < a.getTime()) return -businessDaysBetween(to, from);
  let count = 0;
  while (a.getTime() < b.getTime()) {
    a = new Date(a.getTime() + DAY_MS);
    if (isBusinessDay(a)) count++;
  }
  return count;
}

/** Avance 0–100 del reloj de ejecución según días hábiles transcurridos. */
export function executionProgressPercent(start: Date, deadline: Date, now = new Date()): number {
  const total = businessDaysBetween(start, deadline);
  if (total <= 0) return 100;
  const elapsed = businessDaysBetween(start, now);
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}
