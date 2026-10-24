import { assertEquals } from "jsr:@std/assert@1";
import type { TokenVerifier } from "../_shared/auth.ts";
import { createHandler } from "../_shared/handler.ts";
import { EPHEMERIS_CACHE_CONTROL, handleEphemeris } from "./ephemeris.ts";

const verifyToken: TokenVerifier = (token) =>
  Promise.resolve(token === "valid" ? { sub: "user-1", is_anonymous: true } : null);

const handler = createHandler({
  methods: ["GET"],
  allowedOrigins: [],
  verifyToken,
  handle: handleEphemeris,
});

function get(query: string, token = "valid"): Promise<Response> {
  return handler(
    new Request(`https://fn.test/ephemeris?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}

Deno.test("200 cacheable et identique pour deux appels", async () => {
  const first = await get("from=2024-04-01&to=2024-04-03");
  const second = await get("from=2024-04-01&to=2024-04-03");

  assertEquals(first.status, 200);
  assertEquals(first.headers.get("Cache-Control"), EPHEMERIS_CACHE_CONTROL);
  const body = await first.text();
  assertEquals(body, await second.text());
  assertEquals(JSON.parse(body).days.length, 3);
});

Deno.test("400 avec code pour une plage trop longue", async () => {
  const response = await get("from=2024-01-01&to=2024-03-01");

  assertEquals(response.status, 400);
  assertEquals((await response.json()).error.code, "range_too_long");
});

Deno.test("400 avec code pour une date invalide", async () => {
  const response = await get("date=nope");

  assertEquals(response.status, 400);
  assertEquals((await response.json()).error.code, "invalid_date");
});

Deno.test("401 sans jeton valide, 405 en POST", async () => {
  assertEquals((await get("date=2024-04-01", "bad")).status, 401);
  const post = await handler(
    new Request("https://fn.test/ephemeris?date=2024-04-01", {
      method: "POST",
      headers: { Authorization: "Bearer valid" },
    }),
  );
  assertEquals(post.status, 405);
});
