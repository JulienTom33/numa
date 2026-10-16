import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { UseAuthResult } from "../../hooks/useAuth";
import type { AuthFlowError, AuthMode, OAuthProvider } from "../../lib/auth";
import AuthScreen from "../../screens/Auth/AuthScreen";
import MagicLinkScreen from "../../screens/MagicLink/MagicLinkScreen";

export type AuthFlowDestination = "welcome" | "today";

interface Props {
  initialMode: AuthMode;
  auth: UseAuthResult;
  onExit: (destination: AuthFlowDestination) => void;
}

type AuthFlowStep = "providers" | "email";

function AuthFlow({ initialMode, auth, onExit }: Props) {
  const { t } = useTranslation("auth");
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [step, setStep] = useState<AuthFlowStep>("providers");
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(null);
  const [providerError, setProviderError] = useState<AuthFlowError | null>(null);
  const [sendError, setSendError] = useState<AuthFlowError | null>(null);

  const { status, redirectError, dismissRedirectError, sendMagicLink, resendMagicLink, signInWithProvider } =
    auth;
  const isAnonymous = status === "anonymous";
  const isAuthenticated = status === "authenticated";
  const backDestination: AuthFlowDestination = isAnonymous ? "today" : "welcome";

  useEffect(() => {
    if (isAuthenticated) onExit("today");
  }, [isAuthenticated, onExit]);

  function clearErrors() {
    setProviderError(null);
    setSendError(null);
    dismissRedirectError();
  }

  async function handleProvider(provider: OAuthProvider) {
    clearErrors();
    setPendingProvider(provider);
    const error = await signInWithProvider(provider, mode);
    if (error) {
      setProviderError(error);
      setPendingProvider(null);
    }
  }

  function handleSwitchMode() {
    clearErrors();
    setMode(mode === "signup" ? "signin" : "signup");
  }

  function handleEmailLink() {
    clearErrors();
    setStep("email");
  }

  async function handleSend(email: string) {
    setSendError(null);
    const error = await sendMagicLink(email, mode);
    if (error) {
      setSendError(error);
      throw new Error(error.code);
    }
  }

  async function handleResend(email: string) {
    const error = await resendMagicLink(email, mode);
    if (error) throw new Error(error.code);
  }

  if (step === "email") {
    return (
      <MagicLinkScreen
        onSend={handleSend}
        onResend={handleResend}
        onOpenSpace={() => onExit("today")}
        onBack={() => setStep("providers")}
        sendErrorMessage={sendError ? t(`errors.${sendError.code}`) : null}
      />
    );
  }

  const displayedError = providerError ?? redirectError;

  return (
    <AuthScreen
      mode={mode}
      onBack={() => onExit(backDestination)}
      backLabel={t(backDestination === "today" ? "flow.backToToday" : "flow.backToWelcome")}
      onGoogle={() => handleProvider("google")}
      onApple={() => handleProvider("apple")}
      onEmailLink={handleEmailLink}
      onSwitchMode={handleSwitchMode}
      pendingProvider={pendingProvider}
      errorMessage={displayedError ? t(`errors.${displayedError.code}`) : null}
      noticeMessage={isAnonymous && mode === "signin" ? t("flow.anonymousSignInNotice") : null}
    />
  );
}

export default AuthFlow;
