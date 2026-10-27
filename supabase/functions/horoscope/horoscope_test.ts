import { assertEquals } from "jsr:@std/assert@1";
import type { TokenVerifier } from "../_shared/auth.ts";
import { createHandler } from "../_shared/handler.ts";
import { createMemoryRateLimitStore, type RateLimitStore } from "../_shared/rateLimit.ts";
import { chartFixture } from "../chat/test_helpers.ts";
import { buildFactors } from "./context.ts";
import { createHoroscopeHandler } from "./horoscope.ts";
import type { HoroscopeProvider } from "./provider.ts";
import { stubHoroscopeProvider } from "./stub.ts";
import type { ChartSource, HoroscopeStore, SavedHoroscope, SaveInput } from "./store.ts";

const verifyToken: TokenVerifier = (token) =>
  Promise.resolve(token === "member" ? { sub: "member-1", is_anonymous: false } : null);

const NOW = new Date("2026-10-27T10:00:00Z");

function memoryHoroscopes(): HoroscopeStore & { saved: SaveInput[] } {
  const rows = new Map<string, SavedHoroscope>();
  const saved: SaveInput[] = [];
  return {
    saved,
    find: (userId, date) => Promise.resolve(rows.get(`${userId}:${date}`) ?? null),
    save: (input) => {
      saved.push(input);
      const row = {
        date: input.date,
        sections: input.generated.sections,
        factors: input.factors,
        promptVersion: input.generated.promptVersion,
      };
      rows.set(`${input.userId}:${input.date}`, row);
      return Promise.resolve(row);
    },
  };
}

function countingProvider(): HoroscopeProvider & { calls: number } {
  const provider = {
    calls: 0,
    generate: (...args: Parameters<HoroscopeProvider["generate"]>) => {
      provider.calls += 1;
      return stubHoroscopeProvider.generate(...args);
    },
  };
  return provider;
}

function setup(
  options: { hasChart?: boolean; rateLimits?: RateLimitStore; dailyAiLimit?: number } = {},
) {
  const horoscopes = memoryHoroscopes();
  const provider = countingProvider();
  const charts: ChartSource = {
    latest: () =>
      Promise.resolve(options.hasChart === false ? null : { id: "chart-1", chart: chartFixture() }),
  };
  const handler = createHandler({
    methods: ["POST"],
    allowedOrigins: [],
    verifyToken,
    handle: createHoroscopeHandler({
      charts,
      horoscopes,
      provider,
      rateLimits: options.rateLimits ?? createMemoryRateLimitStore(),
      dailyAiLimit: options.dailyAiLimit ?? 1000,
      now: () => NOW,
    }),
  });
  return { handler, horoscopes, provider };
}

function post(body: unknown, token = "member"): Request {
  return new Request("https://fn.test/horoscope", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

Deno.test("generates, stores and returns the four sections with their basis", async () => {
  const { handler, horoscopes } = setup();

  const response = await handler(post({ date: "2026-10-27" }));
  const { horoscope } = await response.json();

  assertEquals(response.status, 200);
  assertEquals(horoscope.date, "2026-10-27");
  assertEquals(Object.keys(horoscope.sections), ["general", "relations", "work", "energy"]);
  assertEquals(horoscope.promptVersion, "sidera-horoscope-v1");
  assertEquals(horoscope.basis.confidence, "high");
  assertEquals(Array.isArray(horoscope.basis.aspects), true);
  assertEquals(horoscopes.saved.length, 1);
  assertEquals(horoscopes.saved[0].chartId, "chart-1");
});

Deno.test("defaults to the server date and reuses the stored reading without calling the AI", async () => {
  const { handler, provider } = setup();

  const first = await handler(post({}));
  const second = await handler(post({ date: "2026-10-27" }));

  assertEquals((await first.json()).horoscope.date, "2026-10-27");
  assertEquals(second.status, 200);
  assertEquals(provider.calls, 1);
});

Deno.test("rejects a malformed or distant date", async () => {
  const { handler, provider } = setup();

  for (const date of ["27/10/2026", "2026-02-30", "2026-10-20", 5]) {
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
      new Request("https://fn.test/horoscope", { headers: { Authorization: "Bearer member" } }),
    )).status,
    405,
  );
});

Deno.test("applies the per-user rate limit before any work", async () => {
  const rateLimits = createMemoryRateLimitStore();
  const { handler, provider } = setup({ rateLimits });

  for (let call = 0; call < 10; call += 1) await handler(post({}));
  const blocked = await handler(post({}));

  assertEquals(blocked.status, 429);
  assertEquals((await blocked.json()).error.code, "rate_limit_exceeded");
  assertEquals(rateLimits.calls[0], "horoscope:member-1");
  assertEquals(provider.calls, 1);
});

Deno.test("applies the global daily AI limit only when generating", async () => {
  const { handler } = setup({ dailyAiLimit: 1 });

  assertEquals((await handler(post({ date: "2026-10-26" }))).status, 200);
  const blocked = await handler(post({ date: "2026-10-27" }));

  assertEquals(blocked.status, 429);
  assertEquals((await blocked.json()).error.code, "ai_daily_limit_exceeded");
  assertEquals((await handler(post({ date: "2026-10-26" }))).status, 200);
});

Deno.test("computes transits at noon UTC of the requested date", async () => {
  const { handler, horoscopes } = setup();

  await handler(post({ date: "2026-10-26" }));

  assertEquals(
    horoscopes.saved[0].factors,
    buildFactors(chartFixture(), "2026-10-26", new Date("2026-10-26T12:00:00Z")),
  );
});
