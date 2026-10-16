import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

export type AnonymousSessionErrorCode = "sign_in_failed" | "profile_failed";

export interface AnonymousSessionError {
  code: AnonymousSessionErrorCode;
  message: string | null;
}

function toSessionError(
  code: AnonymousSessionErrorCode,
  error: { message: string } | PostgrestError | null,
): AnonymousSessionError | null {
  return error ? { code, message: error.message } : null;
}

/**
 * Crée une session anonyme Supabase et rattache un profil applicatif au user_id créé.
 * L'insertion du profil est idempotente (upsert) : un retry après échec réseau ne duplique rien.
 */
export async function startAnonymousSession(): Promise<{ error: AnonymousSessionError | null }> {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    return { error: toSessionError("sign_in_failed", error) ?? { code: "sign_in_failed", message: null } };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: data.user.id }, { onConflict: "id" });

  return { error: toSessionError("profile_failed", profileError) };
}
