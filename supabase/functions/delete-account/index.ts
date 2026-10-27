import { parseAllowedOrigins } from "../_shared/cors.ts";
import { createHandler } from "../_shared/handler.ts";
import { createSupabaseRateLimitStore, withRateLimit } from "../_shared/rateLimit.ts";
import { createAdminClient, verifySupabaseToken } from "../_shared/supabase.ts";
import {
  createDeleteAccountHandler,
  createSupabaseAccountDeleter,
  DELETE_ACCOUNT_RATE_LIMIT,
} from "./deleteAccount.ts";

const admin = createAdminClient();

Deno.serve(
  createHandler({
    methods: ["POST"],
    allowedOrigins: parseAllowedOrigins(Deno.env.get("ALLOWED_ORIGINS")),
    verifyToken: verifySupabaseToken,
    handle: withRateLimit(
      createSupabaseRateLimitStore(admin),
      DELETE_ACCOUNT_RATE_LIMIT,
      createDeleteAccountHandler({ deleter: createSupabaseAccountDeleter(admin) }),
    ),
  }),
);
