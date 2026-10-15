export type TimePrecision = "exact" | "approximate" | "unknown";

export type TimeMargin = "under_30_min" | "between_30_min_and_2_h" | "over_2_h";

export const TIME_MARGINS: readonly TimeMargin[] = ["under_30_min", "between_30_min_and_2_h", "over_2_h"];

export const TIME_MARGIN_LABELS: Record<TimeMargin, string> = {
  under_30_min: "< 30 min",
  between_30_min_and_2_h: "30 min–2 h",
  over_2_h: "> 2 h",
};

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

export function validateFirstName(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === "") {
    return "Indiquez un prénom ou un pseudonyme.";
  }
  if (trimmed.length > FIRST_NAME_MAX_LENGTH) {
    return `Votre prénom ne peut pas dépasser ${FIRST_NAME_MAX_LENGTH} caractères.`;
  }
  if (hasControlCharacter(trimmed)) {
    return "Votre prénom contient des caractères non autorisés.";
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
): { isoDate: string; error: null } | { isoDate: null; error: string } {
  const { day, month, year } = parts;
  if (day === null || month === null || year === null) {
    return { isoDate: null, error: "Indiquez votre jour, mois et année de naissance." };
  }
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return { isoDate: null, error: "Cette date n'existe pas. Vérifiez le jour et le mois." };
  }
  const isoDate = `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
  const error = validateBirthDate(isoDate, today);
  return error ? { isoDate: null, error } : { isoDate, error: null };
}

export function validateBirthDate(value: string | null, today: Date = new Date()): string | null {
  if (value === null || value === "") {
    return "Indiquez votre date de naissance.";
  }
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) {
    return "Cette date n'est pas valide.";
  }
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (!isRealDate(year, month, day)) {
    return "Cette date n'existe pas. Vérifiez le jour et le mois.";
  }
  if (year < MIN_BIRTH_YEAR) {
    return `L'année de naissance doit être postérieure à ${MIN_BIRTH_YEAR - 1}.`;
  }
  if (value > toLocalIsoDate(today)) {
    return "La date de naissance ne peut pas être dans le futur.";
  }
  return null;
}

export function validateBirthTime(input: BirthTimeInput): string | null {
  if (input.precision === null) {
    return "Indiquez si vous connaissez votre heure de naissance.";
  }
  if (input.precision === "unknown") {
    return null;
  }
  if (input.time === "") {
    return "Indiquez votre heure de naissance, même approximative.";
  }
  if (!TIME_PATTERN.test(input.time)) {
    return "L'heure doit être au format HH:MM (par exemple 14:30).";
  }
  if (input.precision === "approximate" && input.margin === null) {
    return "Indiquez la marge d'incertitude de votre heure de naissance.";
  }
  return null;
}

export function validateBirthPlace(place: BirthPlace | null): string | null {
  if (place === null) {
    return "Choisissez votre ville de naissance dans la liste des suggestions.";
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

const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatBirthDate(isoDate: string): string {
  const match = ISO_DATE_PATTERN.exec(isoDate);
  if (!match) {
    return isoDate;
  }
  return DATE_FORMATTER.format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))));
}

export function formatBirthTime(input: BirthTimeInput): string {
  switch (input.precision) {
    case "exact":
      return input.time;
    case "approximate":
      return input.margin
        ? `Vers ${input.time} (marge ${TIME_MARGIN_LABELS[input.margin]})`
        : `Vers ${input.time}`;
    case "unknown":
      return "Heure inconnue";
    default:
      return "Non renseignée";
  }
}

const TIME_WARNINGS: Record<TimePrecision, string | null> = {
  exact: null,
  approximate: "Votre heure est approximative : l'ascendant et les maisons sont donnés à titre indicatif.",
  unknown: "Sans heure de naissance, l'ascendant et les maisons ne peuvent pas être calculés précisément.",
};

export function buildOnboardingSummary(data: OnboardingData): OnboardingSummary {
  return {
    firstName: data.firstName.trim(),
    birthDate: data.birthDate ? formatBirthDate(data.birthDate) : "Non renseignée",
    birthTime: formatBirthTime(data.birthTime),
    birthPlace: data.birthPlace?.label ?? null,
    timezone: data.birthPlace?.timezone ?? null,
    timeWarning: data.birthTime.precision ? TIME_WARNINGS[data.birthTime.precision] : null,
  };
}
