import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Icon from "./Icon";
import { iconNames } from "./icons";

describe("Icon", () => {
  it("renders a decorative svg hidden from assistive technologies", () => {
    const { container } = render(<Icon name="close" />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
  });

  it("applies the requested size", () => {
    const { container } = render(<Icon name="info" size={14} />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("width", "14");
    expect(svg).toHaveAttribute("height", "14");
  });

  it("renders every icon of the set", () => {
    for (const name of iconNames) {
      const { container, unmount } = render(<Icon name={name} />);
      expect(container.querySelector("svg")?.childElementCount).toBeGreaterThan(0);
      unmount();
    }
  });
});
