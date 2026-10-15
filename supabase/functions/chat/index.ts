// Point d'entrée du chat : quota de questions anonymes appliqué côté serveur (#27).
import { parseAllowedOrigins } from "../_shared/cors.ts";
import { createHandler } from "../_shared/handler.ts";
import { createAdminClient, verifySupabaseToken } from "../_shared/supabase.ts";
import { createChatHandler } from "./chat.ts";
import { stubProvider } from "./provider.ts";
import { createSupabaseQuotaStore } from "./quota.ts";

Deno.serve(
  createHandler({
    methods: ["GET", "POST"],
    allowedOrigins: parseAllowedOrigins(Deno.env.get("ALLOWED_ORIGINS")),
    verifyToken: verifySupabaseToken,
    handle: createChatHandler({
      store: createSupabaseQuotaStore(createAdminClient()),
      provider: stubProvider,
    }),
  }),
);
