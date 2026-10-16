import { assert, assertEquals, assertThrows } from "jsr:@std/assert@1";
import { type ChartLocation, computeAngles } from "./angles.ts";
import {
  computeHouses,
  HOUSE_SYSTEMS,
  type HouseSystem,
  isPlacidusDefined,
  placidusCusps,
} from "./houses.ts";

// Valeurs de référence : Swiss Ephemeris 2.10.03 (portage `sweph-wasm` 2.6.9, `swe_houses`,
// systèmes "P", "O", "E", "W"), calculées le 2026-10-16 HORS DÉPÔT (scratchpad local), comme
// l'autorise la décision #50 : Swiss Ephemeris (AGPL) n'est ni une dépendance ni copié ici, seuls
// les nombres obtenus servent d'oracle. Profils P1–P5 : docs/research/api-astrologiques.md
// (instants déjà convertis en UTC ; P3 en temps moyen local d'Ulm, 10:50 UT, et P5 à midi).
// Swiss Ephemeris refuse Placidus au-delà du cercle polaire (`null` ci-dessous) : la référence
// du repli est alors sa valeur Porphyre.
interface ReferenceProfile {
  readonly id: string;
  readonly location: ChartLocation;
  readonly ascendant: number;
  readonly midheaven: number;
  readonly cusps: Readonly<Record<HouseSystem, readonly number[] | null>>;
}

