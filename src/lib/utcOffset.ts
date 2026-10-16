import { LEGAL_MEAN_TIME_START_MS } from "./legalMeanTime";

export interface LocalDateTime {
  date: string;
  time: string;
}

export type UtcOffsetStatus =
  | "exact"
  | "ambiguous"
  | "nonexistent"
  | "localMeanTime";

interface LegalUtcOffset {
  offsetMinutes: number;
  utc: string;
  status: Exclude<UtcOffsetStatus, "localMeanTime">;
}

interface LocalMeanTimeUtcOffset {
  offsetMinutes: number;
  offsetSeconds: number;
  utc: string;
  status: "localMeanTime";
}

export type UtcOffset = LegalUtcOffset | LocalMeanTimeUtcOffset;

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const DAY_MS = 24 * 60 * MINUTE_MS;
const SECONDS_PER_LONGITUDE_DEGREE = 240;
const STANDARD_OFFSET_STEP_SECONDS = 15 * 60;
const BEFORE_ANY_TRANSITION_MS = Date.UTC(1000, 0, 1);
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})$/;

const formatters = new Map<string, Intl.DateTimeFormat>();
const meanTimeOffsets = new Map<string, number | null>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
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

function offsetSecondsAt(utcMs: number, timeZone: string): number {
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
  return (wallMs - Math.floor(utcMs / SECOND_MS) * SECOND_MS) / SECOND_MS;
}

function offsetAt(utcMs: number, timeZone: string): number {
  return Math.round(offsetSecondsAt(utcMs, timeZone) / 60);
}

function meanTimeOffsetOf(timeZone: string): number | null {
  let meanTimeOffset = meanTimeOffsets.get(timeZone);
  if (meanTimeOffset === undefined) {
    const earliest = offsetSecondsAt(BEFORE_ANY_TRANSITION_MS, timeZone);
    meanTimeOffset = earliest % STANDARD_OFFSET_STEP_SECONDS === 0 ? null : earliest;
    meanTimeOffsets.set(timeZone, meanTimeOffset);
  }
  return meanTimeOffset;
}

function isLocalMeanTime(utcMs: number, timeZone: string): boolean {
  const meanTimeOffset = meanTimeOffsetOf(timeZone);
  if (meanTimeOffset === null) return false;
  if (utcMs >= (LEGAL_MEAN_TIME_START_MS[timeZone] ?? Infinity)) return false;
  return offsetSecondsAt(utcMs, timeZone) === meanTimeOffset;
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
  const sameDate = check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day;
  return sameDate ? ms : null;
}

function isValidLongitude(longitude: number | undefined): boolean {
  return longitude === undefined || (Number.isFinite(longitude) && Math.abs(longitude) <= 180);
}

function localMeanTimeOffset(
  wallMs: number,
  timeZone: string,
  longitude: number,
): LocalMeanTimeUtcOffset | null {
  const offsetSeconds = Math.round(longitude * SECONDS_PER_LONGITUDE_DEGREE);
  const utcMs = wallMs - offsetSeconds * SECOND_MS;
  if (!isLocalMeanTime(utcMs, timeZone)) return null;
  return {
    offsetMinutes: Math.round(offsetSeconds / 60),
    offsetSeconds,
    utc: new Date(utcMs).toISOString(),
    status: "localMeanTime",
  };
}

/**
 * Renvoie `null` si la date, l'heure, le fuseau ou la longitude sont invalides.
 * Avec la longitude du lieu (degrés décimaux, est positif), une date antérieure à toute heure légale
 * du fuseau est convertie en heure locale moyenne du lieu (longitude / 15 h, à la seconde) :
 * statut `localMeanTime`, `offsetSeconds` renseigné. Sans longitude, la base tz s'applique telle quelle.
 */
export function resolveUtcOffset(
  local: LocalDateTime,
  timeZone: string,
  longitude?: number,
): UtcOffset | null {
  const wallMs = parseLocal(local);
  if (wallMs === null || !isValidLongitude(longitude)) return null;

  let before: number;
  let after: number;
  try {
    before = offsetAt(wallMs - DAY_MS, timeZone);
    after = offsetAt(wallMs + DAY_MS, timeZone);
  } catch {
    return null;
  }

  const meanTime = longitude === undefined ? null : localMeanTimeOffset(wallMs, timeZone, longitude);
  if (meanTime) return meanTime;

  const valid = [...new Set([before, after])]
    .filter((offset) => offsetAt(wallMs - offset * MINUTE_MS, timeZone) === offset)
    .sort((a, b) => b - a);

  const offsetMinutes = valid[0] ?? before;
  return {
    offsetMinutes,
    utc: new Date(wallMs - offsetMinutes * MINUTE_MS).toISOString(),
    status: statusFor(valid.length),
  };
}

function statusFor(validOffsetCount: number): LegalUtcOffset["status"] {
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
