import { assertEquals } from "jsr:@std/assert@1";
import type { TokenVerifier } from "../_shared/auth.ts";
import { createHandler } from "../_shared/handler.ts";
import { createMemoryRateLimitStore, type RateLimitStore } from "../_shared/rateLimit.ts";
import type { NatalChart } from "../../../shared/contracts/natalChart/natalChart.ts";
import { createChatHandler, MAX_QUESTION_LENGTH } from "./chat.ts";
import type { QuestionProvider } from "./provider.ts";
import {
  chartFixture,
  createMemoryStore,
  echoProvider,
  failingProvider,
  memoryCharts,
  memoryConversations,
} from "./test_helpers.ts";

const verifyToken: TokenVerifier = (token) =>
  Promise.resolve(
    token === "anon"
      ? { sub: "anon-1", is_anonymous: true }
      : token === "member"
      ? { sub: "member-1", is_anonymous: false }
      : null,
  );

function chat(
  provider: QuestionProvider = echoProvider(),
  store = createMemoryStore(),
  chart: NatalChart | null = null,
  conversations = memoryConversations(),
  rateLimits: RateLimitStore = createMemoryRateLimitStore(),
  dailyAiLimit = 1000,
) {
  return createHandler({
    methods: ["GET", "POST"],
    allowedOrigins: [],
    verifyToken,
    handle: createChatHandler({
      store,
      provider,
      charts: memoryCharts(chart),
      conversations,
      rateLimits,
      dailyAiLimit,
    }),
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
  assertEquals(await response.json(), { quota: { limit: 4, used: 0, remaining: 4 } });
});

Deno.test("POST answers four times then returns 429 on the fifth question", async () => {
  const handler = chat();

  const first = await handler(ask({ question: "Q1 " }));
  assertEquals(await first.json(), {
    answer: "réponse à : Q1",
    basis: null,
    conversationId: "conversation-1",
    messageId: "message-1",
    quota: { limit: 4, used: 1, remaining: 3 },
  });

  for (const [index, question] of ["Q2", "Q3", "Q4"].entries()) {
    const next = await handler(ask({ question }));
    assertEquals(next.status, 200);
    assertEquals((await next.json()).quota.remaining, 2 - index);
  }

  const fifth = await handler(ask({ question: "Q5" }));
  assertEquals(fifth.status, 429);
  assertEquals((await fifth.json()).error.code, "question_quota_exceeded");
});

Deno.test("POST records the factors, prompt version, provider and model with the answer", async () => {
  const conversations = memoryConversations();
  const provider = echoProvider();
  const response = await chat(provider, createMemoryStore(), chartFixture(), conversations)(
    ask({ question: "Que dit mon Soleil ?" }),
  );

  assertEquals(response.status, 200);
  assertEquals(conversations.recorded.length, 1);
  const [recorded] = conversations.recorded;
  assertEquals(recorded.userId, "anon-1");
  assertEquals(recorded.answer.provider, "test");
  assertEquals(recorded.answer.model, "test-model");
  assertEquals(recorded.answer.promptVersion, "sidera-chat-v5");
  assertEquals(recorded.factors?.bodies[0].sign, "cancer");
  assertEquals(JSON.stringify(recorded.factors).includes("Paris"), false);
});

Deno.test("POST returns the factors used as the basis of the answer, without personal data", async () => {
  const response = await chat(echoProvider(), createMemoryStore(), chartFixture())(
    ask({ question: "Que dit mon Soleil ?" }),
  );

  const { basis } = await response.json();
  assertEquals(basis.bodies[0].sign, "cancer");
  assertEquals(Array.isArray(basis.aspects), true);
  assertEquals(Array.isArray(basis.warnings), true);
  assertEquals(JSON.stringify(basis).includes("Paris"), false);
});

Deno.test("POST continues an existing conversation", async () => {
  const conversations = memoryConversations();
  const id = "11111111-1111-4111-8111-111111111111";
  const response = await chat(echoProvider(), createMemoryStore(), null, conversations)(
    ask({ question: "Q1", conversationId: id }),
  );

  assertEquals((await response.json()).conversationId, id);
  assertEquals(conversations.recorded[0].factors, null);
});

Deno.test("POST refuses a foreign conversation before calling the provider", async () => {
  const calls: string[] = [];
  const provider: QuestionProvider = {
    answer: (request) => {
      calls.push(request.question);
      return echoProvider().answer(request);
    },
  };
  const store = createMemoryStore();
  const conversations = memoryConversations(false);
  const response = await chat(provider, store, null, conversations)(
    ask({ question: "Q1", conversationId: "11111111-1111-4111-8111-111111111111" }),
  );

  assertEquals(response.status, 404);
  assertEquals((await response.json()).error.code, "conversation_not_found");
  assertEquals(calls.length, 0);
  assertEquals(await store.used("anon-1"), 0);
  assertEquals(conversations.recorded.length, 0);
});

Deno.test("POST rejects a malformed conversation id", async () => {
  const response = await chat()(ask({ question: "Q1", conversationId: "x" }));

  assertEquals(response.status, 400);
  assertEquals((await response.json()).error.code, "invalid_conversation");
});

Deno.test("POST returns 502 without consuming a question when the provider fails", async () => {
  const store = createMemoryStore();
  const conversations = memoryConversations();
  const response = await chat(failingProvider, store, null, conversations)(ask({ question: "Q1" }));

  assertEquals(response.status, 502);
  assertEquals((await response.json()).error.code, "provider_unavailable");
  assertEquals(await store.used("anon-1"), 0);
  assertEquals(conversations.recorded.length, 0);
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

Deno.test("POST refuses a question containing personal data before any provider call", async () => {
  const provider = echoProvider();
  const handler = chat(provider);

  for (
    const question of [
      "Écris à moi@exemple.fr",
      "Je suis né le 15/06/1975",
      "Appelle le 06 12 34 56 78",
    ]
  ) {
    const response = await handler(ask({ question }));
    assertEquals(response.status, 400);
    assertEquals((await response.json()).error.code, "personal_data_detected");
  }
  assertEquals(provider.calls, []);
});

Deno.test("POST without a valid session is rejected before touching the quota", async () => {
  const response = await chat()(ask({ question: "Q1" }, "forged"));

  assertEquals(response.status, 401);
});

Deno.test("POST returns 429 rate_limit_exceeded for a non-anonymous account before the provider", async () => {
  const provider = echoProvider();
  const handler = chat(provider, createMemoryStore(), null, memoryConversations(), {
    consume: (key) => Promise.resolve(!key.startsWith("chat:")),
  });

  const response = await handler(ask({ question: "Q1" }, "member"));

  assertEquals(response.status, 429);
  assertEquals((await response.json()).error.code, "rate_limit_exceeded");
  assertEquals(provider.calls, []);
});

Deno.test("POST counts the per-user limit under the chat scope and user id", async () => {
  const rateLimits = createMemoryRateLimitStore();
  await chat(echoProvider(), createMemoryStore(), null, memoryConversations(), rateLimits)(
    ask({ question: "Q1" }, "member"),
  );

  assertEquals(rateLimits.calls, ["chat:member-1", "ai:global"]);
});

Deno.test("GET does not consume the rate limit", async () => {
  const rateLimits = createMemoryRateLimitStore();
  await chat(echoProvider(), createMemoryStore(), null, memoryConversations(), rateLimits)(
    new Request("https://fn.test/chat", { headers: { Authorization: "Bearer anon" } }),
  );

  assertEquals(rateLimits.calls, []);
});

Deno.test("POST returns 429 ai_daily_limit_exceeded without calling the provider or using a question", async () => {
  const provider = echoProvider();
  const store = createMemoryStore();
  const handler = chat(
    provider,
    store,
    null,
    memoryConversations(),
    createMemoryRateLimitStore(),
    1,
  );

  assertEquals((await handler(ask({ question: "Q1" }, "member"))).status, 200);
  const response = await handler(ask({ question: "Q2" }, "member"));

  assertEquals(response.status, 429);
  assertEquals((await response.json()).error.code, "ai_daily_limit_exceeded");
  assertEquals(provider.calls.length, 1);

  const anon = await handler(ask({ question: "Q3" }));
  assertEquals(anon.status, 429);
  assertEquals(store.pending(), 0);
  assertEquals(await store.used("anon-1"), 0);
});

Deno.test("POST does not consume the global AI cap when the anonymous quota is exhausted", async () => {
  const rateLimits = createMemoryRateLimitStore();
  const handler = chat(
    echoProvider(),
    createMemoryStore(),
    null,
    memoryConversations(),
    rateLimits,
  );
  for (const question of ["Q1", "Q2", "Q3", "Q4", "Q5"]) {
    await handler(ask({ question }));
  }

  assertEquals(rateLimits.calls.filter((key) => key === "ai:global").length, 4);
});

Deno.test("POST passes the conversation history to the provider", async () => {
  const id = "11111111-1111-4111-8111-111111111111";
  const past = [
    { role: "user" as const, content: "Q0" },
    { role: "assistant" as const, content: "R0" },
  ];
  const provider = echoProvider();
  const conversations = memoryConversations(true, { [`anon-1:${id}`]: past });
  await chat(provider, createMemoryStore(), null, conversations)(
    ask({ question: "Q1", conversationId: id }),
  );

  assertEquals(provider.histories, [past]);
});

Deno.test("POST never exposes another user's history", async () => {
  const id = "11111111-1111-4111-8111-111111111111";
  const past = [{ role: "user" as const, content: "secret" }];
  const provider = echoProvider();
  const conversations = memoryConversations(true, { [`member-1:${id}`]: past });
  await chat(provider, createMemoryStore(), null, conversations)(
    ask({ question: "Q1", conversationId: id }),
  );

  assertEquals(provider.histories, [[]]);
});

Deno.test("POST without conversation sends an empty history", async () => {
  const provider = echoProvider();
  await chat(provider)(ask({ question: "Q1" }));

  assertEquals(provider.histories, [[]]);
});
