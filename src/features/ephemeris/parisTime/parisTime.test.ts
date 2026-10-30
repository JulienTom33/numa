import { describe, expect, it } from "vitest";
import { formatParisDate, formatParisTime } from "./parisTime";

describe("parisTime", () => {
  it("convertit un instant d'été en UTC+2", () => {
    expect(formatParisTime("2026-07-15T10:30:00Z", "fr")).toBe("12:30");
  });

  it("convertit un instant d'hiver en UTC+1", () => {
    expect(formatParisTime("2026-01-15T10:30:00Z", "fr")).toBe("11:30");
  });

  it("gère le changement d'heure d'automne", () => {
    expect(formatParisTime("2026-10-24T22:00:00Z", "fr")).toBe("00:00");
    expect(formatParisTime("2026-10-25T22:00:00Z", "fr")).toBe("23:00");
  });

  it("affiche la date de Paris quand l'instant UTC est proche de minuit", () => {
    expect(formatParisDate("2026-07-15T22:30:00Z", "fr")).toBe("16 juillet 2026");
    expect(formatParisDate("2026-01-15T22:30:00Z", "fr")).toBe("15 janvier 2026");
  });
});
