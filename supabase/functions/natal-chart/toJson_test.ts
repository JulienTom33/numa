import { assertEquals, assertThrows } from "jsr:@std/assert@1";
import { computeNatalChart } from "./compute.ts";
import { toJson } from "./toJson.ts";

Deno.test("toJson conserve les primitives, tableaux et objets imbriqués", () => {
  assertEquals(toJson({ a: [1, "x", true, null], b: { c: 2 } }), {
    a: [1, "x", true, null],
    b: { c: 2 },
  });
});

Deno.test("toJson ignore les propriétés undefined", () => {
  assertEquals(toJson({ a: 1, b: undefined }), { a: 1 });
});

Deno.test("toJson rejette les valeurs non sérialisables", () => {
  assertThrows(() => toJson({ a: () => 1 }), Error, "value_not_serializable");
  assertThrows(() => toJson(undefined), Error, "value_not_serializable");
});

Deno.test("toJson reproduit à l'identique un thème natal sérialisé", () => {
  const chart = computeNatalChart({
    birthDate: "1990-06-15",
    birthTime: "14:30:00",
    timePrecision: "exact",
    timeMargin: null,
    timezone: "Europe/Paris",
    latitude: 48.8566,
    longitude: 2.3522,
  });
  assertEquals(toJson(chart), JSON.parse(JSON.stringify(chart)));
});
