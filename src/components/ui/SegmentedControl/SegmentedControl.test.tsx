import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SegmentedControl from "./SegmentedControl";

type Day = "yesterday" | "today" | "tomorrow";

const options: { value: Day; label: string }[] = [
  { value: "yesterday", label: "Hier" },
  { value: "today", label: "Aujourd'hui" },
  { value: "tomorrow", label: "Demain" },
];

function renderControl(value: Day = "today", onChange = vi.fn()) {
  render(
    <SegmentedControl
      id="test__segmented--day"
      label="Jour de l'horoscope"
      options={options}
      value={value}
      onChange={onChange}
    />,
  );
  return onChange;
}

describe("SegmentedControl", () => {
  it("renders a labelled radiogroup with the current value checked", () => {
    renderControl();

    expect(screen.getByRole("radiogroup", { name: "Jour de l'horoscope" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Aujourd'hui" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Hier" })).not.toBeChecked();
  });

  it("only makes the checked option tabbable", () => {
    renderControl();

    expect(screen.getByRole("radio", { name: "Aujourd'hui" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("radio", { name: "Demain" })).toHaveAttribute("tabindex", "-1");
  });

  it("calls onChange when an option is clicked", async () => {
    const onChange = renderControl();

    await userEvent.click(screen.getByRole("radio", { name: "Demain" }));

    expect(onChange).toHaveBeenCalledWith("tomorrow");
  });

  it.each([
    ["{ArrowRight}", "tomorrow"],
    ["{ArrowDown}", "tomorrow"],
    ["{ArrowLeft}", "yesterday"],
    ["{ArrowUp}", "yesterday"],
    ["{Home}", "yesterday"],
    ["{End}", "tomorrow"],
  ])("moves the selection with %s", async (key, expected) => {
    const onChange = renderControl();

    screen.getByRole("radio", { name: "Aujourd'hui" }).focus();
    await userEvent.keyboard(key);

    expect(onChange).toHaveBeenCalledWith(expected);
  });

  it("wraps around at both ends", async () => {
    const onChange = renderControl("tomorrow");

    screen.getByRole("radio", { name: "Demain" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith("yesterday");
  });

  it("wraps backwards from the first option", async () => {
    const onChange = renderControl("yesterday");

    screen.getByRole("radio", { name: "Hier" }).focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(onChange).toHaveBeenLastCalledWith("tomorrow");
  });

  it("ignores other keys", async () => {
    const onChange = renderControl();

    screen.getByRole("radio", { name: "Aujourd'hui" }).focus();
    await userEvent.keyboard("a");

    expect(onChange).not.toHaveBeenCalled();
  });
});
