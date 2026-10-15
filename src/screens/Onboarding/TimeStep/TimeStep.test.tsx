import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import TimeStep from "./TimeStep";
import type { TimeStepValue } from "./timeStepValue";

function renderStep(value: TimeStepValue = { precision: null }, onChange = vi.fn()) {
  render(<TimeStep value={value} onChange={onChange} />);
  return onChange;
}

function ControlledStep({ initial }: { initial: TimeStepValue }) {
  const [value, setValue] = useState(initial);
  return <TimeStep value={value} onChange={setValue} />;
}

describe("TimeStep", () => {
  it("renders three choices in a labelled group, none selected by default", () => {
    renderStep();

    expect(
      screen.getByRole("group", { name: "Connaissez-vous votre heure de naissance ?" }),
    ).toBeInTheDocument();
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
    for (const radio of radios) expect(radio).not.toBeChecked();
  });

  it("selects a precision on click", async () => {
    const onChange = renderStep();

    await userEvent.click(screen.getByText("Heure exacte"));

    expect(onChange).toHaveBeenCalledWith({ precision: "exact" });
  });

  it("enters the group with Tab and moves the selection with arrow keys", async () => {
    render(<ControlledStep initial={{ precision: "exact" }} />);

    await userEvent.tab();
    expect(screen.getByRole("radio", { name: /Heure exacte/ })).toHaveFocus();

    await userEvent.keyboard("{ArrowDown}");
    const approximate = screen.getByRole("radio", { name: /Heure approximative/ });
    expect(approximate).toBeChecked();
    expect(approximate).toHaveFocus();

    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: /Heure inconnue/ })).toBeChecked();

    await userEvent.keyboard("{ArrowUp}");
    expect(approximate).toBeChecked();
  });

  it("shows a time field for an exact time and reports the typed time", () => {
    const onChange = renderStep({ precision: "exact" });

    const field = screen.getByLabelText("Heure de naissance");
    expect(field).toHaveAttribute("id", "time-step__input--exact-time");
    fireEvent.change(field, { target: { value: "08:45" } });

    expect(onChange).toHaveBeenCalledWith({ precision: "exact", time: "08:45" });
  });

  it("removes the time when the field is cleared", () => {
    const onChange = renderStep({ precision: "exact", time: "08:45" });

    fireEvent.change(screen.getByLabelText("Heure de naissance"), { target: { value: "" } });

    expect(onChange).toHaveBeenCalledWith({ precision: "exact" });
  });

  it("asks for a time and a margin for an approximate time", async () => {
    const onChange = renderStep({ precision: "approximate", time: "08:45" });

    expect(screen.getByLabelText("Heure approximative")).toHaveValue("08:45");
    await userEvent.selectOptions(screen.getByLabelText("Marge d'incertitude"), "30 min–2 h");

    expect(onChange).toHaveBeenCalledWith({
      precision: "approximate",
      time: "08:45",
      margin: "between_30_min_and_2_h",
    });
  });

  it("offers the three margins", () => {
    renderStep({ precision: "approximate" });

    for (const label of ["< 30 min", "30 min–2 h", "> 2 h"]) {
      expect(screen.getByRole("option", { name: label })).toBeInTheDocument();
    }
  });

  it("warns about an unknown time and explains where to find it", async () => {
    renderStep({ precision: "unknown" });

    expect(screen.getByText(/ascendant et vos maisons/)).toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "Où trouver cette information ?" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/acte de naissance/)).toBeVisible();
  });

  it("clears the entered time when switching to unknown", async () => {
    const onChange = renderStep({ precision: "approximate", time: "08:45", margin: "over_2_h" });

    await userEvent.click(screen.getByText("Heure inconnue"));

    expect(onChange).toHaveBeenCalledWith({ precision: "unknown" });
  });
});
