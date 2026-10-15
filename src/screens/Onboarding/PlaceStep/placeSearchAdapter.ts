import type { PlaceSearchErrorCode, PlaceSuggestion, SearchPlaces } from "../../../lib/placeSearch";

/** Recherche attendue par `PlaceStep` : un échec du service est une promesse rejetée. */
export type PlaceSearch = (query: string, signal: AbortSignal) => Promise<PlaceSuggestion[]>;

/** Erreur levée quand le service de géocodage renvoie un résultat en échec. */
export class PlaceSearchFailure extends Error {
  readonly code: PlaceSearchErrorCode;

  constructor(code: PlaceSearchErrorCode, message: string) {
    super(message);
    this.name = "PlaceSearchFailure";
    this.code = code;
  }
}

/** Adapte `searchPlaces` (résultat `{ places, error }`) à la signature attendue par `PlaceStep`. */
export function toPlaceSearch(searchPlaces: SearchPlaces): PlaceSearch {
  return async (query, signal) => {
    const result = await searchPlaces(query, { signal });
    if (result.error) throw new PlaceSearchFailure(result.error.code, result.error.message);
    return result.places;
  };
}
