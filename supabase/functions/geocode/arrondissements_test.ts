import { assertEquals } from "jsr:@std/assert@1";
import { arrondissementsFor } from "./arrondissements.ts";

Deno.test("arrondissementsFor returns the municipal arrondissements of Paris, Lyon and Marseille", () => {
  assertEquals(arrondissementsFor("2988507")?.length, 20);
  assertEquals(arrondissementsFor("2996944")?.length, 9);
  assertEquals(arrondissementsFor("2995469")?.length, 16);
});

Deno.test("arrondissementsFor numbers arrondissements from 1 and keeps coordinates in range", () => {
  for (const id of ["2988507", "2996944", "2995469"]) {
    const list = arrondissementsFor(id) ?? [];
    assertEquals(list.map((item) => item.number), list.map((_, index) => index + 1));
    for (const { latitude, longitude } of list) {
      assertEquals(latitude > 43 && latitude < 49, true);
      assertEquals(longitude > 2 && longitude < 6, true);
    }
  }
});

Deno.test("arrondissementsFor returns null for other places", () => {
  assertEquals(arrondissementsFor("4717560"), null);
});
