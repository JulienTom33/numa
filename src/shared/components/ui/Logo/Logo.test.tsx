import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Logo from "./Logo";

describe("Logo", () => {
  it("renders the wordmark with a decorative mark", () => {
    const { container } = render(<Logo id="test__logo--main" />);

    expect(screen.getByText("Numa")).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("exposes the mark as an image when the wordmark is hidden", () => {
    render(<Logo id="test__logo--main" showWordmark={false} />);

    expect(screen.getByRole("img", { name: "Numa" })).toBeInTheDocument();
    expect(screen.queryByText("Numa")).not.toBeInTheDocument();
  });

  it("makes the wordmark a button opening a dialog when clickable", async () => {
    const onWordmarkClick = vi.fn();
    render(<Logo id="test__logo--main" onWordmarkClick={onWordmarkClick} />);
    const wordmark = screen.getByRole("button", { name: "Numa" });

    await userEvent.click(wordmark);

    expect(wordmark).toHaveAttribute("aria-haspopup", "dialog");
    expect(onWordmarkClick).toHaveBeenCalledTimes(1);
  });

  it("scales the mark with the size", () => {
    const { container } = render(<Logo id="test__logo--main" size="lg" />);

    expect(container.querySelector("svg")).toHaveAttribute("width", "56");
  });
});
