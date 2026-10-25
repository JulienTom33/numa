import { parseAllowedOrigins } from "../_shared/cors.ts";
import { createSupabaseRateLimitStore } from "../_shared/rateLimit.ts";
import { createAdminClient, verifySupabaseToken } from "../_shared/supabase.ts";
import { createGeocodeHandler } from "./handler.ts";

Deno.serve(
  createGeocodeHandler({
    allowedOrigins: parseAllowedOrigins(Deno.env.get("ALLOWED_ORIGINS")),
    verifyToken: verifySupabaseToken,
    fetch: (input, init) => fetch(input, init),
    rateLimits: createSupabaseRateLimitStore(createAdminClient()),
  }),
);
