import { assertEquals } from "jsr:@std/assert@1";
import { errorResponse, HttpError, json } from "./http.ts";

Deno.test("json sets the JSON content type and keeps the status", async () => {
  const response = json({ ok: true }, { status: 201 });

  assertEquals(response.status, 201);
  assertEquals(response.headers.get("Content-Type"), "application/json; charset=utf-8");
  assertEquals(await response.json(), { ok: true });
});

Deno.test("errorResponse exposes the code and message of an HttpError", async () => {
  const response = errorResponse(
    new HttpError(429, "quota_exceeded", "Quota atteint."),
    undefined,
    "corr-1",
  );

  assertEquals(response.status, 429);
  assertEquals(await response.json(), {
    error: { code: "quota_exceeded", message: "Quota atteint.", correlationId: "corr-1" },
  });
});

Deno.test("errorResponse generates a correlation id and logs 5xx with it", async () => {
  const original = console.error;
  const logged: unknown[][] = [];
  console.error = (...args: unknown[]) => logged.push(args);
  let body: { error: { correlationId: string } };
  try {
    body = await errorResponse(new HttpError(503, "ai_unavailable", "ai_unavailable")).json();
  } finally {
    console.error = original;
  }

  assertEquals(body.error.correlationId.length > 0, true);
  assertEquals(logged, [["http_error", "ai_unavailable", body.error.correlationId]]);
});

async function captureConsoleError(run: () => Promise<void> | void): Promise<unknown[][]> {
  const originalError = console.error;
  const logged: unknown[][] = [];
  console.error = (...args: unknown[]) => logged.push(args);
  try {
    await run();
  } finally {
    console.error = originalError;
  }
  return logged;
}

Deno.test("errorResponse hides unexpected errors behind a generic 500", async () => {
  const logged = await captureConsoleError(async () => {
    const response = errorResponse(
      new Error("secret détail interne lea@example.com"),
      undefined,
      "corr-2",
    );

    assertEquals(response.status, 500);
    assertEquals(await response.json(), {
      error: {
        code: "internal_error",
        message: "Une erreur inattendue est survenue.",
        correlationId: "corr-2",
      },
    });
  });

  assertEquals(logged, [["unexpected_error", "Error", "corr-2"]]);
});

Deno.test("errorResponse logs the type of non-Error values", async () => {
  const logged = await captureConsoleError(() => {
    errorResponse("boom", undefined, "corr-3");
  });

  assertEquals(logged, [["unexpected_error", "string", "corr-3"]]);
});

Deno.test("errorResponse adds the given headers", () => {
  const response = errorResponse(new HttpError(401, "unauthenticated", "Non."), {
    "Access-Control-Allow-Origin": "https://numa.test",
  });

  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "https://numa.test");
});
