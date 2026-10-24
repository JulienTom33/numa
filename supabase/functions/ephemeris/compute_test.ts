import { assert, assertEquals } from "jsr:@std/assert@1";
import { computeEphemeris, computeMoonPhase } from "./compute.ts";
import { parseRange } from "./range.ts";
import { computeBody } from "../natal-chart/bodies.ts";
import { BODY_IDS, type BodyId } from "../../../shared/contracts/natalChart/natalChart.ts";

// Source : JPL Horizons (https://ssd.jpl.nasa.gov/api/horizons.api), geocentre 500@399,
// QUANTITIES=31 (longitude ecliptique apparente de la date), consulte le 2026-10-24.
const CONTROL: Readonly<Record<string, Readonly<Record<BodyId, number>>>> = {
  "2000-01-01T12:00:00Z": {
    sun: 280.3689092,
    moon: 223.323786,
    mercury: 271.8892699,
    venus: 241.5657794,
    mars: 327.9632921,
    jupiter: 25.2530685,
    saturn: 40.3956366,
    uranus: 314.809168,
    neptune: 303.1930007,
    pluto: 251.4547644,
  },
  "2024-01-01T00:00:00Z": {
    sun: 280.0389812,
    moon: 155.9921866,
    mercury: 262.2816922,
    venus: 242.6122975,
    mars: 267.3083422,
    jupiter: 35.5823812,
    saturn: 333.243533,
    uranus: 49.3839119,
    neptune: 355.0761521,
    pluto: 299.3576621,
  },
  "2025-01-01T00:00:00Z": {
    sun: 280.8136,
    moon: 293.9135958,
    mercury: 259.8699677,
    venus: 327.7120986,
    mars: 121.9179094,
    jupiter: 73.2154465,
    saturn: 344.5240525,
    uranus: 53.6358245,
    neptune: 357.297808,
    pluto: 301.0647764,
  },
  "2050-01-01T00:00:00Z": {
    sun: 280.7483824,
    moon: 18.675597,
    mercury: 270.0594885,
    venus: 281.248038,
    mars: 227.7146938,
    jupiter: 121.6915484,
    saturn: 297.5742802,
    uranus: 170.7326103,
    neptune: 53.6034213,
    pluto: 337.5330677,
  },
};

const ARC_MINUTE = 1 / 60;

function angularGap(a: number, b: number): number {
  const gap = Math.abs(a - b) % 360;
  return Math.min(gap, 360 - gap);
}

Deno.test("positions Soleil a Pluton a 1 minute d arc de JPL Horizons", () => {
  for (const [iso, expected] of Object.entries(CONTROL)) {
    for (const id of BODY_IDS) {
      const gap = angularGap(computeBody(id, new Date(iso)).longitude, expected[id]);
      assert(gap <= ARC_MINUTE, `${id} ${iso} : ecart ${(gap * 60).toFixed(3)} minute d arc`);
    }
  }
});

Deno.test("phase de la Lune : nouvelle lune du 2024-04-08 18:21 UTC", () => {
  const phase = computeMoonPhase(new Date("2024-04-08T18:22:00Z"));
  assertEquals(phase.name, "new_moon");
  assert(phase.illumination < 0.001);
  assert(phase.age < 0.01);
});

Deno.test("phase de la Lune : pleine lune du 2024-04-23 23:49 UTC", () => {
  const phase = computeMoonPhase(new Date("2024-04-23T23:49:00Z"));
  assertEquals(phase.name, "full_moon");
  assert(phase.illumination > 0.999);
  assert(Math.abs(phase.age - 15.2) < 0.5);
});

Deno.test("phase de la Lune : premier quartier et dernier quartier", () => {
  assertEquals(computeMoonPhase(new Date("2024-04-15T19:13:00Z")).name, "first_quarter");
  assertEquals(computeMoonPhase(new Date("2024-04-02T03:15:00Z")).name, "last_quarter");
});

Deno.test("l ephemeride d un jour contient dix corps, la Lune et des aspects tries par orbe", () => {
  const result = computeEphemeris(parseRange(new URLSearchParams({ date: "2024-04-08" })));

  assertEquals(result.schemaVersion, 1);
  assertEquals(result.engine, { name: "astronomy-engine", version: "2.1.19" });
  assertEquals(result.range, { from: "2024-04-08", to: "2024-04-08", days: 1 });
  assertEquals(result.days.length, 1);
  assertEquals(result.days[0].instant, "2024-04-08T12:00:00.000Z");
  assertEquals(result.days[0].bodies.map((body) => body.body), [...BODY_IDS]);
  const orbs = result.days[0].aspects.map((aspect) => aspect.orb);
  assertEquals(orbs, [...orbs].sort((a, b) => a - b));
});

Deno.test("la reponse est deterministe pour une meme entree", () => {
  const range = parseRange(new URLSearchParams({ from: "2024-04-01", to: "2024-04-07" }));
  assertEquals(JSON.stringify(computeEphemeris(range)), JSON.stringify(computeEphemeris(range)));
});
