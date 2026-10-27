import { assertEquals } from "jsr:@std/assert@1";
import type { ProviderSettings } from "../chat/config.ts";
import { buildWeeklyFactors } from "./context.ts";
import { createWeeklyChain } from "./provider.ts";
import { weekOf } from "./week.ts";

const factors = buildWeeklyFactors(weekOf(new Date("2026-10-27T10:00:00Z")), "leo", null);

const VALID_TEXT = [
  "[general]",
  "Une semaine qui peut inviter à la douceur dans votre quotidien.",
  "[relations]",
  "Le dialogue tend à être plus fluide avec vos proches.",
  "[work]",
  "Vous pouvez avancer pas à pas sur ce que vous avez en cours.",
  "[energy]",
  "Votre énergie peut rester stable pour le reste de la semaine.",
].join("\n");

const settings: ProviderSettings = {
  id: "one",
  baseUrl: "https://one.test/v1",
  model: "one-model",
  timeoutMs: 1000,
  enabled: true,
  apiKeyEnv: "ONE_KEY",
};

function completion(content: string): Response {
  return Response.json({ choices: [{ message: { content }, finish_reason: "stop" }] });
}

Deno.test("returns the parsed sections with the weekly prompt version", async () => {
  const chain = createWeeklyChain({
    providers: [settings],
    getApiKey: () => "key",
    fetchFn: () => Promise.resolve(completion(VALID_TEXT)),
  });

  const result = await chain.generate(factors);

  assertEquals(result?.provider, "one");
  assertEquals(result?.promptVersion, "sidera-horoscope-weekly-v1");
  assertEquals(Object.keys(result?.sections ?? {}), ["general", "relations", "work", "energy"]);
});

Deno.test("returns null when the provider fails or answers an invalid text", async () => {
  const failing = createWeeklyChain({
    providers: [settings],
    getApiKey: () => "key",
    fetchFn: () => Promise.resolve(new Response("", { status: 500 })),
  });
  const invalid = createWeeklyChain({
    providers: [settings],
    getApiKey: () => "key",
    fetchFn: () => Promise.resolve(completion("texte sans sections")),
  });
  const noKey = createWeeklyChain({
    providers: [settings],
    getApiKey: () => undefined,
    fetchFn: () => Promise.resolve(completion(VALID_TEXT)),
  });

  assertEquals(await failing.generate(factors), null);
  assertEquals(await invalid.generate(factors), null);
  assertEquals(await noKey.generate(factors), null);
});
