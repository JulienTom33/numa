import { HttpError } from "../_shared/http.ts";
import { EPHEMERIS_MAX_DAYS } from "../../../shared/contracts/ephemeris/ephemeris.ts";

export interface EphemerisRange {
  readonly from: string;
  readonly to: string;
  readonly start: Date;
  readonly end: Date;
  readonly days: number;
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;

function invalid(code: "invalid_date" | "invalid_range" | "range_too_long"): HttpError {
  return new HttpError(400, code, code);
}

function parseDay(value: string): number {
  const match = DATE_PATTERN.exec(value);
  if (!match) throw invalid("invalid_date");
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  if (
    date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw invalid("invalid_date");
  }
  return date.getTime();
}

export function formatDay(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

export function parseRange(params: URLSearchParams): EphemerisRange {
  const date = params.get("date");
  const fromParam = params.get("from");
  const toParam = params.get("to");

  if (date !== null && (fromParam !== null || toParam !== null)) throw invalid("invalid_range");
  if (date === null && (fromParam === null) !== (toParam === null)) throw invalid("invalid_range");

  const first = date ?? fromParam;
  const last = date ?? toParam;
  if (first === null || last === null) throw invalid("invalid_date");

  const start = parseDay(first);
  const lastDay = parseDay(last);
  if (lastDay < start) throw invalid("invalid_range");

  const days = Math.round((lastDay - start) / DAY_MS) + 1;
  if (days > EPHEMERIS_MAX_DAYS) throw invalid("range_too_long");

  return {
    from: formatDay(start),
    to: formatDay(lastDay),
    start: new Date(start),
    end: new Date(lastDay + DAY_MS),
    days,
  };
}
