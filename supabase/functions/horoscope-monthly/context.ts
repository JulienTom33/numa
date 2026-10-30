import { type BodyId, ENGINE_VERSION } from "../../../shared/contracts/natalChart/natalChart.ts";
import type { ZodiacSign } from "../../../shared/zodiac/zodiac.ts";
import { computeEphemeris } from "../ephemeris/compute.ts";
import { parseRange } from "../ephemeris/range.ts";
import { isRecord } from "../chat/guards.ts";
import type { Month } from "./month.ts";
import { MONTHLY_PROMPT_VERSION } from "./prompt.ts";

export const MAX_MONTH_ASPECTS = 8;

const SLOW_BODIES: readonly BodyId[] = ["jupiter", "saturn", "uranus", "neptune", "pluto"];

export interface MonthAspect {
  bodyA: BodyId;
  bodyB: BodyId;
  type: string;
  orb: number;
}

export interface MonthlyFactors {
  month: { start: string; end: string };
  sunSign: ZodiacSign;
  ascendantSign: ZodiacSign | null;
  retrogrades: { body: BodyId; sign: ZodiacSign }[];
  ingresses: { body: BodyId; to: ZodiacSign; at: string }[];
  stations: { body: BodyId; type: string; sign: ZodiacSign; at: string }[];
  moonPhases: { phase: string; at: string }[];
  eclipses: { body: string; kind: string; at: string }[];
  aspects: MonthAspect[];
}

export interface MonthlyBasis {
  ascendantKnown: boolean;
  events: {
    ingresses: MonthlyFactors["ingresses"];
    stations: MonthlyFactors["stations"];
    moonPhases: MonthlyFactors["moonPhases"];
    eclipses: MonthlyFactors["eclipses"];
  };
  aspects: MonthAspect[];
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function isSlowAspect(bodyA: BodyId, bodyB: BodyId): boolean {
  return SLOW_BODIES.includes(bodyA) || SLOW_BODIES.includes(bodyB);
}

export function cacheKey(month: Month, sunSign: string, ascendantSign: string | null): string {
  return [month.label, sunSign, ascendantSign ?? "none", MONTHLY_PROMPT_VERSION, ENGINE_VERSION]
    .join(":");
}

export function buildMonthlyFactors(
  month: Month,
  sunSign: ZodiacSign,
  ascendantSign: ZodiacSign | null,
): MonthlyFactors {
  const ephemeris = computeEphemeris(
    parseRange(new URLSearchParams({ from: month.start, to: month.end })),
  );
  const strongest = new Map<string, MonthAspect>();
  for (const aspect of ephemeris.days.flatMap((day) => day.aspects)) {
    if (aspect.bodyA === "moon" || aspect.bodyB === "moon") continue;
    if (!isSlowAspect(aspect.bodyA, aspect.bodyB)) continue;
    const key = `${aspect.bodyA}-${aspect.bodyB}-${aspect.type}`;
    const known = strongest.get(key);
    if (known === undefined || aspect.orb < known.orb) {
      strongest.set(key, {
        bodyA: aspect.bodyA,
        bodyB: aspect.bodyB,
        type: aspect.type,
        orb: round(aspect.orb),
      });
    }
  }

  return {
    month: { start: month.start, end: month.end },
    sunSign,
    ascendantSign,
    retrogrades: ephemeris.days[0].bodies
      .filter((body) => body.retrograde)
      .map(({ body, sign }) => ({ body, sign })),
    ingresses: ephemeris.events.ingresses.map(({ body, to, at }) => ({ body, to, at })),
    stations: ephemeris.events.stations.map(({ body, type, sign, at }) => ({
      body,
      type,
      sign,
      at,
    })),
    moonPhases: ephemeris.events.moonPhases.map(({ phase, at }) => ({ phase, at })),
    eclipses: ephemeris.events.eclipses.map(({ body, kind, at }) => ({ body, kind, at })),
    aspects: [...strongest.values()].sort((a, b) => a.orb - b.orb).slice(0, MAX_MONTH_ASPECTS),
  };
}

function list<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

export function basisOf(factors: unknown): MonthlyBasis {
  const record = isRecord(factors) ? factors : {};
  return {
    ascendantKnown: typeof record.ascendantSign === "string",
    events: {
      ingresses: list(record.ingresses),
      stations: list(record.stations),
      moonPhases: list(record.moonPhases),
      eclipses: list(record.eclipses),
    },
    aspects: list(record.aspects),
  };
}
