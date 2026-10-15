import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import { authenticate, extractBearerToken, type TokenVerifier } from "./auth.ts";
import { HttpError } from "./http.ts";

function request(authorization?: string): Request {
  return new Request("https://fn.test", {
    headers: authorization ? { Authorization: authorization } : {},
  });
}

const verifyAs = (claims: Record<string, unknown> | null): TokenVerifier => () =>
  Promise.resolve(claims);

Deno.test("extractBearerToken reads a bearer token", () => {
  assertEquals(extractBearerToken(request("Bearer abc.def.ghi")), "abc.def.ghi");
});

Deno.test("extractBearerToken rejects missing, other schemes and empty tokens", () => {
  assertEquals(extractBearerToken(request()), null);
  assertEquals(extractBearerToken(request("Basic abc")), null);
  assertEquals(extractBearerToken(request("Bearer   ")), null);
});

Deno.test("authenticate returns the caller of a valid account token", async () => {
  const caller = await authenticate(
    request("Bearer token"),
    verifyAs({ sub: "user-1", is_anonymous: false }),
  );

  assertEquals(caller, { userId: "user-1", isAnonymous: false });
});

Deno.test("authenticate flags anonymous sessions", async () => {
  const caller = await authenticate(
    request("Bearer token"),
    verifyAs({ sub: "anon-1", is_anonymous: true }),
  );

  assertEquals(caller, { userId: "anon-1", isAnonymous: true });
});

Deno.test("authenticate passes the token to the verifier", async () => {
  let received = "";
  await authenticate(request("Bearer my-token"), (token) => {
    received = token;
    return Promise.resolve({ sub: "user-1" });
  });

  assertEquals(received, "my-token");
});

Deno.test("authenticate rejects a request without token with 401", async () => {
  const error = await assertRejects(
    () => authenticate(request(), verifyAs({ sub: "user-1" })),
    HttpError,
  );

  assertEquals([error.status, error.code], [401, "unauthenticated"]);
});

Deno.test("authenticate rejects an invalid token with 401", async () => {
  const error = await assertRejects(
    () => authenticate(request("Bearer bad"), verifyAs(null)),
    HttpError,
  );

  assertEquals([error.status, error.code], [401, "invalid_token"]);
});

Deno.test("authenticate rejects claims without subject", async () => {
  await assertRejects(
    () => authenticate(request("Bearer token"), verifyAs({ sub: "" })),
    HttpError,
  );
  await assertRejects(
    () => authenticate(request("Bearer token"), verifyAs({ role: "anon" })),
    HttpError,
  );
});
