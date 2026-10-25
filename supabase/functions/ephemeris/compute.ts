import {
  Body,
  Illumination,
  MoonPhase as engineMoonPhase,
  SearchMoonPhase,
} from "astronomy-engine";
import {
  BODY_IDS,
  ENGINE_NAME,
  ENGINE_VERSION,
} from "../../../shared/contracts/natalChart/natalChart.ts";
import {
  type Ephemeris,
  EPHEMERIS_SCHEMA_VERSION,
  type EphemerisDay,
  MOON_PHASE_NAMES,
  type MoonPhase,
} from "../../../shared/contracts/ephemeris/ephemeris.ts";
import { findAspects } from "../natal-chart/aspects.ts";
import { computeBody, round } from "../natal-chart/bodies.ts";
import { computeEvents } from "./events.ts";
import { type EphemerisRange, formatDay } from "./range.ts";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOON_MS = 12 * 60 * 60 * 1000;
const SYNODIC_SEARCH_DAYS = 31;

function phaseName(angle: number): MoonPhase["name"] {
  return MOON_PHASE_NAMES[Math.floor(((angle + 22.5) % 360) / 45)];
}

function moonAge(instant: Date): number {
  const searchStart = new Date(instant.getTime() - SYNODIC_SEARCH_DAYS * DAY_MS);
  let lastNew = SearchMoonPhase(0, searchStart, SYNODIC_SEARCH_DAYS);
  while (lastNew !== null) {
    const afterLast = new Date(lastNew.date.getTime() + DAY_MS);
    const remaining = (instant.getTime() - afterLast.getTime()) / DAY_MS;
    if (remaining <= 0) break;
    const next = SearchMoonPhase(0, afterLast, remaining);
    if (next === null) break;
    lastNew = next;
  }
  return lastNew === null ? 0 : (instant.getTime() - lastNew.date.getTime()) / DAY_MS;
}

export function computeMoonPhase(instant: Date): MoonPhase {
  const angle = engineMoonPhase(instant);
  return {
    name: phaseName(angle),
    angle: round(angle),
    illumination: round(Illumination(Body.Moon, instant).phase_fraction, 1e4),
    age: round(moonAge(instant), 1e4),
  };
}

function computeDay(dayStart: number): EphemerisDay {
  const instant = new Date(dayStart + NOON_MS);
  const bodies = BODY_IDS.map((id) => computeBody(id, instant));
  return {
    date: formatDay(dayStart),
    instant: instant.toISOString(),
    bodies,
    moon: computeMoonPhase(instant),
    aspects: findAspects(bodies),
  };
}

export function computeEphemeris(range: EphemerisRange): Ephemeris {
  const days = Array.from(
    { length: range.days },
    (_, index) => computeDay(range.start.getTime() + index * DAY_MS),
  );
  return {
    schemaVersion: EPHEMERIS_SCHEMA_VERSION,
    engine: { name: ENGINE_NAME, version: ENGINE_VERSION },
    range: { from: range.from, to: range.to, days: range.days },
    days,
    events: computeEvents(range.start, range.end),
  };
}
