import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchMyChart } from "../skyChart/skyChart";
import { completeChart } from "../MyChart/myChartFixtures";
import MyChartFlow from "./MyChartFlow";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

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

    render(<MyChartFlow />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(await screen.findByText("Ascendant Scorpion")).toBeInTheDocument();
  });

  it("réessaie après une erreur", async () => {
    fetchMock.mockResolvedValueOnce({ data: null, error: "network_error" });
    fetchMock.mockResolvedValueOnce({ data: completeChart, error: null });

    render(<MyChartFlow />);
    await userEvent.click(await screen.findByRole("button", { name: "Réessayer" }));

    expect(await screen.findByText("Ascendant Scorpion")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
