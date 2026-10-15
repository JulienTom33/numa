// Validation locale à l'écran ; la validation métier complète (#18) pourra la remplacer.

export interface BirthDateParts {
  day: string;
  month: string;
  year: string;
}

export const emptyBirthDateParts: BirthDateParts = { day: "", month: "", year: "" };

export const FRENCH_MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
] as const;

export const MIN_BIRTH_YEAR = 1900;

export function isComplete(parts: BirthDateParts): boolean {
  return parts.day !== "" && parts.month !== "" && parts.year !== "";
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(month: number, year: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/** Vrai si la date existe au calendrier et n'est pas postérieure à `today`. */
export function isValidBirthDate(parts: BirthDateParts, today: Date = new Date()): boolean {
  if (!isComplete(parts)) return false;
  const day = Number(parts.day);
  const month = Number(parts.month);
  const year = Number(parts.year);
  if (![day, month, year].every(Number.isInteger)) return false;
  if (month < 1 || month > 12 || year < MIN_BIRTH_YEAR || day < 1) return false;
  if (day > daysInMonth(month, year)) return false;

  const todayKey = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return year * 10000 + month * 100 + day <= todayKey;
}

/** « 1er mars 1990 », « 14 juillet 2001 ». Suppose une date valide. */
export function formatBirthDate(parts: BirthDateParts): string {
  const day = Number(parts.day);
  const month = FRENCH_MONTHS[Number(parts.month) - 1];
  return `${day === 1 ? "1er" : day} ${month} ${Number(parts.year)}`;
}
