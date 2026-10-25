import {
  parseIsoDate,
  validateBirthDateParts,
  validateBirthPlace,
  validateBirthTime,
  validateFirstName,
  normalizeBirthTime,
  type BirthDateErrorCode,
  type BirthDateParts,
  type BirthPlace,
  type BirthPlaceErrorCode,
  type BirthTimeErrorCode,
  type BirthTimeInput,
  type FirstNameErrorCode,
} from "../../onboarding/birthData/birthData";

export const PROFILE_LANGUAGES = ["fr"] as const;
export const PROFILE_TONES = ["gentle", "balanced", "direct"] as const;
export const ACCOUNT_STATUSES = ["anonymous", "authenticated"] as const;

export type ProfileLanguage = (typeof PROFILE_LANGUAGES)[number];
export type ProfileTone = (typeof PROFILE_TONES)[number];
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export type ProfileErrorCode = "profile_not_found" | "birth_data_not_found" | "network_error" | "save_failed" | "internal_error";

export interface ProfileBirth {
  id: string;
  birthDate: string;
  birthTime: BirthTimeInput;
  birthPlace: BirthPlace;
}

export interface ProfileData {
  userId: string;
  firstName: string;
  status: AccountStatus;
  language: ProfileLanguage;
  tone: ProfileTone;
  birth: ProfileBirth;
}

export interface ProfileDraft {
  firstName: string;
  birthDate: BirthDateParts;
  birthTime: BirthTimeInput;
  birthPlace: BirthPlace | null;
  language: ProfileLanguage;
  tone: ProfileTone;
}

export interface ProfileFieldErrors {
  firstName: FirstNameErrorCode | null;
  birthDate: BirthDateErrorCode | null;
  birthTime: BirthTimeErrorCode | null;
  birthPlace: BirthPlaceErrorCode | null;
}

export interface ProfileUpdate {
  firstName: string;
  language: ProfileLanguage;
  tone: ProfileTone;
  birth: { birthDate: string; birthTime: BirthTimeInput; birthPlace: BirthPlace } | null;
}

export type ProfileValidation =
  | { update: ProfileUpdate; errors: null }
  | { update: null; errors: ProfileFieldErrors };

export function findOption<T extends string>(options: readonly T[], value: unknown): T | null {
  return options.find((option) => option === value) ?? null;
}

export function toProfileDraft(profile: ProfileData): ProfileDraft {
  const parts = parseIsoDate(profile.birth.birthDate);
  return {
    firstName: profile.firstName,
    birthDate: { day: parts?.day ?? null, month: parts?.month ?? null, year: parts?.year ?? null },
    birthTime: profile.birth.birthTime,
    birthPlace: profile.birth.birthPlace,
    language: profile.language,
    tone: profile.tone,
  };
}

function samePlace(a: BirthPlace | null, b: BirthPlace | null): boolean {
  if (a === null || b === null) return a === b;
  return a.label === b.label && a.latitude === b.latitude && a.longitude === b.longitude && a.timezone === b.timezone;
}

function sameTime(a: BirthTimeInput, b: BirthTimeInput): boolean {
  const left = normalizeBirthTime(a);
  const right = normalizeBirthTime(b);
  return left.precision === right.precision && left.time === right.time && left.margin === right.margin;
}

export function hasBirthChanged(profile: ProfileData, draft: ProfileDraft): boolean {
  const { isoDate } = validateBirthDateParts(draft.birthDate);
  return (
    isoDate !== profile.birth.birthDate ||
    !sameTime(draft.birthTime, profile.birth.birthTime) ||
    !samePlace(draft.birthPlace, profile.birth.birthPlace)
  );
}

export function validateProfileDraft(profile: ProfileData, draft: ProfileDraft, today: Date = new Date()): ProfileValidation {
  const date = validateBirthDateParts(draft.birthDate, today);
  const errors: ProfileFieldErrors = {
    firstName: validateFirstName(draft.firstName),
    birthDate: date.error,
    birthTime: validateBirthTime(draft.birthTime),
    birthPlace: validateBirthPlace(draft.birthPlace),
  };
  if (date.isoDate === null || draft.birthPlace === null || Object.values(errors).some((code) => code !== null)) {
    return { update: null, errors };
  }
  return {
    errors: null,
    update: {
      firstName: draft.firstName.trim(),
      language: draft.language,
      tone: draft.tone,
      birth: hasBirthChanged(profile, draft)
        ? { birthDate: date.isoDate, birthTime: normalizeBirthTime(draft.birthTime), birthPlace: draft.birthPlace }
        : null,
    },
  };
}
