import { assert, assertEquals, assertThrows } from "jsr:@std/assert@1";
import { computeNatalChart } from "./compute.ts";
import { ENGINE_VERSION } from "../../../shared/contracts/natalChart/natalChart.ts";
import type { BirthInput } from "../../../shared/contracts/natalChart/natalChart.ts";

const ARC_MINUTE = 1 / 60;

function dm(degrees: number, minutes: number, signOffset = 0): number {
  return signOffset + degrees + minutes / 60;
}

function assertNear(actual: number, expected: number, label: string): void {
  const difference = Math.abs(((actual - expected + 540) % 360) - 180);
  assert(difference <= ARC_MINUTE, `${label}: ${actual} vs ${expected} (${difference * 60}')`);
}

function exact(overrides: Partial<BirthInput>): BirthInput {
  return {
    birthDate: "1975-06-15",
    birthTime: "14:30:00",
    timePrecision: "exact",
    timeMargin: null,
    timezone: "Europe/Paris",
    latitude: 48.8566,
    longitude: 2.3522,
    ...overrides,
  };
}

function find(chart: ReturnType<typeof computeNatalChart>, body: string) {
  const found = chart.bodies.find((candidate) => candidate.body === body);
  assert(found, body);
  return found;
}

// Valeurs Swiss Ephemeris de docs/research/api-astrologiques.md, tolerance 1' (arrondi a la minute).
const PROFILES = [
  {
    name: "P1",
    input: exact({}),
    sun: dm(23, 50, 60),
    moon: dm(9, 43, 150),
    ascendant: dm(13, 8, 180),
    midheaven: dm(16, 39, 90),
    utc: "1975-06-15T13:30:00.000Z",
    status: "exact",
  },
  {
    name: "P2",
    input: exact({ birthDate: "2021-10-31", birthTime: "02:30:00" }),
    sun: dm(7, 47, 210),
    moon: dm(3, 28, 150),
    ascendant: dm(0, 31, 150),
    midheaven: dm(21, 48, 30),
    utc: "2021-10-31T00:30:00.000Z",
    status: "ambiguous",
  },
  {
    name: "P3 (temps moyen local d'Ulm)",
    input: exact({
      birthDate: "1879-03-14",
      birthTime: "11:30:00",
      timezone: "Europe/Berlin",
      latitude: 48.4,
      longitude: 10,
    }),
    sun: dm(23, 30, 330),
    moon: dm(14, 31, 240),
    ascendant: dm(11, 38, 90),
    midheaven: dm(12, 50, 330),
    utc: "1879-03-14T10:50:00.000Z",
    status: "localMeanTime",
  },
  {
    name: "P4",
    input: exact({
      birthDate: "1990-01-10",
      birthTime: "08:15:00",
      timezone: "Australia/Sydney",
      latitude: -33.8688,
      longitude: 151.2093,
    }),
    sun: dm(19, 21, 270),
    moon: dm(2, 1, 90),
    ascendant: dm(17, 27, 300),
    midheaven: dm(11, 32, 210),
    utc: "1990-01-09T21:15:00.000Z",
    status: "exact",
  },
];

for (const profile of PROFILES) {
  Deno.test(`${profile.name} : Soleil, Lune, ascendant et MC a 1' des valeurs de reference`, () => {
    const chart = computeNatalChart(profile.input);
    assertNear(find(chart, "sun").longitude, profile.sun, "soleil");
    assertNear(find(chart, "moon").longitude, profile.moon, "lune");
    assert(chart.angles);
    assertNear(chart.angles.ascendant.longitude, profile.ascendant, "ascendant");
    assertNear(chart.angles.midheaven.longitude, profile.midheaven, "mc");
    assertEquals(chart.instant.utc, profile.utc);
    assertEquals(chart.instant.status, profile.status);
  });
}

Deno.test("heure exacte : confiance haute, Placidus, 12 maisons, aucun avertissement", () => {
  const chart = computeNatalChart(PROFILES[0].input);
  assertEquals(chart.confidence, "high");
  assertEquals(chart.warnings, []);
  assertEquals(chart.houses?.system, "placidus");
  assertEquals(chart.houses?.fallback, null);
  assertEquals(chart.houses?.cusps.length, 12);
  assertEquals(chart.bodies.length, 10);
  assert(chart.bodies.every((body) => body.house !== null && body.house >= 1 && body.house <= 12));
  assertEquals(chart.engine, { name: "astronomy-engine", version: ENGINE_VERSION });
  assertEquals(chart.schemaVersion, 1);
});

