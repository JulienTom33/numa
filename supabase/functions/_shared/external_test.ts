import { assertEquals, assertInstanceOf, assertRejects } from "jsr:@std/assert@1";
import { ExternalFailure, fetchExternal } from "./external.ts";

async function silenced(run: (logged: unknown[][]) => Promise<void>): Promise<void> {
  const original = console.error;
  const logged: unknown[][] = [];
  console.error = (...args: unknown[]) => logged.push(args);
  try {
    await run(logged);
  } finally {
    console.error = original;
  }
}

function sequence(
  ...responses: (Response | Error)[]
): { fetchFn: typeof fetch; calls: () => number } {
  let index = 0;
  const fetchFn = ((_url: string, _init?: RequestInit) => {
    const next = responses[Math.min(index, responses.length - 1)];
    index += 1;
    return next instanceof Error ? Promise.reject(next) : Promise.resolve(next.clone());
  }) as typeof fetch;
  return { fetchFn, calls: () => index };
}

const options = (fetchFn: typeof fetch, retries = 0) => ({
  fetchFn,
  service: "svc",
  timeoutMs: 100,
  retries,
});

Deno.test("fetchExternal returns an ok response and passes a timeout signal", async () => {
  let signal: AbortSignal | null | undefined;
  const fetchFn = ((_url: string, init?: RequestInit) => {
    signal = init?.signal;
    return Promise.resolve(new Response("ok"));
  }) as typeof fetch;

  const response = await fetchExternal("https://x.test", {}, options(fetchFn));

  assertEquals(await response.text(), "ok");
  assertInstanceOf(signal, AbortSignal);
});

Deno.test("fetchExternal classifies timeout, network, 429 and 5xx failures", async () => {
  await silenced(async () => {
    const cases: [Response | Error, string, number | null, number | null][] = [
      [new DOMException("t", "TimeoutError"), "timeout", null, null],
      [new TypeError("down"), "network_error", null, null],
      [
        new Response(null, { status: 429, headers: { "retry-after": "2" } }),
        "rate_limited",
        429,
        2000,
      ],
      [new Response(null, { status: 503 }), "http_error", 503, null],
      [new Response(null, { status: 404 }), "http_error", 404, null],
    ];
    for (const [outcome, kind, status, retryAfterMs] of cases) {
      const error = await assertRejects(
        () => fetchExternal("https://x.test", {}, options(sequence(outcome).fetchFn)),
        ExternalFailure,
      );
      assertEquals([error.kind, error.status, error.retryAfterMs], [kind, status, retryAfterMs]);
    }
  });
});

Deno.test("fetchExternal retries transient failures within the bound", async () => {
  await silenced(async () => {
    const flaky = sequence(new Response(null, { status: 502 }), new Response("ok"));
    const response = await fetchExternal("https://x.test", {}, options(flaky.fetchFn, 1));
    assertEquals(await response.text(), "ok");
    assertEquals(flaky.calls(), 2);

    const down = sequence(new Response(null, { status: 500 }));
    await assertRejects(
      () => fetchExternal("https://x.test", {}, options(down.fetchFn, 2)),
      ExternalFailure,
    );
    assertEquals(down.calls(), 3);
  });
});

Deno.test("fetchExternal does not retry 4xx", async () => {
  await silenced(async () => {
    const bad = sequence(new Response(null, { status: 400 }));
    await assertRejects(
      () => fetchExternal("https://x.test", {}, options(bad.fetchFn, 2)),
      ExternalFailure,
    );
    assertEquals(bad.calls(), 1);
  });
});

Deno.test("fetchExternal logs only service, kind and status", async () => {
  await silenced(async (logged) => {
    const failing = sequence(new Response("secret-body", { status: 500 }));
    await assertRejects(
      () =>
        fetchExternal(
          "https://x.test/?q=lea@example.com",
          { headers: { Authorization: "Bearer k" } },
          options(failing.fetchFn),
        ),
      ExternalFailure,
    );
    assertEquals(logged, [["external_failure", "svc", "http_error", 500]]);
  });
});
