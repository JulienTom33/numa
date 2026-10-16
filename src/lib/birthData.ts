export type TimePrecision = "exact" | "approximate" | "unknown";

export type TimeMargin = "under_30_min" | "between_30_min_and_2_h" | "over_2_h";

export const TIME_MARGINS: readonly TimeMargin[] = ["under_30_min", "between_30_min_and_2_h", "over_2_h"];

export type FirstNameErrorCode = "required" | "tooLong" | "invalidCharacters";

export type BirthDateErrorCode = "incomplete" | "required" | "invalidFormat" | "nonexistent" | "tooEarly" | "future";

export type BirthTimeErrorCode = "precisionRequired" | "timeRequired" | "invalidFormat" | "marginRequired";

export type BirthPlaceErrorCode = "required";

export type TimeWarningCode = "approximate" | "unknown";

export interface BirthPlace {
  label: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface BirthTimeInput {
  precision: TimePrecision | null;
  time: string;
  margin: TimeMargin | null;
}

export interface BirthDateParts {
  day: number | null;
  month: number | null;
  year: number | null;
}

export interface OnboardingData {
  firstName: string;
  birthDate: string | null;
  birthTime: BirthTimeInput;
  birthPlace: BirthPlace | null;
}

export const EMPTY_ONBOARDING_DATA: OnboardingData = {
  firstName: "",
  birthDate: null,
  birthTime: { precision: null, time: "", margin: null },
  birthPlace: null,
};

export const FIRST_NAME_MAX_LENGTH = 50;
export const MIN_BIRTH_YEAR = 1900;

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
function hasControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });
}

export function validateFirstName(value: string): FirstNameErrorCode | null {
  const trimmed = value.trim();
  if (trimmed === "") {
    return "required";
  }
  if (trimmed.length > FIRST_NAME_MAX_LENGTH) {
    return "tooLong";
  }
  if (hasControlCharacter(trimmed)) {
    return "invalidCharacters";
  }
  return null;
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, "0");
}

/** Date locale de l'utilisateur au format ISO : c'est elle qui définit « aujourd'hui » pour lui. */
export function toLocalIsoDate(date: Date): string {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`;
}

function isRealDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) {
    return false;
  }
  const candidate = new Date(Date.UTC(year, month - 1, day));
  return candidate.getUTCFullYear() === year && candidate.getUTCMonth() === month - 1 && candidate.getUTCDate() === day;
}

/** Valide les trois listes Jour / Mois / Année et renvoie la date ISO si elle est acceptable. */
export function validateBirthDateParts(
  parts: BirthDateParts,
  today: Date = new Date(),
): { isoDate: string; error: null } | { isoDate: null; error: BirthDateErrorCode } {
  const { day, month, year } = parts;
  if (day === null || month === null || year === null) {
    return { isoDate: null, error: "incomplete" };
  }
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return { isoDate: null, error: "nonexistent" };
  }
  const isoDate = `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
  const error = validateBirthDate(isoDate, today);
  return error ? { isoDate: null, error } : { isoDate, error: null };
}

export function validateBirthDate(value: string | null, today: Date = new Date()): BirthDateErrorCode | null {
  if (value === null || value === "") {
    return "required";
  }
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) {
    return "invalidFormat";
  }
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (!isRealDate(year, month, day)) {
    return "nonexistent";
  }
  if (year < MIN_BIRTH_YEAR) {
    return "tooEarly";
  }
  if (value > toLocalIsoDate(today)) {
    return "future";
  }
  return null;
}

export function validateBirthTime(input: BirthTimeInput): BirthTimeErrorCode | null {
  if (input.precision === null) {
    return "precisionRequired";
  }
  if (input.precision === "unknown") {
    return null;
  }
  if (input.time === "") {
    return "timeRequired";
  }
  if (!TIME_PATTERN.test(input.time)) {
    return "invalidFormat";
  }
  if (input.precision === "approximate" && input.margin === null) {
    return "marginRequired";
  }
  return null;
}

export function validateBirthPlace(place: BirthPlace | null): BirthPlaceErrorCode | null {
  if (place === null) {
    return "required";
  }
  return null;
}

/** Ne garde que les champs pertinents pour la précision choisie, pour ne jamais persister une heure « fantôme ». */
export function normalizeBirthTime(input: BirthTimeInput): BirthTimeInput {
  if (input.precision === "unknown") {
    return { precision: "unknown", time: "", margin: null };
  }
  if (input.precision === "exact") {
    return { ...input, margin: null };
  }
  return input;
}

/** Calcul de l'ascendant et des maisons fiable seulement avec une heure exacte et un lieu (#80). */
export function hasPreciseBirthData(data: OnboardingData): boolean {
  return data.birthTime.precision === "exact" && data.birthPlace !== null;
}

export interface OnboardingSummary {
  firstName: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string | null;
  timezone: string | null;
  timeWarning: string | null;
}

/** Date ISO découpée en jour, mois et année ; `null` si le format n'est pas `AAAA-MM-JJ`. */
export function parseIsoDate(isoDate: string): { year: number; month: number; day: number } | null {
  const match = ISO_DATE_PATTERN.exec(isoDate);
  return match ? { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) } : null;
}

/** Avertissement à afficher selon la précision de l'heure : seule une heure exacte n'en a pas. */
export function timeWarningCode(precision: TimePrecision | null): TimeWarningCode | null {
  return precision === "approximate" || precision === "unknown" ? precision : null;
}
