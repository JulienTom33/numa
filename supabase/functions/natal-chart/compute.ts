import { computeHouses } from "../_shared/astrology/houses.ts";
import { toEclipticPosition } from "../_shared/astrology/zodiac.ts";
import { resolveUtcOffset, type UtcOffset } from "../_shared/time/utcOffset.ts";
import { findAspects } from "./aspects.ts";
import { computeBody, eclipticLongitude } from "./bodies.ts";
import {
  type BirthInput,
  BODY_IDS,
  type BodyPosition,
  type ChartHouses,
  type ChartWarning,
  type Confidence,
  ENGINE_NAME,
  ENGINE_VERSION,
  type MoonSignChange,
  type NatalChart,
  type PhaseListener,
  SCHEMA_VERSION,
  type TimeMargin,
} from "./types.ts";

export const UNKNOWN_TIME_REFERENCE = "12:00";
const DAY_START = "00:00";
const DAY_END = "23:59";
const HOUR_MS = 60 * 60 * 1000;
const UNCERTAINTY_HOURS: Readonly<Record<TimeMargin, number>> = {
  under_30_min: 0.5,
  between_30_min_and_2_h: 2,
  over_2_h: 6,
};

function utcOf(birthDate: string, time: string, input: BirthInput): UtcOffset {
  const resolved = resolveUtcOffset({ date: birthDate, time }, input.timezone, input.longitude);
  if (resolved === null) throw new RangeError("invalid_birth_data");
  return resolved;
}

function uncertaintyWindow(
  input: BirthInput,
  instant: Date,
): { start: Date; end: Date } | null {
  if (input.timePrecision === "approximate" && input.timeMargin !== null) {
    const span = UNCERTAINTY_HOURS[input.timeMargin] * HOUR_MS;
    return { start: new Date(instant.getTime() - span), end: new Date(instant.getTime() + span) };
  }
  if (input.timePrecision === "unknown") {
    return {
      start: new Date(utcOf(input.birthDate, DAY_START, input).utc),
      end: new Date(utcOf(input.birthDate, DAY_END, input).utc),
    };
  }
  return null;
}

function moonSignChange(window: { start: Date; end: Date } | null): MoonSignChange | null {
  if (window === null) return null;
  const from = toEclipticPosition(eclipticLongitude("moon", window.start)).sign;
  const to = toEclipticPosition(eclipticLongitude("moon", window.end)).sign;
  return from === to ? null : { from, to };
}

function houseOf(longitude: number, cusps: ChartHouses["cusps"]): number {
  for (let index = 0; index < cusps.length; index++) {
    const start = cusps[index].longitude;
    const end = cusps[(index + 1) % cusps.length].longitude;
    const span = (end - start + 360) % 360;
    if ((longitude - start + 360) % 360 < span) return index + 1;
  }
  return 1;
}

function confidenceOf(input: BirthInput, offset: UtcOffset): Confidence {
  if (input.timePrecision === "unknown") return "low";
  if (input.timePrecision === "approximate") return "medium";
  return offset.status === "ambiguous" || offset.status === "nonexistent" ? "medium" : "high";
}

function warningsOf(
  input: BirthInput,
  offset: UtcOffset,
  houses: ChartHouses | null,
  change: MoonSignChange | null,
): ChartWarning[] {
  const warnings: ChartWarning[] = [];
  if (input.timePrecision === "unknown") warnings.push("unknown_time");
  if (input.timePrecision === "approximate") warnings.push("approximate_time");
  if (offset.status === "ambiguous") warnings.push("ambiguous_local_time");
  if (offset.status === "nonexistent") warnings.push("nonexistent_local_time");
  if (offset.status === "localMeanTime") warnings.push("local_mean_time");
  if (houses?.fallback) warnings.push("polar_fallback");
  if (change) warnings.push("moon_sign_uncertain");
  return warnings;
}

export function computeNatalChart(
  input: BirthInput,
  onPhase: PhaseListener = () => undefined,
): NatalChart {
  const knownTime = input.timePrecision === "unknown" ? null : input.birthTime;
  const localTimeUsed = knownTime === null ? UNKNOWN_TIME_REFERENCE : knownTime.slice(0, 5);
  const offset = utcOf(input.birthDate, localTimeUsed, input);
  const instant = new Date(offset.utc);
  onPhase("timezone");

  const positions = BODY_IDS.map((body) => computeBody(body, instant));
  onPhase("positions");

  const calculation = knownTime === null
    ? null
    : computeHouses({ instant, latitude: input.latitude, longitude: input.longitude });
  const houses: ChartHouses | null = calculation && {
    requestedSystem: calculation.requestedSystem,
    system: calculation.system,
    fallback: calculation.fallback,
    cusps: calculation.cusps,
  };
  onPhase("ascendant");

  const bodies: BodyPosition[] = positions.map((position) => ({
    ...position,
    house: houses ? houseOf(position.longitude, houses.cusps) : null,
  }));

  const change = moonSignChange(uncertaintyWindow(input, instant));

  const aspects = findAspects(bodies);
  onPhase("houses_aspects");

  const chart: NatalChart = {
    schemaVersion: SCHEMA_VERSION,
    engine: { name: ENGINE_NAME, version: ENGINE_VERSION },
    confidence: confidenceOf(input, offset),
    birth: input,
    instant: {
      utc: offset.utc,
      offsetMinutes: offset.offsetMinutes,
      offsetSeconds: offset.status === "localMeanTime" ? offset.offsetSeconds : null,
      status: offset.status,
      localTimeUsed,
    },
    bodies,
    angles: calculation && {
      ascendant: calculation.ascendant,
      midheaven: calculation.midheaven,
    },
    houses,
    aspects,
    moonSignChange: change,
    warnings: warningsOf(input, offset, houses, change),
  };
  onPhase("reading");
  return chart;
}
