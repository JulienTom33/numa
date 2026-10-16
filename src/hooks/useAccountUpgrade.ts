import type { Provider } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { translateUpgradeError, type TranslatedUpgradeError } from "../i18n/messages/auth";
import {
  linkAnonymousAccountWithProvider,
  readUpgradeRedirectError,
  resendUpgradeConfirmation,
  upgradeAnonymousAccount,
  type UpgradeError,
  type UpgradeOptions,
} from "../lib/accountUpgrade";
import { supabase } from "../lib/supabaseClient";

export type AccountUpgradeStep = "idle" | "submitting" | "confirmation_sent" | "upgraded";

export interface UseAccountUpgradeResult {
  step: AccountUpgradeStep;
  email: string | null;
  error: TranslatedUpgradeError | null;
  upgrade: (email: string) => Promise<void>;
  resend: () => Promise<void>;
  linkProvider: (provider: Provider) => Promise<void>;
}

function readInitialRedirectError(): UpgradeError | null {
  return typeof window === "undefined" ? null : readUpgradeRedirectError(window.location.href);
}

/**
 * Pilote la conversion de la session anonyme courante en compte permanent.
 * Passe à `upgraded` dès que Supabase signale un utilisateur non anonyme, y compris quand la
 * confirmation arrive par un autre onglet (clic sur le lien reçu par email).
 */
export function useAccountUpgrade(options: UpgradeOptions = {}): UseAccountUpgradeResult {
  const { redirectTo } = options;
  const { t } = useTranslation("auth");
  const [step, setStep] = useState<AccountUpgradeStep>("idle");
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<UpgradeError | null>(readInitialRedirectError);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && !session.user.is_anonymous) {
        setStep("upgraded");
        setError(null);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const upgrade = useCallback(
    async (nextEmail: string) => {
      setStep("submitting");
      setError(null);
      setEmail(nextEmail);

      const result = await upgradeAnonymousAccount(nextEmail, { redirectTo });
      if (result.error) {
        setError(result.error);
        setStep("idle");
        return;
      }
      setStep(result.status);
    },
    [redirectTo],
  );

  const resend = useCallback(async () => {
    if (!email) {
      return;
    }
    setStep("submitting");
    setError(null);

    const { error: resendError } = await resendUpgradeConfirmation(email, { redirectTo });
    setError(resendError);
    setStep("confirmation_sent");
  }, [email, redirectTo]);

  const linkProvider = useCallback(
    async (provider: Provider) => {
      setStep("submitting");
      setError(null);

      const { error: linkError } = await linkAnonymousAccountWithProvider(provider, { redirectTo });
      if (linkError) {
        setError(linkError);
        setStep("idle");
      }
    },
    [redirectTo],
  );

  const translatedError = useMemo(() => error && translateUpgradeError(error, t), [error, t]);

  return { step, email, error: translatedError, upgrade, resend, linkProvider };
}
