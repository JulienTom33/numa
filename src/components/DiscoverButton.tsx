import Button from "./ui/Button/Button";

interface Props {
  onClick: () => void;
  loading: boolean;
  error: string | null;
}

function DiscoverButton({ onClick, loading, error }: Props) {
  return (
    <div id="discover-button__container--main" className="flex flex-col items-center gap-2">
      <Button
        id="discover-button__button--start"
        variant="outline"
        onClick={onClick}
        loading={loading}
        loadingLabel="Création de la session…"
      >
        Découvrir sans compte
      </Button>
      {error && (
        <p id="discover-button__error--start" role="alert" className="text-sm text-coral-ink">
          {error}
        </p>
      )}
    </div>
  );
}

export default DiscoverButton;
