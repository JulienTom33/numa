import { assertEquals } from "jsr:@std/assert@1";
import { isRecord } from "./guards.ts";

Deno.test("isRecord accepts plain objects only", () => {
  assertEquals(isRecord({ a: 1 }), true);
  assertEquals(isRecord({}), true);
  assertEquals([null, undefined, [], "x", 3].map(isRecord), [false, false, false, false, false]);
});
