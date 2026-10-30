import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { MyChartStatus } from "../useMyChart/useMyChart";
import type { NatalChartErrorCode } from "../natalChart/natalChart";
import type { MyChartData } from "../skyChart/skyChart";
import MyChart from "./MyChart";
import { approximateTimeChart, completeChart, unknownTimeChart } from "./myChartFixtures";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

interface Options {
  status?: MyChartStatus;
  data?: MyChartData | null;
  errorCode?: NatalChartErrorCode | null;
}

function renderScreen({ status = "ready", data = completeChart, errorCode = null }: Options = {}) {
  const onRetry = vi.fn();
  render(<MyChart status={status} data={data} errorCode={errorCode} onRetry={onRetry} />);
  return { onRetry };
}

describe("MyChart", () => {
  it("affiche le trio, la carte Ascendant avec degré et maison", () => {
    renderScreen();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Mon thème");
    const trio = within(document.getElementById("my-chart__trio--placements") as HTMLElement);
    expect(trio.getByText("Taureau")).toBeInTheDocument();
    expect(trio.getByText("Cancer")).toBeInTheDocument();
    expect(trio.getByText("Scorpion")).toBeInTheDocument();
    expect(document.getElementById("my-chart__title--ascendant")).toHaveTextContent("Ascendant Scorpion");
    expect(document.getElementById("my-chart__text--ascendant")).toHaveTextContent("pourrait");
    expect(document.getElementById("my-chart__value--ascendant-degree")).toHaveTextContent("22° Scorpion");
    expect(document.getElementById("my-chart__value--ascendant-house")).toHaveTextContent("Maison 1");
  });

  it("réutilise la carte Méthode et la carte Transits", () => {
    renderScreen();

    expect(document.getElementById("my-chart__value--houses")).toHaveTextContent("Placidus");
    expect(document.getElementById("my-chart__value--engine")).toHaveTextContent("astronomy-engine 2.1.19");
    expect(document.getElementById("my-chart__card--transits")).toBeInTheDocument();
  });

  it("heure inconnue : Ascendant expliqué comme manquant, Lune à confirmer", () => {
    renderScreen({ data: unknownTimeChart });

    expect(document.getElementById("my-chart__title--ascendant")).toHaveTextContent(/^Ascendant$/);
    expect(document.getElementById("my-chart__text--ascendant")).toHaveTextContent("n'a pas été calculé");
    expect(document.getElementById("my-chart__list--ascendant")).toBeNull();
    expect(within(document.getElementById("my-chart__trio--placements") as HTMLElement).getByText("À confirmer")).toBeInTheDocument();
    expect(document.getElementById("my-chart__value--houses")).toHaveTextContent("Non calculées");
  });

  it("ciel actuel indisponible : le reste de l'écran s'affiche", () => {
    renderScreen({ data: approximateTimeChart });

    expect(document.getElementById("my-chart__text--transits-unavailable")).toBeInTheDocument();
    expect(document.getElementById("my-chart__card--sky")).toBeInTheDocument();
  });

  it("affiche l'état de chargement", () => {
    renderScreen({ status: "loading", data: null });

    expect(screen.getByRole("status")).toHaveTextContent("Chargement de votre thème");
  });

  it("affiche l'erreur et relance le chargement", async () => {
    const { onRetry } = renderScreen({ status: "error", data: null, errorCode: "network_error" });

    expect(document.getElementById("my-chart__text--error")).toHaveTextContent("connexion a échoué");
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("affiche le thème détaillé une fois connecté", () => {
    renderScreen();

    expect(document.getElementById("my-chart__card--details")).toBeInTheDocument();
    expect(document.getElementById("my-chart__card--discovery")).not.toBeInTheDocument();
  });

  it("en découverte, remplace le détail par l'appel à la connexion", async () => {
    const user = userEvent.setup();
    const onSignUp = vi.fn();
    render(
      <MyChart status="ready" data={completeChart} errorCode={null} onRetry={vi.fn()} isAnonymous onSignUp={onSignUp} />,
    );

    expect(document.getElementById("my-chart__card--details")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Se connecter pour en savoir plus" }));
    expect(onSignUp).toHaveBeenCalledTimes(1);
  });

  it("ouvre la modale « Comprendre mon thème »", async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.click(screen.getByRole("button", { name: "Comprendre mon thème" }));

    expect(screen.getByRole("dialog", { name: "Comprendre mon thème" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fermer" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
