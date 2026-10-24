import { describe, expect, it } from "vitest";
import { findOption, hasBirthChanged, toProfileDraft, validateProfileDraft, PROFILE_TONES } from "./profileData";
import { authenticatedProfile } from "./profileFixtures";

const TODAY = new Date(2026, 9, 24, 12, 0);

describe("toProfileDraft", () => {
  it("découpe la date ISO en jour, mois, année", () => {
    expect(toProfileDraft(authenticatedProfile).birthDate).toEqual({ day: 12, month: 3, year: 1990 });
  });
});

describe("findOption", () => {
  it("renvoie l'option connue ou null", () => {
    expect(findOption(PROFILE_TONES, "direct")).toBe("direct");
    expect(findOption(PROFILE_TONES, "autre")).toBeNull();
  });
});

describe("hasBirthChanged", () => {
  it("est faux pour un brouillon identique", () => {
    expect(hasBirthChanged(authenticatedProfile, toProfileDraft(authenticatedProfile))).toBe(false);
  });

  it("détecte un changement de date, d'heure ou de lieu", () => {
    const draft = toProfileDraft(authenticatedProfile);
    expect(hasBirthChanged(authenticatedProfile, { ...draft, birthDate: { day: 13, month: 3, year: 1990 } })).toBe(true);
    expect(
      hasBirthChanged(authenticatedProfile, { ...draft, birthTime: { precision: "unknown", time: "", margin: null } }),
    ).toBe(true);
    expect(hasBirthChanged(authenticatedProfile, { ...draft, birthPlace: null })).toBe(true);
  });
});

describe("validateProfileDraft", () => {
  it("n'envoie pas la naissance quand elle est inchangée", () => {
    const draft = { ...toProfileDraft(authenticatedProfile), firstName: "  Léa ", tone: "direct" as const };
    const result = validateProfileDraft(authenticatedProfile, draft, TODAY);
    expect(result.errors).toBeNull();
    expect(result.update).toEqual({ firstName: "Léa", language: "fr", tone: "direct", birth: null });
  });

  it("inclut la naissance normalisée quand elle change", () => {
    const draft = {
      ...toProfileDraft(authenticatedProfile),
      birthTime: { precision: "unknown" as const, time: "10:00", margin: null },
    };
    const result = validateProfileDraft(authenticatedProfile, draft, TODAY);
    expect(result.update?.birth?.birthTime).toEqual({ precision: "unknown", time: "", margin: null });
  });

  it("renvoie les codes d'erreur de chaque champ", () => {
    const draft = {
      ...toProfileDraft(authenticatedProfile),
      firstName: " ",
      birthDate: { day: 31, month: 2, year: 1990 },
      birthTime: { precision: null, time: "", margin: null },
      birthPlace: null,
    };
    const result = validateProfileDraft(authenticatedProfile, draft, TODAY);
    expect(result.update).toBeNull();
    expect(result.errors).toEqual({
      firstName: "required",
      birthDate: "nonexistent",
      birthTime: "precisionRequired",
      birthPlace: "required",
    });
  });
});
