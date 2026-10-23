import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Chip from "./Chip";

describe("Chip", () => {
  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(
      <Chip id="test__chip--suggestion" onClick={onClick}>
        Comment se présente ma semaine ?
      </Chip>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Comment se présente ma semaine ?" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is not a toggle when selected is not provided", () => {
    render(
      <Chip id="test__chip--suggestion" onClick={vi.fn()}>
        Suggestion
      </Chip>,
    );

    expect(screen.getByRole("button")).not.toHaveAttribute("aria-pressed");
  });

  it("exposes its pressed state when selectable", () => {
    render(
      <Chip id="test__chip--filter" onClick={vi.fn()} selected>
        Travail
      </Chip>,
    );

    expect(screen.getByRole("button", { pressed: true })).toHaveClass("bg-violet-wash");
  });

  it("does not call onClick when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Chip id="test__chip--suggestion" onClick={onClick} disabled>
        Suggestion
      </Chip>,
    );

    await userEvent.click(screen.getByRole("button"));

    expect(onClick).not.toHaveBeenCalled();
  });
});
