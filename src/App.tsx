import { useState } from "react";
import AppShell from "./components/AppShell/AppShell";
import DiscoverButton from "./components/DiscoverButton";
import DiscoveryModeBadge from "./components/DiscoveryModeBadge";
import EmptyState from "./components/ui/EmptyState/EmptyState";
import TabBar from "./components/ui/TabBar/TabBar";
import { useAnonymousSession } from "./hooks/useAnonymousSession";
import { mainTabs, type MainTab } from "./navigation/mainTabs";

function App() {
  const { session, isAnonymous, loading, error, start } = useAnonymousSession();
  const [activeTab, setActiveTab] = useState<MainTab>("today");

  if (!session) {
    return (
      <AppShell id="app__shell--root" screenKey="welcome">
        <div
          id="app__screen--welcome"
          className="flex min-h-full flex-col items-center justify-center gap-4 px-4 py-8"
        >
          <h1 id="app__title--main" className="font-display text-title-lg font-bold">
            Numa
          </h1>
          <p id="app__subtitle--main" className="text-sm text-ink-secondary">
            Lectures astrologiques compréhensibles et transparentes.
          </p>
          <DiscoverButton onClick={start} loading={loading} error={error} />
        </div>
      </AppShell>
    );
  }

  const tab = mainTabs.find((item) => item.key === activeTab) ?? mainTabs[0];

  return (
    <AppShell
      id="app__shell--root"
      screenKey={activeTab}
      tabBar={
        <TabBar
          id="app__tabbar--main"
          items={mainTabs}
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
          description="Cet écran arrive bientôt."
        />
      </div>
    </AppShell>
  );
}

export default App;
