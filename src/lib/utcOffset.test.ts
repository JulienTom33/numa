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

  it("ignores the longitude once legal time applies", () => {
    expect(resolveUtcOffset({ date: "1975-07-14", time: "12:00" }, "Europe/Paris", 2.3488)).toEqual({
      offsetMinutes: 60,
      utc: "1975-07-14T11:00:00.000Z",
      status: "exact",
    });
    expect(resolveUtcOffset({ date: "2021-11-07", time: "01:30" }, "America/New_York", -74.006)?.status).toBe(
      "ambiguous",
    );
    expect(resolveUtcOffset({ date: "2021-03-28", time: "02:30" }, "Europe/Paris", 2.3488)?.status).toBe(
      "nonexistent",
    );
    expect(resolveUtcOffset({ date: "1990-06-01", time: "12:00" }, "Asia/Kolkata", 88.3639)?.offsetMinutes).toBe(330);
    expect(resolveUtcOffset({ date: "1990-01-15", time: "12:00" }, "Australia/Sydney", 151.2093)?.offsetMinutes).toBe(
      660,
    );
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

describe("resolveUtcOffset before legal time", () => {
  it("uses the local mean time of Ulm, not the one of Berlin, in 1879", () => {
    expect(resolveUtcOffset({ date: "1879-03-14", time: "11:30" }, "Europe/Berlin", 9.9833)).toEqual({
      offsetMinutes: 40,
      offsetSeconds: 2396,
      utc: "1879-03-14T10:50:04.000Z",
      status: "localMeanTime",
    });
  });

  it("keeps the tz database Berlin mean time when no longitude is given", () => {
    expect(resolveUtcOffset({ date: "1879-03-14", time: "11:30" }, "Europe/Berlin")).toEqual({
      offsetMinutes: 53,
      utc: "1879-03-14T10:37:00.000Z",
      status: "exact",
    });
  });

  it("switches to legal time once Germany adopted CET in 1893", () => {
    expect(resolveUtcOffset({ date: "1894-03-14", time: "11:30" }, "Europe/Berlin", 9.9833)).toEqual({
      offsetMinutes: 60,
      utc: "1894-03-14T10:30:00.000Z",
      status: "exact",
    });
  });

  it("matches the Paris mean time (+0:09:21) at the Paris Observatory before 1891", () => {
    expect(resolveUtcOffset({ date: "1880-06-01", time: "12:00" }, "Europe/Paris", 2.3372)).toEqual({
      offsetMinutes: 9,
      offsetSeconds: 561,
      utc: "1880-06-01T11:50:39.000Z",
      status: "localMeanTime",
    });
  });

  it("uses the local mean time of Lyon before 1891, then the legal Paris mean time", () => {
    expect(resolveUtcOffset({ date: "1885-06-01", time: "12:00" }, "Europe/Paris", 4.8357)).toEqual({
      offsetMinutes: 19,
      offsetSeconds: 1161,
      utc: "1885-06-01T11:40:39.000Z",
      status: "localMeanTime",
    });
    expect(resolveUtcOffset({ date: "1900-06-01", time: "12:00" }, "Europe/Paris", 4.8357)).toEqual({
      offsetMinutes: 9,
      utc: "1900-06-01T11:51:00.000Z",
      status: "exact",
    });
  });

  it("handles a city far west of its zone reference (Brest, 27 minutes from Paris)", () => {
    expect(resolveUtcOffset({ date: "1880-06-01", time: "12:00" }, "Europe/Paris", -4.4861)).toEqual({
      offsetMinutes: -18,
      offsetSeconds: -1077,
      utc: "1880-06-01T12:17:57.000Z",
      status: "localMeanTime",
    });
  });

  it("handles western longitudes before standard time in North America (San Diego, 1880)", () => {
    expect(resolveUtcOffset({ date: "1880-01-15", time: "12:00" }, "America/Los_Angeles", -117.1573)).toEqual({
      offsetMinutes: -469,
      offsetSeconds: -28118,
      utc: "1880-01-15T19:48:38.000Z",
      status: "localMeanTime",
    });
  });

  it("never treats a fixed-offset zone as local mean time", () => {
    expect(resolveUtcOffset({ date: "1850-06-01", time: "12:00" }, "UTC", 10)).toEqual({
      offsetMinutes: 0,
      utc: "1850-06-01T12:00:00.000Z",
      status: "exact",
    });
  });

  it.each([200, -180.5, Number.NaN, Number.POSITIVE_INFINITY])("returns null for longitude %s", (longitude) => {
    expect(resolveUtcOffset({ date: "1879-03-14", time: "11:30" }, "Europe/Berlin", longitude)).toBeNull();
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
