import { useCallback, useState } from "react";
import AppShell from "./components/AppShell/AppShell";
import DiscoveryModeBadge from "./components/DiscoveryModeBadge";
import EmptyState from "./components/ui/EmptyState/EmptyState";
import DiscoveryConsultGate from "./features/discovery/DiscoveryConsultGate";
import MigrationScreen from "./features/discovery/MigrationScreen";
import OnboardingFlow from "./features/onboarding/OnboardingFlow";
import OnboardingLoading from "./features/onboarding/OnboardingLoading";
import { useOnboardingStatus } from "./features/onboarding/useOnboardingStatus";
import TabBar from "./components/ui/TabBar/TabBar";
import { useTranslation } from "react-i18next";
import AuthFlow, { type AuthFlowDestination } from "./features/auth/AuthFlow";
import { useAnonymousSession } from "./hooks/useAnonymousSession";
import { useAuth } from "./hooks/useAuth";
import type { AuthMode } from "./lib/auth";
import { useMainTabs, type MainTab } from "./navigation/mainTabs";
import Welcome from "./screens/Welcome/Welcome";

function App() {
  const { t } = useTranslation(["common", "auth"]);
  const { session, isAnonymous, error, start } = useAnonymousSession();
  const [activeTab, setActiveTab] = useState<MainTab>("today");
  const tabItems = useMainTabs();
  const onboarding = useOnboardingStatus(session?.user.id ?? null);
  const auth = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode | null>(auth.redirectError ? "signin" : null);
  const exitAuth = useCallback((destination: AuthFlowDestination) => {
    setAuthMode(null);
    if (destination === "today") setActiveTab("today");
  }, []);

  if (auth.converted) {
    return <MigrationScreen onContinue={auth.acknowledgeConversion} />;
  }

  if (authMode) {
    return <AuthFlow initialMode={authMode} auth={auth} onExit={exitAuth} />;
  }

  if (!session) {
    return (
      <Welcome
        onSignUp={() => setAuthMode("signup")}
        onSignIn={() => setAuthMode("signin")}
        onDiscover={start}
        discoverError={error ? t("auth:anonymousSession.notCreated") : null}
      />
    );
  }

  if (onboarding.status === "loading") return <OnboardingLoading />;
  if (onboarding.status === "required") {
    return (
      <OnboardingFlow
        userId={session.user.id}
        discoveryMode={isAnonymous}
        onComplete={() => {
          setActiveTab("today");
          onboarding.markCompleted();
        }}
      />
    );
  }

  const tab = tabItems.find((item) => item.key === activeTab) ?? tabItems[0];

  return (
    <AppShell
      id="app__shell--root"
      screenKey={activeTab}
      tabBar={
        <TabBar
          id="app__tabbar--main"
          items={tabItems}
          activeKey={activeTab}
          onSelect={setActiveTab}
        />
      }
    >
      <div id={`app__screen--${tab.key}`} className="flex flex-col items-center gap-2 px-4 pt-6">
        {isAnonymous && <DiscoveryModeBadge />}
        <EmptyState
          id={`app__placeholder--${tab.key}`}
          icon={tab.icon}
          title={tab.label}
          description={t("common:comingSoon")}
        />
        {isAnonymous && tab.key === "consult" && (
          <DiscoveryConsultGate onSignUp={() => setAuthMode("signup")} onSignIn={() => setAuthMode("signin")} />
        )}
      </div>
    </AppShell>
  );
}

export default App;
