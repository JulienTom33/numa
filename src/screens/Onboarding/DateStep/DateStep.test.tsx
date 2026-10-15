import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import DateStep from "./DateStep";
import { emptyBirthDateParts } from "./birthDateParts";
import type { BirthDateParts } from "./birthDateParts";

const today = new Date(2026, 9, 15);

function ControlledDateStep({ onContinue }: { onContinue: () => void }) {
  const [value, setValue] = useState<BirthDateParts>(emptyBirthDateParts);
  return (
    <DateStep
      value={value}
      onChange={setValue}
      onContinue={onContinue}
      onBack={vi.fn()}
      today={today}
    />
  );
}

function renderStatic(value: BirthDateParts) {
  render(
    <DateStep
      value={value}
      onChange={vi.fn()}
      onContinue={vi.fn()}
      onBack={vi.fn()}
      today={today}
    />,
  );
}

describe("DateStep", () => {
  it("renders step 2 with labelled day, month and year lists", () => {
    renderStatic(emptyBirthDateParts);

    expect(screen.getByText("Étape 2 sur 5")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Quand êtes-vous né(e) ?" })).toBeInTheDocument();
    expect(screen.getByLabelText("Jour")).toHaveAttribute("id", "date-step__select--day");
    expect(screen.getByLabelText("Mois")).toHaveAttribute("id", "date-step__select--month");
    expect(screen.getByLabelText("Année")).toHaveAttribute("id", "date-step__select--year");
    expect(screen.getByRole("option", { name: "2026" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "2027" })).not.toBeInTheDocument();
  });

  it("keeps Continue disabled while the date is incomplete", () => {
    renderStatic({ day: "14", month: "3", year: "" });

    expect(screen.getByRole("button", { name: "Continuer" })).toBeDisabled();
    expect(screen.queryByText(/Date enregistrée/)).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("confirms a valid date in French and enables Continue", async () => {
    const onContinue = vi.fn();
    render(<ControlledDateStep onContinue={onContinue} />);

    await userEvent.selectOptions(screen.getByLabelText("Jour"), "1");
    await userEvent.selectOptions(screen.getByLabelText("Mois"), "Mars");
    await userEvent.selectOptions(screen.getByLabelText("Année"), "1990");

    expect(screen.getByText("Date enregistrée : 1er mars 1990")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Continuer" }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("refuses 31 February", () => {
    renderStatic({ day: "31", month: "2", year: "1990" });

    expect(screen.getByRole("alert")).toHaveTextContent("Cette date n'existe pas");
    expect(screen.getByRole("button", { name: "Continuer" })).toBeDisabled();
    expect(screen.queryByText(/Date enregistrée/)).not.toBeInTheDocument();
  });

  it("refuses 29 February in a non-leap year", () => {
    renderStatic({ day: "29", month: "2", year: "2023" });

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuer" })).toBeDisabled();
  });

  it("forwards each list change through onChange", async () => {
    const onChange = vi.fn();
    render(
      <DateStep
        value={{ day: "14", month: "3", year: "1990" }}
        onChange={onChange}
        onContinue={vi.fn()}
        onBack={vi.fn()}
        today={today}
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText("Mois"), "Avril");

    expect(onChange).toHaveBeenCalledWith({ day: "14", month: "4", year: "1990" });
  });
});
