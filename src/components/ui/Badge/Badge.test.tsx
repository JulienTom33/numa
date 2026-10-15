import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Badge from "./Badge";

describe("Badge", () => {
  it("renders its content with the given id", () => {
    render(<Badge id="test__badge--status">Mode découverte</Badge>);

    expect(screen.getByText("Mode découverte")).toHaveAttribute("id", "test__badge--status");
  });

  it("uses the violet tone by default", () => {
    render(<Badge id="test__badge--status">Mode découverte</Badge>);

    expect(screen.getByText("Mode découverte")).toHaveClass("bg-violet-soft", "text-violet-ink");
  });

  it.each([
    ["sage", "bg-sage-soft"],
    ["gold", "bg-gold-soft"],
    ["sky", "bg-sky-soft"],
    ["coral", "bg-coral-soft"],
    ["neutral", "border-line"],
  ] as const)("applies the %s tone", (tone, expectedClass) => {
    render(
      <Badge id="test__badge--status" tone={tone}>
        Statut
      </Badge>,
    );

    expect(screen.getByText("Statut")).toHaveClass(expectedClass);
  });
});
