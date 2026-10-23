import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ChartProgressStatus } from "../useChartProgress/useChartProgress";
import type { NatalChartErrorCode } from "../natalChart/natalChart";
import ChartProgress from "./ChartProgress";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

interface Options {
  completedCount?: number;
  status?: ChartProgressStatus;
  errorCode?: NatalChartErrorCode | null;
  onRetry?: () => void;
}

function renderScreen({ completedCount = 0, status = "loading", errorCode = null, onRetry = vi.fn() }: Options = {}) {
  render(<ChartProgress completedCount={completedCount} status={status} errorCode={errorCode} onRetry={onRetry} />);
  return { onRetry };
}

describe("ChartProgress", () => {
  it("affiche l'anneau, les six étapes et la mention de durée", () => {
    renderScreen({ completedCount: 3 });

    const ring = screen.getByRole("progressbar", { name: "Progression du calcul" });
    expect(ring).toHaveAttribute("aria-valuenow", "50");
    expect(ring).toHaveTextContent("50");
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    const list = within(screen.getByRole("list"));
    expect(list.getByText("Positions planétaires", { exact: false })).toHaveTextContent("terminé");
    expect(list.getByText("Ascendant", { exact: false })).toHaveTextContent("en cours");
    expect(screen.getByText("Ce calcul peut prendre quelques secondes.")).toBeInTheDocument();
  });

  it("annonce l'étape courante dans une zone aria-live polie", () => {
    renderScreen({ completedCount: 3 });

    const live = document.getElementById("chart-progress__status--current");
    expect(live).toHaveAttribute("aria-live", "polite");
    expect(live).toHaveTextContent("Étape en cours : Ascendant");
  });

  it("annonce la fin du calcul", () => {
    renderScreen({ completedCount: 6, status: "done" });

    expect(document.getElementById("chart-progress__status--current")).toHaveTextContent("Calcul terminé");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("n'applique aucune transition quand les animations sont réduites", () => {
    renderScreen({ completedCount: 2 });

    const arc = document.querySelector("#chart-progress__ring--progress circle:last-child");
    expect(arc?.getAttribute("class")).toContain("motion-reduce:transition-none");
  });

  it("affiche l'erreur et relance le calcul avec Réessayer", async () => {
    const user = userEvent.setup();
    const { onRetry } = renderScreen({ completedCount: 2, status: "error", errorCode: "network_error" });

    expect(screen.getByRole("alert")).toHaveTextContent("La connexion a échoué");
    expect(document.getElementById("chart-progress__status--current")).toBeEmptyDOMElement();

    await user.click(screen.getByRole("button", { name: "Réessayer" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("retombe sur le message générique sans code d'erreur", () => {
    renderScreen({ status: "error" });

    expect(screen.getByRole("alert")).toHaveTextContent("a rencontré un problème");
  });
});
