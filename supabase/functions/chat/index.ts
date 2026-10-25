import { parseAllowedOrigins } from "../_shared/cors.ts";
import { createHandler } from "../_shared/handler.ts";
import { createSupabaseRateLimitStore, parseAiDailyLimit } from "../_shared/rateLimit.ts";
import { createAdminClient, verifySupabaseToken } from "../_shared/supabase.ts";
import { createChainProvider } from "./chain.ts";
import { createChatHandler } from "./chat.ts";
import { parseProviders } from "./config.ts";
import { createSupabaseQuotaStore } from "./quota.ts";
import { createSupabaseChartSource, createSupabaseConversationStore } from "./store.ts";

const admin = createAdminClient();

const provider = Deno.env.get("AI_PROVIDER_STUB") === "1"
  ? (await import("./stub.ts")).stubProvider
  : createChainProvider({
    providers: parseProviders(Deno.env.get("AI_PROVIDERS")),
    getApiKey: (name) => Deno.env.get(name),
    fetchFn: fetch,
    now: Date.now,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  });

Deno.serve(
  createHandler({
    methods: ["GET", "POST"],
    allowedOrigins: parseAllowedOrigins(Deno.env.get("ALLOWED_ORIGINS")),
    verifyToken: verifySupabaseToken,
    handle: createChatHandler({
      store: createSupabaseQuotaStore(admin),
      provider,
      charts: createSupabaseChartSource(admin),
      conversations: createSupabaseConversationStore(admin),
      rateLimits: createSupabaseRateLimitStore(admin),
      dailyAiLimit: parseAiDailyLimit(Deno.env.get("AI_DAILY_LIMIT")),
    }),
  }),
);
