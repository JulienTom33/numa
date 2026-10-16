import { assertEquals } from "jsr:@std/assert@1";
import type { Caller } from "../_shared/auth.ts";
import { createHandler } from "../_shared/handler.ts";
import type { ChartCache } from "./cache.ts";
import { createNatalChartHandler } from "./natalChart.ts";
import type { NatalChart } from "./types.ts";
import type { BirthDataRow } from "./store.ts";
import { type BirthDataStore, toBirthInput } from "./store.ts";

interface MemoryCache {
  cache: ChartCache;
  entries: Map<string, NatalChart>;
  saves: string[];
}

function memoryCache(): MemoryCache {
  const entries = new Map<string, NatalChart>();
  const saves: string[] = [];
  const cache: ChartCache = {
    find: (birthDataId, key) => Promise.resolve(entries.get(`${birthDataId}:${key}`) ?? null),
    save: (_userId, birthDataId, key, chart) => {
      saves.push(key);
      for (const existing of [...entries.keys()]) {
        if (existing.startsWith(`${birthDataId}:`)) entries.delete(existing);
      }
      entries.set(`${birthDataId}:${key}`, chart);
      return Promise.resolve();
    },
  };
  return { cache, entries, saves };
}

const USER_ID = "11111111-1111-1111-1111-111111111111";

const BIRTH_DATA_ID = "99999999-9999-9999-9999-999999999999";

const ROW: BirthDataRow = {
  id: BIRTH_DATA_ID,
  birth_date: "1975-06-15",
  birth_time: "14:30:00",
  time_precision: "exact",
  time_margin: null,
  timezone: "Europe/Paris",
  latitude: "48.856600",
  longitude: "2.352200",
};

function storeReturning(row: BirthDataRow | null) {
  const calls: { token: string; userId: string }[] = [];
  const store: BirthDataStore = {
    findLatest: (token, userId) => {
      calls.push({ token, userId });
      return Promise.resolve(row ? { id: row.id, birth: toBirthInput(row) } : null);
    },
  };
  return { store, calls };
}

function handlerFor(store: BirthDataStore, cache: ChartCache = memoryCache().cache) {
  return createHandler({
    methods: ["GET", "POST"],
    allowedOrigins: ["http://localhost:5173"],
    verifyToken: (token) => Promise.resolve(token === "valid" ? { sub: USER_ID } : null),
    handle: createNatalChartHandler({ store, cache }),
  });
}

function request(init: RequestInit = {}): Request {
  return new Request("http://localhost/natal-chart", init);
}

const authorized = { headers: { Authorization: "Bearer valid" } };

Deno.test("JWT absent : 401 unauthenticated, aucune lecture", async () => {
  const { store, calls } = storeReturning(ROW);
  const response = await handlerFor(store)(request());
  assertEquals(response.status, 401);
  assertEquals((await response.json()).error.code, "unauthenticated");
  assertEquals(calls.length, 0);
});

Deno.test("JWT invalide : 401 invalid_token", async () => {
  const { store } = storeReturning(ROW);
  const response = await handlerFor(store)(
    request({ headers: { Authorization: "Bearer forged" } }),
  );
  assertEquals(response.status, 401);
  assertEquals((await response.json()).error.code, "invalid_token");
});

Deno.test("pas de birth_data : 404 birth_data_not_found", async () => {
  const { store } = storeReturning(null);
  const response = await handlerFor(store)(request(authorized));
  assertEquals(response.status, 404);
  assertEquals((await response.json()).error.code, "birth_data_not_found");
});

Deno.test("donnees invalides : 422 invalid_birth_data sans detail technique", async () => {
  const { store } = storeReturning({ ...ROW, timezone: "Mars/Olympus" });
  const response = await handlerFor(store)(request(authorized));
  assertEquals(response.status, 422);
  const body = await response.json();
  assertEquals(body.error, { code: "invalid_birth_data", message: "invalid_birth_data" });
});

Deno.test("succes : theme calcule pour le sub du JWT, jamais pour un id du corps", async () => {
  const { store, calls } = storeReturning(ROW);
  const response = await handlerFor(store)(
    request({
      ...authorized,
      method: "POST",
      body: JSON.stringify({ userId: "22222222-2222-2222-2222-222222222222" }),
    }),
  );
  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Cache-Control"), "no-store");
  const { chart } = await response.json();
  assertEquals(chart.confidence, "high");
  assertEquals(chart.bodies.length, 10);
  assertEquals(calls, [{ token: "valid", userId: USER_ID }]);
});

Deno.test("methode non autorisee : 405", async () => {
  const { store } = storeReturning(ROW);
  const response = await handlerFor(store)(request({ ...authorized, method: "DELETE" }));
  assertEquals(response.status, 405);
});

Deno.test("toBirthInput convertit les numeriques PostgREST en nombres", () => {
  const input = toBirthInput(ROW);
  assertEquals(input.latitude, 48.8566);
  assertEquals(input.longitude, 2.3522);
  const caller: Caller = { userId: USER_ID, isAnonymous: false };
  assertEquals(caller.userId, USER_ID);
});

