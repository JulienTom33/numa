import { e_tilt, MakeTime, SiderealTime } from "astronomy-engine";
import { normalizeDegrees } from "./zodiac.ts";

export interface ChartLocation {
  readonly instant: Date;
  readonly latitude: number;
  readonly longitude: number;
}

export interface ChartAngles {
  readonly localSiderealTime: number;
  readonly obliquity: number;
  readonly ascendant: number;
  readonly midheaven: number;
}

export const DEGREES = Math.PI / 180;

/** Vérifie l'instant UTC et les coordonnées géographiques, sinon lève une RangeError. */
export function assertValidLocation(location: ChartLocation): void {
  if (Number.isNaN(location.instant.getTime())) {
    throw new RangeError("invalid_instant");
  }
  if (!Number.isFinite(location.latitude) || Math.abs(location.latitude) >= 90) {
    throw new RangeError("invalid_latitude");
  }
  if (!Number.isFinite(location.longitude) || Math.abs(location.longitude) > 180) {
    throw new RangeError("invalid_longitude");
  }
}

/**
 * Temps sidéral local apparent (RAMC), en degrés : temps sidéral apparent de Greenwich
 * (Astronomy Engine) plus la longitude est.
 */
export function localSiderealTimeDegrees(instant: Date, longitude: number): number {
  return normalizeDegrees(SiderealTime(instant) * 15 + longitude);
}

/** Obliquité vraie de l'écliptique (moyenne + nutation en obliquité), en degrés. */
export function trueObliquity(instant: Date): number {
  return e_tilt(MakeTime(instant)).tobl;
}

/**
 * Longitude écliptique du MC, point de l'écliptique d'ascension droite RAMC :
 * tan λ = tan RAMC / cos ε (inverse de Meeus, éq. 13.3, avec β = 0).
 */
export function midheavenFromSiderealTime(ramc: number, obliquity: number): number {
  const theta = ramc * DEGREES;
  const epsilon = obliquity * DEGREES;
  return normalizeDegrees(
    Math.atan2(Math.sin(theta), Math.cos(theta) * Math.cos(epsilon)) / DEGREES,
  );
}

/**
 * Longitude écliptique de l'ascendant :
 * tan λ = −cos RAMC / (sin ε tan φ + cos ε sin RAMC) (Meeus, chap. 14, point de l'écliptique
 * à l'horizon), quadrant choisi pour le point qui se lève à l'est.
 */
export function ascendantFromSiderealTime(
  ramc: number,
  obliquity: number,
  latitude: number,
): number {
  const theta = ramc * DEGREES;
  const epsilon = obliquity * DEGREES;
  const phi = latitude * DEGREES;
  return normalizeDegrees(
    Math.atan2(
      Math.cos(theta),
      -(Math.sin(theta) * Math.cos(epsilon) + Math.tan(phi) * Math.sin(epsilon)),
    ) / DEGREES,
  );
}

/** Calcule le temps sidéral local, l'obliquité vraie, l'ascendant et le MC d'un instant UTC. */
export function computeAngles(location: ChartLocation): ChartAngles {
  assertValidLocation(location);
  const localSiderealTime = localSiderealTimeDegrees(location.instant, location.longitude);
  const obliquity = trueObliquity(location.instant);
  return {
    localSiderealTime,
    obliquity,
    ascendant: ascendantFromSiderealTime(localSiderealTime, obliquity, location.latitude),
    midheaven: midheavenFromSiderealTime(localSiderealTime, obliquity),
  };
}
