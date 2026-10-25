import { assertEquals, assertThrows } from "jsr:@std/assert@1";
import { DEFAULT_PROVIDERS, parseProviders } from "./config.ts";

Deno.test("the default chain is Mistral then Groq gpt-oss-120b", () => {
  assertEquals(DEFAULT_PROVIDERS.map((p) => [p.id, p.model, p.timeoutMs]), [
    ["mistral", "mistral-small-latest", 15000],
    ["groq", "openai/gpt-oss-120b", 10000],
  ]);
  assertEquals(parseProviders(undefined), DEFAULT_PROVIDERS);
});

Deno.test("parses a configured chain keeping its order", () => {
  const raw = JSON.stringify([
    {
      id: "a",
      baseUrl: "https://a.test/v1",
      model: "m",
      timeoutMs: 1000,
      enabled: true,
      apiKeyEnv: "A_KEY",
    },
    {
      id: "b",
      baseUrl: "https://b.test/v1",
      model: "n",
      timeoutMs: 2000,
      enabled: false,
      apiKeyEnv: "B_KEY",
      extraBody: { x: 1 },
    },
  ]);

  assertEquals(parseProviders(raw).map((p) => [p.id, p.enabled]), [["a", true], ["b", false]]);
});

Deno.test("rejects an invalid configuration", () => {
  for (const raw of ["[]", "{}", "[1]", '[{"id":"a"}]']) {
    assertThrows(() => parseProviders(raw), Error, "ai_providers_invalid");
  }
  const insecure = JSON.stringify([{
    id: "a",
    baseUrl: "http://a.test",
    model: "m",
    timeoutMs: 1,
    enabled: true,
    apiKeyEnv: "K",
  }]);
  assertThrows(() => parseProviders(insecure), Error, "ai_providers_invalid");
});
