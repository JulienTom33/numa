/**
 * Décalage UTC applicable à une date et une heure locales dans un fuseau IANA, en tenant compte
 * de l'historique du fuseau (heure d'été, changements d'heure légale) tel que fourni par la base
 * tz embarquée dans le moteur JavaScript (ICU).
 *
 * Limites : la précision dépend de la base tz du navigateur ; avant l'adoption d'une heure
 * légale (ex. Paris avant 1911), la base donne le temps moyen local, arrondi ici à la minute.
 */

export interface LocalDateTime {
  /** `AAAA-MM-JJ` */
  date: string;
  /** `HH:mm` */
  time: string;
}

export type UtcOffsetStatus =
  /** Heure locale unique. */
  | "exact"
  /** Heure vécue deux fois (retour à l'heure d'hiver) : la première occurrence est retenue. */
  | "ambiguous"
  /** Heure sautée (passage à l'heure d'été) : le décalage d'avant le saut est retenu. */
  | "nonexistent";

export interface UtcOffset {
  /** Minutes à ajouter à UTC pour obtenir l'heure locale (Paris en hiver : 60). */
  offsetMinutes: number;
  /** Instant UTC correspondant, ISO 8601. */
  utc: string;
  status: UtcOffsetStatus;
}

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})$/;

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    // Lève une RangeError si le fuseau est inconnu.
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

function offsetAt(utcMs: number, timeZone: string): number {
  const parts: Record<string, string> = {};
  for (const { type, value } of formatterFor(timeZone).formatToParts(new Date(utcMs))) {
    parts[type] = value;
  }
  const wallMs = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  // Les secondes de l'instant sont tronquées par le formatage : on les retire aussi côté UTC.
  return Math.round((wallMs - Math.floor(utcMs / 1000) * 1000) / MINUTE_MS);
}

function parseLocal({ date, time }: LocalDateTime): number | null {
  const dateMatch = DATE_PATTERN.exec(date);
  const timeMatch = TIME_PATTERN.exec(time);
  if (!dateMatch || !timeMatch) return null;

  const [year, month, day] = dateMatch.slice(1).map(Number);
  const [hour, minute] = timeMatch.slice(1).map(Number);
  if (hour > 23 || minute > 59) return null;

  const ms = Date.UTC(year, month - 1, day, hour, minute);
  const check = new Date(ms);
  // Rejette les dates impossibles (31 février…) que Date.UTC décalerait silencieusement.
  const sameDate = check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day;
  return sameDate ? ms : null;
}

/**
 * Renvoie `null` si la date, l'heure ou le fuseau sont invalides.
 */
export function resolveUtcOffset(local: LocalDateTime, timeZone: string): UtcOffset | null {
  const wallMs = parseLocal(local);
  if (wallMs === null) return null;

  let before: number;
  let after: number;
  try {
    // Aucun fuseau ne change deux fois de décalage en 24 h : ces deux bornes encadrent le cas.
    before = offsetAt(wallMs - DAY_MS, timeZone);
    after = offsetAt(wallMs + DAY_MS, timeZone);
  } catch {
    return null;
  }

  const valid = [...new Set([before, after])]
    .filter((offset) => offsetAt(wallMs - offset * MINUTE_MS, timeZone) === offset)
    // Le plus grand décalage correspond au premier instant UTC.
    .sort((a, b) => b - a);

  const offsetMinutes = valid[0] ?? before;
  return {
    offsetMinutes,
    utc: new Date(wallMs - offsetMinutes * MINUTE_MS).toISOString(),
    status: statusFor(valid.length),
  };
}

function statusFor(validOffsetCount: number): UtcOffsetStatus {
  if (validOffsetCount === 0) return "nonexistent";
  return validOffsetCount > 1 ? "ambiguous" : "exact";
}

/** `UTC+01:00`, `UTC−03:30`, `UTC+00:00`. */
export function formatUtcOffset(offsetMinutes: number): string {
  const sign = offsetMinutes < 0 ? "−" : "+";
  const absolute = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, "0");
  const minutes = String(absolute % 60).padStart(2, "0");
  return `UTC${sign}${hours}:${minutes}`;
}
