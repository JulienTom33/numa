import { useMemo } from "react";
import { Outlet } from "react-router";
import MigrationScreen from "../../../features/discovery/MigrationScreen/MigrationScreen";
import { useAnonymousSession } from "../../../features/auth/useAnonymousSession/useAnonymousSession";
import { useAuth } from "../../../features/auth/useAuth/useAuth";
import { useOnboardingStatus } from "../../../features/onboarding/useOnboardingStatus/useOnboardingStatus";
import CookieBanner from "../../cookieConsent/CookieBanner/CookieBanner";
import CookieConsentProvider from "../../cookieConsent/CookieConsentProvider";
import { AppContext, type AppContextValue } from "../appContext/appContext";
import { authCallbackUrl } from "../routes/routes";

function AppRoot() {
  const auth = useAuth({ redirectTo: authCallbackUrl() });
  const { start, error } = useAnonymousSession();
  const session = auth.session;
  const onboarding = useOnboardingStatus(session?.user.id ?? null);
  const isAnonymous = auth.status === "anonymous";
  const discoverFailed = error !== null;

  const value = useMemo<AppContextValue>(
    () => ({ auth, session, isAnonymous, onboarding, discover: start, discoverFailed }),
    [auth, session, isAnonymous, onboarding, start, discoverFailed],
  );

  return (
    <CookieConsentProvider>
      {auth.converted ? (
        <MigrationScreen onContinue={auth.acknowledgeConversion} />
      ) : (
        <AppContext.Provider value={value}>
          <Outlet />
        </AppContext.Provider>
      )}
      <CookieBanner />
    </CookieConsentProvider>
  );
}

export default AppRoot;
