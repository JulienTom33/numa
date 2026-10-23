import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Switch from "./Switch";

describe("Switch", () => {
  it("exposes a labelled switch reflecting its state", () => {
    render(
      <Switch
        id="test__switch--notif"
        label="Notifications horoscope"
        checked
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("switch", { name: "Notifications horoscope" })).toBeChecked();
  });

  it("requests the opposite state when clicked", async () => {
    const onChange = vi.fn();
    render(
      <Switch
        id="test__switch--notif"
        label="Notifications horoscope"
        checked={false}
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByRole("switch"));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("toggles with the keyboard", async () => {
    const onChange = vi.fn();
    render(
      <Switch
        id="test__switch--notif"
        label="Notifications horoscope"
        checked
        onChange={onChange}
      />,
    );

    screen.getByRole("switch").focus();
    await userEvent.keyboard(" ");

    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("describes the switch when a description is given", () => {
    render(
      <Switch
        id="test__switch--notif"
        label="Notifications horoscope"
        description="Chaque matin à 8 h"
        checked={false}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("switch")).toHaveAccessibleDescription("Chaque matin à 8 h");
  });

  it("does not change when disabled", async () => {
    const onChange = vi.fn();
    render(
      <Switch
        id="test__switch--notif"
        label="Notifications horoscope"
        checked={false}
        onChange={onChange}
        disabled
      />,
    );

    await userEvent.click(screen.getByRole("switch"));

    expect(onChange).not.toHaveBeenCalled();
  });
});
