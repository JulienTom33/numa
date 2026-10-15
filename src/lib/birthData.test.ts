import { describe, expect, it } from "vitest";
import {
  buildOnboardingSummary,
  EMPTY_ONBOARDING_DATA,
  formatBirthDate,
  formatBirthTime,
  hasPreciseBirthData,
  normalizeBirthTime,
  toLocalIsoDate,
  validateBirthDate,
  validateBirthDateParts,
  validateBirthPlace,
  validateBirthTime,
  validateFirstName,
  type BirthPlace,
  type OnboardingData,
} from "./birthData";

const TODAY = new Date(2026, 9, 15, 12, 0);

const LYON: BirthPlace = { label: "Lyon, France", latitude: 45.764043, longitude: 4.835659, timezone: "Europe/Paris" };

describe("validateFirstName", () => {
  it("accepts a first name or pseudonym", () => {
    expect(validateFirstName("Émile")).toBeNull();
    expect(validateFirstName("  Jean-Luc  ")).toBeNull();
    expect(validateFirstName("Astro42")).toBeNull();
  });

  it("rejects an empty or blank value", () => {
    expect(validateFirstName("")).toBe("Indiquez un prénom ou un pseudonyme.");
    expect(validateFirstName("   ")).toBe("Indiquez un prénom ou un pseudonyme.");
  });

  it("rejects a value longer than 50 characters once trimmed", () => {
    expect(validateFirstName(`  ${"a".repeat(50)}  `)).toBeNull();
    expect(validateFirstName("a".repeat(51))).toBe("Votre prénom ne peut pas dépasser 50 caractères.");
  });

  it("rejects control characters", () => {
    expect(validateFirstName("Em\u0007ile")).toBe("Votre prénom contient des caractères non autorisés.");
  });
});

describe("validateBirthDate", () => {
  it("accepts a real past date", () => {
    expect(validateBirthDate("1990-03-12", TODAY)).toBeNull();
    expect(validateBirthDate("2000-02-29", TODAY)).toBeNull();
  });

  it("accepts today", () => {
    expect(validateBirthDate("2026-10-15", TODAY)).toBeNull();
  });

  it("requires a value", () => {
    expect(validateBirthDate(null, TODAY)).toBe("Indiquez votre date de naissance.");
    expect(validateBirthDate("", TODAY)).toBe("Indiquez votre date de naissance.");
  });

  it("rejects a malformed value", () => {
    expect(validateBirthDate("12/03/1990", TODAY)).toBe("Cette date n'est pas valide.");
  });

  it("rejects impossible dates such as 31 February", () => {
    const message = "Cette date n'existe pas. Vérifiez le jour et le mois.";
    expect(validateBirthDate("1990-02-31", TODAY)).toBe(message);
    expect(validateBirthDate("1991-02-29", TODAY)).toBe(message);
    expect(validateBirthDate("1990-04-31", TODAY)).toBe(message);
    expect(validateBirthDate("1990-13-01", TODAY)).toBe(message);
    expect(validateBirthDate("1990-01-00", TODAY)).toBe(message);
  });

  it("rejects a date in the future", () => {
    expect(validateBirthDate("2026-10-16", TODAY)).toBe("La date de naissance ne peut pas être dans le futur.");
  });

  it("rejects an implausible year", () => {
    expect(validateBirthDate("1899-12-31", TODAY)).toBe("L'année de naissance doit être postérieure à 1899.");
    expect(validateBirthDate("1900-01-01", TODAY)).toBeNull();
  });

  it("uses the current date by default", () => {
    expect(validateBirthDate("1990-03-12")).toBeNull();
  });
});

describe("validateBirthDateParts", () => {
  it("returns the ISO date of valid parts", () => {
    expect(validateBirthDateParts({ day: 2, month: 3, year: 1990 }, TODAY)).toEqual({
      isoDate: "1990-03-02",
      error: null,
    });
  });

  it("requires every part", () => {
    expect(validateBirthDateParts({ day: 2, month: null, year: 1990 }, TODAY)).toEqual({
      isoDate: null,
      error: "Indiquez votre jour, mois et année de naissance.",
    });
  });

  it("rejects 31 February", () => {
    expect(validateBirthDateParts({ day: 31, month: 2, year: 1990 }, TODAY).error).toBe(
      "Cette date n'existe pas. Vérifiez le jour et le mois.",
    );
  });

  it("rejects non-integer parts", () => {
    expect(validateBirthDateParts({ day: 1.5, month: 2, year: 1990 }, TODAY).isoDate).toBeNull();
  });
});

