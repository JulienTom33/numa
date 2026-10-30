import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { NatalChartSummaryStatus } from "../useNatalChartSummary/useNatalChartSummary";
import type { NatalChartErrorCode } from "../natalChart/natalChart";
import type { NatalChartSummary } from "../natalChartSummary/natalChartSummary";
import ChartSummary from "./ChartSummary";
import { approximateTimeSummary, completeSummary, unknownTimeSummary } from "./chartSummaryFixtures";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

interface Options {
  status?: NatalChartSummaryStatus;
  summary?: NatalChartSummary | null;
  errorCode?: NatalChartErrorCode | null;
}

function renderScreen({ status = "ready", summary = completeSummary, errorCode = null }: Options = {}) {
  const onRetry = vi.fn();
  const onDiscover = vi.fn();
  render(<ChartSummary status={status} summary={summary} errorCode={errorCode} onRetry={onRetry} onDiscover={onDiscover} />);
  return { onRetry, onDiscover };
}

describe("ChartSummary", () => {
  it("affiche le titre avec le prénom et le trio avec les degrés", () => {
    renderScreen();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Votre profil astrologique, Camille");
    const trio = within(document.getElementById("chart-summary__trio--placements") as HTMLElement);
    expect(trio.getByText("Taureau")).toBeInTheDocument();
    expect(trio.getByText("Cancer")).toBeInTheDocument();
    expect(trio.getByText("Scorpion")).toBeInTheDocument();
    expect(trio.getByText("14°")).toBeInTheDocument();
    expect(trio.getByText("22°")).toBeInTheDocument();
  });

  it("omet le prénom quand il est absent", () => {
    renderScreen({ summary: { ...completeSummary, firstName: null } });

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/^Votre profil astrologique$/);
  });

  it("formule des explications au conditionnel", () => {
    renderScreen();

    expect(document.getElementById("chart-summary__item--sun")).toHaveTextContent("décrirait plutôt");
    expect(document.getElementById("chart-summary__item--moon")).toHaveTextContent("évoquerait plutôt");
    expect(document.getElementById("chart-summary__item--ascendant")).toHaveTextContent("pourrait refléter");
    expect(document.getElementById("chart-summary__callout--notes")).toBeNull();
  });

  it("explique l'absence d'Ascendant, la Lune incertaine et l'heure inconnue", () => {
    renderScreen({ summary: unknownTimeSummary });

    expect(screen.getByText("Non calculé")).toBeInTheDocument();
    expect(document.getElementById("chart-summary__item--ascendant")).toHaveTextContent("n'a pas été calculé");
    expect(document.getElementById("chart-summary__item--moon")).toHaveTextContent("Gémeaux ou en Cancer");
    expect(screen.getByText("À confirmer")).toBeInTheDocument();
    expect(document.getElementById("chart-summary__item--note-unknown_time")).toBeInTheDocument();
    expect(document.getElementById("chart-summary__item--note-moon_sign_uncertain")).toBeInTheDocument();
    expect(document.getElementById("chart-summary__value--houses")).toHaveTextContent("Non calculées");
    expect(document.getElementById("chart-summary__value--time-quality")).toHaveTextContent("Heure inconnue");
  });

  it("signale l'heure approximative et le repli de maisons", () => {
    renderScreen({ summary: approximateTimeSummary });

    expect(document.getElementById("chart-summary__item--note-approximate_time")).toBeInTheDocument();
    expect(document.getElementById("chart-summary__item--note-polar_fallback")).toBeInTheDocument();
    expect(document.getElementById("chart-summary__value--houses")).toHaveTextContent("Porphyre");
    expect(document.getElementById("chart-summary__value--time-quality")).toHaveTextContent("Heure approximative");
  });

  it("affiche la méthode : zodiaque, maisons, qualité, date et moteur", () => {
    renderScreen();

    expect(document.getElementById("chart-summary__value--zodiac")).toHaveTextContent("Tropical");
    expect(document.getElementById("chart-summary__value--houses")).toHaveTextContent("Placidus");
    expect(document.getElementById("chart-summary__value--time-quality")).toHaveTextContent("Heure exacte");
    expect(document.getElementById("chart-summary__value--computed-at")).toHaveTextContent("16 octobre 2026");
    expect(document.getElementById("chart-summary__value--engine")).toHaveTextContent("astronomy-engine 2.1.19");
  });

  it("ouvre et ferme les bulles d'aide au clavier", async () => {
    const user = userEvent.setup();
    renderScreen();

    const bubble = screen.getByRole("button", { name: "Que sont les maisons ?" });
    bubble.focus();
    await user.keyboard("{Enter}");
    expect(bubble).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/12 secteurs/)).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(bubble).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/12 secteurs/)).not.toBeInTheDocument();
  });

  it("ouvre la modale d'explication avec « Comprendre mon thème »", async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.click(screen.getByRole("button", { name: "Comprendre mon thème" }));

    const dialog = screen.getByRole("dialog", { name: "Comprendre mon thème" });
    expect(dialog).toHaveTextContent("Précision et limites");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("ouvre l'espace avec « Découvrir mon espace »", async () => {
    const user = userEvent.setup();
    const { onDiscover } = renderScreen();

    await user.click(screen.getByRole("button", { name: "Découvrir mon espace" }));

    expect(onDiscover).toHaveBeenCalledTimes(1);
  });

  it("affiche l'état de chargement", () => {
    renderScreen({ status: "loading", summary: null });

    expect(screen.getByRole("status")).toHaveTextContent("Préparation de votre profil");
  });

  it("affiche l'erreur et relance avec Réessayer", async () => {
    const user = userEvent.setup();
    const { onRetry } = renderScreen({ status: "error", summary: null, errorCode: "network_error" });

    expect(screen.getByText(/connexion a échoué/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Réessayer" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
