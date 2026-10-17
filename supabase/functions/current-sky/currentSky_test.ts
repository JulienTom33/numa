import { assertEquals } from "jsr:@std/assert@1";
import { createHandler } from "../_shared/handler.ts";
import type { ChartCache } from "../natal-chart/cache.ts";
import { computeNatalChart } from "../natal-chart/compute.ts";
import { type BirthDataRow, type BirthDataStore, toBirthInput } from "../natal-chart/store.ts";
import {
  computeCurrentSky,
  createCurrentSkyHandler,
  natalLongitudes,
  TRANSIT_MAX_ORB,
} from "./currentSky.ts";

const USER_ID = "11111111-1111-1111-1111-111111111111";

const ROW: BirthDataRow = {
  id: "99999999-9999-9999-9999-999999999999",
  birth_date: "1975-06-15",
  birth_time: "14:30:00",
  time_precision: "exact",
  time_margin: null,
  timezone: "Europe/Paris",
  latitude: "48.856600",
  longitude: "2.352200",
};

const NOW = new Date("2026-10-16T12:00:00Z");

const emptyCache: ChartCache = {
  find: () => Promise.resolve(null),
  save: () => Promise.resolve(),
};

function handlerFor(row: BirthDataRow | null, cache: ChartCache = emptyCache) {
  const store: BirthDataStore = {
    findLatest: () => Promise.resolve(row ? { id: row.id, birth: toBirthInput(row) } : null),
  };
  return createHandler({
    methods: ["GET", "POST"],
    allowedOrigins: ["http://localhost:5173"],
    verifyToken: (token) => Promise.resolve(token === "valid" ? { sub: USER_ID } : null),
    handle: createCurrentSkyHandler({ store, cache, now: () => NOW }),
  });
}

const request = (headers: Record<string, string> = {}) =>
  new Request("http://localhost/current-sky", { headers });

Deno.test("JWT absent : 401", async () => {
  const response = await handlerFor(ROW)(request());
  assertEquals(response.status, 401);
});

Deno.test("pas de birth_data : 404", async () => {
  const response = await handlerFor(null)(request({ Authorization: "Bearer valid" }));
  assertEquals(response.status, 404);
  assertEquals((await response.json()).error.code, "birth_data_not_found");
});

Deno.test("donnees invalides : 422", async () => {
  const response = await handlerFor({ ...ROW, timezone: "Mars/Olympus" })(
    request({ Authorization: "Bearer valid" }),
  );
  assertEquals(response.status, 422);
});

Deno.test("succes : 10 corps, instant injecte, aspects dans l'orbe et tries", async () => {
  const response = await handlerFor(ROW)(request({ Authorization: "Bearer valid" }));
  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Cache-Control"), "no-store");
  const sky = await response.json();
  assertEquals(sky.generatedAt, NOW.toISOString());
  assertEquals(sky.bodies.length, 10);
  const orbs: number[] = sky.aspects.map((aspect: { orb: number }) => aspect.orb);
  assertEquals(orbs, [...orbs].sort((a, b) => a - b));
  for (const orb of orbs) assertEquals(orb <= TRANSIT_MAX_ORB, true);
});

Deno.test("le theme en cache est utilise", async () => {
  const chart = computeNatalChart(toBirthInput(ROW));
  const cache: ChartCache = { find: () => Promise.resolve(chart), save: () => Promise.resolve() };
  const response = await handlerFor(ROW, cache)(request({ Authorization: "Bearer valid" }));
  assertEquals(response.status, 200);
});

Deno.test("heure inconnue : aucun aspect a l'ascendant", () => {
  const chart = computeNatalChart({
    ...toBirthInput(ROW),
    birthTime: null,
    timePrecision: "unknown",
  });
  const longitudes = natalLongitudes(chart);
  assertEquals(longitudes.ascendant, undefined);
  assertEquals(longitudes.sun !== undefined, true);
  const sky = computeCurrentSky(longitudes, NOW);
  assertEquals(sky.aspects.some((aspect) => aspect.natalPoint === "ascendant"), false);
});

Deno.test("conjonction exacte detectee avec une orbe nulle", () => {
  const sunNow = computeCurrentSky({}, NOW).bodies[0].longitude;
  const sky = computeCurrentSky({ sun: sunNow }, NOW);
  assertEquals(sky.aspects[0], {
    transitBody: "sun",
    natalPoint: "sun",
    type: "conjunction",
    orb: 0,
  });
});
