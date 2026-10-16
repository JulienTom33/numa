import { describe, expect, it } from "vitest";
import i18n from "..";
import {
  EMPTY_ONBOARDING_DATA,
  type BirthDateErrorCode,
  type BirthPlace,
  type BirthTimeErrorCode,
  type FirstNameErrorCode,
  type OnboardingData,
} from "../../lib/birthData";
import {
  birthDateErrorMessage,
  birthPlaceErrorMessage,
  birthTimeErrorMessage,
  buildOnboardingSummary,
  firstNameErrorMessage,
  formatBirthDate,
  formatBirthTime,
  onboardingErrorMessage,
  type OnboardingErrorCode,
} from "./onboarding";

const t = i18n.getFixedT("fr", "onboarding");

const LYON: BirthPlace = { label: "Lyon, France", latitude: 45.764043, longitude: 4.835659, timezone: "Europe/Paris" };

describe("validation messages", () => {
  it.each<[FirstNameErrorCode, string]>([
    ["required", "Indiquez un prénom ou un pseudonyme."],
    ["tooLong", "Votre prénom ne peut pas dépasser 50 caractères."],
    ["invalidCharacters", "Votre prénom contient des caractères non autorisés."],
  ])("translates the first name code %s", (code, expected) => {
    expect(firstNameErrorMessage(code, t)).toBe(expected);
  });

  it.each<[BirthDateErrorCode, string]>([
    ["incomplete", "Indiquez votre jour, mois et année de naissance."],
    ["required", "Indiquez votre date de naissance."],
    ["invalidFormat", "Cette date n'est pas valide."],
    ["nonexistent", "Cette date n'existe pas. Vérifiez le jour et le mois."],
    ["tooEarly", "L'année de naissance doit être postérieure à 1899."],
    ["future", "La date de naissance ne peut pas être dans le futur."],
  ])("translates the birth date code %s", (code, expected) => {
    expect(birthDateErrorMessage(code, t)).toBe(expected);
  });

  it.each<[BirthTimeErrorCode, string]>([
    ["precisionRequired", "Indiquez si vous connaissez votre heure de naissance."],
    ["timeRequired", "Indiquez votre heure de naissance, même approximative."],
    ["invalidFormat", "L'heure doit être au format HH:MM (par exemple 14:30)."],
    ["marginRequired", "Indiquez la marge d'incertitude de votre heure de naissance."],
  ])("translates the birth time code %s", (code, expected) => {
    expect(birthTimeErrorMessage(code, t)).toBe(expected);
  });

  it("translates the birth place code", () => {
    expect(birthPlaceErrorMessage("required", t)).toBe(
      "Choisissez votre ville de naissance dans la liste des suggestions.",
    );
  });

  it.each<[OnboardingErrorCode, string]>([
    ["save_failed", "Vos informations n'ont pas pu être enregistrées. Vérifiez votre connexion et réessayez."],
    ["load_failed", "Votre saisie précédente n'a pas pu être récupérée. Vous pouvez reprendre depuis le début."],
    ["missing_session", "Votre session a expiré. Rechargez la page pour reprendre votre saisie."],
  ])("translates the onboarding error code %s", (code, expected) => {
    expect(onboardingErrorMessage(code, t)).toBe(expected);
  });
});

describe("formatBirthDate", () => {
  it("formats the birth date in French with the ordinal of the first day", () => {
    expect(formatBirthDate("1990-03-12", t, "fr")).toBe("12 mars 1990");
    expect(formatBirthDate("1990-03-01", t, "fr")).toBe("1er mars 1990");
  });

  it("returns a non-ISO value unchanged", () => {
    expect(formatBirthDate("invalide", t, "fr")).toBe("invalide");
  });
});

describe("formatBirthTime", () => {
  it("formats each time precision", () => {
    expect(formatBirthTime({ precision: "exact", time: "14:30", margin: null }, t)).toBe("14:30");
    expect(formatBirthTime({ precision: "approximate", time: "14:30", margin: "between_30_min_and_2_h" }, t)).toBe(
      "Vers 14:30 (marge 30 min–2 h)",
    );
    expect(formatBirthTime({ precision: "approximate", time: "14:30", margin: null }, t)).toBe("Vers 14:30");
    expect(formatBirthTime({ precision: "unknown", time: "", margin: null }, t)).toBe("Heure inconnue");
    expect(formatBirthTime({ precision: null, time: "", margin: null }, t)).toBe("Non renseignée");
  });
});

describe("buildOnboardingSummary", () => {
  const complete: OnboardingData = {
    firstName: "  Émile ",
    birthDate: "1990-03-12",
    birthTime: { precision: "exact", time: "14:30", margin: null },
    birthPlace: LYON,
  };

  it("summarises complete data without warning for an exact time", () => {
    expect(buildOnboardingSummary(complete, t, "fr")).toEqual({
      firstName: "Émile",
      birthDate: "12 mars 1990",
      birthTime: "14:30",
      birthPlace: "Lyon, France",
      timezone: "Europe/Paris",
      timeWarning: null,
    });
  });

  it("warns when the time is unknown or approximate", () => {
    expect(
      buildOnboardingSummary({ ...complete, birthTime: { precision: "unknown", time: "", margin: null } }, t, "fr")
        .timeWarning,
    ).toBe("Sans heure de naissance, l'ascendant et les maisons ne peuvent pas être calculés précisément.");
    expect(
      buildOnboardingSummary(
        { ...complete, birthTime: { precision: "approximate", time: "14:30", margin: "over_2_h" } },
        t,
        "fr",
      ).timeWarning,
    ).toBe("Votre heure est approximative : l'ascendant et les maisons sont donnés à titre indicatif.");
  });

  it("handles empty data", () => {
    expect(buildOnboardingSummary(EMPTY_ONBOARDING_DATA, t, "fr")).toEqual({
      firstName: "",
      birthDate: "Non renseignée",
      birthTime: "Non renseignée",
      birthPlace: null,
      timezone: null,
      timeWarning: null,
    });
  });
});
