import {
  EclipseKind as EngineEclipseKind,
  NextGlobalSolarEclipse,
  NextLunarEclipse,
  NextMoonQuarter,
  SearchGlobalSolarEclipse,
  SearchLunarEclipse,
  SearchMoonQuarter,
} from "astronomy-engine";
import {
  normalizeDegrees,
  toEclipticPosition,
  ZODIAC_SIGNS,
} from "../../../shared/zodiac/zodiac.ts";
import { BODY_IDS, type BodyId } from "../../../shared/contracts/natalChart/natalChart.ts";
import {
  type Eclipse,
  type EclipseKind,
  type EphemerisEvents,
  type Ingress,
  MAJOR_MOON_PHASES,
  type MoonPhaseEvent,
  type Station,
} from "../../../shared/contracts/ephemeris/ephemeris.ts";
import { eclipticLongitude, round } from "../natal-chart/bodies.ts";

const HOUR_MS = 60 * 60 * 1000;
const INGRESS_STEP_MS = 6 * HOUR_MS;
const STATION_STEP_MS = 12 * HOUR_MS;
const SPEED_HALF_WINDOW_MS = HOUR_MS / 2;
const PRECISION_MS = 1000;
const STATION_BODIES: readonly BodyId[] = BODY_IDS.filter((id) => id !== "sun" && id !== "moon");

function signIndex(body: BodyId, time: number): number {
  return Math.min(Math.floor(eclipticLongitude(body, new Date(time)) / 30), 11);
}

function instantSpeed(body: BodyId, time: number): number {
  const before = eclipticLongitude(body, new Date(time - SPEED_HALF_WINDOW_MS));
  const after = eclipticLongitude(body, new Date(time + SPEED_HALF_WINDOW_MS));
  return normalizeDegrees(after - before + 180) - 180;
}

function toSecond(time: number): number {
  return Math.round(time / PRECISION_MS) * PRECISION_MS;
}

function bisect(low: number, high: number, changed: (time: number) => boolean): number {
  let lower = low;
  let upper = high;
  while (upper - lower > PRECISION_MS) {
    const middle = Math.floor((lower + upper) / 2);
    if (changed(middle)) upper = middle;
    else lower = middle;
  }
  return toSecond(upper);
}

function samples(start: number, end: number, step: number): number[] {
  const times: number[] = [];
  for (let time = start; time < end; time += step) times.push(time);
  times.push(end);
  return times;
}

function inRange(time: number, start: number, end: number): boolean {
  return time >= start && time < end;
}

function iso(time: number): string {
  return new Date(toSecond(time)).toISOString();
}

function findIngresses(start: number, end: number): Ingress[] {
  const ingresses: Ingress[] = [];
  const times = samples(start, end, INGRESS_STEP_MS);
  for (const body of BODY_IDS) {
    let previous = signIndex(body, times[0]);
    for (let index = 1; index < times.length; index++) {
      const current = signIndex(body, times[index]);
      if (current !== previous) {
        const from = previous;
        const at = bisect(times[index - 1], times[index], (time) => signIndex(body, time) !== from);
        if (inRange(at, start, end)) {
          ingresses.push({
            body,
            from: ZODIAC_SIGNS[from],
            to: ZODIAC_SIGNS[current],
            retrograde: current !== (from + 1) % 12,
            at: iso(at),
          });
        }
      }
      previous = current;
    }
  }
  return ingresses.sort((a, b) => a.at.localeCompare(b.at) || a.body.localeCompare(b.body));
}

function findStations(start: number, end: number): Station[] {
  const stations: Station[] = [];
  const times = samples(start, end, STATION_STEP_MS);
  for (const body of STATION_BODIES) {
    let previous = instantSpeed(body, times[0]);
    for (let index = 1; index < times.length; index++) {
      const current = instantSpeed(body, times[index]);
      if (previous !== 0 && Math.sign(current) !== Math.sign(previous)) {
        const wasDirect = previous > 0;
        const at = bisect(
          times[index - 1],
          times[index],
          (time) => (instantSpeed(body, time) > 0) !== wasDirect,
        );
        if (inRange(at, start, end)) {
          const position = toEclipticPosition(round(eclipticLongitude(body, new Date(at))));
          stations.push({
            body,
            type: wasDirect ? "retrograde" : "direct",
            sign: position.sign,
            longitude: position.longitude,
            at: iso(at),
          });
        }
      }
      previous = current;
    }
  }
  return stations.sort((a, b) => a.at.localeCompare(b.at) || a.body.localeCompare(b.body));
}

function findMoonPhases(start: number, end: number): MoonPhaseEvent[] {
  const phases: MoonPhaseEvent[] = [];
  let quarter = SearchMoonQuarter(new Date(start));
  while (quarter.time.date.getTime() < end) {
    phases.push({
      phase: MAJOR_MOON_PHASES[quarter.quarter],
      at: iso(quarter.time.date.getTime()),
    });
    quarter = NextMoonQuarter(quarter);
  }
  return phases;
}

function toEclipseKind(kind: EngineEclipseKind): EclipseKind {
  switch (kind) {
    case EngineEclipseKind.Penumbral:
      return "penumbral";
    case EngineEclipseKind.Partial:
      return "partial";
    case EngineEclipseKind.Annular:
      return "annular";
    case EngineEclipseKind.Total:
      return "total";
  }
}

function findEclipses(start: number, end: number): Eclipse[] {
  const eclipses: Eclipse[] = [];
  let lunar = SearchLunarEclipse(new Date(start));
  while (lunar.peak.date.getTime() < end) {
    eclipses.push({
      body: "lunar",
      kind: toEclipseKind(lunar.kind),
      at: iso(lunar.peak.date.getTime()),
    });
    lunar = NextLunarEclipse(lunar.peak);
  }
  let solar = SearchGlobalSolarEclipse(new Date(start));
  while (solar.peak.date.getTime() < end) {
    eclipses.push({
      body: "solar",
      kind: toEclipseKind(solar.kind),
      at: iso(solar.peak.date.getTime()),
    });
    solar = NextGlobalSolarEclipse(solar.peak);
  }
  return eclipses.sort((a, b) => a.at.localeCompare(b.at));
}

export function computeEvents(start: Date, end: Date): EphemerisEvents {
  const [from, to] = [start.getTime(), end.getTime()];
  return {
    ingresses: findIngresses(from, to),
    stations: findStations(from, to),
    moonPhases: findMoonPhases(from, to),
    eclipses: findEclipses(from, to),
  };
}
