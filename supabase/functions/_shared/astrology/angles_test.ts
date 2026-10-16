import { assertAlmostEquals, assertThrows } from "jsr:@std/assert@1";
import {
  ascendantFromSiderealTime,
  computeAngles,
  localSiderealTimeDegrees,
  midheavenFromSiderealTime,
  trueObliquity,
} from "./angles.ts";

const OBLIQUITY = 23.44;

Deno.test("MC et ascendant aux points cardinaux du temps sidéral", () => {
  assertAlmostEquals(midheavenFromSiderealTime(0, OBLIQUITY), 0, 1e-9);
  assertAlmostEquals(midheavenFromSiderealTime(90, OBLIQUITY), 90, 1e-9);
  assertAlmostEquals(midheavenFromSiderealTime(180, OBLIQUITY), 180, 1e-9);
  assertAlmostEquals(midheavenFromSiderealTime(270, OBLIQUITY), 270, 1e-9);
  // RAMC = 0 : le point vernal culmine, l'ascendant est le Cancer à l'équateur (90°).
  assertAlmostEquals(ascendantFromSiderealTime(0, OBLIQUITY, 0), 90, 1e-9);
  // RAMC = 270 : 0° Bélier se lève, quelle que soit la latitude.
  assertAlmostEquals(ascendantFromSiderealTime(270, OBLIQUITY, 48), 0, 1e-9);
  assertAlmostEquals(ascendantFromSiderealTime(270, OBLIQUITY, -33), 0, 1e-9);
});

Deno.test("à l'équateur, RAMC = 90° et 180° placent l'ascendant à 180° et 270°", () => {
  assertAlmostEquals(ascendantFromSiderealTime(180, OBLIQUITY, 0), 270, 1e-9);
  assertAlmostEquals(ascendantFromSiderealTime(90, OBLIQUITY, 0), 180, 1e-9);
});

Deno.test("temps sidéral local = temps sidéral de Greenwich + longitude est", () => {
  const instant = new Date("2000-01-01T12:00:00Z");
  const greenwich = localSiderealTimeDegrees(instant, 0);

  // Temps sidéral moyen de Greenwich à J2000.0 : 280,46061837° (Meeus, éq. 12.4) ;
  // l'apparent en diffère de l'équation des équinoxes (< 1,2″ de temps, soit < 18″ d'arc).
  assertAlmostEquals(greenwich, 280.46061837, 0.005);
  assertAlmostEquals(localSiderealTimeDegrees(instant, 30), greenwich + 30, 1e-9);
  assertAlmostEquals(localSiderealTimeDegrees(instant, -100), greenwich - 100, 1e-9);
});

Deno.test("obliquité vraie proche de l'obliquité moyenne IAU à J2000 (23°26′21,4″)", () => {
  assertAlmostEquals(trueObliquity(new Date("2000-01-01T12:00:00Z")), 23.4392911, 0.003);
});

Deno.test("computeAngles valide l'instant et les coordonnées", () => {
  const instant = new Date("2000-01-01T00:00:00Z");
  assertThrows(
    () => computeAngles({ instant: new Date("invalide"), latitude: 0, longitude: 0 }),
    RangeError,
    "invalid_instant",
  );
  assertThrows(
    () => computeAngles({ instant, latitude: -90, longitude: 0 }),
    RangeError,
    "invalid_latitude",
  );
  assertThrows(
    () => computeAngles({ instant, latitude: Number.NaN, longitude: 0 }),
    RangeError,
    "invalid_latitude",
  );
  assertThrows(
    () => computeAngles({ instant, latitude: 0, longitude: 180.5 }),
    RangeError,
    "invalid_longitude",
  );
});
