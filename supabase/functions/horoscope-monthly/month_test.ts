import { assertEquals, assertThrows } from "jsr:@std/assert@1";
import { monthOf, parseRequestedDate } from "./month.ts";

Deno.test("a month runs from the first to the last day UTC", () => {
  assertEquals(monthOf(new Date("2026-10-27T10:00:00Z")), {
    start: "2026-10-01",
    end: "2026-10-31",
    label: "2026-10",
  });
  assertEquals(monthOf(new Date("2026-11-30T23:59:59Z")).end, "2026-11-30");
  assertEquals(monthOf(new Date("2028-02-10T00:00:00Z")).end, "2028-02-29");
  assertEquals(monthOf(new Date("2026-12-31T12:00:00Z")).label, "2026-12");
});

Deno.test("accepts a nearby date and rejects malformed or distant ones", () => {
  const now = new Date("2026-10-27T10:00:00Z");

  assertEquals(parseRequestedDate(undefined, now), now);
  assertEquals(parseRequestedDate("2026-11-20", now).toISOString(), "2026-11-20T00:00:00.000Z");
  for (const date of ["27/10/2026", "2026-02-30", "2026-01-01", "2027-01-01", 5]) {
    assertThrows(() => parseRequestedDate(date, now));
  }
});