describe("toLocalIsoDate", () => {
  it("formats the local calendar date", () => {
    expect(toLocalIsoDate(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});

describe("validateBirthTime", () => {
  it("requires a precision choice", () => {
    expect(validateBirthTime({ precision: null, time: "", margin: null })).toBe(
      "Indiquez si vous connaissez votre heure de naissance.",
    );
  });

  it("accepts an unknown time without any value", () => {
    expect(validateBirthTime({ precision: "unknown", time: "", margin: null })).toBeNull();
  });

  it("accepts an exact time in HH:MM", () => {
    expect(validateBirthTime({ precision: "exact", time: "00:00", margin: null })).toBeNull();
    expect(validateBirthTime({ precision: "exact", time: "23:59", margin: null })).toBeNull();
  });

  it("requires a time for exact and approximate precision", () => {
    expect(validateBirthTime({ precision: "exact", time: "", margin: null })).toBe(
      "Indiquez votre heure de naissance, même approximative.",
    );
  });

  it("rejects a malformed time", () => {
    const message = "L'heure doit être au format HH:MM (par exemple 14:30).";
    expect(validateBirthTime({ precision: "exact", time: "24:00", margin: null })).toBe(message);
    expect(validateBirthTime({ precision: "exact", time: "9:30", margin: null })).toBe(message);
    expect(validateBirthTime({ precision: "exact", time: "12:60", margin: null })).toBe(message);
  });

  it("requires a margin for an approximate time", () => {
    expect(validateBirthTime({ precision: "approximate", time: "14:30", margin: null })).toBe(
      "Indiquez la marge d'incertitude de votre heure de naissance.",
    );
    expect(validateBirthTime({ precision: "approximate", time: "14:30", margin: "over_2_h" })).toBeNull();
  });
});

describe("validateBirthPlace", () => {
  it("requires a place picked from the suggestions", () => {
    expect(validateBirthPlace(null)).toBe("Choisissez votre ville de naissance dans la liste des suggestions.");
    expect(validateBirthPlace(LYON)).toBeNull();
  });
});

describe("normalizeBirthTime", () => {
  it("drops time and margin when the time is unknown", () => {
    expect(normalizeBirthTime({ precision: "unknown", time: "10:00", margin: "over_2_h" })).toEqual({
      precision: "unknown",
      time: "",
      margin: null,
    });
  });

  it("drops the margin for an exact time", () => {
    expect(normalizeBirthTime({ precision: "exact", time: "10:00", margin: "over_2_h" })).toEqual({
      precision: "exact",
      time: "10:00",
      margin: null,
    });
  });

  it("keeps an approximate time unchanged", () => {
    const input = { precision: "approximate", time: "10:00", margin: "under_30_min" } as const;
    expect(normalizeBirthTime(input)).toEqual(input);
  });
});

describe("formatting", () => {
  it("formats the birth date in French", () => {
    expect(formatBirthDate("1990-03-12")).toBe("12 mars 1990");
    expect(formatBirthDate("invalide")).toBe("invalide");
  });

  it("formats each time precision", () => {
    expect(formatBirthTime({ precision: "exact", time: "14:30", margin: null })).toBe("14:30");
    expect(formatBirthTime({ precision: "approximate", time: "14:30", margin: "between_30_min_and_2_h" })).toBe(
      "Vers 14:30 (marge 30 min–2 h)",
    );
    expect(formatBirthTime({ precision: "approximate", time: "14:30", margin: null })).toBe("Vers 14:30");
    expect(formatBirthTime({ precision: "unknown", time: "", margin: null })).toBe("Heure inconnue");
    expect(formatBirthTime({ precision: null, time: "", margin: null })).toBe("Non renseignée");
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
    expect(buildOnboardingSummary(complete)).toEqual({
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
      buildOnboardingSummary({ ...complete, birthTime: { precision: "unknown", time: "", margin: null } }).timeWarning,
    ).toContain("ne peuvent pas être calculés précisément");
    expect(
      buildOnboardingSummary({ ...complete, birthTime: { precision: "approximate", time: "14:30", margin: "over_2_h" } })
        .timeWarning,
    ).toContain("à titre indicatif");
  });

  it("handles empty data", () => {
    expect(buildOnboardingSummary(EMPTY_ONBOARDING_DATA)).toEqual({
      firstName: "",
      birthDate: "Non renseignée",
      birthTime: "Non renseignée",
      birthPlace: null,
      timezone: null,
      timeWarning: null,
    });
  });
});

describe("hasPreciseBirthData", () => {
  it("requires an exact time and a place", () => {
    const base: OnboardingData = {
      ...EMPTY_ONBOARDING_DATA,
      birthTime: { precision: "exact", time: "14:30", margin: null },
      birthPlace: LYON,
    };
    expect(hasPreciseBirthData(base)).toBe(true);
    expect(hasPreciseBirthData({ ...base, birthPlace: null })).toBe(false);
    expect(hasPreciseBirthData({ ...base, birthTime: { precision: "unknown", time: "", margin: null } })).toBe(false);
  });
});
