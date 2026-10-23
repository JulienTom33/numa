import type { EclipticPosition, ZodiacSign } from "../../zodiac/zodiac.ts";
import type { UtcOffsetStatus } from "../../time/utcOffset/utcOffset.ts";

export const SCHEMA_VERSION = 1;

export const HOUSE_SYSTEMS = ["placidus", "porphyry", "equal", "whole-sign"] as const;

export type HouseSystem = typeof HOUSE_SYSTEMS[number];

export type HouseFallbackReason = "polar-latitude" | "placidus-not-converged";

export interface HouseFallback {
  readonly from: HouseSystem;
  readonly reason: HouseFallbackReason;
}

export const CONFIDENCES = ["high", "medium", "low"] as const;

export const CHART_WARNINGS = [
  "unknown_time",
  "approximate_time",
  "ambiguous_local_time",
  "nonexistent_local_time",
  "local_mean_time",
  "polar_fallback",
  "moon_sign_uncertain",
] as const;

export const ENGINE_NAME = "astronomy-engine";
export const ENGINE_VERSION = "2.1.19";

export const BODY_IDS = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
] as const;

export type BodyId = typeof BODY_IDS[number];

export const ASPECT_TYPES = ["conjunction", "sextile", "square", "trine", "opposition"] as const;

export type AspectType = typeof ASPECT_TYPES[number];

export type TimePrecision = "exact" | "approximate" | "unknown";

export type TimeMargin = "under_30_min" | "between_30_min_and_2_h" | "over_2_h";

export type Confidence = typeof CONFIDENCES[number];

export type ChartWarning =
  | "unknown_time"
  | "approximate_time"
  | "ambiguous_local_time"
  | "nonexistent_local_time"
  | "local_mean_time"
  | "polar_fallback"
  | "moon_sign_uncertain";

export interface BirthInput {
  readonly birthDate: string;
  readonly birthTime: string | null;
  readonly timePrecision: TimePrecision;
  readonly timeMargin: TimeMargin | null;
  readonly timezone: string;
  readonly latitude: number;
  readonly longitude: number;
}

export interface BodyPosition extends EclipticPosition {
  readonly body: BodyId;
  readonly retrograde: boolean;
  readonly speed: number;
  readonly house: number | null;
}

export interface Aspect {
  readonly bodyA: BodyId;
  readonly bodyB: BodyId;
  readonly type: AspectType;
  readonly exactAngle: number;
  readonly orb: number;
}

export interface ChartInstant {
  readonly utc: string;
  readonly offsetMinutes: number;
  readonly offsetSeconds: number | null;
  readonly status: UtcOffsetStatus;
  readonly localTimeUsed: string;
}

export interface ChartAnglesResult {
  readonly ascendant: EclipticPosition;
  readonly midheaven: EclipticPosition;
}

export interface ChartHouses {
  readonly requestedSystem: HouseSystem;
  readonly system: HouseSystem;
  readonly fallback: HouseFallback | null;
  readonly cusps: readonly EclipticPosition[];
}

export interface MoonSignChange {
  readonly from: ZodiacSign;
  readonly to: ZodiacSign;
}

export interface NatalChart {
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly engine: { readonly name: typeof ENGINE_NAME; readonly version: string };
  readonly confidence: Confidence;
  readonly birth: BirthInput;
  readonly instant: ChartInstant;
  readonly bodies: readonly BodyPosition[];
  readonly angles: ChartAnglesResult | null;
  readonly houses: ChartHouses | null;
  readonly aspects: readonly Aspect[];
  readonly moonSignChange: MoonSignChange | null;
  readonly warnings: readonly ChartWarning[];
}

export const CHART_PHASES = [
  "validation",
  "timezone",
  "positions",
  "ascendant",
  "houses_aspects",
  "reading",
] as const;

export type ChartPhase = (typeof CHART_PHASES)[number];

export type PhaseListener = (phase: ChartPhase) => void;
