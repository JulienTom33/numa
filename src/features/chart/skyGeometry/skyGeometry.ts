import type { SkyBodyId } from "../skyChart/skyChart";
import type { ZodiacSign } from "../../../../shared/zodiac/zodiac.ts";

export const WHEEL_SIZE = 340;
export const WHEEL_CENTER = WHEEL_SIZE / 2;
export const WHEEL_RADII = {
  outer: 150,
  signInner: 124,
  houseNumber: 62,
  planet: 100,
  inner: 48,
} as const;

const TEXT_VARIANT = "︎";
const MIN_GLYPH_GAP = 9;
const SPREAD_PASSES = 6;

export const SIGN_GLYPHS: Readonly<Record<ZodiacSign, string>> = {
  aries: `♈${TEXT_VARIANT}`,
  taurus: `♉${TEXT_VARIANT}`,
  gemini: `♊${TEXT_VARIANT}`,
  cancer: `♋${TEXT_VARIANT}`,
  leo: `♌${TEXT_VARIANT}`,
  virgo: `♍${TEXT_VARIANT}`,
  libra: `♎${TEXT_VARIANT}`,
  scorpio: `♏${TEXT_VARIANT}`,
  sagittarius: `♐${TEXT_VARIANT}`,
  capricorn: `♑${TEXT_VARIANT}`,
  aquarius: `♒${TEXT_VARIANT}`,
  pisces: `♓${TEXT_VARIANT}`,
};

export const BODY_GLYPHS: Readonly<Record<SkyBodyId, string>> = {
  sun: `☉${TEXT_VARIANT}`,
  moon: `☽${TEXT_VARIANT}`,
  mercury: `☿${TEXT_VARIANT}`,
  venus: `♀${TEXT_VARIANT}`,
  mars: `♂${TEXT_VARIANT}`,
  jupiter: `♃${TEXT_VARIANT}`,
  saturn: `♄${TEXT_VARIANT}`,
  uranus: `♅${TEXT_VARIANT}`,
  neptune: `♆${TEXT_VARIANT}`,
  pluto: `♇${TEXT_VARIANT}`,
};

export interface Point {
  x: number;
  y: number;
}

export function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

export function wheelRotation(ascendantLongitude: number | null): number {
  return ascendantLongitude ?? 0;
}

export function screenAngle(longitude: number, rotation: number): number {
  return normalizeDegrees(180 + (longitude - rotation));
}

export function polarPoint(angleDegrees: number, radius: number): Point {
  const radians = (angleDegrees * Math.PI) / 180;
  return {
    x: WHEEL_CENTER + radius * Math.cos(radians),
    y: WHEEL_CENTER - radius * Math.sin(radians),
  };
}

export function spreadLongitudes(longitudes: readonly number[], minGap = MIN_GLYPH_GAP): number[] {
  const order = longitudes.map((_, index) => index).sort((a, b) => longitudes[a] - longitudes[b]);
  const spread = order.map((index) => longitudes[index]);
  for (let pass = 0; pass < SPREAD_PASSES; pass++) {
    for (let current = 0; current < spread.length; current++) {
      const next = (current + 1) % spread.length;
      if (next === current) continue;
      const gap = normalizeDegrees(spread[next] - spread[current]);
      if (gap < minGap) {
        const push = (minGap - gap) / 2;
        spread[current] -= push;
        spread[next] += push;
      }
    }
  }
  const result = new Array<number>(longitudes.length);
  order.forEach((originalIndex, sortedIndex) => {
    result[originalIndex] = normalizeDegrees(spread[sortedIndex]);
  });
  return result;
}

export function sectorPath(startAngle: number, endAngle: number, inner: number, outer: number): string {
  const a = polarPoint(startAngle, outer);
  const b = polarPoint(endAngle, outer);
  const c = polarPoint(endAngle, inner);
  const d = polarPoint(startAngle, inner);
  const fmt = (point: Point) => `${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  return `M ${fmt(a)} A ${outer} ${outer} 0 0 0 ${fmt(b)} L ${fmt(c)} A ${inner} ${inner} 0 0 1 ${fmt(d)} Z`;
}