Deno.test("la maison du Soleil est coherente avec les cuspides", () => {
  const chart = computeNatalChart(PROFILES[0].input);
  const cusps = chart.houses?.cusps ?? [];
  const house = find(chart, "sun").house ?? 0;
  const start = cusps[house - 1].longitude;
  const end = cusps[house % 12].longitude;
  const offset = (find(chart, "sun").longitude - start + 360) % 360;
  assert(offset < (end - start + 360) % 360);
});

Deno.test("heure ambigue : confiance moyenne et avertissement ambiguous_local_time", () => {
  const chart = computeNatalChart(PROFILES[1].input);
  assertEquals(chart.confidence, "medium");
  assertEquals(chart.warnings, ["ambiguous_local_time"]);
});

Deno.test("heure inexistante : confiance moyenne et avertissement nonexistent_local_time", () => {
  const chart = computeNatalChart(exact({ birthDate: "2021-03-28", birthTime: "02:30:00" }));
  assertEquals(chart.instant.status, "nonexistent");
  assertEquals(chart.confidence, "medium");
  assertEquals(chart.warnings, ["nonexistent_local_time"]);
});

Deno.test("naissance ancienne : temps moyen local signale", () => {
  const chart = computeNatalChart(PROFILES[2].input);
  assertEquals(chart.warnings, ["local_mean_time"]);
  assertEquals(chart.confidence, "high");
  assertEquals(chart.instant.offsetSeconds, 2400);
});

Deno.test("P5 heure inconnue : midi local, pas d'ascendant ni de maisons, Lune Cancer vers Lion", () => {
  const chart = computeNatalChart(
    exact({
      birthDate: "1988-02-29",
      birthTime: null,
      timePrecision: "unknown",
      latitude: 45.764,
      longitude: 4.8357,
    }),
  );
  assertEquals(chart.confidence, "low");
  assertEquals(chart.angles, null);
  assertEquals(chart.houses, null);
  assertEquals(chart.instant.utc, "1988-02-29T11:00:00.000Z");
  assertEquals(chart.instant.localTimeUsed, "12:00");
  assert(chart.bodies.every((body) => body.house === null));
  assertNear(find(chart, "sun").longitude, dm(10, 4, 330), "soleil");
  assertNear(find(chart, "moon").longitude, dm(5, 19, 120), "lune");
  assertEquals(chart.moonSignChange, { from: "cancer", to: "leo" });
  assertEquals(chart.warnings, ["unknown_time", "moon_sign_uncertain"]);
});

Deno.test("heure inconnue sans changement de signe lunaire : seul unknown_time", () => {
  const chart = computeNatalChart(
    exact({ birthDate: "1975-06-15", birthTime: null, timePrecision: "unknown" }),
  );
  assertEquals(chart.moonSignChange, null);
  assertEquals(chart.warnings, ["unknown_time"]);
});

Deno.test("heure approximative : confiance moyenne, ascendant calcule", () => {
  const chart = computeNatalChart(
    exact({ timePrecision: "approximate", timeMargin: "under_30_min" }),
  );
  assertEquals(chart.confidence, "medium");
  assertEquals(chart.warnings, ["approximate_time"]);
  assert(chart.angles);
});

Deno.test("latitude polaire : repli Porphyre signale", () => {
  const chart = computeNatalChart(exact({ latitude: 78.2232, longitude: 15.6267 }));
  assertEquals(chart.houses?.system, "porphyry");
  assertEquals(chart.houses?.requestedSystem, "placidus");
  assertEquals(chart.houses?.fallback?.reason, "polar-latitude");
  assertEquals(chart.warnings, ["polar_fallback"]);
});

Deno.test("retrogradation : Mercure retrograde le 2021-10-05, direct le 2021-10-31", () => {
  const retrograde = computeNatalChart(exact({ birthDate: "2021-10-05", birthTime: "12:00:00" }));
  assertEquals(find(retrograde, "mercury").retrograde, true);
  assert(find(retrograde, "mercury").speed < 0);
  const chart = computeNatalChart(PROFILES[1].input);
  assertEquals(find(chart, "mercury").retrograde, false);
  assertEquals(find(chart, "jupiter").retrograde, false);
  assertEquals(find(chart, "saturn").retrograde, false);
});

Deno.test("Soleil et Lune ne sont jamais retrogrades", () => {
  const chart = computeNatalChart(PROFILES[1].input);
  assertEquals(find(chart, "sun").retrograde, false);
  assertEquals(find(chart, "moon").retrograde, false);
  assert(find(chart, "moon").speed > 10);
});

Deno.test("fuseau ou date invalides : RangeError", () => {
  assertThrows(() => computeNatalChart(exact({ timezone: "Mars/Olympus" })), RangeError);
  assertThrows(() => computeNatalChart(exact({ birthDate: "1975-02-30" })), RangeError);
  assertThrows(() => computeNatalChart(exact({ latitude: 91 })), RangeError);
});
