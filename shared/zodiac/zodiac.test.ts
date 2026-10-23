import { describe, expect, it } from "vitest";
import { normalizeDegrees, toEclipticPosition, ZODIAC_SIGNS } from "./zodiac.ts";

describe("normalizeDegrees", () => {
  it("ramène tout angle dans [0, 360)", () => {
    expect(normalizeDegrees(0)).toBe(0);
    expect(normalizeDegrees(360)).toBe(0);
    expect(normalizeDegrees(725)).toBe(5);
    expect(normalizeDegrees(-30)).toBe(330);
    expect(normalizeDegrees(-720)).toBe(0);
    expect(normalizeDegrees(-1e-15)).toBeLessThan(360);
  });
});

describe("toEclipticPosition", () => {
  it("donne le signe et le degré dans le signe", () => {
    expect(toEclipticPosition(0)).toEqual({ longitude: 0, sign: "aries", degreeInSign: 0 });
    expect(toEclipticPosition(359.5).sign).toBe("pisces");
    expect(toEclipticPosition(359.5).degreeInSign).toBeCloseTo(29.5);
    expect(toEclipticPosition(-1).sign).toBe("pisces");
    expect(toEclipticPosition(193.146863).degreeInSign).toBeCloseTo(13.146863);
    expect(toEclipticPosition(193.146863).sign).toBe("libra");
  });

  it("couvre 30° par signe, du Bélier aux Poissons", () => {
    ZODIAC_SIGNS.forEach((sign, index) => {
      expect(toEclipticPosition(index * 30 + 15).sign).toBe(sign);
    });
    expect(ZODIAC_SIGNS).toHaveLength(12);
  });
});
