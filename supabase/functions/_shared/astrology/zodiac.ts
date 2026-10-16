export const ZODIAC_SIGNS = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
] as const;

export type ZodiacSign = typeof ZODIAC_SIGNS[number];

export interface EclipticPosition {
  readonly longitude: number;
  readonly sign: ZodiacSign;
  readonly degreeInSign: number;
}

/** Ramène un angle en degrés dans l'intervalle [0, 360). */
export function normalizeDegrees(degrees: number): number {
  const remainder = degrees % 360;
  const normalized = remainder < 0 ? remainder + 360 : remainder;
  return normalized >= 360 ? 0 : normalized + 0;
}

/** Convertit une longitude écliptique tropicale (degrés) en signe et degré dans le signe. */
export function toEclipticPosition(longitude: number): EclipticPosition {
  const normalized = normalizeDegrees(longitude);
  const signIndex = Math.min(Math.floor(normalized / 30), 11);
  return {
    longitude: normalized,
    sign: ZODIAC_SIGNS[signIndex],
    degreeInSign: normalized - signIndex * 30,
  };
}
