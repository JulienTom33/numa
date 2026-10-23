import { describe, expect, it } from "vitest";
import { formatDate, formatNumber, formatPercent } from "./format";

// Intl insère des espaces insécables (U+00A0 / U+202F) en français : on les normalise.
const normalize = (value: string) => value.replace(/\s/g, " ");

describe("format", () => {
  it("formats numbers with the language conventions", () => {
    expect(normalize(formatNumber(1234.5, "fr"))).toBe("1 234,5");
    expect(formatNumber(1234.5, "en")).toBe("1,234.5");
  });

  it("formats a ratio as a rounded percentage", () => {
    expect(normalize(formatPercent(0.42, "fr"))).toBe("42 %");
    expect(formatPercent(0.336, "en")).toBe("34%");
  });

  it("formats dates with the language conventions", () => {
    const date = new Date(Date.UTC(2026, 9, 15, 12));
    const options: Intl.DateTimeFormatOptions = { dateStyle: "long", timeZone: "UTC" };

    expect(formatDate(date, "fr", options)).toBe("15 octobre 2026");
    expect(formatDate(date, "en", options)).toBe("October 15, 2026");
  });
});
