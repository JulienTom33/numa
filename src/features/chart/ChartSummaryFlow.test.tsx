import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchNatalChartSummary } from "../../lib/natalChartSummary";
import { completeSummary } from "../../screens/ChartSummary/chartSummaryFixtures";
import ChartSummaryFlow from "./ChartSummaryFlow";

vi.mock("../../lib/supabaseClient", () => ({ supabase: {} }));

vi.mock("../../lib/natalChartSummary", () => ({ fetchNatalChartSummary: vi.fn() }));

const fetchMock = vi.mocked(fetchNatalChartSummary);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ChartSummaryFlow", () => {
  it("passe du chargement au résumé", async () => {
    fetchMock.mockResolvedValue({ summary: completeSummary, error: null });

    render(<ChartSummaryFlow onDiscover={vi.fn()} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(await screen.findByText("Placidus")).toBeInTheDocument();
  });

  it("propose Réessayer après une erreur", async () => {
    fetchMock.mockResolvedValueOnce({ summary: null, error: "internal_error" });
    fetchMock.mockResolvedValueOnce({ summary: completeSummary, error: null });
    const user = userEvent.setup();

    render(<ChartSummaryFlow onDiscover={vi.fn()} />);

    await user.click(await screen.findByRole("button", { name: "Réessayer" }));

    expect(await screen.findByText("Placidus")).toBeInTheDocument();
  });
});
