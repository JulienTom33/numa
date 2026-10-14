import DiscoverButton from "./components/DiscoverButton";
import DiscoveryModeBadge from "./components/DiscoveryModeBadge";
import { useAnonymousSession } from "./hooks/useAnonymousSession";

function App() {
  const { session, isAnonymous, loading, error, start } = useAnonymousSession();

  return (
    <main
      id="app__main--root"
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-4 py-8 text-slate-100 sm:px-8"
    >
      <h1 id="app__title--main" className="text-2xl font-semibold sm:text-3xl">
        Numa
      </h1>
      <p id="app__subtitle--main" className="text-sm text-slate-400 sm:text-base">
        Lectures astrologiques compréhensibles et transparentes.
      </p>

      {isAnonymous && <DiscoveryModeBadge />}

      {!session && <DiscoverButton onClick={start} loading={loading} error={error} />}
    </main>
  );
}

export default App;
