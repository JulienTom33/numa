import type { HandlerContext } from "../_shared/handler.ts";
import { HttpError, json } from "../_shared/http.ts";
import type { RateLimitRule } from "../_shared/rateLimit.ts";

export const DELETE_ACCOUNT_RATE_LIMIT = {
  scope: "delete-account",
  limit: 3,
  windowSeconds: 60,
} as const satisfies RateLimitRule;

export interface AccountDeleter {
  deleteUser(userId: string): Promise<boolean>;
  purgeRateLimits(userId: string): Promise<boolean>;
}

interface AdminClient {
  auth: {
    admin: {
      deleteUser(userId: string): Promise<{ error: unknown }>;
    };
  };
  from(table: "rate_limits"): {
    delete(): {
      like(column: "key", pattern: string): PromiseLike<{ error: unknown }>;
    };
  };
}

export function createSupabaseAccountDeleter(client: AdminClient): AccountDeleter {
  return {
    deleteUser: async (userId) => {
      const { error } = await client.auth.admin.deleteUser(userId);
      return !error;
    },
    purgeRateLimits: async (userId) => {
      const { error } = await client.from("rate_limits").delete().like("key", `%:${userId}`);
      return !error;
    },
  };
}

export function createDeleteAccountHandler(
  { deleter }: { deleter: AccountDeleter },
): (context: HandlerContext) => Promise<Response> {
  return async ({ caller }) => {
    if (!(await deleter.deleteUser(caller.userId))) {
      throw new HttpError(500, "delete_failed", "La suppression du compte a échoué.");
    }
    let purged = false;
    try {
      purged = await deleter.purgeRateLimits(caller.userId);
    } catch {
      purged = false;
    }
    if (!purged) console.error("delete-account: rate_limits_purge_failed");
    return json({ deleted: true });
  };
}
