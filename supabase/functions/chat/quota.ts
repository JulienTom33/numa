import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import type { Caller } from "../_shared/auth.ts";
import { HttpError } from "../_shared/http.ts";

export const ANONYMOUS_QUESTION_LIMIT = 2;

export interface QuotaStatus {
  limit: number;
  used: number;
  remaining: number;
}

export interface QuotaStore {
  reserve(userId: string, limit: number): Promise<string | null>;
  commit(reservationId: string): Promise<number>;
  release(reservationId: string): Promise<void>;
  used(userId: string): Promise<number>;
}

export interface QuotaResult<T> {
  value: T;
  quota: QuotaStatus | null;
}

function toStatus(used: number): QuotaStatus {
  return {
    limit: ANONYMOUS_QUESTION_LIMIT,
    used,
    remaining: Math.max(ANONYMOUS_QUESTION_LIMIT - used, 0),
  };
}

export async function readQuota(caller: Caller, store: QuotaStore): Promise<QuotaStatus | null> {
  return caller.isAnonymous ? toStatus(await store.used(caller.userId)) : null;
}

export async function answerWithQuota<T>(
  caller: Caller,
  store: QuotaStore,
  generate: () => Promise<T>,
): Promise<QuotaResult<T>> {
  if (!caller.isAnonymous) {
    return { value: await generate(), quota: null };
  }

  const reservationId = await store.reserve(caller.userId, ANONYMOUS_QUESTION_LIMIT);
  if (!reservationId) {
    throw new HttpError(
      429,
      "question_quota_exceeded",
      "Vous avez utilisé vos questions gratuites. Créez un compte pour continuer.",
    );
  }

  let value: T;
  try {
    value = await generate();
  } catch (error) {
    await store.release(reservationId);
    if (error instanceof HttpError) throw error;
    console.error("provider_error", error instanceof Error ? error.name : typeof error);
    throw new HttpError(
      502,
      "provider_unavailable",
      "La réponse n'a pas pu être générée. Votre question n'a pas été décomptée.",
    );
  }

  return { value, quota: toStatus(await store.commit(reservationId)) };
}

async function callRpc<T>(
  client: SupabaseClient,
  name: string,
  args: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await client.rpc(name, args);
  if (error) throw new Error(`rpc_${name}_failed`);
  return data as T;
}

export function createSupabaseQuotaStore(client: SupabaseClient): QuotaStore {
  return {
    reserve: (userId, limit) =>
      callRpc<string | null>(client, "reserve_question", { p_user_id: userId, p_limit: limit }),
    commit: (reservationId) =>
      callRpc<number>(client, "commit_question", { p_reservation_id: reservationId }),
    release: (reservationId) =>
      callRpc<void>(client, "release_question", { p_reservation_id: reservationId }),
    used: (userId) => callRpc<number>(client, "question_count", { p_user_id: userId }),
  };
}
