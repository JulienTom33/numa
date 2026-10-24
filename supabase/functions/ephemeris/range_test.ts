import { assertEquals, assertThrows } from "jsr:@std/assert@1";
import { HttpError } from "../_shared/http.ts";
import { parseRange } from "./range.ts";

function codeOf(query: string): string {
  const error = assertThrows(() => parseRange(new URLSearchParams(query)), HttpError);
  assertEquals(error.status, 400);
  return error.code;
}

Deno.test("un jour donne par date", () => {
  const range = parseRange(new URLSearchParams("date=2024-02-29"));
  assertEquals([range.from, range.to, range.days], ["2024-02-29", "2024-02-29", 1]);
  assertEquals(range.start.toISOString(), "2024-02-29T00:00:00.000Z");
  assertEquals(range.end.toISOString(), "2024-03-01T00:00:00.000Z");
});

Deno.test("31 jours sont acceptes, 32 refuses", () => {
  assertEquals(parseRange(new URLSearchParams("from=2024-01-01&to=2024-01-31")).days, 31);
  assertEquals(codeOf("from=2024-01-01&to=2024-02-01"), "range_too_long");
});

Deno.test("dates invalides", () => {
  assertEquals(codeOf(""), "invalid_date");
  assertEquals(codeOf("date=2024-02-30"), "invalid_date");
  assertEquals(codeOf("date=2023-02-29"), "invalid_date");
  assertEquals(codeOf("date=24-01-01"), "invalid_date");
  assertEquals(codeOf("date=2024-01-01T10:00:00Z"), "invalid_date");
  assertEquals(codeOf("from=abc&to=2024-01-01"), "invalid_date");
});

Deno.test("plages invalides", () => {
  assertEquals(codeOf("from=2024-01-10&to=2024-01-01"), "invalid_range");
  assertEquals(codeOf("from=2024-01-10"), "invalid_range");
  assertEquals(codeOf("to=2024-01-10"), "invalid_range");
  assertEquals(codeOf("date=2024-01-10&to=2024-01-12"), "invalid_range");
});
