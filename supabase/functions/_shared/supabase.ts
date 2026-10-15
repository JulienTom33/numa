import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";
import type { TokenVerifier } from "./auth.ts";

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`);
  return value;
}

function readDefaultKey(keysVariable: string, legacyVariable: string): string {
  const raw = Deno.env.get(keysVariable);
  if (raw) {
    const keys = JSON.parse(raw) as Record<string, string>;
    if (keys.default) return keys.default;
  }
  return requireEnv(legacyVariable);
}

export function createPublicClient(): SupabaseClient {
  return createClient(
    requireEnv("SUPABASE_URL"),
    readDefaultKey("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export const verifySupabaseToken: TokenVerifier = async (token) => {
  const { data, error } = await createPublicClient().auth.getClaims(token);
  if (error || !data) return null;
  return data.claims;
};
