import { parseAllowedOrigins } from "../_shared/cors.ts";
import { createHandler } from "../_shared/handler.ts";
import { createSupabaseRateLimitStore, parseAiDailyLimit } from "../_shared/rateLimit.ts";
import { createAdminClient, verifySupabaseToken } from "../_shared/supabase.ts";
import { parseProviders } from "../chat/config.ts";
import { createSupabaseChartSource } from "../horoscope/store.ts";
import { createWeeklyChain } from "./provider.ts";
import { createSupabaseWeeklyStore } from "./store.ts";
import { createWeeklyHandler } from "./weekly.ts";

const admin = createAdminClient();

const provider = Deno.env.get("AI_PROVIDER_STUB") === "1"
  ? (await import("./stub.ts")).stubWeeklyProvider
  : createWeeklyChain({
    providers: parseProviders(Deno.env.get("AI_PROVIDERS")),
    getApiKey: (name) => Deno.env.get(name),
    fetchFn: fetch,
  });

Deno.serve(
  createHandler({
    methods: ["POST"],
    allowedOrigins: parseAllowedOrigins(Deno.env.get("ALLOWED_ORIGINS")),
    verifyToken: verifySupabaseToken,
    handle: createWeeklyHandler({
      charts: createSupabaseChartSource(admin),
      weekly: createSupabaseWeeklyStore(admin),
      provider,
      rateLimits: createSupabaseRateLimitStore(admin),
      dailyAiLimit: parseAiDailyLimit(Deno.env.get("AI_DAILY_LIMIT")),
    }),
  }),
);
