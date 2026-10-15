import { describe, expect, it } from "vitest";
import { daysInMonth, formatBirthDate, isComplete, isValidBirthDate } from "./birthDateParts";

const today = new Date(2026, 9, 15);

describe("isComplete", () => {
  it("requires day, month and year", () => {
    expect(isComplete({ day: "1", month: "", year: "1990" })).toBe(false);
    expect(isComplete({ day: "1", month: "3", year: "1990" })).toBe(true);
  });
});

describe("daysInMonth", () => {
  it("handles leap years", () => {
    expect(daysInMonth(2, 2000)).toBe(29);
    expect(daysInMonth(2, 1900)).toBe(28);
    expect(daysInMonth(2, 2024)).toBe(29);
    expect(daysInMonth(2, 2023)).toBe(28);
    expect(daysInMonth(4, 2023)).toBe(30);
    expect(daysInMonth(12, 2023)).toBe(31);
  });
});

describe("isValidBirthDate", () => {
  it("accepts an existing past date", () => {
    expect(isValidBirthDate({ day: "14", month: "3", year: "1990" }, today)).toBe(true);
    expect(isValidBirthDate({ day: "29", month: "2", year: "2000" }, today)).toBe(true);
  });

  it("rejects impossible dates", () => {
    expect(isValidBirthDate({ day: "31", month: "2", year: "1990" }, today)).toBe(false);
    expect(isValidBirthDate({ day: "29", month: "2", year: "2023" }, today)).toBe(false);
    expect(isValidBirthDate({ day: "31", month: "4", year: "1990" }, today)).toBe(false);
  });

  it("rejects incomplete, malformed or out-of-range values", () => {
    expect(isValidBirthDate({ day: "", month: "3", year: "1990" }, today)).toBe(false);
    expect(isValidBirthDate({ day: "x", month: "3", year: "1990" }, today)).toBe(false);
    expect(isValidBirthDate({ day: "1", month: "13", year: "1990" }, today)).toBe(false);
    expect(isValidBirthDate({ day: "0", month: "3", year: "1990" }, today)).toBe(false);
    expect(isValidBirthDate({ day: "1", month: "3", year: "1899" }, today)).toBe(false);
  });

  it("rejects future dates but accepts today", () => {
    expect(isValidBirthDate({ day: "16", month: "10", year: "2026" }, today)).toBe(false);
    expect(isValidBirthDate({ day: "15", month: "10", year: "2026" }, today)).toBe(true);
  });
});

describe("formatBirthDate", () => {
  it("formats in French with 1er for the first day", () => {
    expect(formatBirthDate({ day: "14", month: "3", year: "1990" })).toBe("14 mars 1990");
    expect(formatBirthDate({ day: "1", month: "8", year: "2001" })).toBe("1er août 2001");
  });
});
