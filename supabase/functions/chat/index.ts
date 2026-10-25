import { parseAllowedOrigins } from "../_shared/cors.ts";
import { createHandler } from "../_shared/handler.ts";
import { createAdminClient, verifySupabaseToken } from "../_shared/supabase.ts";
import { createChainProvider } from "./chain.ts";
import { createChatHandler } from "./chat.ts";
import { parseProviders } from "./config.ts";
import { createSupabaseQuotaStore } from "./quota.ts";
import { createSupabaseChartSource, createSupabaseConversationStore } from "./store.ts";

const admin = createAdminClient();

Deno.serve(
  createHandler({
    methods: ["GET", "POST"],
    allowedOrigins: parseAllowedOrigins(Deno.env.get("ALLOWED_ORIGINS")),
    verifyToken: verifySupabaseToken,
    handle: createChatHandler({
      store: createSupabaseQuotaStore(admin),
      provider: createChainProvider({
        providers: parseProviders(Deno.env.get("AI_PROVIDERS")),
        getApiKey: (name) => Deno.env.get(name),
        fetchFn: fetch,
        now: Date.now,
        sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
      }),
      charts: createSupabaseChartSource(admin),
      conversations: createSupabaseConversationStore(admin),
    }),
  }),
);
