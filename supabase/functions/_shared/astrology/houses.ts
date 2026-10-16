import { type ChartAngles, type ChartLocation, computeAngles, DEGREES } from "./angles.ts";
import { type EclipticPosition, normalizeDegrees, toEclipticPosition } from "./zodiac.ts";

export const HOUSE_SYSTEMS = ["placidus", "porphyry", "equal", "whole-sign"] as const;

export type HouseSystem = typeof HOUSE_SYSTEMS[number];

export type HouseFallbackReason = "polar-latitude" | "placidus-not-converged";

export interface HouseFallback {
  readonly from: HouseSystem;
  readonly reason: HouseFallbackReason;
}

export interface HouseCalculation {
  readonly requestedSystem: HouseSystem;
  readonly system: HouseSystem;
  readonly fallback: HouseFallback | null;
  readonly localSiderealTime: number;
  readonly obliquity: number;
  readonly ascendant: EclipticPosition;
  readonly midheaven: EclipticPosition;
  readonly cusps: readonly EclipticPosition[];
}

export const DEFAULT_HOUSE_SYSTEM: HouseSystem = "placidus";

const PLACIDUS_TOLERANCE_DEGREES = 1e-9;
const PLACIDUS_MAX_ITERATIONS = 200;

/** Indique si Placidus est défini à cette latitude : |φ| < 90° − ε (hors des cercles polaires). */
export function isPlacidusDefined(latitude: number, obliquity: number): boolean {
  return Math.abs(latitude) < 90 - obliquity;
}

function eclipticLongitudeFromRightAscension(rightAscension: number, obliquity: number): number {
  const alpha = rightAscension * DEGREES;
  return normalizeDegrees(
    Math.atan2(Math.sin(alpha), Math.cos(alpha) * Math.cos(obliquity * DEGREES)) / DEGREES,
  );
}

function ascensionalDifference(longitude: number, obliquity: number, latitude: number): number {
  const declination = Math.asin(Math.sin(obliquity * DEGREES) * Math.sin(longitude * DEGREES));
  return Math.asin(Math.tan(latitude * DEGREES) * Math.tan(declination)) / DEGREES;
}

function angularDistance(a: number, b: number): number {
  const difference = normalizeDegrees(a - b);
  return Math.min(difference, 360 - difference);
}

function placidusCusp(
  angles: ChartAngles,
  latitude: number,
  rightAscensionOf: (ascensionalDifference: number) => number,
): number | null {
  let longitude = eclipticLongitudeFromRightAscension(rightAscensionOf(0), angles.obliquity);
  for (let iteration = 0; iteration < PLACIDUS_MAX_ITERATIONS; iteration++) {
    const difference = ascensionalDifference(longitude, angles.obliquity, latitude);
    const next = eclipticLongitudeFromRightAscension(
      rightAscensionOf(difference),
      angles.obliquity,
    );
    if (!Number.isFinite(next)) {
      return null;
    }
    if (angularDistance(next, longitude) < PLACIDUS_TOLERANCE_DEGREES) {
      return next;
    }
    longitude = next;
  }
  return null;
}

/**
 * Cuspides Placidus 11, 12, 2 et 3 par itération sur la trisection des semi-arcs :
 * α₁₁ = RAMC + DSA/3, α₁₂ = RAMC + 2·DSA/3, α₂ = RAMC + 180° − 2·NSA/3, α₃ = RAMC + 180° − NSA/3,
 * avec DSA = 90° + AD, NSA = 90° − AD et sin AD = tan φ · tan δ. Renvoie null si non convergent.
 */
export function placidusCusps(angles: ChartAngles, latitude: number): number[] | null {
  const ramc = angles.localSiderealTime;
  const cusp11 = placidusCusp(angles, latitude, (ad) => ramc + (90 + ad) / 3);
  const cusp12 = placidusCusp(angles, latitude, (ad) => ramc + (2 * (90 + ad)) / 3);
  const cusp2 = placidusCusp(angles, latitude, (ad) => ramc + 180 - (2 * (90 - ad)) / 3);
  const cusp3 = placidusCusp(angles, latitude, (ad) => ramc + 180 - (90 - ad) / 3);
  if (cusp11 === null || cusp12 === null || cusp2 === null || cusp3 === null) {
    return null;
  }
  return withOppositeCusps(angles, cusp11, cusp12, cusp2, cusp3);
}

