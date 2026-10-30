import type { AspectType } from "../../../../shared/contracts/natalChart/natalChart.ts";
import type { CurrentSky, SkyBodyId, TransitAspect } from "../../chart/skyChart/skyChart";

export const INFLUENCES = ["relations", "love", "work", "energy"] as const;

export type Influence = (typeof INFLUENCES)[number];

export type IntensityLevel = "calm" | "moderate" | "strong";

export interface InfluenceReading {
  influence: Influence;
  level: IntensityLevel;
}

export interface EnergyReading {
  headline: TransitAspect | null;
  influences: InfluenceReading[];
}

const INFLUENCE_BODIES: Record<Influence, readonly SkyBodyId[]> = {
  relations: ["moon", "neptune"],
  love: ["venus"],
  work: ["saturn", "mercury", "jupiter"],
  energy: ["mars", "sun", "uranus", "pluto"],
};

const ASPECT_WEIGHT: Record<AspectType, number> = {
  conjunction: 1,
  opposition: 0.9,
  square: 0.9,
  trine: 0.7,
  sextile: 0.6,
};

const MAX_ORB = 8;
const STRONG_THRESHOLD = 0.6;
const MODERATE_THRESHOLD = 0.25;

export function aspectStrength(aspect: TransitAspect): number {
  const closeness = Math.max(0, 1 - aspect.orb / MAX_ORB);
  return closeness * ASPECT_WEIGHT[aspect.type];
}

function levelOf(strength: number): IntensityLevel {
  if (strength >= STRONG_THRESHOLD) return "strong";
  if (strength >= MODERATE_THRESHOLD) return "moderate";
  return "calm";
}

export function readEnergy(transits: CurrentSky): EnergyReading {
  const ranked = [...transits.aspects].sort((a, b) => aspectStrength(b) - aspectStrength(a));
  const influences = INFLUENCES.map((influence) => {
    const strongest = Math.max(
      0,
      ...transits.aspects
        .filter((aspect) => INFLUENCE_BODIES[influence].includes(aspect.transitBody))
        .map(aspectStrength),
    );
    return { influence, level: levelOf(strongest) };
  });
  return { headline: ranked[0] ?? null, influences };
}
