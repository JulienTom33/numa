import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import { DEFAULT_PROVIDERS } from "./config.ts";
import { ProviderFailure, requestCompletion } from "./completion.ts";
import { buildMessages, MAX_OUTPUT_TOKENS } from "./prompt.ts";

const settings = DEFAULT_PROVIDERS[1];
const messages = buildMessages("Q", null);

Deno.test("sends an OpenAI-compatible request with the key, model and token cap", async () => {
  let seen: { url: string; headers: Headers; body: Record<string, unknown> } | null = null;
  const fetchFn: typeof fetch = (input, init) => {
    seen = {
      url: String(input),
      headers: new Headers(init?.headers),
      body: JSON.parse(String(init?.body)),
    };
    return Promise.resolve(
      Response.json({ choices: [{ message: { content: "ok" }, finish_reason: "length" }] }),
    );
  };

  const result = await requestCompletion(fetchFn, settings, "secret", messages);

  assertEquals(result, { text: "ok", truncated: true });
  assertEquals(seen!.url, "https://api.groq.com/openai/v1/chat/completions");
  assertEquals(seen!.headers.get("authorization"), "Bearer secret");
  assertEquals(seen!.body.model, "openai/gpt-oss-120b");
  assertEquals(seen!.body.max_tokens, MAX_OUTPUT_TOKENS);
  assertEquals(seen!.body.reasoning_effort, "low");
  assertEquals(seen!.body.messages, messages);
});

Deno.test("maps HTTP statuses and malformed bodies to failures", async () => {
  const cases: [Response, string, number | null][] = [
    [new Response("", { status: 429, headers: { "retry-after": "1" } }), "rate_limited", 1000],
    [new Response("", { status: 429 }), "rate_limited", null],
    [new Response("", { status: 500 }), "http_error", null],
    [Response.json({ choices: [] }), "invalid_response", null],
    [Response.json({ choices: [{ message: { content: 3 } }] }), "invalid_response", null],
    [new Response("not json"), "invalid_response", null],
  ];
  for (const [response, kind, retryAfterMs] of cases) {
    const error = await assertRejects(
      () => requestCompletion(() => Promise.resolve(response), settings, "k", messages),
      ProviderFailure,
    );
    assertEquals([error.kind, error.retryAfterMs], [kind, retryAfterMs]);
  }
});

Deno.test("maps a network error and a timeout", async () => {
  const network = await assertRejects(
    () => requestCompletion(() => Promise.reject(new TypeError("down")), settings, "k", messages),
    ProviderFailure,
  );
  assertEquals(network.kind, "http_error");

  const timeout = await assertRejects(
    () =>
      requestCompletion(
        () => Promise.reject(new DOMException("t", "TimeoutError")),
        settings,
        "k",
        messages,
      ),
    ProviderFailure,
  );
  assertEquals(timeout.kind, "timeout");
});
