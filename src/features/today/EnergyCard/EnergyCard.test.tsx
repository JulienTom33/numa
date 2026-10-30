import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EnergyCard from "./EnergyCard";

describe("EnergyCard", () => {
  it("explique le repère du jour, son sens et la méthode", () => {
    render(
      <EnergyCard
        energy={{
          headline: { transitBody: "mars", natalPoint: "ascendant", type: "conjunction", orb: 0.4 },
          influences: [],
        }}
        onRetry={vi.fn()}
      />,
    );

    expect(document.getElementById("today__text--energy")).toHaveTextContent("Mars en conjonction");
    expect(document.getElementById("today__text--energy-meaning")).toHaveTextContent("très proches");
    expect(document.getElementById("today__text--energy-meaning")).toHaveTextContent("0.4°");
    expect(document.getElementById("today__text--energy-how")).toHaveTextContent("calculs astronomiques");
  });

  it("propose de réessayer quand le ciel est indisponible", () => {
    const onRetry = vi.fn();
    render(<EnergyCard energy={null} onRetry={onRetry} />);

    fireEvent.click(document.getElementById("today__button--energy-retry") as HTMLElement);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
