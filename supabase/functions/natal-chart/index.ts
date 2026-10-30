import { parseAllowedOrigins } from "../_shared/cors.ts";
import { createHandler } from "../_shared/handler.ts";
import { createSupabaseRateLimitStore, RATE_LIMITS, withRateLimit } from "../_shared/rateLimit.ts";
import { createAdminClient, verifySupabaseToken } from "../_shared/supabase.ts";
import { createNatalChartHandler } from "./natalChart.ts";
import { createSupabaseChartCache } from "./cache.ts";
import { createSupabaseBirthDataStore } from "./store.ts";

Deno.serve(
  createHandler({
    functionName: "natal-chart",
    methods: ["GET", "POST"],
    allowedOrigins: parseAllowedOrigins(Deno.env.get("ALLOWED_ORIGINS")),
    verifyToken: verifySupabaseToken,
    handle: withRateLimit(
      createSupabaseRateLimitStore(createAdminClient()),
      RATE_LIMITS.natalChart,
      createNatalChartHandler({
        store: createSupabaseBirthDataStore(),
        cache: createSupabaseChartCache(),
      }),
    ),
  }),
);
