import { assertEquals, assertThrows } from "jsr:@std/assert@1";
import { createAdminClient, createPublicClient } from "./supabase.ts";

const VARIABLES = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEYS",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SECRET_KEYS",
  "SUPABASE_SERVICE_ROLE_KEY",
];

function withEnv(values: Record<string, string>, run: () => void) {
  const saved = new Map(VARIABLES.map((name) => [name, Deno.env.get(name)]));
  VARIABLES.forEach((name) => Deno.env.delete(name));
  Object.entries(values).forEach(([name, value]) => Deno.env.set(name, value));
  try {
    run();
  } finally {
    saved.forEach((value, name) =>
      value === undefined ? Deno.env.delete(name) : Deno.env.set(name, value)
    );
  }
}

Deno.test("createPublicClient uses the default publishable key", () => {
  withEnv({
    SUPABASE_URL: "http://127.0.0.1:54321",
    SUPABASE_PUBLISHABLE_KEYS: JSON.stringify({ default: "sb_publishable_test" }),
  }, () => {
    assertEquals(typeof createPublicClient().auth.getClaims, "function");
  });
});

Deno.test("createPublicClient falls back to the legacy anon key", () => {
  withEnv({ SUPABASE_URL: "http://127.0.0.1:54321", SUPABASE_ANON_KEY: "legacy-anon" }, () => {
    assertEquals(typeof createPublicClient().auth.getClaims, "function");
  });
});

Deno.test("createPublicClient fails clearly when configuration is missing", () => {
  withEnv({}, () => {
    assertThrows(
      () => createPublicClient(),
      Error,
      "Variable d'environnement manquante : SUPABASE_URL",
    );
  });
  withEnv({ SUPABASE_URL: "http://127.0.0.1:54321", SUPABASE_PUBLISHABLE_KEYS: "{}" }, () => {
    assertThrows(() => createPublicClient(), Error, "SUPABASE_ANON_KEY");
  });
});

Deno.test("createAdminClient uses the default secret key", () => {
  withEnv({
    SUPABASE_URL: "http://127.0.0.1:54321",
    SUPABASE_SECRET_KEYS: JSON.stringify({ default: "sb_secret_test" }),
  }, () => {
    assertEquals(typeof createAdminClient().rpc, "function");
  });
});

Deno.test("createAdminClient falls back to the legacy service role key", () => {
  withEnv({ SUPABASE_URL: "http://127.0.0.1:54321", SUPABASE_SERVICE_ROLE_KEY: "legacy" }, () => {
    assertEquals(typeof createAdminClient().rpc, "function");
  });
  withEnv({ SUPABASE_URL: "http://127.0.0.1:54321" }, () => {
    assertThrows(() => createAdminClient(), Error, "SUPABASE_SERVICE_ROLE_KEY");
  });
});
