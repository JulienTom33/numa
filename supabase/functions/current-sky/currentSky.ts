import { extractBearerToken } from "../_shared/auth.ts";
import type { HandlerContext } from "../_shared/handler.ts";
import { HttpError, json } from "../_shared/http.ts";
import type { ZodiacSign } from "../../../shared/zodiac/zodiac.ts";
import { angularSeparation, ASPECT_DEFINITIONS } from "../natal-chart/aspects.ts";
import { computeBody, round } from "../natal-chart/bodies.ts";
import type { ChartCache } from "../natal-chart/cache.ts";
import { computeCacheKey } from "../natal-chart/cacheKey.ts";
import { computeNatalChart } from "../natal-chart/compute.ts";
import type { BirthDataStore } from "../natal-chart/store.ts";
import {
  type AspectType,
  BODY_IDS,
  type BodyId,
  type NatalChart,
} from "../../../shared/contracts/natalChart/natalChart.ts";

export const NATAL_POINTS = ["sun", "moon", "ascendant"] as const;

export type NatalPoint = typeof NATAL_POINTS[number];

export const TRANSIT_MAX_ORB = 3;

export interface SkyBody {
  readonly body: BodyId;
  readonly longitude: number;
  readonly sign: ZodiacSign;
  readonly degreeInSign: number;
  readonly retrograde: boolean;
}

export interface TransitAspect {
  readonly transitBody: BodyId;
  readonly natalPoint: NatalPoint;
  readonly type: AspectType;
  readonly orb: number;
}

export interface CurrentSky {
  readonly generatedAt: string;
  readonly bodies: readonly SkyBody[];
  readonly aspects: readonly TransitAspect[];
}

export interface CurrentSkyDependencies {
  store: BirthDataStore;
  cache: ChartCache;
  now?: () => Date;
}

const ORB_DECIMALS = 1e4;

export function natalLongitudes(chart: NatalChart): Partial<Record<NatalPoint, number>> {
  const sun = chart.bodies.find((body) => body.body === "sun");
  const moon = chart.bodies.find((body) => body.body === "moon");
  const longitudes: Partial<Record<NatalPoint, number>> = {};
  if (sun) longitudes.sun = sun.longitude;
  if (moon && !chart.warnings.includes("moon_sign_uncertain")) longitudes.moon = moon.longitude;
  if (chart.angles) longitudes.ascendant = chart.angles.ascendant.longitude;
  return longitudes;
}

export function computeCurrentSky(
  natal: Partial<Record<NatalPoint, number>>,
  instant: Date,
): CurrentSky {
  const bodies: SkyBody[] = BODY_IDS.map((id) => {
    const { body, longitude, sign, degreeInSign, retrograde } = computeBody(id, instant);
    return { body, longitude, sign, degreeInSign, retrograde };
  });
  const aspects: TransitAspect[] = [];
  for (const body of bodies) {
    for (const point of NATAL_POINTS) {
      const natalLongitude = natal[point];
      if (natalLongitude === undefined) continue;
      const separation = angularSeparation(body.longitude, natalLongitude);
      for (const [type, { angle, maxOrb }] of Object.entries(ASPECT_DEFINITIONS)) {
        const orb = Math.abs(separation - angle);
        if (orb <= Math.min(maxOrb, TRANSIT_MAX_ORB)) {
          aspects.push({
            transitBody: body.body,
            natalPoint: point,
            type: type as AspectType,
            orb: round(orb, ORB_DECIMALS),
          });
        }
      }
    }
  }
  aspects.sort((a, b) => a.orb - b.orb);
  return { generatedAt: instant.toISOString(), bodies, aspects };
}

export function createCurrentSkyHandler(
  { store, cache, now = () => new Date() }: CurrentSkyDependencies,
) {
  return async ({ req, caller }: HandlerContext): Promise<Response> => {
    const token = extractBearerToken(req);
    if (token === null) throw new HttpError(401, "unauthenticated", "unauthenticated");

    const record = await store.findLatest(token, caller.userId);
    if (record === null) throw new HttpError(404, "birth_data_not_found", "birth_data_not_found");

    let chart: NatalChart | null = null;
    try {
      chart = await cache.find(record.id, await computeCacheKey(record.birth));
    } catch {
      chart = null;
    }
    try {
      chart ??= computeNatalChart(record.birth);
    } catch (error) {
      if (error instanceof RangeError) {
        throw new HttpError(422, "invalid_birth_data", "invalid_birth_data");
      }
      throw error;
    }

    return json(computeCurrentSky(natalLongitudes(chart), now()), {
      headers: { "Cache-Control": "no-store" },
    });
  };
}
