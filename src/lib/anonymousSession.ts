import type { PostgrestError } from "@supabase/supabase-js";
import i18n from "../i18n";
import { supabase } from "./supabaseClient";

export interface AnonymousSessionError {
  message: string;
}

function toSessionError(error: { message: string } | PostgrestError | null): AnonymousSessionError | null {
  return error ? { message: error.message } : null;
}

/**
 * Crée une session anonyme Supabase et rattache un profil applicatif au user_id créé.
 * L'insertion du profil est idempotente (upsert) : un retry après échec réseau ne duplique rien.
 */
export async function startAnonymousSession(): Promise<{ error: AnonymousSessionError | null }> {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    return { error: toSessionError(error) ?? { message: i18n.t("auth:anonymousSession.notCreated") } };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: data.user.id }, { onConflict: "id" });

  return { error: toSessionError(profileError) };
}
