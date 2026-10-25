import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import type { TokenVerifier } from "./auth.ts";
import { createHandler } from "./handler.ts";
import { json } from "./http.ts";
import {
  AI_DAILY_LIMIT_EXCEEDED,
  createMemoryRateLimitStore,
  createSupabaseRateLimitStore,
  DEFAULT_AI_DAILY_LIMIT,
  enforceAiDailyLimit,
  parseAiDailyLimit,
  RATE_LIMIT_EXCEEDED,
  withRateLimit,
} from "./rateLimit.ts";

const verifyToken: TokenVerifier = (token) =>
  Promise.resolve(token === "u1" || token === "u2" ? { sub: token } : null);

const rule = { scope: "demo", limit: 2, windowSeconds: 60 };

function call(handler: (req: Request) => Promise<Response>, token: string) {
  return handler(
    new Request("https://fn.test/demo", { headers: { Authorization: `Bearer ${token}` } }),
  );
}

function demo(store = createMemoryRateLimitStore()) {
  let executed = 0;
  const handler = createHandler({
    methods: ["GET"],
    allowedOrigins: [],
    verifyToken,
    handle: withRateLimit(store, rule, () => {
      executed++;
      return json({ ok: true });
    }),
  });
  return { handler, store, executed: () => executed };
}

Deno.test("withRateLimit laisse passer sous la limite", async () => {
  const { handler, store } = demo();
  assertEquals((await call(handler, "u1")).status, 200);
  assertEquals((await call(handler, "u1")).status, 200);
  assertEquals(store.calls, ["demo:u1", "demo:u1"]);
});

Deno.test("withRateLimit renvoie 429 avec un code stable sans exécuter la fonction", async () => {
  const { handler, executed } = demo();
  await call(handler, "u1");
  await call(handler, "u1");
  const response = await call(handler, "u1");
  assertEquals(response.status, 429);
  assertEquals((await response.json()).error.code, RATE_LIMIT_EXCEEDED);
  assertEquals(executed(), 2);
});

Deno.test("withRateLimit compte séparément chaque utilisateur", async () => {
  const { handler } = demo();
  await call(handler, "u1");
  await call(handler, "u1");
  await call(handler, "u1");
  assertEquals((await call(handler, "u2")).status, 200);
});

Deno.test("withRateLimit n'est pas atteint par un appelant non authentifié", async () => {
  const { handler, store } = demo();
  assertEquals((await call(handler, "bad")).status, 401);
  assertEquals(store.calls, []);
});

Deno.test("enforceAiDailyLimit refuse au-delà du plafond global", async () => {
  const store = createMemoryRateLimitStore();
  await enforceAiDailyLimit(store, 1);
  const error = await assertRejects(() => enforceAiDailyLimit(store, 1));
  assertEquals((error as { code: string; status: number }).code, AI_DAILY_LIMIT_EXCEEDED);
  assertEquals((error as { status: number }).status, 429);
  assertEquals(store.calls, ["ai:global", "ai:global"]);
});

Deno.test("parseAiDailyLimit lit la variable ou prend la valeur par défaut", () => {
  assertEquals(parseAiDailyLimit(undefined), DEFAULT_AI_DAILY_LIMIT);
  assertEquals(parseAiDailyLimit(""), DEFAULT_AI_DAILY_LIMIT);
  assertEquals(parseAiDailyLimit("50"), 50);
  assertEquals(typeof parseAiDailyLimit("1"), "number");
});

Deno.test("parseAiDailyLimit rejette une valeur invalide", () => {
  for (const raw of ["0", "-3", "abc", "1.5"]) {
    let failed = false;
    try {
      parseAiDailyLimit(raw);
    } catch {
      failed = true;
    }
    assertEquals(failed, true, raw);
  }
});

Deno.test("le store Supabase appelle consume_rate_limit", async () => {
  const seen: unknown[] = [];
  const client = {
    rpc: (name: string, args: unknown) => {
      seen.push(name, args);
      return Promise.resolve({ data: false, error: null });
    },
  };
  const store = createSupabaseRateLimitStore(client as never);
  assertEquals(await store.consume("k", 3, 60), false);
  assertEquals(seen, ["consume_rate_limit", { p_key: "k", p_limit: 3, p_window_seconds: 60 }]);
});

Deno.test("le store Supabase échoue fermé sur erreur RPC", async () => {
  const client = { rpc: () => Promise.resolve({ data: null, error: { message: "x" } }) };
  const store = createSupabaseRateLimitStore(client as never);
  await assertRejects(() => store.consume("k", 3, 60));
});
