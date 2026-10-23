import { DEFAULT_HOUSE_SYSTEM } from "../_shared/astrology/houses.ts";
import {
  ENGINE_NAME,
  ENGINE_VERSION,
  SCHEMA_VERSION,
} from "../../../shared/contracts/natalChart/natalChart.ts";
import type { BirthInput } from "../../../shared/contracts/natalChart/natalChart.ts";

const COORDINATE_DECIMALS = 6;

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export interface CacheKeyVersions {
  readonly engineName: string;
  readonly engineVersion: string;
  readonly schemaVersion: number;
}

const CURRENT_VERSIONS: CacheKeyVersions = {
  engineName: ENGINE_NAME,
  engineVersion: ENGINE_VERSION,
  schemaVersion: SCHEMA_VERSION,
};

export function canonicalCacheInput(
  birth: BirthInput,
  versions: CacheKeyVersions = CURRENT_VERSIONS,
): string {
  const timeKnown = birth.timePrecision !== "unknown" && birth.birthTime !== null;
  return JSON.stringify({
    birthDate: birth.birthDate,
    birthTime: timeKnown ? birth.birthTime?.slice(0, 5) : null,
    timePrecision: birth.timePrecision,
    timeMargin: birth.timePrecision === "approximate" ? birth.timeMargin : null,
    timezone: birth.timezone,
    latitude: Number(birth.latitude.toFixed(COORDINATE_DECIMALS)),
    longitude: Number(birth.longitude.toFixed(COORDINATE_DECIMALS)),
    houseSystem: DEFAULT_HOUSE_SYSTEM,
    engine: { name: versions.engineName, version: versions.engineVersion },
    schemaVersion: versions.schemaVersion,
  });
}

export async function computeCacheKey(
  birth: BirthInput,
  versions: CacheKeyVersions = CURRENT_VERSIONS,
): Promise<string> {
  const data = new TextEncoder().encode(canonicalCacheInput(birth, versions));
  return toHex(await crypto.subtle.digest("SHA-256", data));
}
