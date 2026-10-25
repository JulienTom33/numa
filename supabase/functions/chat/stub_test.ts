import { assertEquals } from "jsr:@std/assert@1";
import { PROMPT_VERSION } from "./prompt.ts";
import { stubProvider } from "./stub.ts";

Deno.test("le fournisseur factice répond de façon déterministe et tracée", async () => {
  const answer = await stubProvider.answer({ question: "Que dit mon thème ?", factors: null });
  assertEquals(answer.provider, "stub");
  assertEquals(answer.model, "stub");
  assertEquals(answer.promptVersion, PROMPT_VERSION);
  assertEquals(answer.text.length > 0, true);
});
