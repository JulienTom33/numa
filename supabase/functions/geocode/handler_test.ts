import { assertEquals } from "jsr:@std/assert@1";
import type { TokenVerifier } from "../_shared/auth.ts";
import { createMemoryRateLimitStore } from "../_shared/rateLimit.ts";
import { createGeocodeHandler } from "./handler.ts";
import type { FetchFn } from "./places.ts";

const ORIGIN = "https://numa.test";

const verifyToken: TokenVerifier = (token) =>
  Promise.resolve(token === "valid" ? { sub: "user-1", is_anonymous: true } : null);

const providerFetch: FetchFn = () =>
  Promise.resolve(
    new Response(
      JSON.stringify({
        results: [{
          id: 2996944,
          name: "Lyon",
          latitude: 45.74846,
          longitude: 4.84671,
          feature_code: "PPLA",
          country_code: "FR",
          timezone: "Europe/Paris",
          country: "France",
          admin1: "Auvergne-Rhône-Alpes",
        }],
      }),
    ),
  );

const handler = createGeocodeHandler({
  allowedOrigins: [ORIGIN],
  verifyToken,
  fetch: providerFetch,
  rateLimits: createMemoryRateLimitStore(),
});

function request(body: string, token = "valid"): Request {
  return new Request("https://fn.test/geocode", {
    method: "POST",
    headers: { Origin: ORIGIN, Authorization: `Bearer ${token}` },
    body,
  });
}

Deno.test("returns the matching places for an authenticated caller", async () => {
  const response = await handler(request(JSON.stringify({ query: "Lyon" })));

  assertEquals(response.status, 200);
  const { places } = await response.json();
  assertEquals(places[0].label, "Lyon, Auvergne-Rhône-Alpes, France");
  assertEquals(places[0].timezone, "Europe/Paris");
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), ORIGIN);
});

Deno.test("rejects a body that is not JSON", async () => {
  const response = await handler(request("Lyon"));

  assertEquals(response.status, 400);
  assertEquals((await response.json()).error.code, "invalid_body");
});

Deno.test("rejects a query that is too short", async () => {
  const response = await handler(request(JSON.stringify({ query: "L" })));

  assertEquals(response.status, 400);
  assertEquals((await response.json()).error.code, "invalid_query");
});

Deno.test("requires authentication before calling the provider", async () => {
  let called = false;
  const guarded = createGeocodeHandler({
    allowedOrigins: [ORIGIN],
    verifyToken,
    fetch: (input, init) => {
      called = true;
      return providerFetch(input, init);
    },
    rateLimits: createMemoryRateLimitStore(),
  });

  const response = await guarded(request(JSON.stringify({ query: "Lyon" }), "forged"));

  assertEquals(response.status, 401);
  assertEquals(called, false);
});

Deno.test("returns 429 before calling the provider once the rate limit is exceeded", async () => {
  let calls = 0;
  const limited = createGeocodeHandler({
    allowedOrigins: [ORIGIN],
    verifyToken,
    fetch: (input, init) => {
      calls++;
      return providerFetch(input, init);
    },
    rateLimits: { consume: () => Promise.resolve(false) },
  });

  const response = await limited(request(JSON.stringify({ query: "Lyon" })));

  assertEquals(response.status, 429);
  assertEquals((await response.json()).error.code, "rate_limit_exceeded");
  assertEquals(calls, 0);
});
