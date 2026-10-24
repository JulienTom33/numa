import { assert, assertEquals } from "jsr:@std/assert@1";
import { computeEvents } from "./events.ts";

// Sources : NASA Eclipse Web Site (eclipse.gsfc.nasa.gov) pour les eclipses, almanachs
// astronomiques usuels (Astro.com) pour les stations, phases et ingres de 2024.
// Tolerance de 3 minutes sur l heure.
const TOLERANCE_MS = 3 * 60 * 1000;

function events(from: string, to: string) {
  return computeEvents(new Date(`${from}T00:00:00Z`), new Date(`${to}T00:00:00Z`));
}

function near(actual: string, expected: string): boolean {
  return Math.abs(new Date(actual).getTime() - new Date(expected).getTime()) <= TOLERANCE_MS;
}

Deno.test("ingres du Soleil en Belier a l equinoxe de mars 2024", () => {
  const sun = events("2024-03-20", "2024-03-21").ingresses.find((item) => item.body === "sun");
  assertEquals(sun?.from, "pisces");
  assertEquals(sun?.to, "aries");
  assertEquals(sun?.retrograde, false);
  assert(near(sun?.at ?? "", "2024-03-20T03:06:00Z"));
});

Deno.test("ingres du Soleil en Cancer au solstice de juin 2024", () => {
  const sun = events("2024-06-20", "2024-06-21").ingresses.find((item) => item.body === "sun");
  assertEquals(sun?.to, "cancer");
  assert(near(sun?.at ?? "", "2024-06-20T20:51:00Z"));
});

Deno.test("station retrograde de Mercure le 2024-04-01", () => {
  const { stations } = events("2024-03-28", "2024-04-05");
  assertEquals(stations.length, 1);
  assertEquals(stations[0].body, "mercury");
  assertEquals(stations[0].type, "retrograde");
  assertEquals(stations[0].sign, "aries");
  assert(near(stations[0].at, "2024-04-01T22:14:00Z"));
});

Deno.test("stations de Jupiter et de Saturne en 2024", () => {
  const jupiter = events("2024-10-08", "2024-10-11").stations;
  assertEquals(jupiter.map((item) => [item.body, item.type]), [["jupiter", "retrograde"]]);
  assertEquals(jupiter[0].at.slice(0, 10), "2024-10-09");

  const saturn = events("2024-11-14", "2024-11-17").stations;
  assertEquals(saturn.map((item) => [item.body, item.type]), [["saturn", "direct"]]);
  assertEquals(saturn[0].at.slice(0, 10), "2024-11-15");
});

Deno.test("phases lunaires d avril 2024", () => {
  const { moonPhases } = events("2024-04-01", "2024-05-01");
  assertEquals(moonPhases.map((item) => item.phase), [
    "last_quarter",
    "new_moon",
    "first_quarter",
    "full_moon",
  ]);
  assert(near(moonPhases[1].at, "2024-04-08T18:21:00Z"));
  assert(near(moonPhases[3].at, "2024-04-23T23:49:00Z"));
});

Deno.test("eclipse solaire totale du 2024-04-08", () => {
  const { eclipses } = events("2024-04-01", "2024-04-15");
  assertEquals(eclipses.length, 1);
  assertEquals(eclipses[0].body, "solar");
  assertEquals(eclipses[0].kind, "total");
  assert(near(eclipses[0].at, "2024-04-08T18:17:00Z"));
});

Deno.test("eclipses de septembre et octobre 2024", () => {
  const { eclipses } = events("2024-09-15", "2024-10-05");
  assertEquals(eclipses.map((item) => [item.body, item.kind]), [
    ["lunar", "partial"],
    ["solar", "annular"],
  ]);
  assert(near(eclipses[0].at, "2024-09-18T02:44:00Z"));
  assert(near(eclipses[1].at, "2024-10-02T18:46:00Z"));
});

Deno.test("les evenements hors de la plage sont exclus", () => {
  const result = events("2024-04-09", "2024-04-10");
  assertEquals(result.eclipses, []);
  assertEquals(result.stations, []);
  assertEquals(result.moonPhases, []);
});
