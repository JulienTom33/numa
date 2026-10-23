import {
  Body,
  GeoVector,
  MakeTime,
  RotateVector,
  Rotation_EQJ_ECT,
  SphereFromVector,
} from "astronomy-engine";
import { normalizeDegrees, toEclipticPosition } from "../../../shared/zodiac/zodiac.ts";
import type { BodyId, BodyPosition } from "../../../shared/contracts/natalChart/natalChart.ts";

const ENGINE_BODIES: Readonly<Record<BodyId, Body>> = {
  sun: Body.Sun,
  moon: Body.Moon,
  mercury: Body.Mercury,
  venus: Body.Venus,
  mars: Body.Mars,
  jupiter: Body.Jupiter,
  saturn: Body.Saturn,
  uranus: Body.Uranus,
  neptune: Body.Neptune,
  pluto: Body.Pluto,
};

const HALF_DAY_MS = 12 * 60 * 60 * 1000;
const LONGITUDE_DECIMALS = 1e6;

export function round(value: number, factor = LONGITUDE_DECIMALS): number {
  return Math.round(value * factor) / factor;
}

export function eclipticLongitude(body: BodyId, instant: Date): number {
  const time = MakeTime(instant);
  const vector = GeoVector(ENGINE_BODIES[body], time, true);
  const ecliptic = SphereFromVector(RotateVector(Rotation_EQJ_ECT(time), vector));
  return normalizeDegrees(ecliptic.lon);
}

function signedDifference(from: number, to: number): number {
  return normalizeDegrees(to - from + 180) - 180;
}

export function dailySpeed(body: BodyId, instant: Date): number {
  const before = eclipticLongitude(body, new Date(instant.getTime() - HALF_DAY_MS));
  const after = eclipticLongitude(body, new Date(instant.getTime() + HALF_DAY_MS));
  return signedDifference(before, after);
}

export function computeBody(body: BodyId, instant: Date): Omit<BodyPosition, "house"> {
  const speed = dailySpeed(body, instant);
  return {
    body,
    ...toEclipticPosition(round(eclipticLongitude(body, instant))),
    retrograde: speed < 0,
    speed: round(speed, 1e4),
  };
}
