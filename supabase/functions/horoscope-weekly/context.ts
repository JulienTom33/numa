import {
  type BodyId,
  ENGINE_VERSION,
  type NatalChart,
} from "../../../shared/contracts/natalChart/natalChart.ts";
import type { ZodiacSign } from "../../../shared/zodiac/zodiac.ts";
import { computeEphemeris } from "../ephemeris/compute.ts";
import { parseRange } from "../ephemeris/range.ts";
import { isRecord } from "../chat/guards.ts";
import { WEEKLY_PROMPT_VERSION } from "./prompt.ts";
import type { Week } from "./week.ts";

export const MAX_WEEK_ASPECTS = 6;

export interface WeekAspect {
  bodyA: BodyId;
  bodyB: BodyId;
  type: string;
  orb: number;
}

export interface WeeklyFactors {
  week: { start: string; end: string };
  sunSign: ZodiacSign;
  ascendantSign: ZodiacSign | null;
  retrogrades: { body: BodyId; sign: ZodiacSign }[];
  ingresses: { body: BodyId; to: ZodiacSign; at: string }[];
  stations: { body: BodyId; type: string; sign: ZodiacSign; at: string }[];
  moonPhases: { phase: string; at: string }[];
  eclipses: { body: string; kind: string; at: string }[];
  aspects: WeekAspect[];
}

export interface WeeklyBasis {
  ascendantKnown: boolean;
  events: {
    ingresses: WeeklyFactors["ingresses"];
    stations: WeeklyFactors["stations"];
    moonPhases: WeeklyFactors["moonPhases"];
    eclipses: WeeklyFactors["eclipses"];
  };
  aspects: WeekAspect[];
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function sunSignOf(chart: NatalChart): ZodiacSign | null {
  return chart.bodies.find((body) => body.body === "sun")?.sign ?? null;
}

export function cacheKey(week: Week, sunSign: string, ascendantSign: string | null): string {
  return [week.label, sunSign, ascendantSign ?? "none", WEEKLY_PROMPT_VERSION, ENGINE_VERSION]
    .join(":");
}

export function buildWeeklyFactors(
  week: Week,
  sunSign: ZodiacSign,
  ascendantSign: ZodiacSign | null,
): WeeklyFactors {
  const ephemeris = computeEphemeris(
    parseRange(new URLSearchParams({ from: week.start, to: week.end })),
  );
  const strongest = new Map<string, WeekAspect>();
  for (const aspect of ephemeris.days.flatMap((day) => day.aspects)) {
    if (aspect.bodyA === "moon" || aspect.bodyB === "moon") continue;
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
    week: { start: week.start, end: week.end },
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
    aspects: [...strongest.values()].sort((a, b) => a.orb - b.orb).slice(0, MAX_WEEK_ASPECTS),
  };
}

function list<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

export function basisOf(factors: unknown): WeeklyBasis {
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
