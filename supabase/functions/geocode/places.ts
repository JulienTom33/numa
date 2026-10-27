import { ExternalFailure, fetchExternal } from "../_shared/external.ts";
import { HttpError } from "../_shared/http.ts";

export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 100;
export const DEFAULT_LIMIT = 8;
export const MAX_LIMIT = 10;
export const PROVIDER_TIMEOUT_MS = 5000;

const OPEN_METEO_SEARCH_URL = "https://geocoding-api.open-meteo.com/v1/search";
const PROVIDER_COUNT = 20;

export interface SearchRequest {
  query: string;
  limit: number;
}

export interface Place {
  id: string;
  name: string;
  region: string | null;
  country: string;
  countryCode: string;
  label: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

interface SearchOptions {
  fetch: FetchFn;
  timeoutMs?: number;
}

export function parseSearchRequest(body: unknown): SearchRequest {
  if (typeof body !== "object" || body === null) {
    throw invalidQuery();
  }
  const { query, limit } = body as Record<string, unknown>;

  if (typeof query !== "string") throw invalidQuery();
  const trimmed = query.trim().replace(/\s+/g, " ");
  if (trimmed.length < MIN_QUERY_LENGTH || trimmed.length > MAX_QUERY_LENGTH) {
    throw invalidQuery();
  }

  if (limit === undefined) return { query: trimmed, limit: DEFAULT_LIMIT };
  if (typeof limit !== "number" || !Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new HttpError(
      400,
      "invalid_limit",
      `Le nombre de résultats doit être compris entre 1 et ${MAX_LIMIT}.`,
    );
  }
  return { query: trimmed, limit };
}

function invalidQuery(): HttpError {
  return new HttpError(
    400,
    "invalid_query",
    `La recherche doit contenir entre ${MIN_QUERY_LENGTH} et ${MAX_QUERY_LENGTH} caractères.`,
  );
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function isValidCoordinate(value: unknown, bound: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= bound;
}

/** Convertit un résultat Open-Meteo en lieu, ou `null` s'il est incomplet ou n'est pas une localité. */
export function toPlace(raw: unknown): Place | null {
  if (typeof raw !== "object" || raw === null) return null;
  const entry = raw as Record<string, unknown>;

  const featureCode = nonEmptyString(entry.feature_code);
  if (!featureCode?.startsWith("PPL")) return null;

  const name = nonEmptyString(entry.name);
  const country = nonEmptyString(entry.country);
  const countryCode = nonEmptyString(entry.country_code);
  const timezone = nonEmptyString(entry.timezone);
  const { id, latitude, longitude } = entry;
  if (!name || !country || !countryCode || !timezone || typeof id !== "number") return null;
  if (!isValidCoordinate(latitude, 90) || !isValidCoordinate(longitude, 180)) return null;

  const admin1 = nonEmptyString(entry.admin1);
  const region = admin1 && admin1 !== name ? admin1 : null;
  return {
    id: String(id),
    name,
    region,
    country,
    countryCode,
    label: [name, region, country].filter(Boolean).join(", "),
    latitude,
    longitude,
    timezone,
  };
}

export async function searchPlaces(
  { query, limit }: SearchRequest,
  { fetch, timeoutMs = PROVIDER_TIMEOUT_MS }: SearchOptions,
): Promise<Place[]> {
  const url = new URL(OPEN_METEO_SEARCH_URL);
  url.search = new URLSearchParams({
    name: query,
    count: String(PROVIDER_COUNT),
    language: "fr",
    format: "json",
  }).toString();

  let response: Response;
  try {
    response = await fetchExternal(url.toString(), {}, {
      fetchFn: fetch,
      service: "open-meteo",
      timeoutMs,
      retries: 1,
    });
  } catch (error) {
    if (error instanceof ExternalFailure && error.kind === "timeout") {
      throw new HttpError(
        504,
        "provider_timeout",
        "Le service de recherche de lieux ne répond pas.",
      );
    }
    throw providerUnavailable();
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw providerUnavailable();
  }
  if (typeof payload !== "object" || payload === null) throw providerUnavailable();

  const { results } = payload as Record<string, unknown>;
  if (results === undefined) return [];
  if (!Array.isArray(results)) throw providerUnavailable();

  return results
    .map(toPlace)
    .filter((place): place is Place => place !== null)
    .slice(0, limit);
}

function providerUnavailable(): HttpError {
  return new HttpError(
    502,
    "provider_unavailable",
    "Le service de recherche de lieux est indisponible.",
  );
}
