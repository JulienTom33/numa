import { assertEquals, assertRejects, assertThrows } from "jsr:@std/assert@1";
import { HttpError } from "../_shared/http.ts";
import { arrondissementsFor } from "./arrondissements.ts";
import {
  DEFAULT_LIMIT,
  type FetchFn,
  parseSearchRequest,
  searchPlaces,
  toPlace,
} from "./places.ts";

const PARIS = {
  id: 2988507,
  name: "Paris",
  latitude: 48.85341,
  longitude: 2.3488,
  feature_code: "PPLC",
  country_code: "FR",
  timezone: "Europe/Paris",
  country: "France",
  admin1: "Île-de-France",
};

const PARIS_TEXAS = {
  id: 4717560,
  name: "Paris",
  latitude: 33.66094,
  longitude: -95.55551,
  feature_code: "PPLA2",
  country_code: "US",
  timezone: "America/Chicago",
  country: "États-Unis",
  admin1: "Texas",
};

function respondWith(body: unknown, status = 200): { fetch: FetchFn; urls: string[] } {
  const urls: string[] = [];
  return {
    urls,
    fetch: (input) => {
      urls.push(input);
      return Promise.resolve(new Response(JSON.stringify(body), { status }));
    },
  };
}

async function assertHttpError(promise: Promise<unknown>, status: number, code: string) {
  const error = await assertRejects(() => promise, HttpError);
  assertEquals([error.status, error.code], [status, code]);
}

Deno.test("parseSearchRequest normalises the query and applies the default limit", () => {
  assertEquals(parseSearchRequest({ query: "  Saint   Malo " }), {
    query: "Saint Malo",
    limit: DEFAULT_LIMIT,
  });
  assertEquals(parseSearchRequest({ query: "Ly", limit: 3 }), { query: "Ly", limit: 3 });
});

Deno.test("parseSearchRequest rejects invalid queries", () => {
  for (
    const body of [null, "Paris", {}, { query: 42 }, { query: " a " }, { query: "x".repeat(101) }]
  ) {
    const error = assertThrows(() => parseSearchRequest(body), HttpError);
    assertEquals(error.code, "invalid_query");
  }
});

Deno.test("parseSearchRequest rejects invalid limits", () => {
  for (const limit of [0, 11, 2.5, "5"]) {
    const error = assertThrows(() => parseSearchRequest({ query: "Paris", limit }), HttpError);
    assertEquals(error.code, "invalid_limit");
  }
});

Deno.test("toPlace builds a French label with city, region and country", () => {
  assertEquals(toPlace(PARIS), {
    id: "2988507",
    name: "Paris",
    region: "Île-de-France",
    country: "France",
    countryCode: "FR",
    label: "Paris, Île-de-France, France",
    latitude: 48.85341,
    longitude: 2.3488,
    timezone: "Europe/Paris",
    arrondissements: arrondissementsFor("2988507") ?? [],
  });
});

Deno.test("toPlace attaches arrondissements only to cities that have them", () => {
  assertEquals(toPlace(PARIS_TEXAS)?.arrondissements, undefined);
  assertEquals(toPlace({ ...PARIS, id: 2996944, name: "Lyon" })?.arrondissements?.length, 9);
});

Deno.test("toPlace omits a region that repeats the city name", () => {
  const place = toPlace({ ...PARIS, name: "Berlin", admin1: "Berlin", country: "Allemagne" });
  assertEquals(place?.label, "Berlin, Allemagne");
  assertEquals(place?.region, null);
});

Deno.test("toPlace drops non-populated places and incomplete entries", () => {
  assertEquals(toPlace({ ...PARIS, feature_code: "AIRP" }), null);
  assertEquals(toPlace({ ...PARIS, timezone: undefined }), null);
  assertEquals(toPlace({ ...PARIS, latitude: 120 }), null);
  assertEquals(toPlace({ ...PARIS, id: "x" }), null);
  assertEquals(toPlace("Paris"), null);
});

Deno.test("searchPlaces queries Open-Meteo in French and caps the results", async () => {
  const { fetch, urls } = respondWith({
    results: [PARIS, { ...PARIS, feature_code: "ADM1" }, PARIS_TEXAS],
  });

  const places = await searchPlaces({ query: "Paris", limit: 1 }, { fetch });

  assertEquals(places.map((place) => place.label), ["Paris, Île-de-France, France"]);
  const url = new URL(urls[0]);
  assertEquals(url.origin, "https://geocoding-api.open-meteo.com");
  assertEquals(url.searchParams.get("name"), "Paris");
  assertEquals(url.searchParams.get("language"), "fr");
});

Deno.test("searchPlaces returns an empty list when nothing matches", async () => {
  const { fetch } = respondWith({ generationtime_ms: 0.2 });

  assertEquals(await searchPlaces({ query: "zzqxw", limit: 5 }, { fetch }), []);
});

Deno.test("searchPlaces reports a provider error status", async () => {
  const { fetch } = respondWith({ error: true, reason: "boom" }, 500);

  await assertHttpError(
    searchPlaces({ query: "Paris", limit: 5 }, { fetch }),
    502,
    "provider_unavailable",
  );
});

Deno.test("searchPlaces reports a malformed provider payload", async () => {
  const { fetch } = respondWith({ results: "oops" });

  await assertHttpError(
    searchPlaces({ query: "Paris", limit: 5 }, { fetch }),
    502,
    "provider_unavailable",
  );
});

Deno.test("searchPlaces reports a network failure", async () => {
  const fetch: FetchFn = () => Promise.reject(new TypeError("dns error"));

  await assertHttpError(
    searchPlaces({ query: "Paris", limit: 5 }, { fetch }),
    502,
    "provider_unavailable",
  );
});

Deno.test("searchPlaces aborts a provider that does not answer in time", async () => {
  const fetch: FetchFn = (_input, init) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
    });

  await assertHttpError(
    searchPlaces({ query: "Paris", limit: 5 }, { fetch, timeoutMs: 10 }),
    504,
    "provider_timeout",
  );
});
