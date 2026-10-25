import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import type { HandlerContext } from "./handler.ts";
import { HttpError } from "./http.ts";

export const RATE_LIMIT_EXCEEDED = "rate_limit_exceeded";
export const AI_DAILY_LIMIT_EXCEEDED = "ai_daily_limit_exceeded";

export const DEFAULT_AI_DAILY_LIMIT = 1000;

const MINUTE = 60;
const DAY = 86_400;

export interface RateLimitRule {
  scope: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitStore {
  consume(key: string, limit: number, windowSeconds: number): Promise<boolean>;
}

export const RATE_LIMITS = {
  chat: { scope: "chat", limit: 10, windowSeconds: MINUTE },
  geocode: { scope: "geocode", limit: 30, windowSeconds: MINUTE },
  natalChart: { scope: "natal-chart", limit: 20, windowSeconds: MINUTE },
  currentSky: { scope: "current-sky", limit: 30, windowSeconds: MINUTE },
  ephemeris: { scope: "ephemeris", limit: 30, windowSeconds: MINUTE },
} as const satisfies Record<string, RateLimitRule>;

export async function enforceRateLimit(
  store: RateLimitStore,
  rule: RateLimitRule,
  userId: string,
): Promise<void> {
  if (!(await store.consume(`${rule.scope}:${userId}`, rule.limit, rule.windowSeconds))) {
    throw new HttpError(
      429,
      RATE_LIMIT_EXCEEDED,
      "Trop de requêtes. Réessayez dans quelques instants.",
    );
  }
}

export async function enforceAiDailyLimit(store: RateLimitStore, limit: number): Promise<void> {
  if (!(await store.consume("ai:global", limit, DAY))) {
    throw new HttpError(
      429,
      AI_DAILY_LIMIT_EXCEEDED,
      "Le service est momentanément saturé. Réessayez demain.",
    );
  }
}

export function parseAiDailyLimit(raw: string | undefined): number {
  if (raw === undefined || raw === "") return DEFAULT_AI_DAILY_LIMIT;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) throw new Error("ai_daily_limit_invalid");
  return value;
}

export function withRateLimit(
  store: RateLimitStore,
  rule: RateLimitRule,
  handle: (context: HandlerContext) => Response | Promise<Response>,
): (context: HandlerContext) => Promise<Response> {
  return async (context) => {
    await enforceRateLimit(store, rule, context.caller.userId);
    return await handle(context);
  };
}

export function createSupabaseRateLimitStore(client: SupabaseClient): RateLimitStore {
  return {
    consume: async (key, limit, windowSeconds) => {
      const { data, error } = await client.rpc("consume_rate_limit", {
        p_key: key,
        p_limit: limit,
        p_window_seconds: windowSeconds,
      });
      if (error || typeof data !== "boolean") throw new Error("rpc_consume_rate_limit_failed");
      return data;
    },
  };
}

export function createMemoryRateLimitStore(): RateLimitStore & { calls: string[] } {
  const counts = new Map<string, number>();
  const calls: string[] = [];
  return {
    calls,
    consume: (key, limit) => {
      calls.push(key);
      const count = (counts.get(key) ?? 0) + 1;
      counts.set(key, count);
      return Promise.resolve(count <= limit);
    },
  };
}
