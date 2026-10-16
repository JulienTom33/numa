import { parseAllowedOrigins } from "../_shared/cors.ts";
import { createHandler } from "../_shared/handler.ts";
import { verifySupabaseToken } from "../_shared/supabase.ts";
import { createNatalChartHandler } from "./natalChart.ts";
import { createSupabaseBirthDataStore } from "./store.ts";

Deno.serve(
  createHandler({
    methods: ["GET", "POST"],
    allowedOrigins: parseAllowedOrigins(Deno.env.get("ALLOWED_ORIGINS")),
    verifyToken: verifySupabaseToken,
    handle: createNatalChartHandler({ store: createSupabaseBirthDataStore() }),
  }),
);
