import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../../shared/queryClient/queryTestWrapper/queryTestWrapper";
import { paths } from "../../../shared/navigation/routes/routes";
import { completeChart } from "../../chart/MyChart/myChartFixtures";
import { fetchMyChart } from "../../chart/skyChart/skyChart";
import TodayFlow from "./TodayFlow";

vi.mock("../../../shared/supabaseClient/supabaseClient", () => ({ supabase: {} }));

vi.mock("../../chart/natalChartSummary/natalChartSummary", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../chart/natalChartSummary/natalChartSummary")>()),
  readFirstName: vi.fn().mockResolvedValue(null),
}));

vi.mock("../../chart/skyChart/skyChart", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../chart/skyChart/skyChart")>()),
  fetchMyChart: vi.fn(),
}));

const anonymous = vi.hoisted(() => ({ value: false }));

vi.mock("../../../shared/navigation/appContext/appContext", () => ({
  useAppContext: () => ({ isAnonymous: anonymous.value }),
}));

const fetchMock = vi.mocked(fetchMyChart);

function renderFlow() {
  render(
    <MemoryRouter initialEntries={[paths.today]}>
      <Routes>
        <Route path={paths.today} element={<TodayFlow />} />
        <Route path={paths.consult} element={<p id="test__text--consult">consulter</p>} />
        <Route path={paths.profile} element={<p id="test__text--profile">profil</p>} />
        <Route path={paths.signup} element={<p id="test__text--signup">inscription</p>} />
      </Routes>
    </MemoryRouter>,
    { wrapper: createQueryWrapper() },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  anonymous.value = false;
});

describe("TodayFlow", () => {
  it("charge le thème puis navigue vers le chat", async () => {
    fetchMock.mockResolvedValue({ data: completeChart, error: null });
    renderFlow();

    expect(screen.getByRole("status")).toBeInTheDocument();
    await userEvent.click(await screen.findByRole("button", { name: "Consulter Sidéra" }));

    expect(document.getElementById("test__text--consult")).toBeInTheDocument();
  });

  it("ouvre l'inscription depuis la pastille en mode découverte", async () => {
    anonymous.value = true;
    fetchMock.mockResolvedValue({ data: completeChart, error: null });
    renderFlow();

    await userEvent.click(await screen.findByRole("button", { name: "Créer un compte" }));

    expect(document.getElementById("test__text--signup")).toBeInTheDocument();
  });
});
