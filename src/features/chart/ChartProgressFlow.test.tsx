import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchNatalChartSummary } from "../../lib/natalChartSummary";
import { streamNatalChart } from "../../lib/natalChartProgress";
import { completeSummary } from "../../screens/ChartSummary/chartSummaryFixtures";
import ChartProgressFlow from "./ChartProgressFlow";

vi.mock("../../lib/supabaseClient", () => ({ supabase: {} }));

vi.mock("../../lib/natalChartProgress", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../lib/natalChartProgress")>()),
  streamNatalChart: vi.fn(),
}));

vi.mock("../../lib/natalChartSummary", () => ({ fetchNatalChartSummary: vi.fn() }));

const streamMock = vi.mocked(streamNatalChart);
const summaryMock = vi.mocked(fetchNatalChartSummary);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ChartProgressFlow", () => {
  it("affiche le résumé à la fin du calcul puis ouvre l'espace sur demande", async () => {
    streamMock.mockImplementation((onPhase) => {
      onPhase("validation");
      return Promise.resolve(null);
    });
    summaryMock.mockResolvedValue({ summary: completeSummary, error: null });
    const user = userEvent.setup();
    const onComplete = vi.fn();

    render(<ChartProgressFlow onComplete={onComplete} />);

    expect(await screen.findByRole("heading", { name: "Votre profil astrologique, Camille" })).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Découvrir mon espace" }));

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("reste sur l'écran avec un bouton Réessayer en cas d'erreur", async () => {
    streamMock.mockResolvedValue("internal_error");
    const onComplete = vi.fn();

    render(<ChartProgressFlow onComplete={onComplete} />);

    expect(await screen.findByRole("button", { name: "Réessayer" })).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
  });
});
