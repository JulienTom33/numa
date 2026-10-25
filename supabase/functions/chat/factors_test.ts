import { assertEquals } from "jsr:@std/assert@1";
import { extractFactors, MAX_ASPECTS } from "./factors.ts";
import { chartFixture } from "./test_helpers.ts";

Deno.test("extractFactors keeps only astrological factors, rounded", () => {
  const factors = extractFactors(chartFixture());

  assertEquals(factors.bodies[0], {
    body: "sun",
    sign: "cancer",
    degreeInSign: 24.5,
    retrograde: false,
    house: 5,
  });
  assertEquals(factors.ascendant, { sign: "aries", degreeInSign: 10 });
  assertEquals(factors.midheaven, { sign: "capricorn", degreeInSign: 10.1 });
  assertEquals(factors.houseSystem, "placidus");
  assertEquals(Object.keys(factors).sort(), [
    "ascendant",
    "aspects",
    "bodies",
    "confidence",
    "houseSystem",
    "midheaven",
    "warnings",
  ]);
});

Deno.test("extractFactors limits aspects and handles an unknown birth time", () => {
  const factors = extractFactors(chartFixture(false));

  assertEquals(factors.aspects.length, MAX_ASPECTS);
  assertEquals(factors.ascendant, null);
  assertEquals(factors.houseSystem, null);
  assertEquals(factors.warnings, ["unknown_time"]);
});
