import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

const CHAT_FUNCTION = "chat";

/** État du quota tel que calculé par le serveur ; null pour un compte identifié (sans quota). */
export interface QuestionQuota {
  limit: number;
  used: number;
  remaining: number;
}

export interface QuestionQuotaError {
  /** Code renvoyé par la fonction (`question_quota_exceeded`, `provider_unavailable`…). */
  code: string;
  message: string;
}

export interface AskQuestionResult {
  answer: string | null;
  quota: QuestionQuota | null;
  error: QuestionQuotaError | null;
}

const UNKNOWN_ERROR: QuestionQuotaError = {
  code: "network_error",
  message: "Le service est momentanément indisponible.",
};

function errorField(body: unknown): unknown {
  if (typeof body !== "object" || body === null) return undefined;
  return (body as Record<string, unknown>).error;
}

function isQuotaError(value: unknown): value is QuestionQuotaError {
  if (typeof value !== "object" || value === null) return false;
  const { code, message } = value as Record<string, unknown>;
  return typeof code === "string" && typeof message === "string";
}

// Les erreurs HTTP de la fonction portent `{ error: { code, message } }` dans le corps.
async function toQuotaError(error: unknown): Promise<QuestionQuotaError> {
  if (error instanceof FunctionsHttpError && error.context instanceof Response) {
    const detail = errorField(await error.context.json().catch(() => null));
    if (isQuotaError(detail)) return { code: detail.code, message: detail.message };
  }
  return UNKNOWN_ERROR;
}

/** Lit le compteur de questions depuis le serveur, seule source de vérité. */
export async function fetchQuestionQuota(): Promise<{
  quota: QuestionQuota | null;
  error: QuestionQuotaError | null;
}> {
  const { data, error } = await supabase.functions.invoke<{ quota: QuestionQuota | null }>(
    CHAT_FUNCTION,
    { method: "GET" },
  );
  if (error || !data) return { quota: null, error: await toQuotaError(error) };
  return { quota: data.quota, error: null };
}

/**
 * Pose une question : le serveur réserve une place du quota, appelle le fournisseur et ne
 * décompte la question qu'en cas de réponse réussie.
 */
export async function askQuestion(question: string): Promise<AskQuestionResult> {
  const { data, error } = await supabase.functions.invoke<{
    answer: string;
    quota: QuestionQuota | null;
  }>(CHAT_FUNCTION, { body: { question } });

  if (error || !data) {
    return { answer: null, quota: null, error: await toQuotaError(error) };
  }
  return { answer: data.answer, quota: data.quota, error: null };
}
