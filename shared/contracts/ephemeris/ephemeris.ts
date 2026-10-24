import type { ZodiacSign } from "../../zodiac/zodiac.ts";
import type { Aspect, BodyId, BodyPosition } from "../natalChart/natalChart.ts";

export const EPHEMERIS_SCHEMA_VERSION = 1;

export const EPHEMERIS_MAX_DAYS = 31;

export const EPHEMERIS_ERROR_CODES = [
  "invalid_date",
  "invalid_range",
  "range_too_long",
  "unauthenticated",
  "invalid_token",
  "method_not_allowed",
  "network_error",
  "internal_error",
] as const;

export type EphemerisErrorCode = typeof EPHEMERIS_ERROR_CODES[number];

export const MOON_PHASE_NAMES = [
  "new_moon",
  "waxing_crescent",
  "first_quarter",
  "waxing_gibbous",
  "full_moon",
  "waning_gibbous",
  "last_quarter",
  "waning_crescent",
] as const;

export type MoonPhaseName = typeof MOON_PHASE_NAMES[number];

export const MAJOR_MOON_PHASES = [
  "new_moon",
  "first_quarter",
  "full_moon",
  "last_quarter",
] as const;

export type MajorMoonPhase = typeof MAJOR_MOON_PHASES[number];

export const STATION_TYPES = ["retrograde", "direct"] as const;

export type StationType = typeof STATION_TYPES[number];

export const ECLIPSE_BODIES = ["solar", "lunar"] as const;

export type EclipseBody = typeof ECLIPSE_BODIES[number];

export const ECLIPSE_KINDS = ["penumbral", "partial", "annular", "total"] as const;

export type EclipseKind = typeof ECLIPSE_KINDS[number];

export type EphemerisBodyPosition = Omit<BodyPosition, "house">;

export interface MoonPhase {
  readonly name: MoonPhaseName;
  readonly angle: number;
  readonly illumination: number;
  readonly age: number;
}

export interface EphemerisDay {
  readonly date: string;
  readonly instant: string;
  readonly bodies: readonly EphemerisBodyPosition[];
  readonly moon: MoonPhase;
  readonly aspects: readonly Aspect[];
}

export interface Ingress {
  readonly body: BodyId;
  readonly from: ZodiacSign;
  readonly to: ZodiacSign;
  readonly retrograde: boolean;
  readonly at: string;
}

export interface Station {
  readonly body: BodyId;
  readonly type: StationType;
  readonly sign: ZodiacSign;
  readonly longitude: number;
  readonly at: string;
}

export interface MoonPhaseEvent {
  readonly phase: MajorMoonPhase;
  readonly at: string;
}

export interface Eclipse {
  readonly body: EclipseBody;
  readonly kind: EclipseKind;
  readonly at: string;
}

export interface EphemerisEvents {
  readonly ingresses: readonly Ingress[];
  readonly stations: readonly Station[];
  readonly moonPhases: readonly MoonPhaseEvent[];
  readonly eclipses: readonly Eclipse[];
}

export interface Ephemeris {
  readonly schemaVersion: typeof EPHEMERIS_SCHEMA_VERSION;
  readonly engine: { readonly name: string; readonly version: string };
  readonly range: { readonly from: string; readonly to: string; readonly days: number };
  readonly days: readonly EphemerisDay[];
  readonly events: EphemerisEvents;
}