const REFERENCES: readonly ReferenceProfile[] = [
  {
    id: "P1",
    location: { instant: new Date("1975-06-15T13:30:00Z"), latitude: 48.8566, longitude: 2.3522 },
    ascendant: 193.146863,
    midheaven: 106.659135,
    cusps: {
      "placidus": [
        193.146863,
        218.98119,
        250.478887,
        286.659135,
        321.370583,
        350.231927,
        13.146863,
        38.98119,
        70.478887,
        106.659135,
        141.370583,
        170.231927,
      ],
      "porphyry": [
        193.146863,
        224.31762,
        255.488378,
        286.659135,
        315.488378,
        344.31762,
        13.146863,
        44.31762,
        75.488378,
        106.659135,
        135.488378,
        164.31762,
      ],
      "equal": [
        193.146863,
        223.146863,
        253.146863,
        283.146863,
        313.146863,
        343.146863,
        13.146863,
        43.146863,
        73.146863,
        103.146863,
        133.146863,
        163.146863,
      ],
      "whole-sign": [180, 210, 240, 270, 300, 330, 0, 30, 60, 90, 120, 150],
    },
  },
  {
    id: "P2",
    location: { instant: new Date("2021-10-31T00:30:00Z"), latitude: 48.8566, longitude: 2.3522 },
    ascendant: 150.526657,
    midheaven: 51.807591,
    cusps: {
      "placidus": [
        150.526657,
        171.314328,
        198.066638,
        231.807591,
        269.361236,
        303.020061,
        330.526657,
        351.314328,
        18.066638,
        51.807591,
        89.361236,
        123.020061,
      ],
      "porphyry": [
        150.526657,
        177.620301,
        204.713946,
        231.807591,
        264.713946,
        297.620301,
        330.526657,
        357.620301,
        24.713946,
        51.807591,
        84.713946,
        117.620301,
      ],
      "equal": [
        150.526657,
        180.526657,
        210.526657,
        240.526657,
        270.526657,
        300.526657,
        330.526657,
        0.526657,
        30.526657,
        60.526657,
        90.526657,
        120.526657,
      ],
      "whole-sign": [150, 180, 210, 240, 270, 300, 330, 0, 30, 60, 90, 120],
    },
  },
  {
    id: "P3",
    location: { instant: new Date("1879-03-14T10:50:00Z"), latitude: 48.4, longitude: 10 },
    ascendant: 101.646405,
    midheaven: 342.839865,
    cusps: {
      "placidus": [
        101.646405,
        118.617242,
        137.807983,
        162.839865,
        198.332954,
        243.109471,
        281.646405,
        298.617242,
        317.807983,
        342.839865,
        18.332954,
        63.109471,
      ],
      "porphyry": [
        101.646405,
        122.044225,
        142.442045,
        162.839865,
        202.442045,
        242.044225,
        281.646405,
        302.044225,
        322.442045,
        342.839865,
        22.442045,
        62.044225,
      ],
      "equal": [
        101.646405,
        131.646405,
        161.646405,
        191.646405,
        221.646405,
        251.646405,
        281.646405,
        311.646405,
        341.646405,
        11.646405,
        41.646405,
        71.646405,
      ],
      "whole-sign": [90, 120, 150, 180, 210, 240, 270, 300, 330, 0, 30, 60],
    },
  },
  {
    id: "P4",
    location: {
      instant: new Date("1990-01-09T21:15:00Z"),
      latitude: -33.8688,
      longitude: 151.2093,
    },
    ascendant: 317.460341,
    midheaven: 221.538199,
    cusps: {
      "placidus": [
        317.460341,
        340.989761,
        9.03619,
        41.538199,
        75.756313,
        108.190176,
        137.460341,
        160.989761,
        189.03619,
        221.538199,
        255.756313,
        288.190176,
      ],
      "porphyry": [
        317.460341,
        345.486294,
        13.512247,
        41.538199,
        73.512247,
        105.486294,
        137.460341,
        165.486294,
        193.512247,
        221.538199,
        253.512247,
        285.486294,
      ],
      "equal": [
        317.460341,
        347.460341,
        17.460341,
        47.460341,
        77.460341,
        107.460341,
        137.460341,
        167.460341,
        197.460341,
        227.460341,
        257.460341,
        287.460341,
      ],
      "whole-sign": [300, 330, 0, 30, 60, 90, 120, 150, 180, 210, 240, 270],
    },
  },
  {
    id: "P5",
    location: { instant: new Date("1988-02-29T11:00:00Z"), latitude: 45.764, longitude: 4.8357 },
    ascendant: 85.078931,
    midheaven: 326.069716,
    cusps: {
      "placidus": [
        85.078931,
        104.070035,
        123.115178,
        146.069716,
        177.845762,
        221.657054,
        265.078931,
        284.070035,
        303.115178,
        326.069716,
        357.845762,
        41.657054,
      ],
      "porphyry": [
        85.078931,
        105.409193,
        125.739454,
        146.069716,
        185.739454,
        225.409193,
        265.078931,
        285.409193,
        305.739454,
        326.069716,
        5.739454,
        45.409193,
      ],
      "equal": [
        85.078931,
        115.078931,
        145.078931,
        175.078931,
        205.078931,
        235.078931,
        265.078931,
        295.078931,
        325.078931,
        355.078931,
        25.078931,
        55.078931,
      ],
      "whole-sign": [60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 0, 30],
    },
  },
  {
    id: "POLAR70N",
    location: { instant: new Date("2000-01-01T12:00:00Z"), latitude: 70, longitude: 25 },
    ascendant: 120.775473,
    midheaven: 303.160801,
    cusps: {
      "placidus": null,
      "porphyry": [
        120.775473,
        121.570582,
        122.365692,
        123.160801,
        182.365692,
        241.570582,
        300.775473,
        301.570582,
        302.365692,
        303.160801,
        2.365692,
        61.570582,
      ],
      "equal": [
        120.775473,
        150.775473,
        180.775473,
        210.775473,
        240.775473,
        270.775473,
        300.775473,
        330.775473,
        0.775473,
        30.775473,
        60.775473,
        90.775473,
      ],
      "whole-sign": [120, 150, 180, 210, 240, 270, 300, 330, 0, 30, 60, 90],
    },
  },
  {
    id: "POLAR70N_B",
    location: { instant: new Date("2000-03-20T18:00:00Z"), latitude: 70, longitude: 25 },
    ascendant: 191.68274,
    midheaven: 111.814166,
    cusps: {
      "placidus": null,
      "porphyry": [
        191.68274,
        225.059882,
        258.437024,
        291.814166,
        318.437024,
        345.059882,
        11.68274,
        45.059882,
        78.437024,
        111.814166,
        138.437024,
        165.059882,
      ],
      "equal": [
        191.68274,
        221.68274,
        251.68274,
        281.68274,
        311.68274,
        341.68274,
        11.68274,
        41.68274,
        71.68274,
        101.68274,
        131.68274,
        161.68274,
      ],
      "whole-sign": [180, 210, 240, 270, 300, 330, 0, 30, 60, 90, 120, 150],
    },
  },
  {
    id: "POLAR70S",
    location: { instant: new Date("2000-06-21T03:00:00Z"), latitude: -70, longitude: -60 },
    ascendant: 352.360215,
    midheaven: 255.834306,
    cusps: {
      "placidus": null,
      "porphyry": [
        352.360215,
        20.184912,
        48.009609,
        75.834306,
        108.009609,
        140.184912,
        172.360215,
        200.184912,
        228.009609,
        255.834306,
        288.009609,
        320.184912,
      ],
      "equal": [
        352.360215,
        22.360215,
        52.360215,
        82.360215,
        112.360215,
        142.360215,
        172.360215,
        202.360215,
        232.360215,
        262.360215,
        292.360215,
        322.360215,
      ],
      "whole-sign": [330, 0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300],
    },
  },
  {
    id: "CIRCLE66",
    location: { instant: new Date("2010-12-21T08:00:00Z"), latitude: 66, longitude: 10 },
    ascendant: 248.273148,
    midheaven: 222.231948,
    cusps: {
      "placidus": [
        248.273148,
        301.513454,
        15.731069,
        42.231948,
        55.173518,
        62.962233,
        68.273148,
        121.513454,
        195.731069,
        222.231948,
        235.173518,
        242.962233,
      ],
      "porphyry": [
        248.273148,
        299.592748,
        350.912348,
        42.231948,
        50.912348,
        59.592748,
        68.273148,
        119.592748,
        170.912348,
        222.231948,
        230.912348,
        239.592748,
      ],
      "equal": [
        248.273148,
        278.273148,
        308.273148,
        338.273148,
        8.273148,
        38.273148,
        68.273148,
        98.273148,
        128.273148,
        158.273148,
        188.273148,
        218.273148,
      ],
      "whole-sign": [240, 270, 300, 330, 0, 30, 60, 90, 120, 150, 180, 210],
    },
  },
  {
    id: "ARIES_BEFORE",
    location: { instant: new Date("2024-03-20T05:57:32Z"), latitude: 48.8566, longitude: 2.3522 },
    ascendant: 359.995455,
    midheaven: 269.998073,
    cusps: {
      "placidus": [
        359.995455,
        45.714791,
        70.795974,
        89.998073,
        109.199814,
        134.279552,
        179.995455,
        225.714791,
        250.795974,
        269.998073,
        289.199814,
        314.279552,
      ],
      "porphyry": [
        359.995455,
        29.996328,
        59.9972,
        89.998073,
        119.9972,
        149.996328,
        179.995455,
        209.996328,
        239.9972,
        269.998073,
        299.9972,
        329.996328,
      ],
      "equal": [
        359.995455,
        29.995455,
        59.995455,
        89.995455,
        119.995455,
        149.995455,
        179.995455,
        209.995455,
        239.995455,
        269.995455,
        299.995455,
        329.995455,
      ],
      "whole-sign": [330, 0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300],
    },
  },
  {
    id: "ARIES_AFTER",
    location: { instant: new Date("2024-03-20T05:57:33Z"), latitude: 48.8566, longitude: 2.3522 },
    ascendant: 0.004494,
    midheaven: 270.001906,
    cusps: {
      "placidus": [
        0.004494,
        45.720417,
        70.800163,
        90.001906,
        109.204003,
        134.285178,
        180.004494,
        225.720417,
        250.800163,
        270.001906,
        289.204003,
        314.285178,
      ],
      "porphyry": [
        0.004494,
        30.003632,
        60.002769,
        90.001906,
        120.002769,
        150.003632,
        180.004494,
        210.003632,
        240.002769,
        270.001906,
        300.002769,
        330.003632,
      ],
      "equal": [
        0.004494,
        30.004494,
        60.004494,
        90.004494,
        120.004494,
        150.004494,
        180.004494,
        210.004494,
        240.004494,
        270.004494,
        300.004494,
        330.004494,
      ],
      "whole-sign": [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
    },
  },
];

const ARCSECOND = 1 / 3600;
const ARCMINUTE = 1 / 60;
const PROFILE_IDS = ["P1", "P2", "P3", "P4", "P5"];
const POLAR_IDS = ["POLAR70N", "POLAR70N_B", "POLAR70S"];

function separation(a: number, b: number): number {
  const difference = Math.abs(a - b) % 360;
  return Math.min(difference, 360 - difference);
}

function assertClose(actual: number, expected: number, tolerance: number, label: string): void {
  const gap = separation(actual, expected);
  assert(
    gap <= tolerance,
    `${label} : ${actual} au lieu de ${expected} (écart ${(gap * 3600).toFixed(3)}″)`,
  );
}

function reference(id: string): ReferenceProfile {
  const profile = REFERENCES.find((candidate) => candidate.id === id);
  if (!profile) {
    throw new Error(`profil inconnu : ${id}`);
  }
  return profile;
}

Deno.test("ascendant et MC à moins de 1′ (mesuré < 1″) des références P1–P5", () => {
  for (const id of PROFILE_IDS) {
    const profile = reference(id);
    const angles = computeAngles(profile.location);

    assertClose(angles.ascendant, profile.ascendant, ARCMINUTE, `${id} ascendant`);
    assertClose(angles.midheaven, profile.midheaven, ARCMINUTE, `${id} MC`);
    assertClose(angles.ascendant, profile.ascendant, ARCSECOND, `${id} ascendant (1″)`);
    assertClose(angles.midheaven, profile.midheaven, ARCSECOND, `${id} MC (1″)`);
  }
});

Deno.test("cuspides des 4 systèmes à moins de 1″ des références, profils P1–P5 et cas limites", () => {
  for (const profile of REFERENCES) {
    for (const system of HOUSE_SYSTEMS) {
      const expected = profile.cusps[system] ?? profile.cusps.porphyry;
      assert(expected, `${profile.id} : référence Porphyre manquante`);
      const result = computeHouses(profile.location, system);

      assertEquals(result.cusps.length, 12);
      result.cusps.forEach((cusp, index) => {
        assertClose(
          cusp.longitude,
          expected[index],
          ARCSECOND,
          `${profile.id} ${system} maison ${index + 1}`,
        );
      });
    }
  }
});

// Astrotheme (https://www.astrotheme.com/astrology/Albert_Einstein, consulté le 2026-10-16) :
// ascendant 11°38′ Cancer, MC 12°50′ Poissons, valeurs publiées à la minute.
Deno.test("P3 (Einstein) concorde à la minute avec Astrotheme", () => {
  const result = computeHouses(reference("P3").location);

  assertEquals(result.ascendant.sign, "cancer");
  assertClose(result.ascendant.degreeInSign, 11 + 38 / 60, ARCMINUTE, "ascendant");
  assertEquals(result.midheaven.sign, "pisces");
  assertClose(result.midheaven.degreeInSign, 12 + 50 / 60, ARCMINUTE, "MC");
});

Deno.test("Placidus par défaut, sans repli aux latitudes habitées", () => {
  const result = computeHouses(reference("P1").location);

  assertEquals(result.requestedSystem, "placidus");
  assertEquals(result.system, "placidus");
  assertEquals(result.fallback, null);
  assertEquals(result.cusps[0], result.ascendant);
  assertEquals(result.cusps[9], result.midheaven);
});

Deno.test("Placidus reste défini juste sous le cercle polaire (66° N)", () => {
  const result = computeHouses(reference("CIRCLE66").location, "placidus");

  assertEquals(result.system, "placidus");
  assertEquals(result.fallback, null);
});

Deno.test("repli polaire : Placidus devient Porphyre au-delà du cercle polaire (70° N et 70° S)", () => {
  for (const id of POLAR_IDS) {
    const result = computeHouses(reference(id).location, "placidus");

    assertEquals(result.requestedSystem, "placidus");
    assertEquals(result.system, "porphyry");
    assertEquals(result.fallback, { from: "placidus", reason: "polar-latitude" });
    assertEquals(result.cusps, computeHouses(reference(id).location, "porphyry").cusps);
  }
});

Deno.test("les autres systèmes ne se replient pas aux latitudes polaires", () => {
  for (const system of ["porphyry", "equal", "whole-sign"] as const) {
    const result = computeHouses(reference("POLAR70N").location, system);

    assertEquals(result.system, system);
    assertEquals(result.fallback, null);
  }
});

Deno.test("ascendant de part et d'autre de 0° Bélier", () => {
  const before = computeHouses(reference("ARIES_BEFORE").location, "whole-sign");
  const after = computeHouses(reference("ARIES_AFTER").location, "whole-sign");

  assertEquals(before.ascendant.sign, "pisces");
  assertClose(before.ascendant.degreeInSign, 29.995455, ARCSECOND, "ascendant avant");
  assertEquals(before.cusps[0].longitude, 330);
  assertEquals(before.cusps[1].sign, "aries");
  assertEquals(after.ascendant.sign, "aries");
  assertClose(after.ascendant.degreeInSign, 0.004494, ARCSECOND, "ascendant après");
  assertEquals(after.cusps[0].longitude, 0);
});

// Étude #50 (docs/research/api-astrologiques.md) : P4 ascendant 17°27′ Verseau, MC 11°32′ Scorpion.
Deno.test("hémisphère sud (P4, Sydney) : ascendant Verseau, MC Scorpion", () => {
  const result = computeHouses(reference("P4").location);

  assertEquals(result.ascendant.sign, "aquarius");
  assertEquals(Math.floor(result.ascendant.degreeInSign * 60), 17 * 60 + 27);
  assertEquals(result.midheaven.sign, "scorpio");
  assertEquals(Math.floor(result.midheaven.degreeInSign * 60), 11 * 60 + 32);
});

Deno.test("les cuspides opposées sont à 180° pour chaque système", () => {
  for (const system of HOUSE_SYSTEMS) {
    const { cusps } = computeHouses(reference("P5").location, system);
    for (let index = 0; index < 6; index++) {
      assertClose(
        cusps[index + 6].longitude,
        cusps[index].longitude + 180,
        1e-9,
        `${system} ${index + 1}`,
      );
    }
  }
});

Deno.test("placidusCusps renvoie null quand un semi-arc n'existe pas (latitude polaire)", () => {
  const location = reference("POLAR70N").location;

  assertEquals(placidusCusps(computeAngles(location), location.latitude), null);
  assertEquals(isPlacidusDefined(location.latitude, computeAngles(location).obliquity), false);
});

Deno.test("refuse une latitude polaire exacte", () => {
  assertThrows(
    () => computeHouses({ instant: new Date("2000-01-01T00:00:00Z"), latitude: 90, longitude: 0 }),
    RangeError,
    "invalid_latitude",
  );
});
