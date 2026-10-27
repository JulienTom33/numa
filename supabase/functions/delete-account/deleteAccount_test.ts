import { assertEquals } from "jsr:@std/assert@1";
import { createHandler } from "../_shared/handler.ts";
import { createMemoryRateLimitStore, withRateLimit } from "../_shared/rateLimit.ts";
import {
  type AccountDeleter,
  createDeleteAccountHandler,
  createSupabaseAccountDeleter,
  DELETE_ACCOUNT_RATE_LIMIT,
} from "./deleteAccount.ts";

const USER_ID = "11111111-1111-1111-1111-111111111111";

function setup(deleter: AccountDeleter) {
  const store = createMemoryRateLimitStore();
  const handler = createHandler({
    methods: ["POST"],
    allowedOrigins: ["http://localhost:5173"],
    verifyToken: (token) => Promise.resolve(token === "valid" ? { sub: USER_ID } : null),
    handle: withRateLimit(
      store,
      DELETE_ACCOUNT_RATE_LIMIT,
      createDeleteAccountHandler({ deleter }),
    ),
  });
  const call = (token?: string, method = "POST") =>
    handler(
      new Request("http://localhost/delete-account", {
        method,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    );
  return { call, store };
}

Deno.test("supprime le compte de l'appelant authentifié", async () => {
  const deleted: string[] = [];
  const { call } = setup({
    deleteUser: (id) => {
      deleted.push(id);
      return Promise.resolve(true);
    },
  });

  const response = await call("valid");

  assertEquals(response.status, 200);
  assertEquals(await response.json(), { deleted: true });
  assertEquals(deleted, [USER_ID]);
});

Deno.test("refuse un appel non authentifié sans rien supprimer", async () => {
  const deleted: string[] = [];
  const { call, store } = setup({
    deleteUser: (id) => {
      deleted.push(id);
      return Promise.resolve(true);
    },
  });

  assertEquals((await call()).status, 401);
  assertEquals((await call("invalide")).status, 401);
  assertEquals(deleted, []);
  assertEquals(store.calls, []);
});

Deno.test("refuse une méthode autre que POST", async () => {
  const { call } = setup({ deleteUser: () => Promise.resolve(true) });

  assertEquals((await call("valid", "GET")).status, 405);
});

Deno.test("signale un échec de suppression sans détail interne", async () => {
  const { call } = setup({ deleteUser: () => Promise.resolve(false) });

  const response = await call("valid");

  assertEquals(response.status, 500);
  assertEquals((await response.json()).error.code, "delete_failed");
});

Deno.test("applique le rate limiting par utilisateur", async () => {
  const { call, store } = setup({ deleteUser: () => Promise.resolve(false) });

  for (let i = 0; i < DELETE_ACCOUNT_RATE_LIMIT.limit; i++) await call("valid");
  const response = await call("valid");

  assertEquals(response.status, 429);
  assertEquals((await response.json()).error.code, "rate_limit_exceeded");
  assertEquals(store.calls[0], `delete-account:${USER_ID}`);
});

Deno.test("l'adaptateur Supabase traduit l'erreur du client admin", async () => {
  const ids: string[] = [];
  const ok = createSupabaseAccountDeleter({
    auth: {
      admin: {
        deleteUser: (id) => {
          ids.push(id);
          return Promise.resolve({ error: null });
        },
      },
    },
  });
  const ko = createSupabaseAccountDeleter({
    auth: { admin: { deleteUser: () => Promise.resolve({ error: new Error("boom") }) } },
  });

  assertEquals(await ok.deleteUser(USER_ID), true);
  assertEquals(ids, [USER_ID]);
  assertEquals(await ko.deleteUser(USER_ID), false);
});
