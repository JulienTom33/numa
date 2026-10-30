import { HttpError } from "../_shared/http.ts";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;
const MAX_GAP_DAYS = 31;

export interface Month {
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

export function monthOf(instant: Date): Month {
  const year = instant.getUTCFullYear();
  const month = instant.getUTCMonth();
  return {
    start: day(Date.UTC(year, month, 1)),
    end: day(Date.UTC(year, month + 1, 0)),
    label: `${year}-${String(month + 1).padStart(2, "0")}`,
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
    gap > MAX_GAP_DAYS * DAY_MS
  ) {
    throw new HttpError(400, "invalid_date", "invalid_date");
  }
  return parsed;
}
