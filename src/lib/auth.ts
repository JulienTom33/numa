import type { AuthError } from "@supabase/supabase-js";
import {
  linkAnonymousAccountWithProvider,
  mapAuthError,
  readUpgradeRedirectError,
  resendUpgradeConfirmation,
  upgradeAnonymousAccount,
  type UpgradeError,
  type UpgradeErrorCode,
} from "./accountUpgrade";
import { supabase } from "./supabaseClient";

export type AuthMode = "signup" | "signin";

export type OAuthProvider = "google" | "apple";

export type AuthFlowErrorCode =
  | "invalid_email"
  | "email_already_used"
  | "identity_already_linked"
  | "link_expired"
  | "rate_limited"
  | "provider_unavailable"
  | "session_expired"
  | "network"
  | "unknown";

export interface AuthFlowError {
  code: AuthFlowErrorCode;
  retryable: boolean;
}

export interface AuthRequestOptions {
  redirectTo?: string;
}

export const PENDING_CONVERSION_STORAGE_KEY = "numa:pending-conversion";

const CODE_BY_UPGRADE_ERROR: Record<UpgradeErrorCode, AuthFlowErrorCode> = {
  no_session: "session_expired",
  not_anonymous: "unknown",
  email_already_used: "email_already_used",
  identity_already_linked: "identity_already_linked",
  invalid_email: "invalid_email",
  weak_password: "unknown",
  link_expired: "link_expired",
  rate_limited: "rate_limited",
  manual_linking_disabled: "provider_unavailable",
  network: "network",
  unknown: "unknown",
};

const PROVIDER_UNAVAILABLE_AUTH_CODES: ReadonlySet<string> = new Set([
  "provider_disabled",
  "email_provider_disabled",
  "otp_disabled",
  "signup_disabled",
  "anonymous_provider_disabled",
]);

const REDIRECT_ERROR_PARAMS = ["error", "error_code", "error_description"] as const;

const RETRYABLE: ReadonlySet<AuthFlowErrorCode> = new Set(["network", "rate_limited", "unknown"]);

function toAuthFlowError(code: AuthFlowErrorCode): AuthFlowError {
  return { code, retryable: RETRYABLE.has(code) };
}

export function fromUpgradeError(error: UpgradeError): AuthFlowError {
  return toAuthFlowError(CODE_BY_UPGRADE_ERROR[error.code]);
}

export function mapSupabaseAuthError(error: AuthError): AuthFlowError {
  if (error.code && PROVIDER_UNAVAILABLE_AUTH_CODES.has(error.code)) {
    return toAuthFlowError("provider_unavailable");
  }
  return fromUpgradeError(mapAuthError(error));
}

function mapOptionalError(error: AuthError | null): AuthFlowError | null {
  return error ? mapSupabaseAuthError(error) : null;
}

export function defaultAuthRedirectUrl(): string {
  return `${window.location.origin}/`;
}

export async function sendMagicLink(
  email: string,
  options: AuthRequestOptions = {},
): Promise<{ error: AuthFlowError | null }> {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: options.redirectTo, shouldCreateUser: true },
  });
  return { error: mapOptionalError(error) };
}

export async function signInWithProvider(
  provider: OAuthProvider,
  options: AuthRequestOptions = {},
): Promise<{ error: AuthFlowError | null }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: options.redirectTo },
  });
  return { error: mapOptionalError(error) };
}

export async function sendUpgradeLink(
  email: string,
  options: AuthRequestOptions = {},
): Promise<{ error: AuthFlowError | null }> {
  const result = await upgradeAnonymousAccount(email, { redirectTo: options.redirectTo });
  return { error: result.error ? fromUpgradeError(result.error) : null };
}

export async function resendUpgradeLink(
  email: string,
  options: AuthRequestOptions = {},
): Promise<{ error: AuthFlowError | null }> {
  const { error } = await resendUpgradeConfirmation(email, { redirectTo: options.redirectTo });
  return { error: error ? fromUpgradeError(error) : null };
}

export async function linkProvider(
  provider: OAuthProvider,
  options: AuthRequestOptions = {},
): Promise<{ error: AuthFlowError | null }> {
  const { error } = await linkAnonymousAccountWithProvider(provider, {
    redirectTo: options.redirectTo,
  });
  return { error: error ? fromUpgradeError(error) : null };
}

export async function signOut(): Promise<{ error: AuthFlowError | null }> {
  const { error } = await supabase.auth.signOut();
  return { error: mapOptionalError(error) };
}

export function readAuthRedirectError(url: string): AuthFlowError | null {
  const error = readUpgradeRedirectError(url);
  return error ? fromUpgradeError(error) : null;
}

export function clearAuthRedirectError(): void {
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  REDIRECT_ERROR_PARAMS.forEach((name) => {
    url.searchParams.delete(name);
    hash.delete(name);
  });
  url.hash = hash.toString();
  window.history.replaceState(window.history.state, "", url.toString());
}

export function markPendingConversion(userId: string): void {
  try {
    window.localStorage.setItem(PENDING_CONVERSION_STORAGE_KEY, userId);
  } catch {
    return;
  }
}

export function readPendingConversion(): string | null {
  try {
    return window.localStorage.getItem(PENDING_CONVERSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearPendingConversion(): void {
  try {
    window.localStorage.removeItem(PENDING_CONVERSION_STORAGE_KEY);
  } catch {
    return;
  }
}
