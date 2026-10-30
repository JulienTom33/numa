import { parseAllowedOrigins } from "../_shared/cors.ts";
import { createHandler } from "../_shared/handler.ts";
import { createSupabaseRateLimitStore, RATE_LIMITS, withRateLimit } from "../_shared/rateLimit.ts";
import { createAdminClient, verifySupabaseToken } from "../_shared/supabase.ts";
import { createSupabaseChartCache } from "../natal-chart/cache.ts";
import { createSupabaseBirthDataStore } from "../natal-chart/store.ts";
import { createCurrentSkyHandler } from "./currentSky.ts";

Deno.serve(
  createHandler({
    functionName: "current-sky",
    methods: ["GET", "POST"],
    allowedOrigins: parseAllowedOrigins(Deno.env.get("ALLOWED_ORIGINS")),
    verifyToken: verifySupabaseToken,
    handle: withRateLimit(
      createSupabaseRateLimitStore(createAdminClient()),
      RATE_LIMITS.currentSky,
      createCurrentSkyHandler({
        store: createSupabaseBirthDataStore(),
        cache: createSupabaseChartCache(),
      }),
    ),
  }),
);
