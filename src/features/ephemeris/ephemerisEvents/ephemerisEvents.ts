import type {
  EclipseBody,
  EclipseKind,
  MajorMoonPhase,
  StationType,
} from "../../../../shared/contracts/ephemeris/ephemeris.ts";
import type { BodyId } from "../../../../shared/contracts/natalChart/natalChart.ts";
import type { ZodiacSign } from "../../../../shared/zodiac/zodiac.ts";
import type { Ephemeris } from "../ephemeris/ephemeris";

interface EventBase {
  id: string;
  at: string;
}

export type EphemerisEventItem =
  | (EventBase & { kind: "ingress"; body: BodyId; from: ZodiacSign; to: ZodiacSign })
  | (EventBase & { kind: "station"; body: BodyId; type: StationType; sign: ZodiacSign })
  | (EventBase & { kind: "moonPhase"; phase: MajorMoonPhase })
  | (EventBase & { kind: "eclipse"; body: EclipseBody; eclipseKind: EclipseKind });

export function buildEvents({ events }: Pick<Ephemeris, "events">): EphemerisEventItem[] {
  const items: EphemerisEventItem[] = [
    ...events.ingresses.map((event): EphemerisEventItem => ({
      id: `ingress-${event.body}-${event.to}-${event.at}`,
      kind: "ingress",
      at: event.at,
      body: event.body,
      from: event.from,
      to: event.to,
    })),
    ...events.stations.map((event): EphemerisEventItem => ({
      id: `station-${event.body}-${event.type}-${event.at}`,
      kind: "station",
      at: event.at,
      body: event.body,
      type: event.type,
      sign: event.sign,
    })),
    ...events.moonPhases.map((event): EphemerisEventItem => ({
      id: `moon-${event.phase}-${event.at}`,
      kind: "moonPhase",
      at: event.at,
      phase: event.phase,
    })),
    ...events.eclipses.map((event): EphemerisEventItem => ({
      id: `eclipse-${event.body}-${event.at}`,
      kind: "eclipse",
      at: event.at,
      body: event.body,
      eclipseKind: event.kind,
    })),
  ];
  return items.sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
}
