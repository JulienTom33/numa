import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { streamNatalChart } from "../../lib/natalChartProgress";
import ChartProgressFlow from "./ChartProgressFlow";

vi.mock("../../lib/supabaseClient", () => ({ supabase: {} }));

vi.mock("../../lib/natalChartProgress", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../lib/natalChartProgress")>()),
  streamNatalChart: vi.fn(),
}));

const streamMock = vi.mocked(streamNatalChart);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ChartProgressFlow", () => {
  it("redirige automatiquement à la fin du calcul", async () => {
    streamMock.mockImplementation((onPhase) => {
      onPhase("validation");
      return Promise.resolve(null);
    });
    const onComplete = vi.fn();

    render(<ChartProgressFlow onComplete={onComplete} />);

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
  });

  it("reste sur l'écran avec un bouton Réessayer en cas d'erreur", async () => {
    streamMock.mockResolvedValue("internal_error");
    const onComplete = vi.fn();

    render(<ChartProgressFlow onComplete={onComplete} />);

    expect(await screen.findByRole("button", { name: "Réessayer" })).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
  });
});
