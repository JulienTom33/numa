import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { startAnonymousSession } from "../lib/anonymousSession";
import { supabase } from "../lib/supabaseClient";

export interface UseAnonymousSessionResult {
  session: Session | null;
  isAnonymous: boolean;
  loading: boolean;
  error: string | null;
  start: () => Promise<void>;
}

export function useAnonymousSession(): UseAnonymousSessionResult {
  const { t } = useTranslation("auth");
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const start = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { error: startError } = await startAnonymousSession();

    if (startError) {
      setError(startError.message ?? t("anonymousSession.notCreated"));
    }
    setLoading(false);
  }, [t]);

  return {
    session,
    isAnonymous: session?.user?.is_anonymous ?? false,
    loading,
    error,
    start,
  };
}
