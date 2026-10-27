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
import { basisOf, buildWeeklyFactors, cacheKey, sunSignOf } from "./context.ts";
import type { WeeklyProvider } from "./provider.ts";
import type { WeeklyStore } from "./store.ts";
import { parseRequestedDate, type Week, weekOf } from "./week.ts";

export const WEEKLY_RATE_LIMIT: RateLimitRule = {
  scope: "horoscope-weekly",
  limit: 10,
  windowSeconds: 60,
};

export interface WeeklyDependencies {
  charts: ChartSource;
  weekly: WeeklyStore;
  provider: WeeklyProvider;
  rateLimits: RateLimitStore;
  dailyAiLimit: number;
  now?: () => Date;
}

function respond(
  week: Week,
  sections: HoroscopeSections | null,
  factors: unknown,
  promptVersion: string | null,
): Response {
  return json({
    horoscope: {
      weekStart: week.start,
      weekEnd: week.end,
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

export function createWeeklyHandler(
  { charts, weekly, provider, rateLimits, dailyAiLimit, now = () => new Date() }:
    WeeklyDependencies,
) {
  return async ({ req, caller }: HandlerContext): Promise<Response> => {
    await enforceRateLimit(rateLimits, WEEKLY_RATE_LIMIT, caller.userId);
    const body = await req.json().catch(() => null);
    const week = weekOf(parseRequestedDate(isRecord(body) ? body.date : undefined, now()));

    const stored = await charts.latest(caller.userId);
    const sunSign = stored === null ? null : sunSignOf(stored.chart);
    if (stored === null || sunSign === null) {
      throw new HttpError(404, "birth_data_not_found", "birth_data_not_found");
    }

    const ascendantSign = stored.chart.angles?.ascendant.sign ?? null;
    const key = cacheKey(week, sunSign, ascendantSign);
    const existing = await weekly.find(key);
    if (existing !== null) {
      return respond(week, existing.sections, existing.factors, existing.promptVersion);
    }

    const factors = buildWeeklyFactors(week, sunSign, ascendantSign);
    const generated = await provider.generate(factors);
    if (generated === null || !(await withinAiQuota(rateLimits, dailyAiLimit))) {
      return respond(week, null, factors, null);
    }

    const saved = await weekly.save({ cacheKey: key, factors, generated });
    return respond(week, saved.sections, saved.factors, saved.promptVersion);
  };
}
