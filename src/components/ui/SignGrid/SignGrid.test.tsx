import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SignGrid from "./SignGrid";

describe("SignGrid", () => {
  it("renders the 12 signs as radios in a labelled group", () => {
    render(
      <SignGrid
        id="test__signs--ascendant"
        label="Votre ascendant"
        value={null}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("group", { name: "Votre ascendant" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(12);
  });

  it("checks the selected sign", () => {
    render(
      <SignGrid
        id="test__signs--ascendant"
        label="Votre ascendant"
        value="libra"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("radio", { name: "Balance" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Bélier" })).not.toBeChecked();
  });

  it("calls onChange with the clicked sign", async () => {
    const onChange = vi.fn();
    render(
      <SignGrid
        id="test__signs--ascendant"
        label="Votre ascendant"
        value={null}
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByText("Scorpion"));

    expect(onChange).toHaveBeenCalledWith("scorpio");
  });

  it("can visually hide its legend", () => {
    render(
      <SignGrid
        id="test__signs--ascendant"
        label="Votre ascendant"
        value={null}
        onChange={vi.fn()}
        hideLabel
      />,
    );

    expect(screen.getByText("Votre ascendant")).toHaveClass("sr-only");
  });
});
