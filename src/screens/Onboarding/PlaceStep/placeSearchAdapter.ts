import type { PlaceSearchErrorCode, PlaceSuggestion, SearchPlaces } from "../../../lib/placeSearch";

export type PlaceSearch = (query: string, signal: AbortSignal) => Promise<PlaceSuggestion[]>;

export class PlaceSearchFailure extends Error {
  readonly code: PlaceSearchErrorCode;

  constructor(code: PlaceSearchErrorCode) {
    super(code);
    this.name = "PlaceSearchFailure";
    this.code = code;
  }
}

/** Adapte `searchPlaces` (résultat `{ places, error }`) à la signature attendue par `PlaceStep`. */
export function toPlaceSearch(searchPlaces: SearchPlaces): PlaceSearch {
  return async (query, signal) => {
    const result = await searchPlaces(query, { signal });
    if (result.error) throw new PlaceSearchFailure(result.error.code);
    return result.places;
  };
}
