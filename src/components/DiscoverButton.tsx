interface Props {
  onClick: () => void;
  loading: boolean;
  error: string | null;
}

function DiscoverButton({ onClick, loading, error }: Props) {
  return (
    <div id="discover-button__container--main" className="flex flex-col items-center gap-2">
      <button
        id="discover-button__button--start"
        type="button"
        onClick={onClick}
        disabled={loading}
        className="rounded-full bg-indigo-500 px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "Création de la session…" : "Découvrir sans compte"}
      </button>
      {error && (
        <p id="discover-button__error--start" role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export default DiscoverButton;
