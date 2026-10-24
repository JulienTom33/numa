import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../../shared/queryClient/queryTestWrapper/queryTestWrapper";
import { fetchMyChart } from "../skyChart/skyChart";
import { completeChart } from "../MyChart/myChartFixtures";
import MyChartFlow from "./MyChartFlow";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

vi.mock("../natalChartSummary/natalChartSummary", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../natalChartSummary/natalChartSummary")>()),
  readFirstName: vi.fn().mockResolvedValue(null),
}));

vi.mock("../skyChart/skyChart", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../skyChart/skyChart")>()),
  fetchMyChart: vi.fn(),
}));

const fetchMock = vi.mocked(fetchMyChart);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MyChartFlow", () => {
  it("passe du chargement au thème", async () => {
    fetchMock.mockResolvedValue({ data: completeChart, error: null });

    render(<MyChartFlow />, { wrapper: createQueryWrapper() });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(await screen.findByText("Ascendant Scorpion")).toBeInTheDocument();
  });

  it("réessaie après une erreur", async () => {
    fetchMock.mockResolvedValueOnce({ data: null, error: "network_error" });
    fetchMock.mockResolvedValueOnce({ data: completeChart, error: null });

    render(<MyChartFlow />, { wrapper: createQueryWrapper() });
    await userEvent.click(await screen.findByRole("button", { name: "Réessayer" }));

    expect(await screen.findByText("Ascendant Scorpion")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
