import { assertEquals } from "jsr:@std/assert@1";
import type { TokenVerifier } from "./auth.ts";
import { createHandler } from "./handler.ts";
import { HttpError, json } from "./http.ts";

const ORIGIN = "https://numa.test";

const verifyToken: TokenVerifier = (token) =>
  Promise.resolve(token === "valid" ? { sub: "user-1", is_anonymous: true } : null);

const handler = createHandler({
  methods: ["POST"],
  allowedOrigins: [ORIGIN],
  verifyToken,
  handle: ({ caller }) => json({ seen: caller.userId }),
});

function request(method: string, token?: string): Request {
  const headers: Record<string, string> = { Origin: ORIGIN };
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request("https://fn.test", { method, headers });
}

Deno.test("answers the CORS preflight without authentication", async () => {
  const response = await handler(request("OPTIONS"));

  assertEquals(response.status, 204);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), ORIGIN);
});

Deno.test("rejects a method that is not allowed", async () => {
  const response = await handler(request("DELETE", "valid"));

  assertEquals(response.status, 405);
  assertEquals((await response.json()).error.code, "method_not_allowed");
});

Deno.test("rejects an unauthenticated request with CORS headers", async () => {
  const response = await handler(request("POST"));

  assertEquals(response.status, 401);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), ORIGIN);
});

Deno.test("rejects an invalid token", async () => {
  const response = await handler(request("POST", "forged"));

  assertEquals(response.status, 401);
  assertEquals((await response.json()).error.code, "invalid_token");
});

Deno.test("passes the authenticated caller to the handler and adds CORS headers", async () => {
  const response = await handler(request("POST", "valid"));

  assertEquals(response.status, 200);
  assertEquals(await response.json(), { seen: "user-1" });
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), ORIGIN);
});

Deno.test("turns errors thrown by the handler into JSON responses", async () => {
  const failing = createHandler({
    methods: ["POST"],
    allowedOrigins: [ORIGIN],
    verifyToken,
    handle: () => {
      throw new HttpError(429, "quota_exceeded", "Quota atteint.");
    },
  });

  const response = await failing(request("POST", "valid"));

  assertEquals(response.status, 429);
  assertEquals((await response.json()).error.code, "quota_exceeded");
});
