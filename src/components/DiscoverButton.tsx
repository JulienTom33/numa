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
        className="rounded-button bg-coral px-5 py-3 font-display text-base font-bold text-white transition-colors hover:bg-coral-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-ink disabled:bg-coral-disabled"
      >
        {loading ? "Création de la session…" : "Découvrir sans compte"}
      </button>
      {error && (
        <p id="discover-button__error--start" role="alert" className="text-sm text-coral-ink">
          {error}
        </p>
      )}
    </div>
  );
}

export default DiscoverButton;
