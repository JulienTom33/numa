import { assertEquals } from "jsr:@std/assert@1";
import type { TokenVerifier } from "../_shared/auth.ts";
import { createHandler } from "../_shared/handler.ts";
import { createMemoryRateLimitStore, type RateLimitStore } from "../_shared/rateLimit.ts";
import { chartFixture } from "../chat/test_helpers.ts";
import type { ChartSource } from "../horoscope/store.ts";
import { buildMonthlyFactors, cacheKey } from "./context.ts";
import { monthOf } from "./month.ts";
import { createMonthlyHandler } from "./monthly.ts";
import type { MonthlyProvider } from "./provider.ts";
import { stubMonthlyProvider } from "./stub.ts";
import type { MonthlyStore, SavedMonthly, SaveMonthlyInput } from "./store.ts";

const verifyToken: TokenVerifier = (token) =>
  Promise.resolve(token === "member" ? { sub: "member-1", is_anonymous: false } : null);

const NOW = new Date("2026-10-27T10:00:00Z");

function memoryMonthly(): MonthlyStore & { saved: SaveMonthlyInput[] } {
  const rows = new Map<string, SavedMonthly>();
  const saved: SaveMonthlyInput[] = [];
  return {
    saved,
    find: (key) => Promise.resolve(rows.get(key) ?? null),
    save: (input) => {
      saved.push(input);
      const row = {
        sections: input.generated.sections,
        factors: input.factors,
        promptVersion: input.generated.promptVersion,
      };
      rows.set(input.cacheKey, row);
      return Promise.resolve(row);
    },
  };
}

function countingProvider(fail = false): MonthlyProvider & { calls: number } {
  const provider = {
    calls: 0,
    generate: (...args: Parameters<MonthlyProvider["generate"]>) => {
      provider.calls += 1;
      return fail ? Promise.resolve(null) : stubMonthlyProvider.generate(...args);
    },
  };
  return provider;
}

function setup(
  options: {
    hasChart?: boolean;
    failing?: boolean;
    rateLimits?: RateLimitStore & { calls: string[] };
    dailyAiLimit?: number;
  } = {},
) {
  const monthly = memoryMonthly();
  const provider = countingProvider(options.failing);
  const rateLimits = options.rateLimits ?? createMemoryRateLimitStore();
  const charts: ChartSource = {
    latest: () =>
      Promise.resolve(options.hasChart === false ? null : { id: "chart-1", chart: chartFixture() }),
  };
  const handler = createHandler({
    methods: ["POST"],
    allowedOrigins: [],
    verifyToken,
    handle: createMonthlyHandler({
      charts,
      monthly,
      provider,
      rateLimits,
      dailyAiLimit: options.dailyAiLimit ?? 1000,
      now: () => NOW,
    }),
  });
  return { handler, monthly, provider, rateLimits };
}

function post(body: unknown, token = "member"): Request {
  return new Request("https://fn.test/horoscope-monthly", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

Deno.test("generates the month once, stores it and serves it from the cache", async () => {
  const { handler, monthly, provider } = setup();

  const first = await (await handler(post({}))).json();
  const second = await (await handler(post({ date: "2026-10-31" }))).json();

  assertEquals(first.horoscope.monthStart, "2026-10-01");
  assertEquals(first.horoscope.monthEnd, "2026-10-31");
  assertEquals(first.horoscope.fallback, false);
  assertEquals(Object.keys(first.horoscope.sections), ["general", "relations", "work", "energy"]);
  assertEquals(second.horoscope.sections, first.horoscope.sections);
  assertEquals(provider.calls, 1);
  assertEquals(monthly.saved.length, 1);
});

Deno.test("the cache key holds no personal data", () => {
  const key = cacheKey(monthOf(NOW), "leo", null);

  assertEquals(key.startsWith("2026-10:leo:none:sidera-horoscope-monthly-v1:"), true);
});

Deno.test("factors come from the computed ephemeris only", () => {
  const factors = buildMonthlyFactors(monthOf(NOW), "leo", "virgo");

  assertEquals(factors.month, { start: "2026-10-01", end: "2026-10-31" });
  assertEquals(factors.sunSign, "leo");
  assertEquals(factors.aspects.length <= 8, true);
  assertEquals(
    factors.aspects.every((aspect) => aspect.bodyA !== "moon" && aspect.bodyB !== "moon"),
    true,
  );
  assertEquals(factors.moonPhases.length >= 2, true);
});

Deno.test("falls back without AI and does not consume the quota when the provider fails", async () => {
  const rateLimits = createMemoryRateLimitStore();
  const { handler, monthly } = setup({ failing: true, rateLimits });

  const body = await (await handler(post({}))).json();

  assertEquals(body.horoscope.fallback, true);
  assertEquals(body.horoscope.sections, null);
  assertEquals(body.horoscope.basis.events.moonPhases.length >= 2, true);
  assertEquals(monthly.saved.length, 0);
  assertEquals(rateLimits.calls.includes("ai:global"), false);
});

Deno.test("falls back when the global AI quota is exhausted", async () => {
  const { handler } = setup({ dailyAiLimit: 0 });

  const response = await handler(post({}));

  assertEquals(response.status, 200);
  assertEquals((await response.json()).horoscope.fallback, true);
});

Deno.test("rejects a malformed or distant date", async () => {
  const { handler, provider } = setup();

  for (const date of ["27/10/2026", "2026-01-01", 5]) {
    const response = await handler(post({ date }));
    assertEquals(response.status, 400);
    assertEquals((await response.json()).error.code, "invalid_date");
  }
  assertEquals(provider.calls, 0);
});

Deno.test("returns 404 when the user has no natal chart", async () => {
  const { handler } = setup({ hasChart: false });

  const response = await handler(post({}));

  assertEquals(response.status, 404);
  assertEquals((await response.json()).error.code, "birth_data_not_found");
});

Deno.test("requires authentication and refuses GET", async () => {
  const { handler } = setup();

  assertEquals((await handler(post({}, "unknown"))).status, 401);
  assertEquals(
    (await handler(
      new Request("https://fn.test/horoscope-monthly", {
        headers: { Authorization: "Bearer member" },
      }),
    )).status,
    405,
  );
});

Deno.test("applies the per-user rate limit", async () => {
  const rateLimits = createMemoryRateLimitStore();
  const { handler } = setup({ rateLimits });

  for (let call = 0; call < 10; call += 1) await handler(post({}));
  const blocked = await handler(post({}));

  assertEquals(blocked.status, 429);
  assertEquals(rateLimits.calls[0], "horoscope-monthly:member-1");
});
