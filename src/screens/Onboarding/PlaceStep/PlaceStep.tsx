import { useEffect, useState } from "react";
import Autocomplete, {
  type AutocompleteSuggestion,
} from "../../../components/ui/Autocomplete/Autocomplete";
import Button from "../../../components/ui/Button/Button";
import Callout from "../../../components/ui/Callout/Callout";

// Types minimaux, à aligner sur le service de géocodage (#19) au branchement.
export interface PlaceSuggestion {
  id: string;
  label: string;
  region?: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export type SelectedPlace = PlaceSuggestion;

export type PlaceSearch = (query: string, signal: AbortSignal) => Promise<PlaceSuggestion[]>;

interface Props {
  id: string;
  search: PlaceSearch;
  value: SelectedPlace | null;
  onChange: (place: SelectedPlace | null) => void;
}

type SearchStatus = "loading" | "success" | "error";

export const MIN_QUERY_LENGTH = 2;
export const SEARCH_DEBOUNCE_MS = 300;

function describePlace(place: PlaceSuggestion): string {
  return [place.region, place.country].filter(Boolean).join(", ");
}

function PlaceStep({ id, search, value, onChange }: Props) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [status, setStatus] = useState<SearchStatus>("loading");
  const [attempt, setAttempt] = useState(0);

  const inputId = `${id}-city`;
  const term = query.trim();
  const searching = value === null && term.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    if (!searching) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      // Le signal est vérifié ici aussi : un service qui l'ignore ne doit pas
      // pouvoir afficher la réponse d'une saisie déjà remplacée.
      search(term, controller.signal).then(
        (places) => {
          if (controller.signal.aborted) return;
          setResults(places);
          setStatus("success");
        },
        () => {
          if (controller.signal.aborted) return;
          setResults([]);
          setStatus("error");
        },
      );
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searching, term, search, attempt]);

  const handleInputChange = (next: string) => {
    setQuery(next);
    setStatus("loading");
    if (value) onChange(null);
  };

  const handleSelect = (suggestion: AutocompleteSuggestion) => {
    const place = results.find((result) => result.id === suggestion.id);
    if (!place) return;
    setQuery(place.label);
    onChange(place);
  };

  const handleRetry = () => {
    setStatus("loading");
    setAttempt((count) => count + 1);
    // Le bouton prend le focus : sans le rendre au champ, la liste reste fermée.
    document.getElementById(inputId)?.focus();
  };

  const failed = searching && status === "error";
  const suggestions: AutocompleteSuggestion[] =
    searching && status === "success"
      ? results.map((place) => ({
          id: place.id,
          label: place.label,
          description: describePlace(place),
        }))
      : [];

  return (
    <div id={id} className="flex flex-col gap-4">
      <Autocomplete
        id={inputId}
        label="Ville de naissance"
        placeholder="Ex. : Bordeaux"
        value={query}
        onInputChange={handleInputChange}
        suggestions={suggestions}
        onSelect={handleSelect}
        loading={searching && status === "loading"}
        minChars={MIN_QUERY_LENGTH}
        noResultsText="Aucune ville trouvée. Vérifiez l'orthographe ou essayez une ville proche."
        error={failed ? "La recherche a échoué. Vérifiez votre connexion." : undefined}
      />
      {failed && (
        <Button
          id={`${id}-retry`}
          variant="outline"
          size="sm"
          className="self-start"
          onClick={handleRetry}
        >
          Réessayer
        </Button>
      )}
      {value && (
        <Callout id={`${id}-selected`} tone="info" title={`${value.label}, ${describePlace(value)}`}>
          <span id={`${id}-timezone`}>Fuseau horaire détecté : {value.timezone}</span>
        </Callout>
      )}
    </div>
  );
}

export default PlaceStep;
