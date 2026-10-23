import { toErrorCode, type NatalChartErrorCode } from "../natalChart/natalChart";
import { parseNatalChart, readComputedAt, type NatalChartSummary } from "../natalChartSummary/natalChartSummary";
import { ASPECT_TYPES, type AspectType } from "../../../../shared/contracts/natalChart/natalChart.ts";
import { supabase } from "../../../shared/supabaseClient/supabaseClient";
import { ZODIAC_SIGNS, type ZodiacSign } from "../../../../shared/zodiac/zodiac.ts";

export const SKY_BODIES = [
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

export type SkyBodyId = (typeof SKY_BODIES)[number];

export const NATAL_POINTS = ["sun", "moon", "ascendant"] as const;

export type NatalPoint = (typeof NATAL_POINTS)[number];

export interface SkyBodyPosition {
  body: SkyBodyId;
  longitude: number;
  sign: ZodiacSign;
  degreeInSign: number;
  retrograde: boolean;
  house: number | null;
}

export interface NatalSky {
  bodies: SkyBodyPosition[];
  ascendantLongitude: number | null;
  cusps: number[] | null;
}

export interface TransitAspect {
  transitBody: SkyBodyId;
  natalPoint: NatalPoint;
  type: AspectType;
  orb: number;
}

export interface CurrentSky {
  generatedAt: string;
  bodies: SkyBodyPosition[];
  aspects: TransitAspect[];
}

export interface MyChartData {
  summary: NatalChartSummary;
  natal: NatalSky;
  transits: CurrentSky | null;
}

export interface MyChartResult {
  data: MyChartData | null;
  error: NatalChartErrorCode | null;
}

type RawSummary = NonNullable<Parameters<typeof parseNatalChart>[0]>;

type RawNatalChart = RawSummary & {
  angles?: { ascendant?: { longitude?: unknown } } | null;
  houses?: { cusps?: unknown } | null;
};

interface RawNatalResponse {
  chart?: RawNatalChart;
}

interface RawSkyResponse {
  generatedAt?: unknown;
  bodies?: unknown;
  aspects?: unknown;
}

const CUSP_COUNT = 12;

function isOneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return values.some((candidate) => candidate === value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseBodies(raw: unknown): SkyBodyPosition[] {
  if (!Array.isArray(raw)) return [];
  const bodies: SkyBodyPosition[] = [];
  for (const item of raw as unknown[]) {
    if (
      isRecord(item) &&
      isOneOf(SKY_BODIES, item.body) &&
      isOneOf(ZODIAC_SIGNS, item.sign) &&
      typeof item.longitude === "number" &&
      typeof item.degreeInSign === "number"
    ) {
      bodies.push({
        body: item.body,
        longitude: item.longitude,
        sign: item.sign,
        degreeInSign: item.degreeInSign,
        retrograde: item.retrograde === true,
        house: typeof item.house === "number" ? item.house : null,
      });
    }
  }
  return bodies;
}

export function parseCusps(raw: unknown): number[] | null {
  if (!Array.isArray(raw) || raw.length !== CUSP_COUNT) return null;
  const longitudes = (raw as unknown[]).map((cusp) =>
    isRecord(cusp) && typeof cusp.longitude === "number" ? cusp.longitude : null,
  );
  return longitudes.every((longitude): longitude is number => longitude !== null) ? longitudes : null;
}

export function parseNatalSky(raw: RawNatalChart | undefined): NatalSky {
  const ascendantLongitude = raw?.angles?.ascendant?.longitude;
  return {
    bodies: parseBodies(raw?.bodies),
    ascendantLongitude: typeof ascendantLongitude === "number" ? ascendantLongitude : null,
    cusps: parseCusps(raw?.houses?.cusps),
  };
}

export function parseCurrentSky(raw: RawSkyResponse | null | undefined): CurrentSky | null {
  if (!raw || typeof raw.generatedAt !== "string") return null;
  const bodies = parseBodies(raw.bodies);
  if (bodies.length === 0) return null;
  const aspects: TransitAspect[] = [];
  for (const item of Array.isArray(raw.aspects) ? (raw.aspects as unknown[]) : []) {
    if (
      isRecord(item) &&
      isOneOf(SKY_BODIES, item.transitBody) &&
      isOneOf(NATAL_POINTS, item.natalPoint) &&
      isOneOf(ASPECT_TYPES, item.type) &&
      typeof item.orb === "number"
    ) {
      aspects.push({
        transitBody: item.transitBody,
        natalPoint: item.natalPoint,
        type: item.type,
        orb: item.orb,
      });
    }
  }
  return { generatedAt: raw.generatedAt, bodies, aspects };
}

async function fetchCurrentSky(): Promise<CurrentSky | null> {
  const { data, error } = await supabase.functions.invoke<RawSkyResponse>("current-sky", {
    method: "GET",
  });
  return error ? null : parseCurrentSky(data);
}

export async function fetchMyChart(): Promise<MyChartResult> {
  const [natal, transits] = await Promise.all([
    supabase.functions.invoke<RawNatalResponse>("natal-chart", { method: "GET" }),
    fetchCurrentSky().catch(() => null),
  ]);
  if (natal.error) return { data: null, error: await toErrorCode(natal.error) };

  const computedAt = await readComputedAt().catch(() => null);
  const summary = parseNatalChart(natal.data?.chart, null, computedAt);
  if (!summary) return { data: null, error: "internal_error" };
  return { data: { summary, natal: parseNatalSky(natal.data?.chart), transits }, error: null };
}
