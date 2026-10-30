import { parseAllowedOrigins } from "../_shared/cors.ts";
import { createHandler } from "../_shared/handler.ts";
import { createSupabaseRateLimitStore, parseAiDailyLimit } from "../_shared/rateLimit.ts";
import { createAdminClient, verifySupabaseToken } from "../_shared/supabase.ts";
import { parseProviders } from "../chat/config.ts";
import { createSupabaseChartSource } from "../horoscope/store.ts";
import { createMonthlyHandler } from "./monthly.ts";
import { createMonthlyChain } from "./provider.ts";
import { createSupabaseMonthlyStore } from "./store.ts";

const admin = createAdminClient();

const provider = Deno.env.get("AI_PROVIDER_STUB") === "1"
  ? (await import("./stub.ts")).stubMonthlyProvider
  : createMonthlyChain({
    providers: parseProviders(Deno.env.get("AI_PROVIDERS")),
    getApiKey: (name) => Deno.env.get(name),
    fetchFn: fetch,
  });

Deno.serve(
  createHandler({
    functionName: "horoscope-monthly",
    methods: ["POST"],
    allowedOrigins: parseAllowedOrigins(Deno.env.get("ALLOWED_ORIGINS")),
    verifyToken: verifySupabaseToken,
    handle: createMonthlyHandler({
      charts: createSupabaseChartSource(admin),
      monthly: createSupabaseMonthlyStore(admin),
      provider,
      rateLimits: createSupabaseRateLimitStore(admin),
      dailyAiLimit: parseAiDailyLimit(Deno.env.get("AI_DAILY_LIMIT")),
    }),
  }),
);
