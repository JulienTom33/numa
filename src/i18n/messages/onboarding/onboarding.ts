import type { TFunction } from "i18next";
import {
  FIRST_NAME_MAX_LENGTH,
  MIN_BIRTH_YEAR,
  parseIsoDate,
  timeWarningCode,
  type BirthDateErrorCode,
  type BirthPlaceErrorCode,
  type BirthTimeErrorCode,
  type BirthTimeInput,
  type FirstNameErrorCode,
  type OnboardingData,
  type OnboardingSummary,
} from "../../../features/onboarding/birthData/birthData";
import type { OnboardingStoreErrorCode } from "../../../features/onboarding/onboardingStore/onboardingStore";
import { formatDate } from "../../format/format";

export type OnboardingTranslate = TFunction<"onboarding">;

export type OnboardingErrorCode = OnboardingStoreErrorCode | "missing_session";

/** Message affiché pour une erreur de validation du prénom. */
export function firstNameErrorMessage(code: FirstNameErrorCode, t: OnboardingTranslate): string {
  return t(`validation.firstName.${code}`, { max: FIRST_NAME_MAX_LENGTH });
}

/** Message affiché pour une erreur de validation de la date de naissance. */
export function birthDateErrorMessage(code: BirthDateErrorCode, t: OnboardingTranslate): string {
  return t(`validation.birthDate.${code}`, { year: MIN_BIRTH_YEAR - 1 });
}

/** Message affiché pour une erreur de validation de l'heure de naissance. */
export function birthTimeErrorMessage(code: BirthTimeErrorCode, t: OnboardingTranslate): string {
  return t(`validation.birthTime.${code}`);
}

/** Message affiché pour une erreur de validation du lieu de naissance. */
export function birthPlaceErrorMessage(code: BirthPlaceErrorCode, t: OnboardingTranslate): string {
  return t(`validation.birthPlace.${code}`);
}

/** Message affiché pour une erreur d'enregistrement, de chargement ou de session de l'onboarding. */
export function onboardingErrorMessage(code: OnboardingErrorCode, t: OnboardingTranslate): string {
  return t(`errors.${code}`);
}

/** Date de naissance lisible (« 1er mars 1990 ») dans la langue courante ; renvoie l'entrée si elle n'est pas ISO. */
export function formatBirthDate(isoDate: string, t: OnboardingTranslate, language: string): string {
  const parts = parseIsoDate(isoDate);
  if (parts === null) {
    return isoDate;
  }
  return t("summary.birthDate", {
    day: t("date.dayOrdinal", { count: parts.day, ordinal: true }),
    month: formatDate(new Date(Date.UTC(parts.year, parts.month - 1, parts.day)), language, {
      month: "long",
      timeZone: "UTC",
    }),
    year: parts.year,
  });
}

/** Heure de naissance lisible selon sa précision (exacte, approximative avec marge, inconnue, non renseignée). */
export function formatBirthTime(input: BirthTimeInput, t: OnboardingTranslate): string {
  switch (input.precision) {
    case "exact":
      return input.time;
    case "approximate":
      if (input.margin === null) {
        return t("summary.birthTime.approximate", { time: input.time });
      }
      return t("summary.birthTime.approximateWithMargin", {
        time: input.time,
        margin: t(`time.margins.${input.margin}`),
      });
    case "unknown":
      return t("summary.birthTime.unknown");
    default:
      return t("summary.notProvided");
  }
}

/** Récapitulatif traduit des données saisies, affiché à la dernière étape de l'onboarding. */
export function buildOnboardingSummary(
  data: OnboardingData,
  t: OnboardingTranslate,
  language: string,
): OnboardingSummary {
  const warning = timeWarningCode(data.birthTime.precision);
  return {
    firstName: data.firstName.trim(),
    birthDate: data.birthDate ? formatBirthDate(data.birthDate, t, language) : t("summary.notProvided"),
    birthTime: formatBirthTime(data.birthTime, t),
    birthPlace: data.birthPlace?.label ?? null,
    timezone: data.birthPlace?.timezone ?? null,
    timeWarning: warning ? t(`summary.timeWarning.${warning}`) : null,
  };
}
