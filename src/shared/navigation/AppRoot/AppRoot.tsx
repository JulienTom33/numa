import { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import MigrationScreen from "../../../features/discovery/MigrationScreen/MigrationScreen";
import { useAnonymousSession } from "../../../features/auth/useAnonymousSession/useAnonymousSession";
import { useAuth } from "../../../features/auth/useAuth/useAuth";
import { useOnboardingStatus } from "../../../features/onboarding/useOnboardingStatus/useOnboardingStatus";
import CookieBanner from "../../cookieConsent/CookieBanner/CookieBanner";
import CookieConsentProvider from "../../cookieConsent/CookieConsentProvider";
import { AppContext, type AppContextValue } from "../appContext/appContext";
import { authCallbackUrl, paths, tabPaths } from "../routes/routes";

const tabBarPaths: string[] = [...Object.values(tabPaths), paths.history];

function AppRoot() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
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
      <CookieBanner
        aboveTabBar={tabBarPaths.includes(pathname)}
        onPrivacy={pathname === paths.privacy ? undefined : () => navigate(paths.privacy)}
      />
      {auth.converted ? (
        <MigrationScreen onContinue={auth.acknowledgeConversion} />
      ) : (
        <AppContext.Provider value={value}>
          <Outlet />
        </AppContext.Provider>
      )}
    </CookieConsentProvider>
  );
}

export default AppRoot;
