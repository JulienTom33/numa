import { parseAllowedOrigins } from "../_shared/cors.ts";
import { createHandler } from "../_shared/handler.ts";
import { json } from "../_shared/http.ts";
import { verifySupabaseToken } from "../_shared/supabase.ts";

Deno.serve(
  createHandler({
    functionName: "whoami",
    methods: ["GET"],
    allowedOrigins: parseAllowedOrigins(Deno.env.get("ALLOWED_ORIGINS")),
    verifyToken: verifySupabaseToken,
    handle: ({ caller }) => json(caller),
  }),
);
