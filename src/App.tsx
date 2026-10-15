import DiscoverButton from "./components/DiscoverButton";
import DiscoveryModeBadge from "./components/DiscoveryModeBadge";
import { useAnonymousSession } from "./hooks/useAnonymousSession";

function App() {
  const { session, isAnonymous, loading, error, start } = useAnonymousSession();

  return (
    <main
      id="app__main--root"
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-page px-4 py-8 text-ink sm:px-8"
    >
      <h1 id="app__title--main" className="font-display text-title-lg font-bold">
        Numa
      </h1>
      <p id="app__subtitle--main" className="text-sm text-ink-secondary sm:text-base">
        Lectures astrologiques compréhensibles et transparentes.
      </p>

      {isAnonymous && <DiscoveryModeBadge />}

      {!session && <DiscoverButton onClick={start} loading={loading} error={error} />}
    </main>
  );
}

export default App;
