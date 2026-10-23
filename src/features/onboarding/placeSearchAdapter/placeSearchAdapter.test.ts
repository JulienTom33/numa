import { describe, expect, it, vi } from "vitest";
import type { PlaceSuggestion, SearchPlaces } from "../placeSearch/placeSearch";
import { PlaceSearchFailure, toPlaceSearch } from "./placeSearchAdapter";

const bordeaux: PlaceSuggestion = {
  id: "bordeaux-fr",
  name: "Bordeaux",
  region: "Nouvelle-Aquitaine",
  country: "France",
  countryCode: "FR",
  label: "Bordeaux, Nouvelle-Aquitaine, France",
  latitude: 44.84,
  longitude: -0.58,
  timezone: "Europe/Paris",
};

describe("toPlaceSearch", () => {
  it("forwards the query and signal and returns the places", async () => {
    const searchPlaces = vi.fn<SearchPlaces>().mockResolvedValue({ places: [bordeaux], error: null });
    const signal = new AbortController().signal;

    await expect(toPlaceSearch(searchPlaces)("Bor", signal)).resolves.toEqual([bordeaux]);
    expect(searchPlaces).toHaveBeenCalledWith("Bor", { signal });
  });

  it("rejects with the service error", async () => {
    const searchPlaces = vi.fn<SearchPlaces>().mockResolvedValue({
      places: null,
      error: { code: "network_error" },
    });

    const failure = toPlaceSearch(searchPlaces)("Bor", new AbortController().signal);

    await expect(failure).rejects.toBeInstanceOf(PlaceSearchFailure);
    await expect(failure).rejects.toMatchObject({ code: "network_error", message: "network_error" });
  });
});
