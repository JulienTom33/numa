import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../../shared/queryClient/queryTestWrapper/queryTestWrapper";
import { readFirstName } from "../natalChartSummary/natalChartSummary";
import { fetchMyChart } from "../skyChart/skyChart";
import { completeChart } from "../MyChart/myChartFixtures";
import { completeSummary } from "../ChartSummary/chartSummaryFixtures";
import ChartSummaryFlow from "./ChartSummaryFlow";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

vi.mock("../natalChartSummary/natalChartSummary", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../natalChartSummary/natalChartSummary")>()),
  readFirstName: vi.fn(),
}));

vi.mock("../skyChart/skyChart", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../skyChart/skyChart")>()),
  fetchMyChart: vi.fn(),
}));

const fetchMock = vi.mocked(fetchMyChart);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(readFirstName).mockResolvedValue(completeSummary.firstName);
});

describe("ChartSummaryFlow", () => {
  it("passe du chargement au résumé", async () => {
    fetchMock.mockResolvedValue({ data: completeChart, error: null });

    render(<ChartSummaryFlow onDiscover={vi.fn()} />, { wrapper: createQueryWrapper() });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(await screen.findByText("Placidus")).toBeInTheDocument();
  });

  it("propose Réessayer après une erreur", async () => {
    fetchMock.mockResolvedValueOnce({ data: null, error: "internal_error" });
    fetchMock.mockResolvedValueOnce({ data: completeChart, error: null });
    const user = userEvent.setup();

    render(<ChartSummaryFlow onDiscover={vi.fn()} />, { wrapper: createQueryWrapper() });

    await user.click(await screen.findByRole("button", { name: "Réessayer" }));

    expect(await screen.findByText("Placidus")).toBeInTheDocument();
  });
});
