import { assertEquals, assertThrows } from "jsr:@std/assert@1";
import { parseRequestedDate, weekOf } from "./week.ts";

Deno.test("a week runs from Monday to Sunday UTC", () => {
  assertEquals(weekOf(new Date("2026-10-27T10:00:00Z")), {
    start: "2026-10-26",
    end: "2026-11-01",
    label: "2026-W44",
  });
  assertEquals(weekOf(new Date("2026-10-26T00:00:00Z")).start, "2026-10-26");
  assertEquals(weekOf(new Date("2026-11-01T23:59:59Z")).start, "2026-10-26");
  assertEquals(weekOf(new Date("2026-11-02T00:00:00Z")).label, "2026-W45");
});

Deno.test("the ISO year can differ from the calendar year", () => {
  assertEquals(weekOf(new Date("2027-01-01T12:00:00Z")).label, "2026-W53");
  assertEquals(weekOf(new Date("2024-12-30T12:00:00Z")).label, "2025-W01");
});

Deno.test("accepts a nearby date and rejects malformed or distant ones", () => {
  const now = new Date("2026-10-27T10:00:00Z");

  assertEquals(parseRequestedDate(undefined, now), now);
  assertEquals(parseRequestedDate("2026-10-20", now).toISOString(), "2026-10-20T00:00:00.000Z");
  for (const date of ["27/10/2026", "2026-02-30", "2026-10-01", 5]) {
    assertThrows(() => parseRequestedDate(date, now));
  }
});
