import { assertEquals } from "jsr:@std/assert@1";
import type { TokenVerifier } from "./auth.ts";
import { createHandler } from "./handler.ts";
import { HttpError, json } from "./http.ts";

const ORIGIN = "https://numa.test";

const verifyToken: TokenVerifier = (token) =>
  Promise.resolve(token === "valid" ? { sub: "user-1", is_anonymous: true } : null);

const handler = createHandler({
  functionName: "test-fn",
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
    functionName: "test-fn",
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

interface Captured {
  level: "log" | "warn" | "error";
  line: Record<string, unknown>;
}

async function capturing(run: () => Promise<void>): Promise<Captured[]> {
  const captured: Captured[] = [];
  const originals = { log: console.log, warn: console.warn, error: console.error };
  for (const level of ["log", "warn", "error"] as const) {
    console[level] = (line: string) => {
      captured.push({ level, line: JSON.parse(line) });
    };
  }
  try {
    await run();
  } finally {
    console.log = originals.log;
    console.warn = originals.warn;
    console.error = originals.error;
  }
  return captured;
}

function failingWith(error: unknown) {
  return createHandler({
    functionName: "test-fn",
    methods: ["POST"],
    allowedOrigins: [ORIGIN],
    verifyToken,
    handle: () => {
      throw error;
    },
  });
}

Deno.test("logs a request_completed info line on success", async () => {
  const captured = await capturing(async () => {
    await handler(request("POST", "valid"));
  });

  assertEquals(captured.length, 1);
  assertEquals(captured[0].level, "log");
  const { line } = captured[0];
  assertEquals(line.event, "request_completed");
  assertEquals(line.level, "info");
  assertEquals(line.function, "test-fn");
  assertEquals(line.method, "POST");
  assertEquals(line.status, 200);
  assertEquals(typeof line.request_id, "string");
  assertEquals(typeof line.latency_ms, "number");
});

Deno.test("logs auth_failure as a warning before request_completed on 401", async () => {
  const captured = await capturing(async () => {
    await handler(request("POST"));
  });

  assertEquals(captured.map((entry) => entry.line.event), ["auth_failure", "request_completed"]);
  assertEquals(captured[0].level, "warn");
  assertEquals(captured[0].line.status, 401);
  assertEquals(captured[1].level, "log");
});

Deno.test("logs quota_rejected for every quota code", async () => {
  for (
    const code of ["rate_limit_exceeded", "ai_daily_limit_exceeded", "question_quota_exceeded"]
  ) {
    const captured = await capturing(async () => {
      await failingWith(new HttpError(429, code, "Quota atteint."))(request("POST", "valid"));
    });

    assertEquals(captured.map((entry) => entry.line.event), [
      "quota_rejected",
      "request_completed",
    ]);
    assertEquals(captured[0].level, "warn");
    assertEquals(captured[0].line.code, code);
  }
});

Deno.test("does not log quota_rejected for other client errors", async () => {
  const captured = await capturing(async () => {
    await failingWith(new HttpError(400, "invalid_input", "Entrée invalide."))(
      request("POST", "valid"),
    );
  });

  assertEquals(captured.map((entry) => entry.line.event), ["request_completed"]);
});

Deno.test("logs request_completed as error with the response correlation id on 500", async () => {
  let correlationId = "";
  const captured = await capturing(async () => {
    const response = await failingWith(new Error("boom"))(request("POST", "valid"));
    assertEquals(response.status, 500);
    correlationId = (await response.json()).error.correlationId;
  });

  const completed = captured.find((entry) => entry.line.event === "request_completed");
  assertEquals(completed?.level, "error");
  assertEquals(completed?.line.status, 500);
  assertEquals(completed?.line.code, "internal_error");
  assertEquals(completed?.line.request_id, correlationId);
});

Deno.test("logs nothing for the CORS preflight", async () => {
  const captured = await capturing(async () => {
    await handler(request("OPTIONS"));
  });

  assertEquals(captured, []);
});
