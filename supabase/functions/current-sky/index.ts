import { parseAllowedOrigins } from "../_shared/cors.ts";
import { createHandler } from "../_shared/handler.ts";
import { verifySupabaseToken } from "../_shared/supabase.ts";
import { createSupabaseChartCache } from "../natal-chart/cache.ts";
import { createSupabaseBirthDataStore } from "../natal-chart/store.ts";
import { createCurrentSkyHandler } from "./currentSky.ts";

Deno.serve(
  createHandler({
    methods: ["GET", "POST"],
    allowedOrigins: parseAllowedOrigins(Deno.env.get("ALLOWED_ORIGINS")),
    verifyToken: verifySupabaseToken,
    handle: createCurrentSkyHandler({
      store: createSupabaseBirthDataStore(),
      cache: createSupabaseChartCache(),
    }),
  }),
);
