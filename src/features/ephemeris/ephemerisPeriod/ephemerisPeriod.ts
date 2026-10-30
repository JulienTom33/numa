export type EphemerisPeriod = "day" | "week" | "month";

export interface DateRange {
  from: string;
  to: string;
}

const DAY_MS = 86_400_000;

export function toUtcDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function utcIsoDate(date: Date): string {
  return toIsoDate(date);
}

export function addDays(iso: string, days: number): string {
  return toIsoDate(new Date(toUtcDate(iso).getTime() + days * DAY_MS));
}

function mondayOf(iso: string): string {
  const weekday = toUtcDate(iso).getUTCDay();
  return addDays(iso, -((weekday + 6) % 7));
}

function addMonths(iso: string, months: number): string {
  const date = toUtcDate(iso);
  return toIsoDate(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1)));
}

export function rangeFor(period: EphemerisPeriod, anchor: string): DateRange {
  if (period === "day") return { from: anchor, to: anchor };
  if (period === "week") {
    const from = mondayOf(anchor);
    return { from, to: addDays(from, 6) };
  }
  return { from: addMonths(anchor, 0), to: addDays(addMonths(anchor, 1), -1) };
}

export function shiftAnchor(period: EphemerisPeriod, anchor: string, direction: 1 | -1): string {
  if (period === "day") return addDays(anchor, direction);
  if (period === "week") return addDays(anchor, direction * 7);
  return addMonths(anchor, direction);
}

export function isWithin(iso: string, range: DateRange): boolean {
  return iso >= range.from && iso <= range.to;
}

export function defaultSelectedDay(range: DateRange, today: string): string {
  return isWithin(today, range) ? today : range.from;
}

export function listDays(range: DateRange): string[] {
  const days: string[] = [];
  for (let day = range.from; day <= range.to; day = addDays(day, 1)) days.push(day);
  return days;
}

export function splitDegree(degreeInSign: number): { degree: number; minute: number } {
  const totalMinutes = Math.floor(degreeInSign * 60);
  return { degree: Math.floor(totalMinutes / 60), minute: totalMinutes % 60 };
}
