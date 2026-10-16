import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import {
  clearAuthRedirectError,
  clearPendingConversion,
  defaultAuthRedirectUrl,
  linkProvider,
  markPendingConversion,
  readAuthRedirectError,
  readPendingConversion,
  resendUpgradeLink,
  sendMagicLink as requestMagicLink,
  sendUpgradeLink,
  signInWithProvider as requestProviderSignIn,
  signOut as requestSignOut,
  type AuthFlowError,
  type AuthMode,
  type OAuthProvider,
} from "../lib/auth";
import { supabase } from "../lib/supabaseClient";

export type AuthStatus = "loading" | "signed_out" | "anonymous" | "authenticated";

export interface UseAuthOptions {
  redirectTo?: string;
}

export interface UseAuthResult {
  status: AuthStatus;
  session: Session | null;
  redirectError: AuthFlowError | null;
  converted: boolean;
  sendMagicLink: (email: string, mode: AuthMode) => Promise<AuthFlowError | null>;
  resendMagicLink: (email: string, mode: AuthMode) => Promise<AuthFlowError | null>;
  signInWithProvider: (provider: OAuthProvider, mode: AuthMode) => Promise<AuthFlowError | null>;
  signOut: () => Promise<AuthFlowError | null>;
  acknowledgeConversion: () => void;
  dismissRedirectError: () => void;
}

function readInitialRedirectError(): AuthFlowError | null {
  return typeof window === "undefined" ? null : readAuthRedirectError(window.location.href);
}

function deriveStatus(loading: boolean, session: Session | null): AuthStatus {
  if (loading) return "loading";
  if (!session) return "signed_out";
  return session.user.is_anonymous ? "anonymous" : "authenticated";
}

export function useAuth(options: UseAuthOptions = {}): UseAuthResult {
  const redirectTo = options.redirectTo ?? defaultAuthRedirectUrl();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectError, setRedirectError] = useState<AuthFlowError | null>(readInitialRedirectError);
  const [pendingConversionUserId, setPendingConversionUserId] = useState<string | null>(
    readPendingConversion,
  );

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (redirectError) clearAuthRedirectError();
  }, [redirectError]);

  const userId = session?.user.id ?? null;
  const isAnonymous = session?.user.is_anonymous ?? false;
  const isPermanentUser = userId !== null && !isAnonymous;

  useEffect(() => {
    if (pendingConversionUserId && isPermanentUser && userId !== pendingConversionUserId) {
      clearPendingConversion();
      setPendingConversionUserId(null);
    }
  }, [pendingConversionUserId, isPermanentUser, userId]);

  const startConversion = useCallback((anonymousUserId: string) => {
    markPendingConversion(anonymousUserId);
    setPendingConversionUserId(anonymousUserId);
  }, []);

  const cancelConversion = useCallback(() => {
    clearPendingConversion();
    setPendingConversionUserId(null);
  }, []);

  const upgradeTarget = isAnonymous ? userId : null;

  const sendMagicLink = useCallback(
    async (email: string, mode: AuthMode) => {
      if (mode === "signup" && upgradeTarget) {
        startConversion(upgradeTarget);
        const { error } = await sendUpgradeLink(email, { redirectTo });
        if (error) cancelConversion();
        return error;
      }
      const { error } = await requestMagicLink(email, { redirectTo });
      return error;
    },
    [upgradeTarget, redirectTo, startConversion, cancelConversion],
  );

  const resendMagicLink = useCallback(
    async (email: string, mode: AuthMode) => {
      if (mode === "signup" && upgradeTarget) {
        const { error } = await resendUpgradeLink(email, { redirectTo });
        return error;
      }
      const { error } = await requestMagicLink(email, { redirectTo });
      return error;
    },
    [upgradeTarget, redirectTo],
  );

  const signInWithProvider = useCallback(
    async (provider: OAuthProvider, mode: AuthMode) => {
      if (mode === "signup" && upgradeTarget) {
        startConversion(upgradeTarget);
        const { error } = await linkProvider(provider, { redirectTo });
        if (error) cancelConversion();
        return error;
      }
      const { error } = await requestProviderSignIn(provider, { redirectTo });
      return error;
    },
    [upgradeTarget, redirectTo, startConversion, cancelConversion],
  );

  const signOut = useCallback(async () => {
    const { error } = await requestSignOut();
    return error;
  }, []);

  const dismissRedirectError = useCallback(() => setRedirectError(null), []);

  return {
    status: deriveStatus(loading, session),
    session,
    redirectError,
    converted: isPermanentUser && userId === pendingConversionUserId,
    sendMagicLink,
    resendMagicLink,
    signInWithProvider,
    signOut,
    acknowledgeConversion: cancelConversion,
    dismissRedirectError,
  };
}
