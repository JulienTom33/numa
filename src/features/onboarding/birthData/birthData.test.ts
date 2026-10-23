import { describe, expect, it } from "vitest";
import {
  EMPTY_ONBOARDING_DATA,
  hasPreciseBirthData,
  normalizeBirthTime,
  parseIsoDate,
  timeWarningCode,
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
    expect(validateFirstName("")).toBe("required");
    expect(validateFirstName("   ")).toBe("required");
  });

  it("rejects a value longer than 50 characters once trimmed", () => {
    expect(validateFirstName(`  ${"a".repeat(50)}  `)).toBeNull();
    expect(validateFirstName("a".repeat(51))).toBe("tooLong");
  });

  it("rejects control characters", () => {
    expect(validateFirstName("Em\u0007ile")).toBe("invalidCharacters");
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
    expect(validateBirthDate(null, TODAY)).toBe("required");
    expect(validateBirthDate("", TODAY)).toBe("required");
  });

  it("rejects a malformed value", () => {
    expect(validateBirthDate("12/03/1990", TODAY)).toBe("invalidFormat");
  });

  it("rejects impossible dates such as 31 February", () => {
    const message = "nonexistent";
    expect(validateBirthDate("1990-02-31", TODAY)).toBe(message);
    expect(validateBirthDate("1991-02-29", TODAY)).toBe(message);
    expect(validateBirthDate("1990-04-31", TODAY)).toBe(message);
    expect(validateBirthDate("1990-13-01", TODAY)).toBe(message);
    expect(validateBirthDate("1990-01-00", TODAY)).toBe(message);
  });

  it("rejects a date in the future", () => {
    expect(validateBirthDate("2026-10-16", TODAY)).toBe("future");
  });

  it("rejects an implausible year", () => {
    expect(validateBirthDate("1899-12-31", TODAY)).toBe("tooEarly");
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
      error: "incomplete",
    });
  });

  it("rejects 31 February", () => {
    expect(validateBirthDateParts({ day: 31, month: 2, year: 1990 }, TODAY).error).toBe("nonexistent");
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
    expect(validateBirthTime({ precision: null, time: "", margin: null })).toBe("precisionRequired");
  });

  it("accepts an unknown time without any value", () => {
    expect(validateBirthTime({ precision: "unknown", time: "", margin: null })).toBeNull();
  });

  it("accepts an exact time in HH:MM", () => {
    expect(validateBirthTime({ precision: "exact", time: "00:00", margin: null })).toBeNull();
    expect(validateBirthTime({ precision: "exact", time: "23:59", margin: null })).toBeNull();
  });

  it("requires a time for exact and approximate precision", () => {
    expect(validateBirthTime({ precision: "exact", time: "", margin: null })).toBe("timeRequired");
  });

  it("rejects a malformed time", () => {
    const message = "invalidFormat";
    expect(validateBirthTime({ precision: "exact", time: "24:00", margin: null })).toBe(message);
    expect(validateBirthTime({ precision: "exact", time: "9:30", margin: null })).toBe(message);
    expect(validateBirthTime({ precision: "exact", time: "12:60", margin: null })).toBe(message);
  });

  it("requires a margin for an approximate time", () => {
    expect(validateBirthTime({ precision: "approximate", time: "14:30", margin: null })).toBe("marginRequired");
    expect(validateBirthTime({ precision: "approximate", time: "14:30", margin: "over_2_h" })).toBeNull();
  });
});

describe("validateBirthPlace", () => {
  it("requires a place picked from the suggestions", () => {
    expect(validateBirthPlace(null)).toBe("required");
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

describe("parseIsoDate", () => {
  it("splits an ISO date into numbers", () => {
    expect(parseIsoDate("1990-03-01")).toEqual({ year: 1990, month: 3, day: 1 });
  });

  it("returns null for a non-ISO value", () => {
    expect(parseIsoDate("01/03/1990")).toBeNull();
  });
});

describe("timeWarningCode", () => {
  it("warns only for approximate or unknown times", () => {
    expect(timeWarningCode("exact")).toBeNull();
    expect(timeWarningCode(null)).toBeNull();
    expect(timeWarningCode("approximate")).toBe("approximate");
    expect(timeWarningCode("unknown")).toBe("unknown");
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
