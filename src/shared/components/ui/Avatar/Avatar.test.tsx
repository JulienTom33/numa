import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Avatar from "./Avatar";
import { getInitial } from "./getInitial";

describe("getInitial", () => {
  it.each([
    ["léa", "L"],
    ["  émile", "É"],
    ["", "?"],
    ["   ", "?"],
  ])("returns the initial of %j", (name, expected) => {
    expect(getInitial(name)).toBe(expected);
  });
});

describe("Avatar", () => {
  it("renders the initial as a labelled image when not interactive", () => {
    render(<Avatar id="test__avatar--user" name="Léa" />);

    expect(screen.getByRole("img", { name: "Léa" })).toHaveTextContent("L");
  });

  it("renders a button when clickable", async () => {
    const onClick = vi.fn();
    render(
      <Avatar id="test__avatar--user" name="Léa" label="Ouvrir mon profil" onClick={onClick} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Ouvrir mon profil" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("falls back to the name as accessible label for the button", () => {
    render(<Avatar id="test__avatar--user" name="Léa" onClick={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Léa" })).toBeInTheDocument();
  });

  it("shows the edit badge when requested", () => {
    const { container } = render(<Avatar id="test__avatar--user" name="Léa" showEditBadge />);

    expect(container.querySelector(".bg-coral")).toBeInTheDocument();
  });

  it("applies the requested size", () => {
    render(<Avatar id="test__avatar--user" name="Léa" size="sm" />);

    expect(screen.getByRole("img")).toHaveClass("h-8", "w-8");
  });
});
