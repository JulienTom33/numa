import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { completeChart, unknownTimeChart } from "../MyChart/myChartFixtures";
import ChartDetails from "./ChartDetails";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

describe("ChartDetails", () => {
  it("détaille planètes, maisons, rétrogradation, angles et aspects", () => {
    render(<ChartDetails idPrefix="t" summary={completeChart.summary} natal={completeChart.natal} />);

    expect(document.getElementById("t__item--planet-sun")).toHaveTextContent("Soleil · Taureau 14° · Maison");
    expect(document.getElementById("t__text--retrograde-jupiter")).toBeInTheDocument();
    expect(document.getElementById("t__item--angle-ascendant")).toHaveTextContent("Ascendant : Scorpion 22°");
    expect(document.getElementById("t__item--angle-midheaven")).toHaveTextContent("Milieu du Ciel : Vierge 2°");
    expect(document.getElementById("t__item--aspect-sun-moon-square")).toHaveTextContent("Carré · Soleil et Lune · écart 1.8°");
    expect(document.getElementById("t__text--details-confidence")).toHaveTextContent("Calcul fiable");
  });

  it("signale l'absence d'angles et les maisons non calculées sans heure", () => {
    render(<ChartDetails idPrefix="t" summary={unknownTimeChart.summary} natal={{ ...unknownTimeChart.natal, aspects: [] }} />);

    expect(document.getElementById("t__text--angles-unavailable")).toBeInTheDocument();
    expect(document.getElementById("t__item--planet-sun")).toHaveTextContent("Maison non calculée");
    expect(document.getElementById("t__text--aspects-none")).toBeInTheDocument();
    expect(document.getElementById("t__text--details-confidence")).toHaveTextContent("Calcul partiel");
  });
});
