import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Select from "./Select";

const months = [
  { value: "1", label: "Janvier" },
  { value: "2", label: "Février" },
];

describe("Select", () => {
  it("links the label to the select and renders its options", () => {
    render(<Select id="test__select--month" label="Mois" options={months} />);

    expect(screen.getByLabelText("Mois")).toHaveAttribute("id", "test__select--month");
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("calls onChange with the selected option", async () => {
    const onChange = vi.fn();
    render(<Select id="test__select--month" label="Mois" options={months} onChange={onChange} />);

    await userEvent.selectOptions(screen.getByLabelText("Mois"), "2");

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Mois")).toHaveValue("2");
  });

  it("renders a disabled placeholder option", () => {
    render(
      <Select
        id="test__select--month"
        label="Mois"
        options={months}
        placeholder="Mois"
        defaultValue=""
      />,
    );

    expect(screen.getByRole("option", { name: "Mois" })).toBeDisabled();
    expect(screen.getByLabelText("Mois")).toHaveValue("");
  });

  it("marks the select invalid and describes the error", () => {
    render(<Select id="test__select--day" label="Jour" options={months} error="Date impossible" />);
    const select = screen.getByLabelText("Jour");

    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveAccessibleDescription("Date impossible");
  });

  it("can visually hide its label", () => {
    render(<Select id="test__select--day" label="Jour" options={months} hideLabel />);

    expect(screen.getByText("Jour")).toHaveClass("sr-only");
  });
});
