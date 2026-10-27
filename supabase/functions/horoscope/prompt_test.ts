import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { chartFixture } from "../chat/test_helpers.ts";
import { buildFactors } from "./context.ts";
import { buildMessages, HOROSCOPE_PROMPT_VERSION } from "./prompt.ts";

Deno.test("the prompt separates the rules from the structured factors", () => {
  const factors = buildFactors(chartFixture(), "2026-10-27", new Date("2026-10-27T10:00:00Z"));
  const [system, user] = buildMessages(factors);

  assertEquals(system.role, "system");
  assertStringIncludes(system.content, "[general], [relations], [work], [energy]");
  assertStringIncludes(system.content, "tendances et des possibilités");
  assertEquals(user.role, "user");
  assertStringIncludes(user.content, "Date du jour : 2026-10-27");
  assertStringIncludes(user.content, JSON.stringify(factors));
  assertEquals(HOROSCOPE_PROMPT_VERSION, "sidera-horoscope-v1");
});
