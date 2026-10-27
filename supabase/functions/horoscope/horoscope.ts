import type { HandlerContext } from "../_shared/handler.ts";
import { HttpError, json } from "../_shared/http.ts";
import {
  enforceAiDailyLimit,
  enforceRateLimit,
  type RateLimitRule,
  type RateLimitStore,
} from "../_shared/rateLimit.ts";
import { isRecord } from "../chat/guards.ts";
import { basisOf, buildFactors } from "./context.ts";
import type { HoroscopeProvider } from "./provider.ts";
import type { ChartSource, HoroscopeStore, SavedHoroscope } from "./store.ts";

export const HOROSCOPE_RATE_LIMIT: RateLimitRule = {
  scope: "horoscope",
  limit: 10,
  windowSeconds: 60,
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

export interface HoroscopeDependencies {
  charts: ChartSource;
  horoscopes: HoroscopeStore;
  provider: HoroscopeProvider;
  rateLimits: RateLimitStore;
  dailyAiLimit: number;
  now?: () => Date;
}

function utcDate(instant: Date): string {
  return instant.toISOString().slice(0, 10);
}

async function readDate(req: Request, now: Date): Promise<string> {
  const body = await req.json().catch(() => null);
  const requested = isRecord(body) ? body.date : undefined;
  if (requested === undefined) return utcDate(now);
  if (typeof requested !== "string" || !ISO_DATE.test(requested)) {
    throw new HttpError(400, "invalid_date", "invalid_date");
  }
  const parsed = new Date(`${requested}T00:00:00Z`);
  const gap = Math.abs(parsed.getTime() - new Date(`${utcDate(now)}T00:00:00Z`).getTime());
  if (Number.isNaN(parsed.getTime()) || utcDate(parsed) !== requested || gap > DAY_MS) {
    throw new HttpError(400, "invalid_date", "invalid_date");
  }
  return requested;
}

function respond({ date, sections, factors, promptVersion }: SavedHoroscope): Response {
  return json({ horoscope: { date, sections, basis: basisOf(factors), promptVersion } });
}

export function createHoroscopeHandler(
  { charts, horoscopes, provider, rateLimits, dailyAiLimit, now = () => new Date() }:
    HoroscopeDependencies,
) {
  return async ({ req, caller }: HandlerContext): Promise<Response> => {
    await enforceRateLimit(rateLimits, HOROSCOPE_RATE_LIMIT, caller.userId);
    const instant = now();
    const date = await readDate(req, instant);

    const existing = await horoscopes.find(caller.userId, date);
    if (existing !== null) return respond(existing);

    const stored = await charts.latest(caller.userId);
    if (stored === null) {
      throw new HttpError(404, "birth_data_not_found", "birth_data_not_found");
    }

    await enforceAiDailyLimit(rateLimits, dailyAiLimit);
    const factors = buildFactors(stored.chart, date, instant);
    const generated = await provider.generate(factors);
    return respond(
      await horoscopes.save({
        userId: caller.userId,
        chartId: stored.id,
        date,
        factors,
        generated,
      }),
    );
  };
}
