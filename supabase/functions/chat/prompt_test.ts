import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { extractFactors } from "./factors.ts";
import {
  buildMessages,
  HISTORY_MESSAGE_LIMIT,
  MAX_OUTPUT_TOKENS,
  PROMPT_VERSION,
} from "./prompt.ts";
import { chartFixture } from "./test_helpers.ts";

Deno.test("the prompt is versioned", () => {
  assertEquals(PROMPT_VERSION, "sidera-chat-v4");
});

Deno.test("the system prompt carries the editorial rules", () => {
  const [system] = buildMessages("Q", null);

  assertEquals(system.role, "system");
  for (
    const rule of [
      "N'invente aucune",
      "vous êtes",
      "Porphyre",
      "renvoie vers un professionnel",
      "vouvoyant",
      "90 à 150 mots",
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

Deno.test("the prompt forbids imposed greetings and technical jargon", () => {
  const [system] = buildMessages("Q", null);

  assertStringIncludes(system.content, "aucune salutation ni présentation");
  assertStringIncludes(system.content, "ni numéros de maisons");
  assertEquals(MAX_OUTPUT_TOKENS >= 1024, true);
});

Deno.test("history precedes the new question and is limited to the last messages", () => {
  const history = Array.from({ length: 10 }, (_, index) => ({
    role: index % 2 === 0 ? "user" as const : "assistant" as const,
    content: `message ${index}`,
  }));
  const messages = buildMessages("Nouvelle", null, history);

  assertEquals(messages.length, 2 + HISTORY_MESSAGE_LIMIT);
  assertEquals(messages.map((message) => message.role), [
    "system",
    "user",
    "assistant",
    "user",
    "assistant",
    "user",
    "assistant",
    "user",
  ]);
  assertEquals(messages[1].content, "message 4");
  assertStringIncludes(messages[messages.length - 1].content, "Nouvelle");
});