/** Cuspides Porphyre : chaque quadrant (MC → AS, AS → FC) divisé en trois arcs égaux d'écliptique. */
export function porphyryCusps(angles: ChartAngles): number[] {
  const upperQuadrant = normalizeDegrees(angles.ascendant - angles.midheaven);
  const lowerQuadrant = normalizeDegrees(angles.midheaven + 180 - angles.ascendant);
  return withOppositeCusps(
    angles,
    angles.midheaven + upperQuadrant / 3,
    angles.midheaven + (2 * upperQuadrant) / 3,
    angles.ascendant + lowerQuadrant / 3,
    angles.ascendant + (2 * lowerQuadrant) / 3,
  );
}

/** Cuspides égales : 30° à partir de l'ascendant. */
export function equalCusps(angles: ChartAngles): number[] {
  return Array.from({ length: 12 }, (_, index) => normalizeDegrees(angles.ascendant + 30 * index));
}

/** Cuspides en signes entiers : la maison 1 commence à 0° du signe de l'ascendant. */
export function wholeSignCusps(angles: ChartAngles): number[] {
  const firstCusp = Math.floor(normalizeDegrees(angles.ascendant) / 30) * 30;
  return Array.from({ length: 12 }, (_, index) => normalizeDegrees(firstCusp + 30 * index));
}

function withOppositeCusps(
  angles: ChartAngles,
  cusp11: number,
  cusp12: number,
  cusp2: number,
  cusp3: number,
): number[] {
  const { ascendant, midheaven } = angles;
  return [
    ascendant,
    cusp2,
    cusp3,
    midheaven + 180,
    cusp11 + 180,
    cusp12 + 180,
    ascendant + 180,
    cusp2 + 180,
    cusp3 + 180,
    midheaven,
    cusp11,
    cusp12,
  ].map(normalizeDegrees);
}

function resolveCusps(
  angles: ChartAngles,
  latitude: number,
  system: HouseSystem,
): { system: HouseSystem; fallback: HouseFallback | null; cusps: number[] } {
  switch (system) {
    case "placidus": {
      if (!isPlacidusDefined(latitude, angles.obliquity)) {
        return {
          system: "porphyry",
          fallback: { from: "placidus", reason: "polar-latitude" },
          cusps: porphyryCusps(angles),
        };
      }
      const cusps = placidusCusps(angles, latitude);
      if (cusps === null) {
        return {
          system: "porphyry",
          fallback: { from: "placidus", reason: "placidus-not-converged" },
          cusps: porphyryCusps(angles),
        };
      }
      return { system, fallback: null, cusps };
    }
    case "porphyry":
      return { system, fallback: null, cusps: porphyryCusps(angles) };
    case "equal":
      return { system, fallback: null, cusps: equalCusps(angles) };
    case "whole-sign":
      return { system, fallback: null, cusps: wholeSignCusps(angles) };
  }
}

/**
 * Calcule ascendant, MC et cuspides des 12 maisons pour un instant UTC et un lieu.
 * Placidus, indéfini aux latitudes polaires ou non convergent, se replie sur Porphyre :
 * `system` vaut alors "porphyry" et `fallback` en donne la raison.
 */
export function computeHouses(
  location: ChartLocation,
  requestedSystem: HouseSystem = DEFAULT_HOUSE_SYSTEM,
): HouseCalculation {
  const angles = computeAngles(location);
  const { system, fallback, cusps } = resolveCusps(angles, location.latitude, requestedSystem);
  return {
    requestedSystem,
    system,
    fallback,
    localSiderealTime: angles.localSiderealTime,
    obliquity: angles.obliquity,
    ascendant: toEclipticPosition(angles.ascendant),
    midheaven: toEclipticPosition(angles.midheaven),
    cusps: cusps.map(toEclipticPosition),
  };
}
