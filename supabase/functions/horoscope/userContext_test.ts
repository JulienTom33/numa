import { assertEquals } from "jsr:@std/assert@1";
import type { TokenVerifier } from "../_shared/auth.ts";
import { createHandler } from "../_shared/handler.ts";
import { createMemoryRateLimitStore } from "../_shared/rateLimit.ts";
import { chartFixture } from "../chat/test_helpers.ts";
import { createHoroscopeHandler } from "./horoscope.ts";
import { stubHoroscopeProvider } from "./stub.ts";

const CALLER = "member-1";
const VICTIM = "victim-9";

const verifyToken: TokenVerifier = (token) =>
  Promise.resolve(token === "member" ? { sub: CALLER, is_anonymous: false } : null);

Deno.test("horoscope agit uniquement pour l'utilisateur du jeton, jamais pour un identifiant du corps", async () => {
  const seen: string[] = [];
  const rateLimits = createMemoryRateLimitStore();
  const handler = createHandler({
    methods: ["POST"],
    allowedOrigins: [],
    verifyToken,
    handle: createHoroscopeHandler({
      charts: {
        latest: (userId) => {
          seen.push(`chart:${userId}`);
          return Promise.resolve({ id: "chart-1", chart: chartFixture() });
        },
      },
      horoscopes: {
        find: (userId) => {
          seen.push(`find:${userId}`);
          return Promise.resolve(null);
        },
        save: (input) => {
          seen.push(`save:${input.userId}`);
          return Promise.resolve({
            date: input.date,
            sections: input.generated.sections,
            factors: input.factors,
            promptVersion: input.generated.promptVersion,
          });
        },
      },
      provider: stubHoroscopeProvider,
      rateLimits,
      dailyAiLimit: 1000,
      now: () => new Date("2026-10-27T10:00:00Z"),
    }),
  });

  const response = await handler(
    new Request("https://fn.test/horoscope", {
      method: "POST",
      headers: { Authorization: "Bearer member", "Content-Type": "application/json" },
      body: JSON.stringify({ date: "2026-10-27", userId: VICTIM, user_id: VICTIM }),
    }),
  );

  assertEquals(response.status, 200);
  assertEquals(seen, [`find:${CALLER}`, `chart:${CALLER}`, `save:${CALLER}`]);
  assertEquals(rateLimits.calls.some((key) => key.includes(VICTIM)), false);
  assertEquals(rateLimits.calls[0], `horoscope:${CALLER}`);
});
