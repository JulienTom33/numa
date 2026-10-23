import { normalizeDegrees } from "../../../shared/zodiac/zodiac.ts";
import { round } from "./bodies.ts";
import type {
  Aspect,
  AspectType,
  BodyId,
} from "../../../shared/contracts/natalChart/natalChart.ts";

export const ASPECT_DEFINITIONS: Readonly<
  Record<AspectType, { readonly angle: number; readonly maxOrb: number }>
> = {
  conjunction: { angle: 0, maxOrb: 8 },
  sextile: { angle: 60, maxOrb: 5 },
  square: { angle: 90, maxOrb: 7 },
  trine: { angle: 120, maxOrb: 8 },
  opposition: { angle: 180, maxOrb: 8 },
};

const ORB_DECIMALS = 1e4;

export function angularSeparation(a: number, b: number): number {
  const difference = normalizeDegrees(a - b);
  return Math.min(difference, 360 - difference);
}

export function findAspects(
  positions: readonly { readonly body: BodyId; readonly longitude: number }[],
): Aspect[] {
  const aspects: Aspect[] = [];
  for (let first = 0; first < positions.length; first++) {
    for (let second = first + 1; second < positions.length; second++) {
      const separation = angularSeparation(positions[first].longitude, positions[second].longitude);
      for (const [type, { angle, maxOrb }] of Object.entries(ASPECT_DEFINITIONS)) {
        const orb = Math.abs(separation - angle);
        if (orb <= maxOrb) {
          aspects.push({
            bodyA: positions[first].body,
            bodyB: positions[second].body,
            type: type as AspectType,
            exactAngle: angle,
            orb: round(orb, ORB_DECIMALS),
          });
        }
      }
    }
  }
  return aspects.sort((a, b) => a.orb - b.orb);
}
