import {
  isAuthApiError,
  isAuthRetryableFetchError,
  isAuthSessionMissingError,
  type AuthError,
  type Provider,
} from "@supabase/supabase-js";
import { supabase } from "../../../shared/supabaseClient/supabaseClient";

export type UpgradeErrorCode =
  | "no_session"
  | "not_anonymous"
  | "email_already_used"
  | "identity_already_linked"
  | "invalid_email"
  | "weak_password"
  | "link_expired"
  | "rate_limited"
  | "manual_linking_disabled"
  | "network"
  | "unknown";

export interface UpgradeError {
  code: UpgradeErrorCode;
  retryable: boolean;
}

export type UpgradeStatus = "confirmation_sent" | "upgraded";

export type UpgradeResult =
  | { status: UpgradeStatus; error: null }
  | { status: null; error: UpgradeError };

export interface UpgradeOptions {
  redirectTo?: string;
}

const RETRYABLE: ReadonlySet<UpgradeErrorCode> = new Set(["network", "rate_limited", "unknown"]);

const CODE_BY_AUTH_ERROR: Record<string, UpgradeErrorCode> = {
  email_exists: "email_already_used",
  user_already_exists: "email_already_used",
  identity_already_exists: "identity_already_linked",
  email_address_invalid: "invalid_email",
  validation_failed: "invalid_email",
  weak_password: "weak_password",
  otp_expired: "link_expired",
  over_email_send_rate_limit: "rate_limited",
  over_request_rate_limit: "rate_limited",
  manual_linking_disabled: "manual_linking_disabled",
  session_not_found: "no_session",
};

export function toUpgradeError(code: UpgradeErrorCode): UpgradeError {
  return { code, retryable: RETRYABLE.has(code) };
}

export function mapAuthError(error: AuthError): UpgradeError {
  if (isAuthRetryableFetchError(error)) {
    return toUpgradeError("network");
  }
  if (isAuthSessionMissingError(error)) {
    return toUpgradeError("no_session");
  }
  if (isAuthApiError(error) && error.status === 429) {
    return toUpgradeError("rate_limited");
  }
  return toUpgradeError((error.code && CODE_BY_AUTH_ERROR[error.code]) || "unknown");
}

function mapOptionalAuthError(error: AuthError | null): UpgradeError | null {
  return error ? mapAuthError(error) : null;
}

function failure(error: UpgradeError): UpgradeResult {
  return { status: null, error };
}

async function ensureAnonymousUser(): Promise<UpgradeError | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return mapAuthError(error);
  }
  if (!data.user) {
    return toUpgradeError("no_session");
  }
  return data.user.is_anonymous ? null : toUpgradeError("not_anonymous");
}

/**
 * Rattache une adresse email à l'utilisateur anonyme courant (même user id).
 * Si la confirmation email est active, Supabase envoie un lien et l'utilisateur reste anonyme
 * jusqu'au clic (`confirmation_sent`) ; sinon la conversion est immédiate (`upgraded`).
 * Idempotent : relancer avec la même adresse renvoie simplement un nouveau lien.
 */
export async function upgradeAnonymousAccount(
  email: string,
  options: UpgradeOptions = {},
): Promise<UpgradeResult> {
  const precondition = await ensureAnonymousUser();
  if (precondition) {
    return failure(precondition);
  }

  const { data, error } = await supabase.auth.updateUser(
    { email: email.trim() },
    { emailRedirectTo: options.redirectTo },
  );
  if (error) {
    return failure(mapAuthError(error));
  }

  return { status: data.user.is_anonymous ? "confirmation_sent" : "upgraded", error: null };
}

/** Renvoie le lien de confirmation (lien expiré, email non reçu). */
export async function resendUpgradeConfirmation(
  email: string,
  options: UpgradeOptions = {},
): Promise<{ error: UpgradeError | null }> {
  const { error } = await supabase.auth.resend({
    type: "email_change",
    email: email.trim(),
    options: { emailRedirectTo: options.redirectTo },
  });
  return { error: mapOptionalAuthError(error) };
}

/**
 * Rattache un fournisseur OAuth à l'utilisateur anonyme courant (redirection vers le fournisseur).
 * Nécessite l'option « manual linking » côté Supabase.
 */
export async function linkAnonymousAccountWithProvider(
  provider: Provider,
  options: UpgradeOptions = {},
): Promise<{ error: UpgradeError | null }> {
  const precondition = await ensureAnonymousUser();
  if (precondition) {
    return { error: precondition };
  }

  const { error } = await supabase.auth.linkIdentity({
    provider,
    options: { redirectTo: options.redirectTo },
  });
  return { error: mapOptionalAuthError(error) };
}

/** Définit le mot de passe du compte, une fois l'adresse email confirmée. */
export async function setAccountPassword(password: string): Promise<{ error: UpgradeError | null }> {
  const { error } = await supabase.auth.updateUser({ password });
  return { error: mapOptionalAuthError(error) };
}

/**
 * Lit l'erreur que Supabase Auth place dans l'URL de retour d'un lien de confirmation
 * (query ou fragment, ex. `#error=access_denied&error_code=otp_expired`).
 */
export function readUpgradeRedirectError(url: string): UpgradeError | null {
  const parsed = new URL(url);
  const params = [parsed.searchParams, new URLSearchParams(parsed.hash.replace(/^#/, ""))];

  for (const param of params) {
    const errorCode = param.get("error_code");
    if (errorCode) {
      return toUpgradeError(CODE_BY_AUTH_ERROR[errorCode] ?? "unknown");
    }
    if (param.get("error")) {
      return toUpgradeError("unknown");
    }
  }
  return null;
}
