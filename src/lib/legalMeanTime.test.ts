import { describe, expect, it } from "vitest";
import { LEGAL_MEAN_TIME_START_MS } from "./legalMeanTime";

function longOffset(timeZone: string, utcMs: number): string {
  const part = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
    .formatToParts(new Date(utcMs))
    .find(({ type }) => type === "timeZoneName");
  return part?.value ?? "";
}

describe("LEGAL_MEAN_TIME_START_MS", () => {
  // Each entry is a tz transition from LMT to a legal mean time with the same offset,
  // invisible through Intl: the offset must be identical on both sides and not a standard one.
  it.each(Object.entries(LEGAL_MEAN_TIME_START_MS))("%s keeps its mean time offset across the start", (zone, start) => {
    const before = longOffset(zone, start - 60_000);
    expect(longOffset(zone, start + 60_000)).toBe(before);
    expect(before).toMatch(/^GMT[+-]\d{2}:\d{2}(:\d{2})?$/);
    expect(before).not.toMatch(/^GMT[+-]\d{2}:(00|15|30|45)$/);
  });
});
