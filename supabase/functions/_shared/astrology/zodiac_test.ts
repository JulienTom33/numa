import { assertAlmostEquals, assertEquals } from "jsr:@std/assert@1";
import { normalizeDegrees, toEclipticPosition, ZODIAC_SIGNS } from "./zodiac.ts";

Deno.test("normalizeDegrees ramène tout angle dans [0, 360)", () => {
  assertEquals(normalizeDegrees(0), 0);
  assertEquals(normalizeDegrees(360), 0);
  assertEquals(normalizeDegrees(725), 5);
  assertEquals(normalizeDegrees(-30), 330);
  assertEquals(normalizeDegrees(-720), 0);
  assertEquals(normalizeDegrees(-1e-15) < 360, true);
});

Deno.test("toEclipticPosition donne le signe et le degré dans le signe", () => {
  assertEquals(toEclipticPosition(0), { longitude: 0, sign: "aries", degreeInSign: 0 });
  assertEquals(toEclipticPosition(359.5).sign, "pisces");
  assertAlmostEquals(toEclipticPosition(359.5).degreeInSign, 29.5);
  assertEquals(toEclipticPosition(-1).sign, "pisces");
  assertAlmostEquals(toEclipticPosition(193.146863).degreeInSign, 13.146863);
  assertEquals(toEclipticPosition(193.146863).sign, "libra");
});

Deno.test("chaque signe couvre 30°, du Bélier aux Poissons", () => {
  ZODIAC_SIGNS.forEach((sign, index) => {
    assertEquals(toEclipticPosition(index * 30 + 15).sign, sign);
  });
  assertEquals(ZODIAC_SIGNS.length, 12);
});
