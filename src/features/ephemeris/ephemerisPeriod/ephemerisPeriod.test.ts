import { describe, expect, it } from "vitest";
import {
  addDays,
  defaultSelectedDay,
  isWithin,
  listDays,
  rangeFor,
  shiftAnchor,
  splitDegree,
  utcIsoDate,
} from "./ephemerisPeriod";

describe("ephemerisPeriod", () => {
  it("formate une date en jour UTC", () => {
    expect(utcIsoDate(new Date("2026-10-30T23:30:00Z"))).toBe("2026-10-30");
  });

  it("calcule la plage d'un jour, d'une semaine du lundi au dimanche et d'un mois civil", () => {
    expect(rangeFor("day", "2026-10-30")).toEqual({ from: "2026-10-30", to: "2026-10-30" });
    expect(rangeFor("week", "2026-10-30")).toEqual({ from: "2026-10-26", to: "2026-11-01" });
    expect(rangeFor("week", "2026-11-01")).toEqual({ from: "2026-10-26", to: "2026-11-01" });
    expect(rangeFor("week", "2026-10-26")).toEqual({ from: "2026-10-26", to: "2026-11-01" });
    expect(rangeFor("month", "2026-10-30")).toEqual({ from: "2026-10-01", to: "2026-10-31" });
    expect(rangeFor("month", "2028-02-10")).toEqual({ from: "2028-02-01", to: "2028-02-29" });
  });

  it("ne dépasse jamais 31 jours", () => {
    for (let month = 1; month <= 12; month += 1) {
      const range = rangeFor("month", `2026-${String(month).padStart(2, "0")}-15`);
      expect(listDays(range).length).toBeLessThanOrEqual(31);
    }
  });

  it("décale la période précédente et suivante", () => {
    expect(shiftAnchor("day", "2026-10-31", 1)).toBe("2026-11-01");
    expect(shiftAnchor("week", "2026-10-30", -1)).toBe("2026-10-23");
    expect(shiftAnchor("month", "2026-01-31", 1)).toBe("2026-02-01");
    expect(shiftAnchor("month", "2026-01-15", -1)).toBe("2025-12-01");
  });

  it("choisit aujourd'hui s'il est dans la plage, sinon le premier jour", () => {
    const range = { from: "2026-10-26", to: "2026-11-01" };
    expect(isWithin("2026-10-26", range)).toBe(true);
    expect(isWithin("2026-11-02", range)).toBe(false);
    expect(defaultSelectedDay(range, "2026-10-30")).toBe("2026-10-30");
    expect(defaultSelectedDay(range, "2026-12-01")).toBe("2026-10-26");
  });

  it("liste les jours et ajoute des jours", () => {
    expect(listDays({ from: "2026-10-30", to: "2026-11-01" })).toEqual(["2026-10-30", "2026-10-31", "2026-11-01"]);
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("sépare degré et minute dans le signe", () => {
    expect(splitDegree(24.7)).toEqual({ degree: 24, minute: 42 });
    expect(splitDegree(0)).toEqual({ degree: 0, minute: 0 });
    expect(splitDegree(29.9999)).toEqual({ degree: 29, minute: 59 });
  });
});
