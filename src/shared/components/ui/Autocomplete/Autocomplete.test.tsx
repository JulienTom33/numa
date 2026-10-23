import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import Autocomplete, { type AutocompleteSuggestion } from "./Autocomplete";

const cities: AutocompleteSuggestion[] = [
  { id: "bordeaux", label: "Bordeaux", description: "Gironde, France" },
  { id: "bourges", label: "Bourges", description: "Cher, France" },
];

interface HarnessProps {
  suggestions?: AutocompleteSuggestion[];
  loading?: boolean;
  onSelect?: (suggestion: AutocompleteSuggestion) => void;
  error?: string;
}

function Harness({
  suggestions = cities,
  loading = false,
  onSelect = vi.fn(),
  error,
}: HarnessProps) {
  const [value, setValue] = useState("");
  return (
    <Autocomplete
      id="test__autocomplete--city"
      label="Ville de naissance"
      value={value}
      onInputChange={setValue}
      suggestions={suggestions}
      loading={loading}
      error={error}
      onSelect={(suggestion) => {
        onSelect(suggestion);
        setValue(suggestion.label);
      }}
    />
  );
}

describe("Autocomplete", () => {
  it("renders a labelled combobox, closed by default", () => {
    render(<Harness />);
    const input = screen.getByRole("combobox", { name: "Ville de naissance" });

    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("waits for the minimum number of characters before suggesting", async () => {
    render(<Harness />);

    await userEvent.type(screen.getByRole("combobox"), "B");
    expect(screen.queryByRole("option")).not.toBeInTheDocument();

    await userEvent.type(screen.getByRole("combobox"), "o");
    expect(screen.getAllByRole("option")).toHaveLength(2);
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-expanded", "true");
  });

  it("selects a suggestion on click and closes the list", async () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);

    await userEvent.type(screen.getByRole("combobox"), "Bo");
    await userEvent.click(screen.getByRole("option", { name: /Bourges/ }));

    expect(onSelect).toHaveBeenCalledWith(cities[1]);
    expect(screen.getByRole("combobox")).toHaveValue("Bourges");
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("navigates suggestions with the keyboard and selects with Enter", async () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);
    const input = screen.getByRole("combobox");

    await userEvent.type(input, "Bo");
    await userEvent.keyboard("{ArrowDown}");
    expect(input).toHaveAttribute("aria-activedescendant", "test__autocomplete--city-option-bordeaux");

    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(input).toHaveAttribute("aria-activedescendant", "test__autocomplete--city-option-bordeaux");

    await userEvent.keyboard("{ArrowUp}{Enter}");
    expect(onSelect).toHaveBeenCalledWith(cities[1]);
  });

  it("wraps to the last suggestion with ArrowUp", async () => {
    render(<Harness />);
    const input = screen.getByRole("combobox");

    await userEvent.type(input, "Bo");
    await userEvent.keyboard("{ArrowUp}");

    expect(input).toHaveAttribute("aria-activedescendant", "test__autocomplete--city-option-bourges");
  });

  it("does nothing on Enter when no suggestion is active", async () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);

    await userEvent.type(screen.getByRole("combobox"), "Bo{Enter}");

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("closes the list with Escape", async () => {
    render(<Harness />);

    await userEvent.type(screen.getByRole("combobox"), "Bo");
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("ignores navigation keys while closed", async () => {
    render(<Harness />);
    const input = screen.getByRole("combobox");

    await userEvent.type(input, "B");
    await userEvent.keyboard("{ArrowDown}");

    expect(input).not.toHaveAttribute("aria-activedescendant");
  });

  it("announces when there is no result", async () => {
    render(<Harness suggestions={[]} />);

    await userEvent.type(screen.getByRole("combobox"), "Zzz");

    expect(screen.getByRole("status")).toHaveTextContent("Aucun résultat");
  });

  it("announces the search while loading", async () => {
    render(<Harness loading />);

    await userEvent.type(screen.getByRole("combobox"), "Bo");

    expect(screen.getByRole("status")).toHaveTextContent("Recherche…");
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("closes when the input loses focus", async () => {
    render(
      <>
        <Harness />
        <button type="button">Ailleurs</button>
      </>,
    );

    await userEvent.type(screen.getByRole("combobox"), "Bo");
    await userEvent.click(screen.getByRole("button", { name: "Ailleurs" }));

    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("describes the input with its error", () => {
    render(<Harness error="Sélectionnez une ville dans la liste." />);

    expect(screen.getByRole("combobox")).toHaveAccessibleDescription(
      "Sélectionnez une ville dans la liste.",
    );
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-invalid", "true");
  });

  it("hides the no-result status while an error is shown", async () => {
    render(<Harness suggestions={[]} error="La recherche a échoué." />);

    await userEvent.type(screen.getByRole("combobox"), "Zzz");

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
