import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TransitsCard from "./TransitsCard";
import { currentSky } from "../MyChart/myChartFixtures";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

function renderCard(overrides: Partial<Parameters<typeof TransitsCard>[0]> = {}) {
  const onRetry = vi.fn();
  render(
    <TransitsCard transits={currentSky} moonUncertain={false} ascendantMissing={false} onRetry={onRetry} {...overrides} />,
  );
  return { onRetry };
}

describe("TransitsCard", () => {
  it("liste les aspects aux points natals et les positions actuelles", () => {
    renderCard();

    expect(document.getElementById("my-chart__item--aspect-mars-ascendant-conjunction")).toHaveTextContent(
      "Mars en conjonction avec votre ascendant",
    );
    expect(document.getElementById("my-chart__item--aspect-mars-ascendant-conjunction")).toHaveTextContent("écart 0,4°");
    expect(document.querySelectorAll("[id^='my-chart__item--transit-']")).toHaveLength(10);
    expect(document.getElementById("my-chart__item--transit-jupiter")).toHaveTextContent("rétrograde");
    expect(document.getElementById("my-chart__text--transits-date")).toHaveTextContent("16 octobre 2026");
  });

  it("indique l'absence d'aspect serré", () => {
    renderCard({ transits: { ...currentSky, aspects: [] } });

    expect(document.getElementById("my-chart__text--transits-empty")).toBeInTheDocument();
  });

  it("explique les points natals non utilisés", () => {
    renderCard({ moonUncertain: true, ascendantMissing: true });

    expect(document.getElementById("my-chart__text--transits-moon-skipped")).toBeInTheDocument();
    expect(document.getElementById("my-chart__text--transits-ascendant-skipped")).toBeInTheDocument();
  });

  it("propose de réessayer si le ciel actuel est indisponible", async () => {
    const { onRetry } = renderCard({ transits: null });

    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
