import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { AppContext, type AppContextValue } from "../../../shared/navigation/appContext/appContext";
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

function renderFlow(isAnonymous: boolean) {
  const Wrapper = createQueryWrapper();
  const context = { isAnonymous } as unknown as AppContextValue;
  render(
    <Wrapper>
      <AppContext.Provider value={context}>
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<MyChartFlow />} />
            <Route path="/inscription" element={<p id="test__text--signup">Inscription</p>} />
          </Routes>
        </MemoryRouter>
      </AppContext.Provider>
    </Wrapper>,
  );
}

describe("MyChartFlow", () => {
  it("passe du chargement au thème", async () => {
    fetchMock.mockResolvedValue({ data: completeChart, error: null });

    renderFlow(false);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(await screen.findByText("Ascendant Scorpion")).toBeInTheDocument();
  });

  it("réessaie après une erreur", async () => {
    fetchMock.mockResolvedValueOnce({ data: null, error: "network_error" });
    fetchMock.mockResolvedValueOnce({ data: completeChart, error: null });

    renderFlow(false);
    await userEvent.click(await screen.findByRole("button", { name: "Réessayer" }));

    expect(await screen.findByText("Ascendant Scorpion")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("en mode découverte, affiche le thème détaillé complet", async () => {
    fetchMock.mockResolvedValue({ data: completeChart, error: null });

    renderFlow(true);

    expect(await screen.findByText("Votre thème en détail")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Se connecter pour en savoir plus" })).not.toBeInTheDocument();
  });
});
