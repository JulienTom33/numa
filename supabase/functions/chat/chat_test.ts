import { assertEquals } from "jsr:@std/assert@1";
import type { TokenVerifier } from "../_shared/auth.ts";
import { createHandler } from "../_shared/handler.ts";
import { createChatHandler, MAX_QUESTION_LENGTH } from "./chat.ts";
import { type QuestionProvider, stubProvider } from "./provider.ts";
import { createMemoryStore, echoProvider, failingProvider } from "./test_helpers.ts";

const verifyToken: TokenVerifier = (token) =>
  Promise.resolve(token === "anon" ? { sub: "anon-1", is_anonymous: true } : null);

function chat(provider: QuestionProvider = echoProvider(), store = createMemoryStore()) {
  return createHandler({
    methods: ["GET", "POST"],
    allowedOrigins: [],
    verifyToken,
    handle: createChatHandler({ store, provider }),
  });
}

function ask(body: unknown, token = "anon"): Request {
  return new Request("https://fn.test/chat", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

Deno.test("GET returns the quota read from the server", async () => {
  const response = await chat()(
    new Request("https://fn.test/chat", { headers: { Authorization: "Bearer anon" } }),
  );

  assertEquals(response.status, 200);
  assertEquals(await response.json(), { quota: { limit: 2, used: 0, remaining: 2 } });
});

Deno.test("POST answers twice then returns 429 on the third question", async () => {
  const handler = chat();

  const first = await handler(ask({ question: "Q1 " }));
  assertEquals(await first.json(), {
    answer: "réponse à : Q1",
    quota: { limit: 2, used: 1, remaining: 1 },
  });

  const second = await handler(ask({ question: "Q2" }));
  assertEquals(second.status, 200);
  assertEquals((await second.json()).quota.remaining, 0);

  const third = await handler(ask({ question: "Q3" }));
  assertEquals(third.status, 429);
  assertEquals((await third.json()).error.code, "question_quota_exceeded");
});

Deno.test("POST returns 502 without consuming a question when the provider fails", async () => {
  const store = createMemoryStore();
  const response = await chat(failingProvider, store)(ask({ question: "Q1" }));

  assertEquals(response.status, 502);
  assertEquals((await response.json()).error.code, "provider_unavailable");
  assertEquals(await store.used("anon-1"), 0);
});

Deno.test("POST rejects an invalid question without consuming the quota", async () => {
  const store = createMemoryStore();
  const handler = chat(echoProvider(), store);

  for (const body of ["not json", {}, { question: "  " }, { question: 42 }]) {
    const response = await handler(ask(body));
    assertEquals(response.status, 400);
    assertEquals((await response.json()).error.code, "invalid_question");
  }
  const tooLong = await handler(ask({ question: "a".repeat(MAX_QUESTION_LENGTH + 1) }));
  assertEquals(tooLong.status, 400);
  assertEquals(await store.used("anon-1"), 0);
});

Deno.test("POST without a valid session is rejected before touching the quota", async () => {
  const response = await chat()(ask({ question: "Q1" }, "forged"));

  assertEquals(response.status, 401);
});

Deno.test("the stub provider answers without any external call", async () => {
  assertEquals(typeof (await stubProvider.answer("Q")), "string");
});
