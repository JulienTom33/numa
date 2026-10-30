import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import i18n from "../../../i18n/i18n";
import { completeChart, unknownTimeChart } from "../MyChart/myChartFixtures";
import ChartDetails from "./ChartDetails";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

describe("ChartDetails", () => {
  afterEach(() => {
    i18n.removeResourceBundle("fr", "chartSignsPersonal");
    i18n.addResourceBundle("fr", "chartSignsPersonal", {});
    i18n.removeResourceBundle("fr", "chartHouses");
    i18n.addResourceBundle("fr", "chartHouses", {});
  });

  it("donne au Soleil et à la Lune un texte par signe avec la ligne pourquoi", () => {
    render(<ChartDetails idPrefix="t" summary={completeChart.summary} natal={completeChart.natal} />);

    expect(document.getElementById("t__reading--sun__text--reading")).toHaveTextContent("Le Soleil en Taureau");
    expect(document.getElementById("t__reading--sun__text--why")).toHaveTextContent("zone du Taureau");
    expect(document.getElementById("t__reading--moon__text--reading")).toHaveTextContent("La Lune en Cancer");
  });

  it("retombe sur le texte générique quand aucun contenu par signe ou par maison n'existe", () => {
    render(<ChartDetails idPrefix="t" summary={completeChart.summary} natal={completeChart.natal} />);

    expect(document.getElementById("t__text--planet-mercury")).toHaveTextContent("Mercure évoque votre façon de penser");
    expect(document.getElementById("t__text--house-mercury")).toBeNull();
  });

  it("affiche le texte par signe et par maison dès que la clé existe", () => {
    const houses = Object.fromEntries(Array.from({ length: 12 }, (_, index) => [String(index + 1), `Maison ${index + 1} : texte de test.`]));
    i18n.addResourceBundle("fr", "chartSignsPersonal", { mercury: { gemini: "Mercure en Gémeaux : texte de test." } });
    i18n.addResourceBundle("fr", "chartHouses", houses);
    render(<ChartDetails idPrefix="t" summary={completeChart.summary} natal={completeChart.natal} />);

    expect(document.getElementById("t__text--planet-mercury")).toHaveTextContent("Mercure en Gémeaux : texte de test.");
    expect(document.getElementById("t__text--house-mercury")).toHaveTextContent("texte de test");
  });

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
