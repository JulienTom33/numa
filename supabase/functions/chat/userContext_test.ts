import { assertEquals } from "jsr:@std/assert@1";
import type { TokenVerifier } from "../_shared/auth.ts";
import { createHandler } from "../_shared/handler.ts";
import { createMemoryRateLimitStore } from "../_shared/rateLimit.ts";
import { createChatHandler } from "./chat.ts";
import {
  chartFixture,
  createMemoryStore,
  echoProvider,
  memoryConversations,
} from "./test_helpers.ts";

const CALLER = "member-1";
const VICTIM = "victim-9";

const verifyToken: TokenVerifier = (token) =>
  Promise.resolve(token === "member" ? { sub: CALLER, is_anonymous: true } : null);

function setup() {
  const seen: string[] = [];
  const quota = createMemoryStore();
  const conversations = memoryConversations();
  const rateKeys: string[] = [];
  const handler = createHandler({
    methods: ["GET", "POST"],
    allowedOrigins: [],
    verifyToken,
    handle: createChatHandler({
      store: {
        ...quota,
        reserve: (userId, limit) => {
          seen.push(`reserve:${userId}`);
          return quota.reserve(userId, limit);
        },
        used: (userId) => {
          seen.push(`used:${userId}`);
          return quota.used(userId);
        },
      },
      provider: echoProvider(),
      charts: {
        latest: (userId) => {
          seen.push(`chart:${userId}`);
          return Promise.resolve(chartFixture());
        },
      },
      conversations: {
        ...conversations,
        owns: (userId, conversationId) => {
          seen.push(`owns:${userId}`);
          return conversations.owns(userId, conversationId);
        },
      },
      rateLimits: {
        consume: (key, limit, windowSeconds) => {
          rateKeys.push(key);
          return createMemoryRateLimitStore().consume(key, limit, windowSeconds);
        },
      },
      dailyAiLimit: 1000,
    }),
  });
  return { handler, seen, conversations, rateKeys };
}

function request(body: unknown): Request {
  return new Request("https://fn.test/chat", {
    method: "POST",
    headers: { Authorization: "Bearer member", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

Deno.test("chat agit uniquement pour l'utilisateur du jeton, jamais pour un identifiant du corps", async () => {
  const { handler, seen, conversations, rateKeys } = setup();

  const response = await handler(request({
    question: "Que dit mon Soleil ?",
    conversationId: "11111111-1111-4111-8111-111111111111",
    userId: VICTIM,
    user_id: VICTIM,
    caller: { userId: VICTIM },
  }));

  assertEquals(response.status, 200);
  assertEquals(conversations.recorded.length, 1);
  assertEquals(conversations.recorded[0].userId, CALLER);
  assertEquals(seen.length > 0, true);
  assertEquals(seen.every((entry) => entry.endsWith(`:${CALLER}`)), true);
  assertEquals(rateKeys.every((key) => !key.includes(VICTIM)), true);
  assertEquals(JSON.stringify([seen, rateKeys]).includes(VICTIM), false);
});

Deno.test("chat ne lit le quota que de l'utilisateur du jeton", async () => {
  const { handler, seen } = setup();

  const response = await handler(
    new Request(`https://fn.test/chat?userId=${VICTIM}`, {
      headers: { Authorization: "Bearer member" },
    }),
  );

  assertEquals(response.status, 200);
  assertEquals(seen, [`used:${CALLER}`]);
});
