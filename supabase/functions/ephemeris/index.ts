import { parseAllowedOrigins } from "../_shared/cors.ts";
import { createHandler } from "../_shared/handler.ts";
import { createSupabaseRateLimitStore, RATE_LIMITS, withRateLimit } from "../_shared/rateLimit.ts";
import { createAdminClient, verifySupabaseToken } from "../_shared/supabase.ts";
import { handleEphemeris } from "./ephemeris.ts";

Deno.serve(
  createHandler({
    methods: ["GET"],
    allowedOrigins: parseAllowedOrigins(Deno.env.get("ALLOWED_ORIGINS")),
    verifyToken: verifySupabaseToken,
    handle: withRateLimit(
      createSupabaseRateLimitStore(createAdminClient()),
      RATE_LIMITS.ephemeris,
      handleEphemeris,
    ),
  }),
);
