import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import { HttpError } from "../_shared/http.ts";
import type { ProviderSettings } from "../chat/config.ts";
import { chartFixture } from "../chat/test_helpers.ts";
import { buildFactors } from "./context.ts";
import { createHoroscopeChain } from "./provider.ts";

const factors = buildFactors(chartFixture(), "2026-10-27", new Date("2026-10-27T10:00:00Z"));

const VALID_TEXT = [
  "[general]",
  "Une journée qui peut inviter à la douceur dans votre quotidien.",
  "[relations]",
  "Le dialogue tend à être plus fluide avec vos proches.",
  "[work]",
  "Vous pouvez avancer pas à pas sur ce que vous avez en cours.",
  "[energy]",
  "Votre énergie peut rester stable pour le reste de la journée.",
].join("\n");

function settings(id: string): ProviderSettings {
  return {
    id,
    baseUrl: `https://${id}.test/v1`,
    model: `${id}-model`,
    timeoutMs: 1000,
    enabled: true,
    apiKeyEnv: `${id.toUpperCase()}_KEY`,
  };
}

function completion(content: string): Response {
  return Response.json({ choices: [{ message: { content }, finish_reason: "stop" }] });
}

function fetchWith(answers: Record<string, () => Response>, calls: string[]): typeof fetch {
  return (input) => {
    const url = String(input);
    calls.push(url);
    const host = new URL(url).host;
    return Promise.resolve(answers[host]?.() ?? new Response("", { status: 500 }));
  };
}

const getApiKey = () => "key";

Deno.test("returns the parsed sections of the first provider that answers", async () => {
  const calls: string[] = [];
  const chain = createHoroscopeChain({
    providers: [settings("one"), settings("two")],
    getApiKey,
    fetchFn: fetchWith({ "one.test": () => completion(VALID_TEXT) }, calls),
  });

  const generated = await chain.generate(factors);

  assertEquals(generated.provider, "one");
  assertEquals(generated.promptVersion, "sidera-horoscope-v1");
  assertEquals(generated.sections.work.startsWith("Vous pouvez"), true);
  assertEquals(calls.length, 1);
});

Deno.test("falls back when a provider fails or returns an unusable text", async () => {
  const chain = createHoroscopeChain({
    providers: [settings("one"), settings("two"), settings("three")],
    getApiKey,
    fetchFn: fetchWith({
      "one.test": () => completion("Texte sans repères de sections pour vous et pour les autres."),
      "three.test": () => completion(VALID_TEXT),
    }, []),
  });

  assertEquals((await chain.generate(factors)).provider, "three");
});

Deno.test("skips disabled providers and providers without a key, then answers 503", async () => {
  const calls: string[] = [];
  const chain = createHoroscopeChain({
    providers: [{ ...settings("one"), enabled: false }, settings("two")],
    getApiKey: (name) => (name === "ONE_KEY" ? "key" : undefined),
    fetchFn: fetchWith({}, calls),
  });

  const error = await assertRejects(() => chain.generate(factors), HttpError);

  assertEquals([error.status, error.code], [503, "ai_unavailable"]);
  assertEquals(calls, []);
});
