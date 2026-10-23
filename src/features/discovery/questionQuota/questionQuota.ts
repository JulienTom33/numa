import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "../../../shared/supabaseClient/supabaseClient";

const CHAT_FUNCTION = "chat";

export interface QuestionQuota {
  limit: number;
  used: number;
  remaining: number;
}

export type QuestionQuotaErrorCode =
  | "question_quota_exceeded"
  | "provider_unavailable"
  | "invalid_question"
  | "unauthenticated"
  | "network_error"
  | "unknown_error";

export interface QuestionQuotaError {
  code: QuestionQuotaErrorCode;
}

export interface AskQuestionResult {
  answer: string | null;
  quota: QuestionQuota | null;
  error: QuestionQuotaError | null;
}

const UNREADABLE_ERROR: QuestionQuotaError = { code: "network_error" };

const SERVER_CODES: Partial<Record<string, QuestionQuotaErrorCode>> = {
  question_quota_exceeded: "question_quota_exceeded",
  provider_unavailable: "provider_unavailable",
  invalid_question: "invalid_question",
  unauthenticated: "unauthenticated",
  invalid_token: "unauthenticated",
};

function errorField(body: unknown): unknown {
  if (typeof body !== "object" || body === null) return undefined;
  return (body as Record<string, unknown>).error;
}

function serverCode(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const { code } = value as Record<string, unknown>;
  return typeof code === "string" ? code : undefined;
}

async function toQuotaError(error: unknown): Promise<QuestionQuotaError> {
  if (error instanceof FunctionsHttpError && error.context instanceof Response) {
    const code = serverCode(errorField(await error.context.json().catch(() => null)));
    if (code !== undefined) return { code: SERVER_CODES[code] ?? "unknown_error" };
  }
  return UNREADABLE_ERROR;
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
