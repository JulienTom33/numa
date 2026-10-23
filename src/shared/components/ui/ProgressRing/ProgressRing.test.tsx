import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProgressRing from "./ProgressRing";

describe("ProgressRing", () => {
  it("exposes its progress to assistive technologies", () => {
    render(<ProgressRing id="test__progress--chart" value={42} label="Calcul du thème" />);
    const progress = screen.getByRole("progressbar", { name: "Calcul du thème" });

    expect(progress).toHaveAttribute("aria-valuenow", "42");
    expect(progress).toHaveAttribute("aria-valuemin", "0");
    expect(progress).toHaveAttribute("aria-valuemax", "100");
    expect(screen.getByText("42 %")).toBeInTheDocument();
  });

  it.each([
    [-10, "0"],
    [150, "100"],
    [33.6, "34"],
  ])("clamps and rounds %s to %s", (value, expected) => {
    render(<ProgressRing id="test__progress--chart" value={value} label="Calcul du thème" />);

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", expected);
  });

  it("uses the requested size", () => {
    render(<ProgressRing id="test__progress--chart" value={10} label="Calcul" size={120} />);

    expect(screen.getByRole("progressbar")).toHaveStyle({ width: "120px", height: "120px" });
  });
});
