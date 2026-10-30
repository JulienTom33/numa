import type { HandlerContext } from "../_shared/handler.ts";
import { HttpError, json } from "../_shared/http.ts";
import {
  AI_DAILY_LIMIT_EXCEEDED,
  enforceAiDailyLimit,
  enforceRateLimit,
  type RateLimitRule,
  type RateLimitStore,
} from "../_shared/rateLimit.ts";
import { isRecord } from "../chat/guards.ts";
import type { ChartSource } from "../horoscope/store.ts";
import type { HoroscopeSections } from "../horoscope/sections.ts";
import { sunSignOf } from "../horoscope-weekly/context.ts";
import { basisOf, buildMonthlyFactors, cacheKey } from "./context.ts";
import { type Month, monthOf, parseRequestedDate } from "./month.ts";
import type { MonthlyProvider } from "./provider.ts";
import type { MonthlyStore } from "./store.ts";

export const MONTHLY_RATE_LIMIT: RateLimitRule = {
  scope: "horoscope-monthly",
  limit: 10,
  windowSeconds: 60,
};

export interface MonthlyDependencies {
  charts: ChartSource;
  monthly: MonthlyStore;
  provider: MonthlyProvider;
  rateLimits: RateLimitStore;
  dailyAiLimit: number;
  now?: () => Date;
}

function respond(
  month: Month,
  sections: HoroscopeSections | null,
  factors: unknown,
  promptVersion: string | null,
): Response {
  return json({
    horoscope: {
      monthStart: month.start,
      monthEnd: month.end,
      sections,
      fallback: sections === null,
      basis: basisOf(factors),
      promptVersion,
    },
  });
}

async function withinAiQuota(store: RateLimitStore, limit: number): Promise<boolean> {
  try {
    await enforceAiDailyLimit(store, limit);
    return true;
  } catch (error) {
    if (error instanceof HttpError && error.code === AI_DAILY_LIMIT_EXCEEDED) return false;
    throw error;
  }
}

export function createMonthlyHandler(
  { charts, monthly, provider, rateLimits, dailyAiLimit, now = () => new Date() }:
    MonthlyDependencies,
) {
  return async ({ req, caller }: HandlerContext): Promise<Response> => {
    await enforceRateLimit(rateLimits, MONTHLY_RATE_LIMIT, caller.userId);
    const body = await req.json().catch(() => null);
    const month = monthOf(parseRequestedDate(isRecord(body) ? body.date : undefined, now()));

    const stored = await charts.latest(caller.userId);
    const sunSign = stored === null ? null : sunSignOf(stored.chart);
    if (stored === null || sunSign === null) {
      throw new HttpError(404, "birth_data_not_found", "birth_data_not_found");
    }

    const ascendantSign = stored.chart.angles?.ascendant.sign ?? null;
    const key = cacheKey(month, sunSign, ascendantSign);
    const existing = await monthly.find(key);
    if (existing !== null) {
      return respond(month, existing.sections, existing.factors, existing.promptVersion);
    }

    const factors = buildMonthlyFactors(month, sunSign, ascendantSign);
    const generated = await provider.generate(factors);
    if (generated === null || !(await withinAiQuota(rateLimits, dailyAiLimit))) {
      return respond(month, null, factors, null);
    }

    const saved = await monthly.save({ cacheKey: key, factors, generated });
    return respond(month, saved.sections, saved.factors, saved.promptVersion);
  };
}
