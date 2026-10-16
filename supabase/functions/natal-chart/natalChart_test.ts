import { assertEquals } from "jsr:@std/assert@1";
import type { Caller } from "../_shared/auth.ts";
import { createHandler } from "../_shared/handler.ts";
import { createNatalChartHandler } from "./natalChart.ts";
import type { BirthDataRow } from "./store.ts";
import { type BirthDataStore, toBirthInput } from "./store.ts";

const USER_ID = "11111111-1111-1111-1111-111111111111";

const ROW: BirthDataRow = {
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
      return Promise.resolve(row ? toBirthInput(row) : null);
    },
  };
  return { store, calls };
}

function handlerFor(store: BirthDataStore) {
  return createHandler({
    methods: ["GET", "POST"],
    allowedOrigins: ["http://localhost:5173"],
    verifyToken: (token) => Promise.resolve(token === "valid" ? { sub: USER_ID } : null),
    handle: createNatalChartHandler({ store }),
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
