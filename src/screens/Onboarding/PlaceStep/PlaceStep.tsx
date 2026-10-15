import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Autocomplete, {
  type AutocompleteSuggestion,
} from "../../../components/ui/Autocomplete/Autocomplete";
import Button from "../../../components/ui/Button/Button";
import Callout from "../../../components/ui/Callout/Callout";
import type { BirthPlace } from "../../../lib/birthData";
import type { PlaceSuggestion } from "../../../lib/placeSearch";
import type { PlaceSearch } from "./placeSearchAdapter";

export type { PlaceSuggestion } from "../../../lib/placeSearch";
export type { PlaceSearch } from "./placeSearchAdapter";

export type SelectedPlace = BirthPlace;

interface Props {
  id: string;
  /** Recherche injectée ; en production, `toPlaceSearch(searchPlaces)`. */
  search: PlaceSearch;
  value: SelectedPlace | null;
  onChange: (place: SelectedPlace | null) => void;
}

type SearchStatus = "loading" | "success" | "error";

/** Même seuil que `PLACE_SEARCH_MIN_LENGTH`, sans importer le client Supabase à l'exécution. */
export const MIN_QUERY_LENGTH = 2;
export const SEARCH_DEBOUNCE_MS = 300;

function describePlace(place: PlaceSuggestion): string {
  return [place.region, place.country].filter(Boolean).join(", ");
}

function PlaceStep({ id, search, value, onChange }: Props) {
  const { t } = useTranslation("onboarding");
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
    document.getElementById(inputId)?.focus();
  };

  const failed = searching && status === "error";
  const suggestions: AutocompleteSuggestion[] =
    searching && status === "success"
      ? results.map((place) => ({
          id: place.id,
          label: place.name,
          description: describePlace(place),
        }))
      : [];

  return (
    <div id={id} className="flex flex-col gap-4">
      <Autocomplete
        id={inputId}
        label={t("place.cityLabel")}
        placeholder={t("place.cityPlaceholder")}
        value={query}
        onInputChange={handleInputChange}
        suggestions={suggestions}
        onSelect={handleSelect}
        loading={searching && status === "loading"}
        minChars={MIN_QUERY_LENGTH}
        noResultsText={t("place.noResults")}
        error={failed ? t("place.searchFailed") : undefined}
      />
      {failed && (
        <Button
          id={`${id}-retry`}
          variant="outline"
          size="sm"
          className="self-start"
          onClick={handleRetry}
        >
          {t("place.retry")}
        </Button>
      )}
      {value && (
        <Callout id={`${id}-selected`} tone="info" title={value.label}>
          <span id={`${id}-timezone`}>{t("place.timezone", { timezone: value.timezone })}</span>
        </Callout>
      )}
    </div>
  );
}

export default PlaceStep;
