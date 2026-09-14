import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

/** Nombre de questions autorisées avant inscription. */
export const ANONYMOUS_QUESTION_LIMIT = 2;

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
    return { error: toSessionError(error) ?? { message: "Session anonyme non créée." } };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: data.user.id }, { onConflict: "id" });

  return { error: toSessionError(profileError) };
}

/**
 * Incrémente de façon atomique le compteur de questions anonymes du jour via la fonction
 * Postgres `increment_usage_counter` (évite une course lecture-puis-écriture côté client).
 */
export async function incrementAnonymousQuestionCount(): Promise<{
  count: number | null;
  error: AnonymousSessionError | null;
}> {
  const periodStart = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase.rpc("increment_usage_counter", {
    p_period_start: periodStart,
  });

  if (error) {
    return { count: null, error: toSessionError(error) };
  }

  return { count: data as number, error: null };
}
