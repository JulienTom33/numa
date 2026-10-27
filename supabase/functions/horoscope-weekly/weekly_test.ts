import { assertEquals } from "jsr:@std/assert@1";
import type { TokenVerifier } from "../_shared/auth.ts";
import { createHandler } from "../_shared/handler.ts";
import { createMemoryRateLimitStore, type RateLimitStore } from "../_shared/rateLimit.ts";
import { chartFixture } from "../chat/test_helpers.ts";
import type { ChartSource } from "../horoscope/store.ts";
import { buildWeeklyFactors, cacheKey } from "./context.ts";
import type { WeeklyProvider } from "./provider.ts";
import { stubWeeklyProvider } from "./stub.ts";
import type { SavedWeekly, SaveWeeklyInput, WeeklyStore } from "./store.ts";
import { createWeeklyHandler } from "./weekly.ts";
import { weekOf } from "./week.ts";

const verifyToken: TokenVerifier = (token) =>
  Promise.resolve(token === "member" ? { sub: "member-1", is_anonymous: false } : null);

const NOW = new Date("2026-10-27T10:00:00Z");

function memoryWeekly(): WeeklyStore & { saved: SaveWeeklyInput[] } {
  const rows = new Map<string, SavedWeekly>();
  const saved: SaveWeeklyInput[] = [];
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

function countingProvider(fail = false): WeeklyProvider & { calls: number } {
  const provider = {
    calls: 0,
    generate: (...args: Parameters<WeeklyProvider["generate"]>) => {
      provider.calls += 1;
      return fail ? Promise.resolve(null) : stubWeeklyProvider.generate(...args);
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
  const weekly = memoryWeekly();
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
    handle: createWeeklyHandler({
      charts,
      weekly,
      provider,
      rateLimits,
      dailyAiLimit: options.dailyAiLimit ?? 1000,
      now: () => NOW,
    }),
  });
  return { handler, weekly, provider, rateLimits };
}

function post(body: unknown, token = "member"): Request {
  return new Request("https://fn.test/horoscope-weekly", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

Deno.test("generates the week once, stores it and serves it from the cache", async () => {
  const { handler, weekly, provider } = setup();

  const first = await (await handler(post({}))).json();
  const second = await (await handler(post({ date: "2026-11-01" }))).json();

  assertEquals(first.horoscope.weekStart, "2026-10-26");
  assertEquals(first.horoscope.weekEnd, "2026-11-01");
  assertEquals(first.horoscope.fallback, false);
  assertEquals(Object.keys(first.horoscope.sections), ["general", "relations", "work", "energy"]);
  assertEquals(second.horoscope.sections, first.horoscope.sections);
  assertEquals(provider.calls, 1);
  assertEquals(weekly.saved.length, 1);
});

Deno.test("the cache key holds no personal data", () => {
  const key = cacheKey(weekOf(NOW), "leo", null);

  assertEquals(key.startsWith("2026-W44:leo:none:sidera-horoscope-weekly-v1:"), true);
});

Deno.test("factors come from the computed ephemeris only", () => {
  const factors = buildWeeklyFactors(weekOf(NOW), "leo", "virgo");

  assertEquals(factors.week, { start: "2026-10-26", end: "2026-11-01" });
  assertEquals(factors.sunSign, "leo");
  assertEquals(factors.aspects.length <= 6, true);
  assertEquals(
    factors.aspects.every((aspect) => aspect.bodyA !== "moon" && aspect.bodyB !== "moon"),
    true,
  );
  assertEquals(factors.moonPhases.length >= 1, true);
});

Deno.test("falls back without AI and does not consume the quota when the provider fails", async () => {
  const rateLimits = createMemoryRateLimitStore();
  const { handler, weekly } = setup({ failing: true, rateLimits });

  const body = await (await handler(post({}))).json();

  assertEquals(body.horoscope.fallback, true);
  assertEquals(body.horoscope.sections, null);
  assertEquals(body.horoscope.basis.events.moonPhases.length >= 1, true);
  assertEquals(weekly.saved.length, 0);
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

  for (const date of ["27/10/2026", "2026-10-01", 5]) {
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
      new Request("https://fn.test/horoscope-weekly", {
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
  assertEquals(rateLimits.calls[0], "horoscope-weekly:member-1");
});
