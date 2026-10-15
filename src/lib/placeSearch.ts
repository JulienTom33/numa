import { FunctionsFetchError, FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

export const PLACE_SEARCH_MIN_LENGTH = 2;

const INVOKE_TIMEOUT_MS = 8000;

export interface PlaceSuggestion {
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

export type PlaceSearchErrorCode =
  | "invalid_query"
  | "provider_unavailable"
  | "provider_timeout"
  | "unauthenticated"
  | "network_error"
  | "aborted"
  | "unknown_error";

export interface PlaceSearchError {
  code: PlaceSearchErrorCode;
  message: string;
}

export type PlaceSearchResult =
  | { places: PlaceSuggestion[]; error: null }
  | { places: null; error: PlaceSearchError };

export type SearchPlaces = (
  query: string,
  options?: { signal?: AbortSignal; limit?: number },
) => Promise<PlaceSearchResult>;

const MESSAGES: Record<PlaceSearchErrorCode, string> = {
  invalid_query: "Saisissez au moins deux caractères.",
  provider_unavailable: "La recherche de lieux est momentanément indisponible.",
  provider_timeout: "La recherche de lieux met trop de temps à répondre.",
  unauthenticated: "Votre session a expiré. Rechargez la page.",
  network_error: "Connexion impossible. Vérifiez votre réseau.",
  aborted: "Recherche annulée.",
  unknown_error: "Une erreur inattendue est survenue.",
};

function failure(code: PlaceSearchErrorCode): PlaceSearchResult {
  return { places: null, error: { code, message: MESSAGES[code] } };
}

const SERVER_CODES: Partial<Record<string, PlaceSearchErrorCode>> = {
  invalid_query: "invalid_query",
  invalid_limit: "invalid_query",
  invalid_body: "invalid_query",
  provider_unavailable: "provider_unavailable",
  provider_timeout: "provider_timeout",
  unauthenticated: "unauthenticated",
  invalid_token: "unauthenticated",
};

async function readServerCode(response: unknown): Promise<PlaceSearchErrorCode> {
  if (!(response instanceof Response)) return "unknown_error";
  if (response.status === 401) return "unauthenticated";
  try {
    const body: unknown = await response.json();
    const code = (body as { error?: { code?: unknown } } | null)?.error?.code;
    return (typeof code === "string" && SERVER_CODES[code]) || "unknown_error";
  } catch {
    return "unknown_error";
  }
}

function isPlaceSuggestion(value: unknown): value is PlaceSuggestion {
  if (typeof value !== "object" || value === null) return false;
  const place = value as Record<string, unknown>;
  return (
    typeof place.id === "string" &&
    typeof place.label === "string" &&
    typeof place.timezone === "string" &&
    typeof place.latitude === "number" &&
    typeof place.longitude === "number"
  );
}

/**
 * Recherche des villes via l'Edge Function `geocode`. Une saisie trop courte renvoie une liste
 * vide sans appel réseau ; une liste vide signifie « aucun résultat ».
 */
export const searchPlaces: SearchPlaces = async (query, { signal, limit } = {}) => {
  const trimmed = query.trim();
  if (trimmed.length < PLACE_SEARCH_MIN_LENGTH) return { places: [], error: null };

  const { data, error } = await supabase.functions.invoke<unknown>("geocode", {
    body: limit === undefined ? { query: trimmed } : { query: trimmed, limit },
    signal,
    timeout: INVOKE_TIMEOUT_MS,
  });

  if (signal?.aborted) return failure("aborted");
  if (error instanceof FunctionsHttpError) return failure(await readServerCode(error.context));
  if (error instanceof FunctionsFetchError) return failure("network_error");
  if (error) return failure("unknown_error");

  const places = (data as { places?: unknown } | null)?.places;
  if (!Array.isArray(places) || !places.every(isPlaceSuggestion)) return failure("unknown_error");
  return { places, error: null };
};
