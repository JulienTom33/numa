import { assertEquals } from "jsr:@std/assert@1";
import { angularSeparation, ASPECT_DEFINITIONS, findAspects } from "./aspects.ts";

Deno.test("separation angulaire : plus court arc, a travers 0 degre", () => {
  assertEquals(angularSeparation(350, 10), 20);
  assertEquals(angularSeparation(10, 350), 20);
  assertEquals(angularSeparation(0, 180), 180);
});

Deno.test("orbes documentes des cinq aspects majeurs", () => {
  assertEquals(
    Object.fromEntries(Object.entries(ASPECT_DEFINITIONS).map(([type, d]) => [type, d.maxOrb])),
    { conjunction: 8, sextile: 5, square: 7, trine: 8, opposition: 8 },
  );
});

Deno.test("aspects detectes dans l'orbe et tries par orbe croissant", () => {
  const aspects = findAspects([
    { body: "sun", longitude: 0 },
    { body: "moon", longitude: 62 },
    { body: "mars", longitude: 119 },
    { body: "venus", longitude: 100 },
  ]);
  assertEquals(
    aspects.map((a) => [a.bodyA, a.bodyB, a.type, a.orb]),
    [
      ["sun", "mars", "trine", 1],
      ["sun", "moon", "sextile", 2],
      ["moon", "mars", "sextile", 3],
    ],
  );
});

Deno.test("hors orbe : aucun aspect", () => {
  assertEquals(findAspects([{ body: "sun", longitude: 0 }, { body: "moon", longitude: 20 }]), []);
});

Deno.test("sextile limite a 5 degres, carre a 7, opposition a 8", () => {
  const types = (gap: number) =>
    findAspects([{ body: "sun", longitude: 0 }, { body: "moon", longitude: gap }]).map((a) =>
      a.type
    );
  assertEquals(types(65), ["sextile"]);
  assertEquals(types(65.5), []);
  assertEquals(types(97), ["square"]);
  assertEquals(types(188), ["opposition"]);
  assertEquals(types(188.5), []);
});
