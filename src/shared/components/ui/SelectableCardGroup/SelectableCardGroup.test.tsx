import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SelectableCardGroup, { type SelectableCardOption } from "./SelectableCardGroup";

type Precision = "exact" | "approximate" | "unknown";

const options: SelectableCardOption<Precision>[] = [
  { value: "exact", title: "Heure exacte", content: <p>Champ heure</p> },
  { value: "approximate", title: "Heure approximative", description: "À quelques heures près" },
  { value: "unknown", title: "Heure inconnue" },
];

function renderGroup(value: Precision | null = null, onChange = vi.fn()) {
  render(
    <SelectableCardGroup
      id="test__cards--birth-time"
      label="Connaissez-vous votre heure de naissance ?"
      options={options}
      value={value}
      onChange={onChange}
    />,
  );
  return onChange;
}

describe("SelectableCardGroup", () => {
  it("renders a labelled radio group with one radio per option", () => {
    renderGroup();

    expect(
      screen.getByRole("group", { name: "Connaissez-vous votre heure de naissance ?" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByText("À quelques heures près")).toBeInTheDocument();
  });

  it("has nothing checked when no value is selected", () => {
    renderGroup();

    for (const radio of screen.getAllByRole("radio")) expect(radio).not.toBeChecked();
  });

  it("calls onChange when a card is clicked", async () => {
    const onChange = renderGroup();

    await userEvent.click(screen.getByText("Heure inconnue"));

    expect(onChange).toHaveBeenCalledWith("unknown");
  });

  it("checks the selected option and reveals its extra content", () => {
    renderGroup("exact");

    expect(screen.getByRole("radio", { name: "Heure exacte" })).toBeChecked();
    expect(screen.getByText("Champ heure")).toBeInTheDocument();
  });

  it("hides the extra content of unselected options", () => {
    renderGroup("unknown");

    expect(screen.queryByText("Champ heure")).not.toBeInTheDocument();
  });

  it("moves the selection with arrow keys", async () => {
    const onChange = renderGroup("exact");

    screen.getByRole("radio", { name: "Heure exacte" }).focus();
    await userEvent.keyboard("{ArrowDown}");

    expect(onChange).toHaveBeenCalledWith("approximate");
  });

  it("can visually hide its legend", () => {
    render(
      <SelectableCardGroup
        id="test__cards--birth-time"
        label="Précision"
        options={options}
        value={null}
        onChange={vi.fn()}
        hideLabel
      />,
    );

    expect(screen.getByText("Précision")).toHaveClass("sr-only");
  });
});
