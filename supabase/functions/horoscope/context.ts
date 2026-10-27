import type { BodyId, NatalChart } from "../../../shared/contracts/natalChart/natalChart.ts";
import type { ZodiacSign } from "../../../shared/zodiac/zodiac.ts";
import {
  computeCurrentSky,
  natalLongitudes,
  type TransitAspect,
} from "../current-sky/currentSky.ts";
import { type ChatFactors, extractFactors } from "../chat/factors.ts";
import { isRecord } from "../chat/guards.ts";

export const MAX_TRANSIT_ASPECTS = 6;

export interface TransitBodyFactor {
  body: BodyId;
  sign: ZodiacSign;
  degreeInSign: number;
  retrograde: boolean;
}

export interface HoroscopeFactors {
  date: string;
  natal: ChatFactors;
  transits: {
    aspects: TransitAspect[];
    bodies: TransitBodyFactor[];
  };
}

export interface BasisAspect {
  transitBody: string;
  natalPoint: string;
  type: string;
  orb: number;
}

export interface Basis {
  confidence: string | null;
  aspects: BasisAspect[];
  warnings: string[];
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function buildFactors(chart: NatalChart, date: string, instant: Date): HoroscopeFactors {
  const sky = computeCurrentSky(natalLongitudes(chart), instant);
  return {
    date,
    natal: extractFactors(chart),
    transits: {
      aspects: sky.aspects.slice(0, MAX_TRANSIT_ASPECTS).map((aspect) => ({ ...aspect })),
      bodies: sky.bodies
        .filter((body) => body.body === "sun" || body.body === "moon" || body.retrograde)
        .map(({ body, sign, degreeInSign, retrograde }) => ({
          body,
          sign,
          degreeInSign: round(degreeInSign),
          retrograde,
        })),
    },
  };
}

function readAspect(value: unknown): BasisAspect | null {
  if (!isRecord(value)) return null;
  const { transitBody, natalPoint, type, orb } = value;
  if (
    typeof transitBody !== "string" || typeof natalPoint !== "string" || typeof type !== "string" ||
    typeof orb !== "number"
  ) {
    return null;
  }
  return { transitBody, natalPoint, type, orb };
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function basisOf(factors: unknown): Basis {
  const record = isRecord(factors) ? factors : {};
  const transits = isRecord(record.transits) ? record.transits : {};
  const natal = isRecord(record.natal) ? record.natal : {};
  const aspects = Array.isArray(transits.aspects) ? transits.aspects : [];
  return {
    confidence: typeof natal.confidence === "string" ? natal.confidence : null,
    aspects: aspects.map(readAspect).filter((aspect): aspect is BasisAspect => aspect !== null),
    warnings: strings(natal.warnings),
  };
}