async function readEvents(response: Response): Promise<Record<string, unknown>[]> {
  const text = await response.text();
  return text.trim().split("\n").map((line) => JSON.parse(line));
}

const PROGRESS_URL = "http://localhost/natal-chart?progress=1";

Deno.test("progress=1 : phases reelles dans l'ordre puis theme identique au mode JSON", async () => {
  const { store } = storeReturning(ROW);
  const handler = handlerFor(store);
  const streamed = await handler(new Request(PROGRESS_URL, authorized));
  assertEquals(streamed.status, 200);
  assertEquals(streamed.headers.get("Content-Type"), "application/x-ndjson; charset=utf-8");
  const events = await readEvents(streamed);
  assertEquals(events.slice(0, -1), [
    { phase: "validation" },
    { phase: "timezone" },
    { phase: "positions" },
    { phase: "ascendant" },
    { phase: "houses_aspects" },
    { phase: "reading" },
  ]);
  const plain = await (await handler(request(authorized))).json();
  assertEquals((events[events.length - 1] as { chart: unknown }).chart, plain.chart);
});

Deno.test("progress=1 : erreurs d'authentification et 404 restent des reponses JSON", async () => {
  const unauthenticated = await handlerFor(storeReturning(ROW).store)(new Request(PROGRESS_URL));
  assertEquals(unauthenticated.status, 401);
  await unauthenticated.body?.cancel();
  const missing = await handlerFor(storeReturning(null).store)(
    new Request(PROGRESS_URL, authorized),
  );
  assertEquals(missing.status, 404);
  await missing.body?.cancel();
});

Deno.test("progress=1 : donnees invalides signalees par un evenement d'erreur", async () => {
  const { store } = storeReturning({ ...ROW, timezone: "Mars/Olympus" });
  const response = await handlerFor(store)(new Request(PROGRESS_URL, authorized));
  assertEquals(await readEvents(response), [
    { phase: "validation" },
    { error: { code: "invalid_birth_data", message: "invalid_birth_data" } },
  ]);
});

Deno.test("cache : 1er appel calcule et enregistre, 2e appel renvoie le theme stocke", async () => {
  const memory = memoryCache();
  const handler = handlerFor(storeReturning(ROW).store, memory.cache);
  const first = await (await handler(request(authorized))).json();
  const second = await (await handler(request(authorized))).json();
  assertEquals(first.cached, false);
  assertEquals(second.cached, true);
  assertEquals(second.chart, first.chart);
  assertEquals(memory.saves.length, 1);
});

Deno.test("cache : une modification de naissance change la cle et purge l'ancienne entree", async () => {
  const memory = memoryCache();
  await handlerFor(storeReturning(ROW).store, memory.cache)(request(authorized));
  const modified = { ...ROW, birth_time: "15:30:00" };
  const response = await handlerFor(storeReturning(modified).store, memory.cache)(
    request(authorized),
  );
  assertEquals((await response.json()).cached, false);
  assertEquals(memory.saves.length, 2);
  assertEquals(memory.saves[0] === memory.saves[1], false);
  assertEquals(memory.entries.size, 1);
});

Deno.test("cache : les erreurs de calcul ne sont jamais enregistrees", async () => {
  const memory = memoryCache();
  const handler = handlerFor(
    storeReturning({ ...ROW, timezone: "Mars/Olympus" }).store,
    memory.cache,
  );
  assertEquals((await handler(request(authorized))).status, 422);
  await readEvents(await handler(new Request(PROGRESS_URL, authorized)));
  assertEquals(memory.saves.length, 0);
  assertEquals(memory.entries.size, 0);
});

Deno.test("cache : une panne du cache n'empeche pas le calcul", async () => {
  const failing: ChartCache = {
    find: () => Promise.reject(new Error("down")),
    save: () => Promise.reject(new Error("down")),
  };
  const response = await handlerFor(storeReturning(ROW).store, failing)(request(authorized));
  assertEquals(response.status, 200);
  assertEquals((await response.json()).cached, false);
});

Deno.test("cache : ecritures concurrentes identiques, une seule entree", async () => {
  const memory = memoryCache();
  const handler = handlerFor(storeReturning(ROW).store, memory.cache);
  const responses = await Promise.all([handler(request(authorized)), handler(request(authorized))]);
  const bodies = await Promise.all(responses.map((response) => response.json()));
  assertEquals(bodies[0].chart, bodies[1].chart);
  assertEquals(memory.entries.size, 1);
});

Deno.test("cache : progress=1 sur un hit emet les phases puis le theme stocke", async () => {
  const memory = memoryCache();
  const handler = handlerFor(storeReturning(ROW).store, memory.cache);
  await readEvents(await handler(new Request(PROGRESS_URL, authorized)));
  const events = await readEvents(await handler(new Request(PROGRESS_URL, authorized)));
  assertEquals(events.slice(0, -1).map((event) => event.phase), [
    "validation",
    "timezone",
    "positions",
    "ascendant",
    "houses_aspects",
    "reading",
  ]);
  assertEquals(events[events.length - 1].cached, true);
  assertEquals(memory.saves.length, 1);
});
