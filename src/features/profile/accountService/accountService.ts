import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "../../../shared/supabaseClient/supabaseClient";

export type AccountErrorCode = "rate_limit_exceeded" | "network_error" | "delete_failed" | "internal_error";

export interface DeleteAccountResult {
  error: AccountErrorCode | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function toAccountErrorCode(code: unknown): AccountErrorCode {
  if (code === "rate_limit_exceeded" || code === "delete_failed") return code;
  return "internal_error";
}

async function readErrorCode(error: unknown): Promise<AccountErrorCode> {
  if (!(error instanceof FunctionsHttpError)) return "network_error";
  try {
    const body: unknown = await error.context.json();
    const detail = isRecord(body) ? body.error : undefined;
    return toAccountErrorCode(isRecord(detail) ? detail.code : undefined);
  } catch {
    return "internal_error";
  }
}

export async function deleteAccount(): Promise<DeleteAccountResult> {
  const { error } = await supabase.functions.invoke<unknown>("delete-account", { method: "POST" });
  return { error: error ? await readErrorCode(error) : null };
}
