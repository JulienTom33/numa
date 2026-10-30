import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import { HttpError } from "../_shared/http.ts";
import { BREAKER_COOLDOWN_MS, createChainProvider } from "./chain.ts";
import { DEFAULT_PROVIDERS, type ProviderSettings } from "./config.ts";

const GOOD_TEXT =
  "Votre Soleil en Cancer vous invite à prendre soin de vos proches. Cela dépend de vous.";

function completion(content: string, finishReason = "stop"): Response {
  return Response.json({ choices: [{ message: { content }, finish_reason: finishReason }] });
}

interface Harness {
  calls: string[];
  clock: { value: number };
  sleeps: number[];
  provider: ReturnType<typeof createChainProvider>;
}

function harness(
  handlers: Record<string, (call: number) => Response | Promise<Response>>,
  providers: ProviderSettings[] = DEFAULT_PROVIDERS,
  keys: Record<string, string> = { GEMINI_API_KEY: "mk", GROQ_API_KEY: "gk" },
): Harness {
  const calls: string[] = [];
  const counts = new Map<string, number>();
  const clock = { value: 0 };
  const sleeps: number[] = [];
  const provider = createChainProvider({
    providers,
    getApiKey: (name) => keys[name],
    now: () => clock.value,
    sleep: (ms) => {
      sleeps.push(ms);
      return Promise.resolve();
    },
    fetchFn: (input) => {
      const url = String(input);
      const host = new URL(url).host;
      calls.push(host);
      const count = (counts.get(host) ?? 0) + 1;
      counts.set(host, count);
      return Promise.resolve(handlers[host](count));
    },
  });
  return { calls, clock, sleeps, provider };
}

const request = { question: "Que dit mon Soleil ?", factors: null };

Deno.test("the primary provider answers and the fallback is not called", async () => {
  const { calls, provider } = harness({
    "generativelanguage.googleapis.com": () => completion(GOOD_TEXT),
    "api.groq.com": () => completion(GOOD_TEXT),
  });

  const answer = await provider.answer(request);

  assertEquals(answer, {
    text: GOOD_TEXT,
    provider: "gemini",
    model: "gemini-3.1-flash-lite",
    promptVersion: "sidera-chat-v3",
  });
  assertEquals(calls, ["generativelanguage.googleapis.com"]);
});

Deno.test("falls back to Groq on a server error from the primary", async () => {
  const { calls, provider } = harness({
    "generativelanguage.googleapis.com": () => new Response("boom", { status: 503 }),
    "api.groq.com": () => completion(GOOD_TEXT),
  });

  const answer = await provider.answer(request);

  assertEquals([answer.provider, answer.model], ["groq", "openai/gpt-oss-120b"]);
  assertEquals(calls, ["generativelanguage.googleapis.com", "api.groq.com"]);
});

Deno.test("retries once after a short retry-after, then answers", async () => {
  const { calls, sleeps, provider } = harness({
    "generativelanguage.googleapis.com": (call) =>
      call === 1
        ? new Response("slow down", { status: 429, headers: { "retry-after": "1" } })
        : completion(GOOD_TEXT),
    "api.groq.com": () => completion(GOOD_TEXT),
  });

  const answer = await provider.answer(request);

  assertEquals(answer.provider, "gemini");
  assertEquals(calls, ["generativelanguage.googleapis.com", "generativelanguage.googleapis.com"]);
  assertEquals(sleeps, [1000]);
});

Deno.test("switches immediately on a long retry-after", async () => {
  const { calls, sleeps, provider } = harness({
    "generativelanguage.googleapis.com": () =>
      new Response("slow down", { status: 429, headers: { "retry-after": "30" } }),
    "api.groq.com": () => completion(GOOD_TEXT),
  });

  assertEquals((await provider.answer(request)).provider, "groq");
  assertEquals(calls, ["generativelanguage.googleapis.com", "api.groq.com"]);
  assertEquals(sleeps, []);
});

Deno.test("a 429 without retry-after opens the breaker for the cooldown", async () => {
  const { calls, clock, provider } = harness({
    "generativelanguage.googleapis.com": () => new Response("slow down", { status: 429 }),
    "api.groq.com": () => completion(GOOD_TEXT),
  });

  await provider.answer(request);
  await provider.answer(request);
  assertEquals(calls, ["generativelanguage.googleapis.com", "api.groq.com", "api.groq.com"]);

  clock.value = BREAKER_COOLDOWN_MS + 1;
  await provider.answer(request);
  assertEquals(calls.slice(3), ["generativelanguage.googleapis.com", "api.groq.com"]);
});

Deno.test("an invalid or non-French answer counts as a failure", async () => {
  const { provider } = harness({
    "generativelanguage.googleapis.com": () => completion("   "),
    "api.groq.com": () => completion("Your sun sign suggests a calm and thoughtful nature."),
  });

  const error = await assertRejects(() => provider.answer(request), HttpError);
  assertEquals([error.status, error.code], [503, "ai_unavailable"]);
});

Deno.test("a timeout moves on to the next provider", async () => {
  const { provider } = harness({
    "generativelanguage.googleapis.com": () => {
      throw new DOMException("timeout", "TimeoutError");
    },
    "api.groq.com": () => completion(GOOD_TEXT),
  });

  assertEquals((await provider.answer(request)).provider, "groq");
});

Deno.test("fails with ai_unavailable when the whole chain fails", async () => {
  const { provider } = harness({
    "generativelanguage.googleapis.com": () => new Response("boom", { status: 500 }),
    "api.groq.com": () => new Response("boom", { status: 500 }),
  });

  const error = await assertRejects(() => provider.answer(request), HttpError);
  assertEquals([error.status, error.code], [503, "ai_unavailable"]);
});

Deno.test("skips disabled providers and providers without a key", async () => {
  const providers = DEFAULT_PROVIDERS.map((settings) =>
    settings.id === "gemini" ? { ...settings, enabled: false } : settings
  );
  const { calls, provider } = harness({
    "generativelanguage.googleapis.com": () => completion(GOOD_TEXT),
    "api.groq.com": () => completion(GOOD_TEXT),
  }, providers);
  assertEquals((await provider.answer(request)).provider, "groq");
  assertEquals(calls, ["api.groq.com"]);

  const noKeys = harness({}, DEFAULT_PROVIDERS, {});
  await assertRejects(() => noKeys.provider.answer(request), HttpError);
});

Deno.test("a provider added by configuration joins the chain without code", async () => {
  const providers: ProviderSettings[] = [
    ...DEFAULT_PROVIDERS.map((settings) => ({ ...settings, enabled: false })),
    {
      id: "extra",
      baseUrl: "https://llm.example.test/v1",
      model: "extra-1",
      timeoutMs: 5000,
      enabled: true,
      apiKeyEnv: "EXTRA_KEY",
    },
  ];
  const { provider } = harness(
    { "llm.example.test": () => completion(GOOD_TEXT) },
    providers,
    { EXTRA_KEY: "xk" },
  );

  assertEquals((await provider.answer(request)).model, "extra-1");
});
