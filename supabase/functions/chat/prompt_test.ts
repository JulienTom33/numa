import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { extractFactors } from "./factors.ts";
import { buildMessages, PROMPT_VERSION } from "./prompt.ts";
import { chartFixture } from "./test_helpers.ts";

Deno.test("the prompt is versioned", () => {
  assertEquals(PROMPT_VERSION, "sidera-chat-v3");
});

Deno.test("the system prompt carries the editorial rules", () => {
  const [system] = buildMessages("Q", null);

  assertEquals(system.role, "system");
  for (
    const rule of [
      "N'invente aucune",
      "vous êtes",
      "polar_fallback",
      "renvoie vers un professionnel",
      "vouvoyant",
      "120 à 200 mots",
    ]
  ) {
    assertStringIncludes(system.content, rule);
  }
});

Deno.test("the question stays in the user message, after the factors", () => {
  const factors = extractFactors(chartFixture());
  const [system, user] = buildMessages("Ma question", factors);

  assertEquals(system.content.includes("Ma question"), false);
  assertStringIncludes(user.content, JSON.stringify(factors));
  assertEquals(user.content.endsWith("Ma question"), true);
  assertEquals(user.content.includes("1975"), false);
});

Deno.test("without a chart the prompt asks the model not to invent factors", () => {
  const [, user] = buildMessages("Q", null);

  assertStringIncludes(user.content, "Aucun thème natal");
});
