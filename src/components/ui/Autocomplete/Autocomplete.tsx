import { type KeyboardEvent, useState } from "react";
import { cx } from "../../../lib/cx";
import { fieldControl, fieldLabel } from "../styles";

export interface AutocompleteSuggestion {
  id: string;
  label: string;
  description?: string;
}

interface Props {
  id: string;
  label: string;
  value: string;
  onInputChange: (value: string) => void;
  suggestions: AutocompleteSuggestion[];
  onSelect: (suggestion: AutocompleteSuggestion) => void;
  loading?: boolean;
  minChars?: number;
  placeholder?: string;
  noResultsText?: string;
  loadingText?: string;
  error?: string;
}

function Autocomplete({
  id,
  label,
  value,
  onInputChange,
  suggestions,
  onSelect,
  loading = false,
  minChars = 2,
  placeholder,
  noResultsText = "Aucun résultat",
  loadingText = "Recherche…",
  error,
}: Props) {
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const listboxId = `${id}-listbox`;
  const errorId = error ? `${id}-error` : undefined;
  const open = focused && !dismissed && value.trim().length >= minChars;
  const showSuggestions = open && !loading && suggestions.length > 0;
  const optionId = (suggestion: AutocompleteSuggestion) => `${id}-option-${suggestion.id}`;
  const activeOptionId =
    showSuggestions && activeIndex >= 0 ? optionId(suggestions[activeIndex]) : undefined;

  const select = (suggestion: AutocompleteSuggestion) => {
    onSelect(suggestion);
    setDismissed(true);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setDismissed(true);
      return;
    }
    if (!showSuggestions) return;

    const last = suggestions.length - 1;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index >= last ? 0 : index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? last : index - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      select(suggestions[activeIndex]);
    }
  };

  return (
    <div className="relative flex flex-col gap-1.5">
      <label htmlFor={id} className={fieldLabel}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showSuggestions}
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onInputChange(event.target.value);
          setDismissed(false);
          setActiveIndex(-1);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={handleKeyDown}
        className={cx(fieldControl(Boolean(error)), "px-4 placeholder:text-ink-muted")}
      />
      {error && (
        <p id={errorId} className="text-xs font-medium text-coral-ink">
          {error}
        </p>
      )}
      <ul
        id={listboxId}
        role="listbox"
        aria-label={label}
        hidden={!showSuggestions}
        className="absolute inset-x-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-field border border-line bg-white py-1 shadow-lg"
      >
        {suggestions.map((suggestion, index) => (
          <li
            key={suggestion.id}
            id={optionId(suggestion)}
            role="option"
            aria-selected={index === activeIndex}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => select(suggestion)}
            className={cx(
              "flex cursor-pointer flex-col px-4 py-2.5",
              index === activeIndex ? "bg-violet-wash" : "hover:bg-surface",
            )}
          >
            <span className="text-sm font-medium text-ink">{suggestion.label}</span>
            {suggestion.description && (
              <span className="text-xs text-ink-secondary">{suggestion.description}</span>
            )}
          </li>
        ))}
      </ul>
      {/* Une erreur affichée prime : « Aucun résultat » serait trompeur. */}
      {open && !showSuggestions && !error && (
        <p role="status" className="text-sm text-ink-secondary">
          {loading ? loadingText : noResultsText}
        </p>
      )}
    </div>
  );
}

export default Autocomplete;
