import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../../shared/queryClient/queryTestWrapper/queryTestWrapper";
import { paths } from "../../../shared/navigation/routes/routes";
import { completeChart } from "../../chart/MyChart/myChartFixtures";
import { fetchMyChart } from "../../chart/skyChart/skyChart";
import { fetchHoroscope } from "../horoscope/horoscope";
import { sampleHoroscope } from "../HoroscopeCard/horoscopeFixtures";
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

vi.mock("../horoscope/horoscope", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../horoscope/horoscope")>()),
  fetchHoroscope: vi.fn(),
}));

const anonymous = vi.hoisted(() => ({ value: false }));

vi.mock("../../../shared/navigation/appContext/appContext", () => ({
  useAppContext: () => ({ isAnonymous: anonymous.value }),
}));

const fetchMock = vi.mocked(fetchMyChart);
const horoscopeMock = vi.mocked(fetchHoroscope);

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
  horoscopeMock.mockResolvedValue({ data: sampleHoroscope, error: null });
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

  it("ne demande l'horoscope qu'une fois le thème prêt", async () => {
    fetchMock.mockResolvedValue({ data: null, error: "birth_data_not_found" });
    renderFlow();

    await screen.findByRole("alert");

    expect(horoscopeMock).not.toHaveBeenCalled();
  });

  it("demande l'horoscope quand le thème est prêt", async () => {
    fetchMock.mockResolvedValue({ data: completeChart, error: null });
    renderFlow();

    await screen.findByRole("button", { name: "Consulter Sidéra" });

    await waitFor(() => expect(horoscopeMock).toHaveBeenCalledTimes(1));
  });

  it("ouvre l'inscription depuis la pastille en mode découverte", async () => {
    anonymous.value = true;
    fetchMock.mockResolvedValue({ data: completeChart, error: null });
    renderFlow();

    await userEvent.click(await screen.findByRole("button", { name: "Créer un compte" }));

    expect(document.getElementById("test__text--signup")).toBeInTheDocument();
  });
});
