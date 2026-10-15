import { describe, expect, it } from "vitest";
import { formatUtcOffset, resolveUtcOffset } from "./utcOffset";

describe("resolveUtcOffset", () => {
  it("has no summer time in Paris in 1975 (reintroduced in 1976)", () => {
    expect(resolveUtcOffset({ date: "1975-07-14", time: "12:00" }, "Europe/Paris")).toEqual({
      offsetMinutes: 60,
      utc: "1975-07-14T11:00:00.000Z",
      status: "exact",
    });
  });

  it("applies summer time in Paris in July 1976", () => {
    expect(resolveUtcOffset({ date: "1976-07-14", time: "12:00" }, "Europe/Paris")).toEqual({
      offsetMinutes: 120,
      utc: "1976-07-14T10:00:00.000Z",
      status: "exact",
    });
  });

  it("uses winter time in Paris in January 1975", () => {
    expect(resolveUtcOffset({ date: "1975-01-15", time: "08:30" }, "Europe/Paris")?.offsetMinutes).toBe(60);
  });

  it("follows the pre-war French legal time (GMT, summer time +1)", () => {
    expect(resolveUtcOffset({ date: "1938-01-15", time: "12:00" }, "Europe/Paris")?.offsetMinutes).toBe(0);
    expect(resolveUtcOffset({ date: "1938-07-01", time: "12:00" }, "Europe/Paris")?.offsetMinutes).toBe(60);
  });

  it("rounds the Paris mean time used before 1911 to the minute", () => {
    expect(resolveUtcOffset({ date: "1900-01-01", time: "12:00" }, "Europe/Paris")?.offsetMinutes).toBe(9);
  });

  it("handles non-hour offsets and the southern hemisphere", () => {
    expect(resolveUtcOffset({ date: "1990-06-01", time: "12:00" }, "Asia/Kolkata")?.offsetMinutes).toBe(330);
    expect(resolveUtcOffset({ date: "1990-01-15", time: "12:00" }, "Australia/Sydney")?.offsetMinutes).toBe(660);
  });

  it("keeps the first occurrence of a repeated hour", () => {
    expect(resolveUtcOffset({ date: "2021-11-07", time: "01:30" }, "America/New_York")).toEqual({
      offsetMinutes: -240,
      utc: "2021-11-07T05:30:00.000Z",
      status: "ambiguous",
    });
  });

  it("flags an hour skipped by the switch to summer time", () => {
    expect(resolveUtcOffset({ date: "2021-03-28", time: "02:30" }, "Europe/Paris")).toEqual({
      offsetMinutes: 60,
      utc: "2021-03-28T01:30:00.000Z",
      status: "nonexistent",
    });
  });

  it.each([
    [{ date: "1975-02-30", time: "12:00" }, "Europe/Paris"],
    [{ date: "1975-07-14", time: "24:00" }, "Europe/Paris"],
    [{ date: "14/07/1975", time: "12:00" }, "Europe/Paris"],
    [{ date: "1975-07-14", time: "12:00" }, "Mars/Olympus_Mons"],
  ])("returns null for invalid input %o in %s", (local, timeZone) => {
    expect(resolveUtcOffset(local, timeZone)).toBeNull();
  });
});

describe("formatUtcOffset", () => {
  it.each([
    [60, "UTC+01:00"],
    [0, "UTC+00:00"],
    [330, "UTC+05:30"],
    [-210, "UTC−03:30"],
  ])("formats %i minutes as %s", (minutes, expected) => {
    expect(formatUtcOffset(minutes)).toBe(expected);
  });
});
