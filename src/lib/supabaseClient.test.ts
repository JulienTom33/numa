import { afterEach, describe, expect, it, vi } from "vitest";

describe("supabaseClient", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("creates a client when env vars are set", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");

    const { supabase } = await import("./supabaseClient");

    expect(supabase).toBeDefined();
  });

  it("throws when env vars are missing", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");

    await expect(import("./supabaseClient")).rejects.toThrow(
      /Variables d'environnement Supabase manquantes/,
    );
  });
});
