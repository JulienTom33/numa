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
}

interface AdminAuthClient {
  auth: {
    admin: {
      deleteUser(userId: string): Promise<{ error: unknown }>;
    };
  };
}

export function createSupabaseAccountDeleter(client: AdminAuthClient): AccountDeleter {
  return {
    deleteUser: async (userId) => {
      const { error } = await client.auth.admin.deleteUser(userId);
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
    return json({ deleted: true });
  };
}
