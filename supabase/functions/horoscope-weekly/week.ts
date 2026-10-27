import { HttpError } from "../_shared/http.ts";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;
const WEEK_DAYS = 7;

export interface Week {
  start: string;
  end: string;
  label: string;
}

function day(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

function startOfDay(instant: Date): number {
  return Date.UTC(instant.getUTCFullYear(), instant.getUTCMonth(), instant.getUTCDate());
}

export function weekOf(instant: Date): Week {
  const today = startOfDay(instant);
  const offset = (new Date(today).getUTCDay() + 6) % WEEK_DAYS;
  const monday = today - offset * DAY_MS;
  const thursday = monday + 3 * DAY_MS;
  const isoYear = new Date(thursday).getUTCFullYear();
  const firstThursday = Date.UTC(isoYear, 0, 4);
  const firstMonday = firstThursday -
    ((new Date(firstThursday).getUTCDay() + 6) % WEEK_DAYS) * DAY_MS;
  const number = Math.round((monday - firstMonday) / (WEEK_DAYS * DAY_MS)) + 1;
  return {
    start: day(monday),
    end: day(monday + (WEEK_DAYS - 1) * DAY_MS),
    label: `${isoYear}-W${String(number).padStart(2, "0")}`,
  };
}

export function parseRequestedDate(requested: unknown, now: Date): Date {
  if (requested === undefined) return now;
  if (typeof requested !== "string" || !ISO_DATE.test(requested)) {
    throw new HttpError(400, "invalid_date", "invalid_date");
  }
  const parsed = new Date(`${requested}T00:00:00Z`);
  const gap = Math.abs(parsed.getTime() - startOfDay(now));
  if (
    Number.isNaN(parsed.getTime()) || day(parsed.getTime()) !== requested ||
    gap > WEEK_DAYS * DAY_MS
  ) {
    throw new HttpError(400, "invalid_date", "invalid_date");
  }
  return parsed;
}
